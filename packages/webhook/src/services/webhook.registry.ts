import {
  assertFieldCryptoConfig,
  createDefaultMasker,
  type FieldCryptoConfig,
  FieldCryptoError,
} from "@k-msg/core";
import type {
  WebhookDelivery,
  WebhookEndpoint,
  WebhookEventType,
} from "../types/webhook.types";

export interface WebhookRegistryCryptoOptions {
  tenantId?: string;
  endpoint?: FieldCryptoConfig;
  delivery?: FieldCryptoConfig;
}

export interface WebhookRegistryOptions {
  fieldCrypto?: WebhookRegistryCryptoOptions;
}

function normalizeString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function toFallbackValue(config: FieldCryptoConfig, plaintext: string): string {
  const fallback = config.openFallback ?? "masked";
  if (fallback === "plaintext") {
    if (!config.unsafeAllowPlaintextStorage) {
      throw new FieldCryptoError(
        "policy",
        "openFallback=plaintext requires unsafeAllowPlaintextStorage=true",
        {
          rule: "fieldCrypto.fail_open.plaintext_guard",
          path: "openFallback",
        },
        {
          fieldPath: "openFallback",
          failMode: "open",
          openFallback: "plaintext",
        },
      );
    }
    return plaintext;
  }
  if (fallback === "null") return "";
  return createDefaultMasker()(plaintext);
}

async function protectValue(
  config: FieldCryptoConfig | undefined,
  input: {
    value: string | undefined;
    path: string;
    aad: Record<string, string>;
    tenantId?: string;
  },
): Promise<string | undefined> {
  const value = normalizeString(input.value);
  if (!value) return undefined;
  if (!config || config.enabled === false) return value;

  const failMode = config.failMode ?? "closed";
  const keyResolver = config.keyResolver;

  try {
    const keyContext = {
      tenantId: input.tenantId,
      tableName: input.aad.tableName,
      fieldPath: input.path,
      messageId: input.aad.messageId,
      providerId: input.aad.providerId,
    };
    const kid = keyResolver
      ? normalizeString((await keyResolver.resolveEncryptKey(keyContext)).kid)
      : undefined;
    const encrypted = await config.provider.encrypt({
      value,
      path: input.path,
      aad: input.aad,
      ...(kid ? { kid } : {}),
    });
    return typeof encrypted.ciphertext === "string"
      ? encrypted.ciphertext
      : JSON.stringify(encrypted.ciphertext);
  } catch (error) {
    if (failMode === "closed") {
      throw error;
    }
    return toFallbackValue(config, value);
  }
}

async function revealValue(
  config: FieldCryptoConfig | undefined,
  input: {
    value: string | undefined;
    path: string;
    aad: Record<string, string>;
    tenantId?: string;
  },
): Promise<string | undefined> {
  const value = normalizeString(input.value);
  if (!value) return undefined;
  if (!config || config.enabled === false) return value;

  const failMode = config.failMode ?? "closed";

  try {
    const keyContext = {
      tenantId: input.tenantId,
      tableName: input.aad.tableName,
      fieldPath: input.path,
      messageId: input.aad.messageId,
      providerId: input.aad.providerId,
    };
    const candidateKids = config.keyResolver?.resolveDecryptKeys
      ? await config.keyResolver.resolveDecryptKeys({
          ...keyContext,
          ciphertext: value,
        })
      : undefined;
    return await config.provider.decrypt({
      ciphertext: value,
      path: input.path,
      aad: input.aad,
      ...(Array.isArray(candidateKids) && candidateKids.length > 0
        ? { candidateKids }
        : {}),
    });
  } catch (error) {
    if (failMode === "closed") {
      throw error;
    }
    return toFallbackValue(config, value);
  }
}

export class WebhookRegistry {
  private endpoints: Map<string, WebhookEndpoint> = new Map();
  private deliveries: Map<string, WebhookDelivery> = new Map();
  private readonly options: WebhookRegistryOptions;

  constructor(options: WebhookRegistryOptions = {}) {
    this.options = options;
    this.validateCryptoOptions(this.options.fieldCrypto);
  }

  async addEndpoint(endpoint: WebhookEndpoint): Promise<void> {
    this.endpoints.set(endpoint.id, await this.protectEndpoint(endpoint));
  }

  async updateEndpoint(
    endpointId: string,
    endpoint: WebhookEndpoint,
  ): Promise<void> {
    if (!this.endpoints.has(endpointId)) {
      throw new Error(`Endpoint ${endpointId} not found`);
    }
    this.endpoints.set(endpointId, await this.protectEndpoint(endpoint));
  }

