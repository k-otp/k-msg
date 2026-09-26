import type { FieldCryptoConfig } from "@k-msg/core";
import {
  protectDelivery,
  protectEndpoint,
  revealDelivery,
  revealEndpoint,
  validateWebhookFieldCryptoOptions,
} from "../crypto/field-crypto";
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

  private protectEndpoint(endpoint: WebhookEndpoint): Promise<WebhookEndpoint> {
    return protectEndpoint(endpoint, this.options.fieldCrypto);
  }

  private revealEndpoint(endpoint: WebhookEndpoint): Promise<WebhookEndpoint> {
    return revealEndpoint(endpoint, this.options.fieldCrypto);
  }

  private protectDelivery(delivery: WebhookDelivery): Promise<WebhookDelivery> {
    return protectDelivery(delivery, this.options.fieldCrypto);
  }

  private revealDelivery(delivery: WebhookDelivery): Promise<WebhookDelivery> {
    return revealDelivery(delivery, this.options.fieldCrypto);
  }

  private validateCryptoOptions(
    options: WebhookRegistryCryptoOptions | undefined,
  ): void {
    validateWebhookFieldCryptoOptions(options);
  }
}
