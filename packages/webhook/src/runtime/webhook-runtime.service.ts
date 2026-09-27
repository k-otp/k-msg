import { logger } from "@k-msg/core";
import {
  migrateWebhookFieldCryptoToTenant,
  validateWebhookFieldCryptoOptions,
  wrapWebhookDeliveryStoreWithFieldCrypto,
  wrapWebhookEndpointStoreWithFieldCrypto,
} from "../crypto/field-crypto";
import {
  hasUndecryptableSecret,
  unmarkSecret,
} from "../crypto/undecryptable-secret";
import {
  type HttpClient,
  resolveSigningSecret,
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
import { WebhookEndpointConflictError } from "./errors";
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
  WebhookTenantMigrationResult,
} from "./types";

const DEFAULT_BATCH_SIZE = 10;
const DEFAULT_BATCH_TIMEOUT_MS = 5_000;

function toStatusFromActive(active: boolean): WebhookEndpoint["status"] {
  return active ? "active" : "inactive";
}

// The active flag and status a new endpoint is stored with.
function resolveActivity(
  input: Pick<WebhookEndpointInput, "active" | "status">,
): Pick<WebhookEndpoint, "active" | "status"> {
  const active =
    input.active ?? (input.status ? input.status === "active" : true);
  return { active, status: input.status ?? toStatusFromActive(active) };
}

function normalizeLimit(limit: number | undefined, fallback: number): number {
  if (typeof limit !== "number" || !Number.isFinite(limit)) {
    return fallback;
  }

  return Math.max(0, Math.floor(limit));
}

