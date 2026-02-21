import type { WebhookDelivery, WebhookEndpoint } from "../types/webhook.types";
import type {
  WebhookDeliveryListOptions,
  WebhookDeliveryStore,
  WebhookEndpointStore,
  WebhookPersistence,
} from "./types";

function sortByUpdatedAtDesc(
  left: WebhookEndpoint,
  right: WebhookEndpoint,
): number {
  return right.updatedAt.getTime() - left.updatedAt.getTime();
}

function sortByCreatedAtDesc(
  left: WebhookDelivery,
  right: WebhookDelivery,
): number {
  return right.createdAt.getTime() - left.createdAt.getTime();
}

function matchesDeliveryOptions(
  delivery: WebhookDelivery,
  options: WebhookDeliveryListOptions,
): boolean {
  if (options.endpointId && delivery.endpointId !== options.endpointId) {
    return false;
  }

  if (options.eventType && delivery.eventType !== options.eventType) {
    return false;
  }

  if (options.status && delivery.status !== options.status) {
    return false;
  }

  return true;
}

export class InMemoryWebhookEndpointStore implements WebhookEndpointStore {
  private readonly endpoints = new Map<string, WebhookEndpoint>();

  async add(endpoint: WebhookEndpoint): Promise<void> {
    this.endpoints.set(endpoint.id, endpoint);
  }

  async update(endpointId: string, endpoint: WebhookEndpoint): Promise<void> {
    if (!this.endpoints.has(endpointId)) {
      throw new Error(`Webhook endpoint ${endpointId} not found`);
    }

    this.endpoints.set(endpointId, endpoint);
  }

  async remove(endpointId: string): Promise<void> {
    this.endpoints.delete(endpointId);
  }

  async get(endpointId: string): Promise<WebhookEndpoint | null> {
    return this.endpoints.get(endpointId) ?? null;
  }

  async list(): Promise<WebhookEndpoint[]> {
    return Array.from(this.endpoints.values()).sort(sortByUpdatedAtDesc);
  }
}

export class InMemoryWebhookDeliveryStore implements WebhookDeliveryStore {
  private readonly deliveries = new Map<string, WebhookDelivery>();

  async add(delivery: WebhookDelivery): Promise<void> {
    this.deliveries.set(delivery.id, delivery);
  }

  async list(
    options: WebhookDeliveryListOptions = {},
  ): Promise<WebhookDelivery[]> {
    const matched = Array.from(this.deliveries.values())
      .filter((delivery) => matchesDeliveryOptions(delivery, options))
      .sort(sortByCreatedAtDesc);

    const limit =
      typeof options.limit === "number" && Number.isFinite(options.limit)
        ? Math.max(0, Math.floor(options.limit))
        : 100;

    return matched.slice(0, limit);
  }
}

export function createInMemoryWebhookPersistence(): WebhookPersistence {
  return {
    endpointStore: new InMemoryWebhookEndpointStore(),
    deliveryStore: new InMemoryWebhookDeliveryStore(),
  };
}
