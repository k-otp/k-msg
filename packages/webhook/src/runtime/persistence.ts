import type { WebhookDelivery, WebhookEndpoint } from "../types/webhook.types";
import { WebhookEndpointConflictError } from "./errors";
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

// Newest first, then by id, so a page cursor has one position to resume from.
function sortByCreatedAtDesc(
  left: WebhookDelivery,
  right: WebhookDelivery,
): number {
  const byTime = right.createdAt.getTime() - left.createdAt.getTime();
  if (byTime !== 0) return byTime;
  if (left.id < right.id) return 1;
  if (left.id > right.id) return -1;
  return 0;
}

/** Whether a delivery comes after the cursor in the newest-first order. */
export function isBeforeDeliveryCursor(
  delivery: WebhookDelivery,
  cursor: { createdAt: Date; id: string },
): boolean {
  const time = delivery.createdAt.getTime();
  const cursorTime = cursor.createdAt.getTime();
  return time < cursorTime || (time === cursorTime && delivery.id < cursor.id);
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

  if (options.before && !isBeforeDeliveryCursor(delivery, options.before)) {
    return false;
  }

  if (options.status && delivery.status !== options.status) {
    return false;
  }

  return true;
}

// Stores and returns copies, so changing an endpoint object a caller holds
// cannot change a stored endpoint or get around the id and URL checks. The
// copies cost list() a structuredClone per endpoint, which dispatch pays for
// every event: fine for the few endpoints this store is meant for.
export class InMemoryWebhookEndpointStore implements WebhookEndpointStore {
  private readonly endpoints = new Map<string, WebhookEndpoint>();

  async add(endpoint: WebhookEndpoint): Promise<void> {
    if (this.endpoints.has(endpoint.id)) {
      throw new WebhookEndpointConflictError("id", endpoint.id, endpoint.id);
    }
    this.assertUrlAvailable(endpoint.url, endpoint.id);

    this.endpoints.set(endpoint.id, structuredClone(endpoint));
  }

  async update(endpointId: string, endpoint: WebhookEndpoint): Promise<void> {
    if (!this.endpoints.has(endpointId)) {
      throw new Error(`Webhook endpoint ${endpointId} not found`);
    }
    this.assertUrlAvailable(endpoint.url, endpointId);

    // The id is the key the endpoint is stored under, as in the D1 store.
    this.endpoints.set(endpointId, {
      ...structuredClone(endpoint),
      id: endpointId,
    });
  }

  private assertUrlAvailable(url: string, endpointId: string): void {
    for (const [storedId, stored] of this.endpoints) {
      if (storedId !== endpointId && stored.url === url) {
        throw new WebhookEndpointConflictError("url", url, storedId);
      }
    }
  }

  async remove(endpointId: string): Promise<void> {
    this.endpoints.delete(endpointId);
  }

  async get(endpointId: string): Promise<WebhookEndpoint | null> {
    const endpoint = this.endpoints.get(endpointId);
    return endpoint ? structuredClone(endpoint) : null;
  }

  async list(): Promise<WebhookEndpoint[]> {
    return Array.from(this.endpoints.values(), (endpoint) =>
      structuredClone(endpoint),
    ).sort(sortByUpdatedAtDesc);
  }
}

export class InMemoryWebhookDeliveryStore implements WebhookDeliveryStore {
  private readonly deliveries = new Map<string, WebhookDelivery>();

  async add(delivery: WebhookDelivery): Promise<void> {
    this.deliveries.set(delivery.id, delivery);
  }

  async replace(delivery: WebhookDelivery): Promise<void> {
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