// A batch must take at least one event, or flush() would never empty the
// queue. Infinity keeps every event queued until flush() or the timer sends
// them all as one batch.
function normalizeBatchSize(batchSize: number | undefined): number {
  return typeof batchSize === "number" && batchSize >= 1
    ? Math.floor(batchSize)
    : DEFAULT_BATCH_SIZE;
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

// Repeating an id or URL within one addEndpoints() call is bad input, not a
// conflict: no stored endpoint has it for the error to name.
function assertDistinctEndpoints(endpoints: readonly WebhookEndpoint[]): void {
  const ids = new Set<string>();
  const urls = new Set<string>();
  for (const endpoint of endpoints) {
    if (ids.has(endpoint.id)) {
      throw new Error(
        `addEndpoints() was given endpoint id ${endpoint.id} more than once`,
      );
    }
    if (urls.has(endpoint.url)) {
      // The URL stays out of the message; it may carry a token.
      throw new Error("addEndpoints() was given the same URL more than once");
    }
    ids.add(endpoint.id);
    urls.add(endpoint.url);
  }
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
  private readonly fieldCrypto: WebhookRuntimeConfig["fieldCrypto"];
  private readonly batchSize: number;
  private readonly batchTimeoutMs: number;
  private readonly autoStart: boolean;

  private eventQueue: WebhookEvent[] = [];
  // Pending only while emit() has queued events, so an idle runtime holds
  // no timer.
  private batchTimer: ReturnType<typeof setTimeout> | null = null;
  private initPromise: Promise<void> | null = null;
  // The batch currently dispatching, shared so flush() can wait for it.
  private activeBatch: Promise<void> | null = null;
  // Endpoint writes and the tenant migration run one at a time: the
  // migration rewrites endpoints from records it read earlier, and two
  // updates to one endpoint would each write over the other.
  private endpointWrites: Promise<unknown> = Promise.resolve();
  private shuttingDown = false;

  constructor(config: WebhookRuntimeConfig) {
    this.config = config.delivery;
    this.dispatcher = new WebhookDispatcher(config.delivery, config.httpClient);
    this.securityOptions = resolveEndpointValidationOptions(config.security);
    this.batchSize = normalizeBatchSize(config.delivery.batchSize);
    this.batchTimeoutMs = normalizeLimit(
      config.delivery.batchTimeoutMs,
      DEFAULT_BATCH_TIMEOUT_MS,
    );
    this.autoStart = config.autoStart ?? true;

    const persistence = this.resolvePersistence(config);
    this.persistence = persistence;
    this.fieldCrypto = config.fieldCrypto;
    validateWebhookFieldCryptoOptions(config.fieldCrypto);
    this.endpointStore = wrapWebhookEndpointStoreWithFieldCrypto(
      persistence.endpointStore,
      config.fieldCrypto,
    );
    this.deliveryStore = wrapWebhookDeliveryStoreWithFieldCrypto(
      persistence.deliveryStore,
      config.fieldCrypto,
    );
  }

  // Checks the URL and the signing secret before queueing, so an invalid
  // endpoint fails at once instead of waiting behind other endpoint writes.
  async addEndpoint(input: WebhookEndpointInput): Promise<WebhookEndpoint> {
    validateEndpointUrl(input.url, this.securityOptions);
    this.assertSigningSecret({
      ...unmarkSecret(input),
      ...resolveActivity(input),
    });
    return this.writeEndpoints(async () => {
      await this.ensureInitialized();
      const endpoint = this.createEndpoint(input);
      await this.storeEndpoints([endpoint]);
      return endpoint;
    });
  }

  // Queued as one write, so a shutdown cannot leave the batch half added.
  // Every URL is checked first, so an invalid one adds none of them; the
  // error names its position, not the URL, which may carry a token. The
  // batch is stored all or none.
  async addEndpoints(
    inputs: readonly WebhookEndpointInput[],
  ): Promise<WebhookEndpoint[]> {
    for (const [index, input] of inputs.entries()) {
      try {
        validateEndpointUrl(input.url, this.securityOptions);
        this.assertSigningSecret({
          ...unmarkSecret(input),
          ...resolveActivity(input),
        });
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        throw new Error(`Webhook endpoint ${index} in the batch: ${reason}`, {
          cause: error,
        });
      }
    }
    return this.writeEndpoints(async () => {
      await this.ensureInitialized();
      const endpoints = inputs.map((input) => this.createEndpoint(input));
      // Check the whole batch first, so a repeated id or URL does not leave
      // part of it stored.
      assertDistinctEndpoints(endpoints);
      await this.assertNoConflicts(endpoints);

      await this.storeEndpoints(endpoints);
      return endpoints;
    });
  }

  // Adds endpoints to the store, all or none. When one fails, for example
  // because a writer outside this runtime took its id or URL, the ones
  // already added are removed. So is the failed one if the store kept it
  // anyway, as D1 can when it fails after committing; a conflict error means
  // it was not stored, and its id may be another endpoint's. Each is removed
  // only while the store still holds it, not a row another writer has put
  // under its id since. The store has no conditional delete, so that check
  // narrows the race rather than closing it. If a removal fails too, the
  // original error is still the one to report.
  private async storeEndpoints(
    endpoints: readonly WebhookEndpoint[],
  ): Promise<void> {
    const added: WebhookEndpoint[] = [];
    for (const endpoint of endpoints) {
      try {
        await this.endpointStore.add(endpoint);
      } catch (error) {
        const written =
          error instanceof WebhookEndpointConflictError
            ? added
            : [...added, endpoint];
        for (const candidate of written) {
          if (await this.holdsEndpoint(candidate)) {
            await this.endpointStore
              .remove(candidate.id)
              .catch(() => undefined);
          }
        }
        throw error;
      }
      added.push(endpoint);
    }
  }

  // Whether the store holds this endpoint itself: the row with its id has
  // its URL and creation time. Read without field crypto, which these
  // fields do not use.
  private async holdsEndpoint(endpoint: WebhookEndpoint): Promise<boolean> {
    const stored = await this.persistence.endpointStore
      .get(endpoint.id)
      .catch(() => null);
    return (
      stored !== null &&
      stored.url === endpoint.url &&
      stored.createdAt.getTime() === endpoint.createdAt.getTime()
    );
  }

  updateEndpoint(
    endpointId: string,
    updates: Partial<WebhookEndpointInput>,
  ): Promise<WebhookEndpoint> {
    return this.writeEndpoints(async () => {
      await this.ensureInitialized();
      return this.applyEndpointUpdate(endpointId, updates);
    });
  }

  private async applyEndpointUpdate(
    endpointId: string,
    updates: Partial<WebhookEndpointInput>,
  ): Promise<WebhookEndpoint> {
    const current = await this.endpointStore.get(endpointId);
    if (!current) {
      throw new Error(`Webhook endpoint ${endpointId} not found`);
    }

    if (updates.url && updates.url !== current.url) {
      validateEndpointUrl(updates.url, this.securityOptions);
    }

    const now = new Date();
    // Unless the update sets `secret`, the store keeps the stored one, even
    // when `current` was read without it because it could not be decrypted.
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
    this.assertSigningSecret(merged, endpointId);

    // The flag describes this read of the endpoint and is never stored.
    await this.endpointStore.update(endpointId, unmarkSecret(merged));
    return merged;
  }

  removeEndpoint(endpointId: string): Promise<void> {
    return this.writeEndpoints(async () => {
      await this.ensureInitialized();
      await this.endpointStore.remove(endpointId);
    });
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

      const success = delivery.status === "success";
      // After retries, the last attempt is the one that decided the result.
      const lastAttempt = delivery.attempts[delivery.attempts.length - 1];
      return {
        endpointId,
        url: endpoint.url,
        success,
        httpStatus: lastAttempt?.httpStatus,
        error: success ? undefined : lastAttempt?.error,
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

    try {
      // A batch in flight is not awaited: one of its delivery hooks may be
      // this caller. A full batch queued meanwhile follows it (processBatch).
      if (
        this.eventQueue.length >= this.batchSize &&
        this.activeBatch === null
      ) {
        await this.processBatch();
      }
    } finally {
      this.scheduleBatch();
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

    // Awaiting the in-flight batch yields to the event loop, so its requests
    // can finish before the remaining queue is drained.
    while (this.eventQueue.length > 0 || this.activeBatch !== null) {
      await this.processBatch();
    }
    // The queue is empty, so a scheduled batch would have nothing to send.
    this.cancelBatchTimer();
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

  /**
   * Re-encrypts stored endpoint secrets and delivery payloads written before
   * ciphertext was bound to `fieldCrypto.tenantId`, returning how many of
   * each it rewrote. Run it once every instance is upgraded, then remove
   * `fieldCrypto.acceptLegacyAad` if it was set to keep them readable in
   * the meantime. Endpoint writes through this runtime wait until it
   * finishes. See `migrateWebhookFieldCryptoToTenant`.
   */
  migrateFieldCryptoToTenant(): Promise<WebhookTenantMigrationResult> {
    return this.writeEndpoints(async () => {
      await this.ensureInitialized();
      return migrateWebhookFieldCryptoToTenant(
        this.persistence,
        this.fieldCrypto ?? {},
      );
    });
  }

  async shutdown(): Promise<void> {
    // Endpoint writes queued before this point, such as ones behind a
    // running migration, still reach the store before it closes; later
    // ones are refused instead of running against a closed store. emit()
    // after this point schedules no batch timer either.
    this.shuttingDown = true;
    this.cancelBatchTimer();

    await this.flush();
    await this.endpointWrites;
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

  // Runs `write` once every endpoint write queued before it has settled.
  // Callers queue as soon as they are called, before any await, so
  // shutdown() waits for every change requested before it started.
  private writeEndpoints<T>(write: () => Promise<T>): Promise<T> {
    if (this.shuttingDown) {
      return Promise.reject(
        new Error(
          "Webhook endpoints cannot be changed after shutdown() has started",
        ),
      );
    }
    const run = () => write();
    const result = this.endpointWrites.then(run, run);
    this.endpointWrites = result.catch(() => undefined);
    return result;
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

  // The dispatcher refuses to send unsigned while security is on; rejecting
  // an endpoint that would receive deliveries reports the problem when it is
  // registered instead. A paused endpoint (see endpointMatchesEvent) needs no
  // secret, so an unsigned one can be paused rather than deleted. An update
  // keeps a stored secret that could not be decrypted, so it has one. The URL
  // is left out of the message because it may carry a token.
  private assertSigningSecret(
    endpoint: Pick<WebhookEndpoint, "active" | "status" | "secret">,
    endpointId?: string,
  ): void {
    if (
      !this.config.enableSecurity ||
      !endpoint.active ||
      endpoint.status !== "active" ||
      hasUndecryptableSecret(endpoint) ||
      resolveSigningSecret(endpoint, this.config) !== undefined
    ) {
      return;
    }
    const subject =
      endpointId === undefined
        ? "An active webhook endpoint"
        : `Webhook endpoint ${endpointId}`;
    throw new Error(
      `${subject} needs a secret: enableSecurity is on and delivery.secretKey is not set`,
    );
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

  private processBatch(): Promise<void> {
    if (this.activeBatch !== null) {
      return this.activeBatch;
    }
    if (this.eventQueue.length === 0) {
      return Promise.resolve();
    }

    const batch = this.eventQueue.splice(0, this.batchSize);
    // Never dispatch (or chain after) an empty batch, so a batch size that
    // takes nothing cannot spin.
    if (batch.length === 0) {
      return Promise.resolve();
    }
    const dispatched = this.dispatchBatch(batch);
    this.activeBatch = dispatched.finally(() => {
      this.activeBatch = null;
    });
    // Runs after activeBatch is cleared. Not after a failure, so a failing
    // store is retried by the timer or the next call, not in a tight loop.
    void dispatched.then(
      () => this.sendQueuedFullBatch(),
      () => undefined,
    );
    return this.activeBatch;
  }

  // A full batch queued while another was being sent goes out right after
  // it, since the emit() that filled it did not wait.
  private sendQueuedFullBatch(): void {
    if (this.eventQueue.length < this.batchSize || this.activeBatch !== null) {
      return;
    }
    void this.processBatch().catch((error: unknown) => {
      logger.error(
        "Webhook batch processor error",
        undefined,
        error instanceof Error ? error : new Error(String(error)),
      );
      this.scheduleBatch();
    });
  }

  private async dispatchBatch(batch: WebhookEvent[]): Promise<void> {
    let dispatched = 0;
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
        dispatched += 1;
      }
    } catch (error) {
      // Re-queue only what was not dispatched; earlier events already reached
      // their endpoints and would otherwise be delivered twice. Not spread
      // into unshift(): a large batch would exceed the argument limit.
      this.eventQueue = batch.slice(dispatched).concat(this.eventQueue);
      throw error;
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

  // Builds a new endpoint for a caller that holds the endpoint write queue.
  // The URL and secret are checked again here, the check that guards the
  // store: callers check them before queueing only to fail fast.
  private createEndpoint(input: WebhookEndpointInput): WebhookEndpoint {
    validateEndpointUrl(input.url, this.securityOptions);
    const now = new Date();

    const endpoint: WebhookEndpoint = {
      // A copy of an endpoint read without its secret has no secret to keep.
      ...unmarkSecret(input),
      id: input.id ?? this.generateEndpointId(),
      ...resolveActivity(input),
      createdAt: now,
      updatedAt: now,
    };
    this.assertSigningSecret(endpoint);
    return endpoint;
  }

  private async assertNoConflicts(
    endpoints: readonly WebhookEndpoint[],
  ): Promise<void> {
    // Only ids and URLs are compared, so read the store without field crypto:
    // a secret that cannot be decrypted must not block registration.
    const stored = await this.persistence.endpointStore.list();
    const idOwners = new Set(stored.map((endpoint) => endpoint.id));
    const urlOwners = new Map(
      stored.map((endpoint) => [endpoint.url, endpoint.id] as const),
    );

    for (const endpoint of endpoints) {
      if (idOwners.has(endpoint.id)) {
        throw new WebhookEndpointConflictError("id", endpoint.id, endpoint.id);
      }
      const urlOwner = urlOwners.get(endpoint.url);
      if (urlOwner !== undefined) {
        throw new WebhookEndpointConflictError("url", endpoint.url, urlOwner);
      }
    }
  }

  private generateEndpointId(): string {
    return `webhook_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  // Keeps a timer pending exactly while emit() has queued events: it sends
  // the queue batchTimeoutMs after the first one, and is cleared as soon as
  // the queue is empty, for example after emit() sent a full batch itself.
  private scheduleBatch(): void {
    if (this.eventQueue.length === 0) {
      this.cancelBatchTimer();
      return;
    }
    if (!this.autoStart || this.shuttingDown || this.batchTimer !== null) {
      return;
    }

    this.batchTimer = setTimeout(() => {
      this.batchTimer = null;
      void this.runScheduledBatch();
    }, this.batchTimeoutMs);
  }

  // Whoever started a batch handles its failure; others only wait for it.
  private async waitForActiveBatch(): Promise<void> {
    if (this.activeBatch !== null) {
      await this.activeBatch.catch(() => undefined);
    }
  }

  private async runScheduledBatch(): Promise<void> {
    try {
      // The queue is due now. Wait out batches in flight, including any
      // chained after them, whose failures their starters report, then send
      // what is left rather than a whole timeout later.
      while (this.activeBatch !== null) {
        await this.waitForActiveBatch();
      }
      await this.processBatch();
    } catch (error) {
      logger.error(
        "Webhook batch processor error",
        undefined,
        error instanceof Error ? error : new Error(String(error)),
      );
    }
    // Events queued meanwhile, or re-queued after a failure, go next.
    this.scheduleBatch();
  }

  private cancelBatchTimer(): void {
    if (this.batchTimer !== null) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
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
