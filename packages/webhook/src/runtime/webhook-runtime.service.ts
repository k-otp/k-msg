import { logger } from "@k-msg/core";
import {
  type HttpClient,
  WebhookDispatcher,
} from "../services/webhook.dispatcher";
import {
  type WebhookDelivery,
  type WebhookEndpoint,
  type WebhookEvent,
  WebhookEventType,
  type WebhookTestResult,
} from "../types/webhook.types";
import {
  resolveEndpointValidationOptions,
  validateEndpointUrl,
} from "./endpoint-validation";
import { endpointMatchesEvent } from "./event-matcher";
import { createInMemoryWebhookPersistence } from "./persistence";
import type {
  WebhookDeliveryListOptions,
  WebhookDeliveryStore,
  WebhookEndpointInput,
  WebhookEndpointStore,
  WebhookPersistence,
  WebhookRuntime,
  WebhookRuntimeConfig,
  WebhookRuntimeSecurityOptions,
  WebhookRuntimeTestPayload,
} from "./types";

function toStatusFromActive(active: boolean): WebhookEndpoint["status"] {
  return active ? "active" : "inactive";
}

function normalizeLimit(limit: number | undefined, fallback: number): number {
  if (typeof limit !== "number" || !Number.isFinite(limit)) {
    return fallback;
  }

  return Math.max(0, Math.floor(limit));
}

function cloneEventWithValidTimestamp(event: WebhookEvent): WebhookEvent {
  const timestamp =
    event.timestamp instanceof Date
      ? event.timestamp
      : new Date(event.timestamp as unknown as string);

  return {
    ...event,
    timestamp: Number.isNaN(timestamp.getTime()) ? new Date() : timestamp,
  };
}

export class WebhookRuntimeService implements WebhookRuntime {
  private readonly config: WebhookRuntimeConfig["delivery"];
  private readonly dispatcher: WebhookDispatcher;
  private readonly endpointStore: WebhookEndpointStore;
  private readonly deliveryStore: WebhookDeliveryStore;
  private readonly securityOptions: ReturnType<
    typeof resolveEndpointValidationOptions
  >;
  private readonly persistence: WebhookPersistence;

  private readonly eventQueue: WebhookEvent[] = [];
  private batchProcessor: ReturnType<typeof setInterval> | null = null;
  private initPromise: Promise<void> | null = null;
  private processing = false;

  constructor(config: WebhookRuntimeConfig) {
    this.config = config.delivery;
    this.dispatcher = new WebhookDispatcher(config.delivery, config.httpClient);
    this.securityOptions = resolveEndpointValidationOptions(config.security);

    const persistence = this.resolvePersistence(config);
    this.persistence = persistence;
    this.endpointStore = persistence.endpointStore;
    this.deliveryStore = persistence.deliveryStore;

    const autoStart = config.autoStart ?? true;
    if (autoStart) {
      this.startBatchProcessor();
    }
  }

  async addEndpoint(input: WebhookEndpointInput): Promise<WebhookEndpoint> {
    await this.ensureInitialized();
    validateEndpointUrl(input.url, this.securityOptions);

    const now = new Date();
    const active =
      input.active ?? (input.status ? input.status === "active" : true);
    const status = input.status ?? toStatusFromActive(active);

    const endpoint: WebhookEndpoint = {
      ...input,
      id: input.id ?? this.generateEndpointId(),
      active,
      status,
      createdAt: now,
      updatedAt: now,
    };

    await this.endpointStore.add(endpoint);
    return endpoint;
  }

  async addEndpoints(
    inputs: readonly WebhookEndpointInput[],
  ): Promise<WebhookEndpoint[]> {
    const created: WebhookEndpoint[] = [];
    for (const input of inputs) {
      created.push(await this.addEndpoint(input));
    }

    return created;
  }

