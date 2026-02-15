import type {
  WebhookDelivery,
  WebhookEndpoint,
  WebhookEventType,
} from "../types/webhook.types";

export class WebhookRegistry {
  private endpoints: Map<string, WebhookEndpoint> = new Map();
  private deliveries: Map<string, WebhookDelivery> = new Map();

  async addEndpoint(endpoint: WebhookEndpoint): Promise<void> {
    this.endpoints.set(endpoint.id, endpoint);
  }

  async updateEndpoint(
    endpointId: string,
    endpoint: WebhookEndpoint,
  ): Promise<void> {
    if (!this.endpoints.has(endpointId)) {
      throw new Error(`Endpoint ${endpointId} not found`);
    }
    this.endpoints.set(endpointId, endpoint);
  }

  async removeEndpoint(endpointId: string): Promise<void> {
    this.endpoints.delete(endpointId);
  }

  async getEndpoint(endpointId: string): Promise<WebhookEndpoint | null> {
    return this.endpoints.get(endpointId) || null;
  }

  async listEndpoints(): Promise<WebhookEndpoint[]> {
    return Array.from(this.endpoints.values());
  }

  async addDelivery(delivery: WebhookDelivery): Promise<void> {
    this.deliveries.set(delivery.id, delivery);
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

    return deliveries
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
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
}
