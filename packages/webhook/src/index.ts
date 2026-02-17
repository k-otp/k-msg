/**
 * Webhook System
 * 실시간 메시지 이벤트 알림 시스템
 */

// 디스패처 컴포넌트
export { BatchDispatcher } from "./dispatcher/batch.dispatcher";
export { LoadBalancer } from "./dispatcher/load-balancer";
export { QueueManager } from "./dispatcher/queue.manager";
// 디스패처 타입
export type {
  BatchConfig,
  CircuitBreakerState,
  DispatchConfig,
  DispatchJob,
  LoadBalancerConfig,
  QueueConfig,
} from "./dispatcher/types";
export { DeliveryStore } from "./registry/delivery.store";
// 레지스트리 컴포넌트
export { EndpointManager } from "./registry/endpoint.manager";
export { EventStore } from "./registry/event.store";
// 레지스트리 타입
export type {
  DeliveryFilter,
  EndpointFilter,
  EventFilter,
  PaginationOptions,
  SearchResult,
  StorageConfig,
} from "./registry/types";
export { RetryManager } from "./retry/retry.manager";
// 보안 및 재시도 관리
export { SecurityManager } from "./security/security.manager";
export {
  DefaultHttpClient,
  type HttpClient,
  MockHttpClient,
  WebhookDispatcher,
} from "./services/webhook.dispatcher";
export { WebhookRegistry } from "./services/webhook.registry";
// 핵심 서비스
export { WebhookService } from "./services/webhook.service";
export type { FileStorageAdapter } from "./shared/file-storage";
// 타입 정의
export type {
  WebhookAttempt,
  WebhookBatch,
  WebhookConfig,
  WebhookDelivery,
  WebhookDeliveryData,
  WebhookEndpoint,
  WebhookEndpointData,
  WebhookEvent,
  WebhookEventData,
  WebhookSecurity,
  WebhookStats,
  WebhookTestResult,
} from "./types/webhook.types";

// Zod schemas (useful for validating inbound/outbound payloads)
export {
  WebhookDeliverySchema,
  WebhookEndpointSchema,
  WebhookEventSchema,
  WebhookEventType,
} from "./types/webhook.types";