  async updateEndpoint(
    endpointId: string,
    updates: Partial<WebhookEndpointInput>,
  ): Promise<WebhookEndpoint> {
    await this.ensureInitialized();

    const current = await this.endpointStore.get(endpointId);
    if (!current) {
      throw new Error(`Webhook endpoint ${endpointId} not found`);
    }

    if (updates.url && updates.url !== current.url) {
      validateEndpointUrl(updates.url, this.securityOptions);
    }

    const now = new Date();
    const merged: WebhookEndpoint = {
      ...current,
      ...updates,
      id: current.id,
      createdAt: current.createdAt,
      updatedAt: now,
      active:
        updates.active ??
        (updates.status ? updates.status === "active" : current.active),
      status:
        updates.status ??
        (updates.active !== undefined
          ? toStatusFromActive(updates.active)
          : current.status),
    };

    await this.endpointStore.update(endpointId, merged);
    return merged;
  }

  async removeEndpoint(endpointId: string): Promise<void> {
    await this.ensureInitialized();
    await this.endpointStore.remove(endpointId);
  }

  async getEndpoint(endpointId: string): Promise<WebhookEndpoint | null> {
    await this.ensureInitialized();
    return this.endpointStore.get(endpointId);
  }

  async listEndpoints(): Promise<WebhookEndpoint[]> {
    await this.ensureInitialized();
    return this.endpointStore.list();
  }

  async probeEndpoint(
    input: string | WebhookRuntimeTestPayload,
  ): Promise<WebhookTestResult> {
    await this.ensureInitialized();

    const endpointId = typeof input === "string" ? input : input.endpointId;
    const endpoint = await this.endpointStore.get(endpointId);
    if (!endpoint) {
      throw new Error(`Webhook endpoint ${endpointId} not found`);
    }

    const event = this.createProbeEvent(
      endpointId,
      typeof input === "string" ? undefined : input.event,
    );
    const startedAt = Date.now();

    try {
      const delivery = await this.dispatcher.dispatch(event, endpoint);
      await this.deliveryStore.add(delivery);

      return {
        endpointId,
        url: endpoint.url,
        success: delivery.status === "success",
        httpStatus: delivery.attempts[0]?.httpStatus,
        responseTime: Date.now() - startedAt,
        testedAt: new Date(),
      };
    } catch (error) {
      return {
        endpointId,
        url: endpoint.url,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        responseTime: Date.now() - startedAt,
        testedAt: new Date(),
      };
    }
  }

  async emit(event: WebhookEvent): Promise<void> {
    this.validateEvent(event);

    if (!this.config.enabledEvents.includes(event.type)) {
      return;
    }

    await this.ensureInitialized();
    this.eventQueue.push(cloneEventWithValidTimestamp(event));

    if (this.eventQueue.length >= this.config.batchSize) {
      await this.processBatch();
    }
  }

  async emitSync(event: WebhookEvent): Promise<WebhookDelivery[]> {
    this.validateEvent(event);

    if (!this.config.enabledEvents.includes(event.type)) {
      return [];
    }

    await this.ensureInitialized();

    const normalized = cloneEventWithValidTimestamp(event);
    const endpoints = await this.getMatchingEndpoints(normalized);
    const deliveries: WebhookDelivery[] = [];

    for (const endpoint of endpoints) {
      const delivery = await this.dispatcher.dispatch(normalized, endpoint);
      await this.deliveryStore.add(delivery);
      deliveries.push(delivery);
    }

    return deliveries;
  }

  async flush(): Promise<void> {
    await this.ensureInitialized();

    while (this.eventQueue.length > 0) {
      await this.processBatch();
    }
  }

  async listDeliveries(
    options: WebhookDeliveryListOptions = {},
  ): Promise<WebhookDelivery[]> {
    await this.ensureInitialized();
    return this.deliveryStore.list({
      ...options,
      limit: normalizeLimit(options.limit, 100),
    });
  }

  async shutdown(): Promise<void> {
    if (this.batchProcessor) {
      clearInterval(this.batchProcessor);
      this.batchProcessor = null;
    }

    await this.flush();
    await this.dispatcher.shutdown();

    if (typeof this.persistence.close === "function") {
      await this.persistence.close();
    }
  }

  private resolvePersistence(config: WebhookRuntimeConfig): WebhookPersistence {
    if (config.persistence) {
      return {
        endpointStore: config.endpointStore ?? config.persistence.endpointStore,
        deliveryStore: config.deliveryStore ?? config.persistence.deliveryStore,
        init: config.persistence.init,
        close: config.persistence.close,
      };
    }

    if (config.endpointStore && config.deliveryStore) {
      return {
        endpointStore: config.endpointStore,
        deliveryStore: config.deliveryStore,
      };
    }

    if (config.endpointStore || config.deliveryStore) {
      throw new Error(
        "Both endpointStore and deliveryStore must be provided together",
      );
    }

    return createInMemoryWebhookPersistence();
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = (async () => {
        if (typeof this.persistence.init === "function") {
          await this.persistence.init();
        }
      })().catch((error) => {
        this.initPromise = null;
        throw error;
      });
    }

