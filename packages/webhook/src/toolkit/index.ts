/**
 * Toolkit APIs (advanced building blocks)
 */

export { BatchDispatcher } from "../dispatcher/batch.dispatcher";
export { LoadBalancer } from "../dispatcher/load-balancer";
export { QueueManager } from "../dispatcher/queue.manager";
export type {
  BatchConfig,
  CircuitBreakerState,
  DispatchConfig,
  DispatchJob,
  LoadBalancerConfig,
  QueueConfig,
} from "../dispatcher/types";

export { DeliveryStore } from "../registry/delivery.store";
export { EndpointManager } from "../registry/endpoint.manager";
export { EventStore } from "../registry/event.store";
export type {
  DeliveryFilter,
  EndpointFilter,
  EventFilter,
  PaginationOptions,
  SearchResult,
  StorageConfig,
} from "../registry/types";
export { RetryManager } from "../retry/retry.manager";
export { SecurityManager } from "../security/security.manager";
export {
  DefaultHttpClient,
  type HttpClient,
  MockHttpClient,
  WebhookDispatcher,
} from "../services/webhook.dispatcher";
export type {
  WebhookRegistryCryptoOptions,
  WebhookRegistryOptions,
} from "../services/webhook.registry";
export { WebhookRegistry } from "../services/webhook.registry";

export type { FileStorageAdapter } from "../shared/file-storage";