  async removeEndpoint(endpointId: string): Promise<void> {
    this.endpoints.delete(endpointId);
  }

  async getEndpoint(endpointId: string): Promise<WebhookEndpoint | null> {
    const endpoint = this.endpoints.get(endpointId);
    if (!endpoint) return null;
    return await this.revealEndpoint(endpoint);
  }

  async listEndpoints(): Promise<WebhookEndpoint[]> {
    return await Promise.all(
      Array.from(this.endpoints.values()).map((endpoint) =>
        this.revealEndpoint(endpoint),
      ),
    );
  }

  async addDelivery(delivery: WebhookDelivery): Promise<void> {
    this.deliveries.set(delivery.id, await this.protectDelivery(delivery));
  }

  async getDeliveries(
    endpointId?: string,
    timeRange?: { start: Date; end: Date },
    eventType?: WebhookEventType,
    status?: string,
    limit = 100,
  ): Promise<WebhookDelivery[]> {
    let deliveries = Array.from(this.deliveries.values());

    if (endpointId) {
      deliveries = deliveries.filter((d) => d.endpointId === endpointId);
    }

    if (timeRange) {
      deliveries = deliveries.filter(
        (d) => d.createdAt >= timeRange.start && d.createdAt <= timeRange.end,
      );
    }

    if (eventType) {
      deliveries = deliveries.filter((d) => d.eventType === eventType);
    }

    if (status) {
      deliveries = deliveries.filter((d) => d.status === status);
    }

    const selected = deliveries
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);

    return await Promise.all(
      selected.map((delivery) => this.revealDelivery(delivery)),
    );
  }

  async getFailedDeliveries(
    endpointId?: string,
    eventType?: WebhookEventType,
  ): Promise<WebhookDelivery[]> {
    const deliveries = await this.getDeliveries(
      endpointId,
      undefined,
      eventType,
      undefined,
      1000,
    );
    return deliveries.filter(
      (d) => d.status === "failed" || d.status === "exhausted",
    );
  }

  private async protectEndpoint(
    endpoint: WebhookEndpoint,
  ): Promise<WebhookEndpoint> {
    const aad = {
      tableName: "webhook_endpoint",
      messageId: endpoint.id,
    };
    const secret = await protectValue(this.options.fieldCrypto?.endpoint, {
      value: endpoint.secret,
      path: "secret",
      aad,
      tenantId: this.options.fieldCrypto?.tenantId,
    });

    return {
      ...endpoint,
      ...(secret ? { secret } : {}),
    };
  }

  private async revealEndpoint(
    endpoint: WebhookEndpoint,
  ): Promise<WebhookEndpoint> {
    const aad = {
      tableName: "webhook_endpoint",
      messageId: endpoint.id,
    };
    const secret = await revealValue(this.options.fieldCrypto?.endpoint, {
      value: endpoint.secret,
      path: "secret",
      aad,
      tenantId: this.options.fieldCrypto?.tenantId,
    });

    return {
      ...endpoint,
      ...(secret ? { secret } : {}),
    };
  }

  private async protectDelivery(
    delivery: WebhookDelivery,
  ): Promise<WebhookDelivery> {
    const aad = {
      tableName: "webhook_delivery",
      messageId: delivery.id,
      providerId: delivery.endpointId,
    };
    const payload = await protectValue(this.options.fieldCrypto?.delivery, {
      value: delivery.payload,
      path: "payload",
      aad,
      tenantId: this.options.fieldCrypto?.tenantId,
    });

    return {
      ...delivery,
      payload: payload ?? delivery.payload,
    };
  }

  private async revealDelivery(
    delivery: WebhookDelivery,
  ): Promise<WebhookDelivery> {
    const aad = {
      tableName: "webhook_delivery",
      messageId: delivery.id,
      providerId: delivery.endpointId,
    };
    const payload = await revealValue(this.options.fieldCrypto?.delivery, {
      value: delivery.payload,
      path: "payload",
      aad,
      tenantId: this.options.fieldCrypto?.tenantId,
    });

    return {
      ...delivery,
      payload: payload ?? delivery.payload,
    };
  }

  private validateCryptoOptions(
    options: WebhookRegistryCryptoOptions | undefined,
  ): void {
    if (!options) return;

    if (options.endpoint) {
      assertFieldCryptoConfig(options.endpoint);
    }

    if (options.delivery) {
      assertFieldCryptoConfig(options.delivery);
    }
  }
}