    await this.initPromise;
  }

  private validateEvent(event: WebhookEvent): void {
    if (!event.id) {
      throw new Error("Event ID is required");
    }

    if (!event.type) {
      throw new Error("Event type is required");
    }

    if (!event.timestamp) {
      throw new Error("Event timestamp is required");
    }

    const timestamp =
      event.timestamp instanceof Date
        ? event.timestamp
        : new Date(event.timestamp as unknown as string);

    if (Number.isNaN(timestamp.getTime())) {
      throw new Error("Event timestamp must be a valid Date");
    }

    if (!event.version) {
      throw new Error("Event version is required");
    }
  }

  private async processBatch(): Promise<void> {
    if (this.processing || this.eventQueue.length === 0) {
      return;
    }

    this.processing = true;

    const batch = this.eventQueue.splice(0, this.config.batchSize);

    try {
      for (const event of batch) {
        const endpoints = await this.getMatchingEndpoints(event);

        const settled = await Promise.allSettled(
          endpoints.map(async (endpoint) => {
            const delivery = await this.dispatcher.dispatch(event, endpoint);
            await this.deliveryStore.add(delivery);
            return delivery;
          }),
        );

        for (const result of settled) {
          if (result.status === "rejected") {
            logger.error(
              "Failed to dispatch webhook",
              undefined,
              result.reason instanceof Error
                ? result.reason
                : new Error(String(result.reason)),
            );
          }
        }
      }
    } catch (error) {
      this.eventQueue.unshift(...batch);
      throw error;
    } finally {
      this.processing = false;
    }
  }

  private async getMatchingEndpoints(
    event: WebhookEvent,
  ): Promise<WebhookEndpoint[]> {
    const all = await this.endpointStore.list();
    return all.filter((endpoint) => endpointMatchesEvent(endpoint, event));
  }

  private createProbeEvent(
    endpointId: string,
    override: Partial<WebhookEvent> | undefined,
  ): WebhookEvent {
    const now = new Date();

    const base: WebhookEvent = {
      id: `probe_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type: WebhookEventType.SYSTEM_MAINTENANCE,
      timestamp: now,
      data: {
        test: true,
        message: "Webhook endpoint probe",
      },
      metadata: {
        correlationId: `probe_${endpointId}_${Date.now()}`,
      },
      version: "1.0",
    };

    if (!override) {
      return base;
    }

    return {
      ...base,
      ...override,
      metadata: {
        ...base.metadata,
        ...(override.metadata ?? {}),
      },
      timestamp:
        override.timestamp instanceof Date
          ? override.timestamp
          : override.timestamp
            ? new Date(override.timestamp as unknown as string)
            : base.timestamp,
    };
  }

  private generateEndpointId(): string {
    return `webhook_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  private startBatchProcessor(): void {
    const timeout = normalizeLimit(this.config.batchTimeoutMs, 5000);
    this.batchProcessor = setInterval(() => {
      this.processBatch().catch((error) => {
        logger.error(
          "Webhook batch processor error",
          undefined,
          error instanceof Error ? error : new Error(String(error)),
        );
      });
    }, timeout);
  }
}

export function probeEndpoint(
  runtime: WebhookRuntimeService,
  input: string | WebhookRuntimeTestPayload,
): Promise<WebhookTestResult> {
  return runtime.probeEndpoint(input);
}

export function addEndpoints(
  runtime: WebhookRuntimeService,
  inputs: readonly WebhookEndpointInput[],
): Promise<WebhookEndpoint[]> {
  return runtime.addEndpoints(inputs);
}

export function resolveWebhookSecurityOptions(
  security: WebhookRuntimeSecurityOptions | undefined,
): ReturnType<typeof resolveEndpointValidationOptions> {
  return resolveEndpointValidationOptions(security);
}

export type { HttpClient };
