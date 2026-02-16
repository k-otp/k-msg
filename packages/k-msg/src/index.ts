/**
 * K-Message: Korean Multi-Channel Messaging Platform
 * Unified package that re-exports core functionality for easy use
 */

export * from "@k-msg/core";
export { KMsg } from "@k-msg/messaging";
export type {
  Job,
  JobQueue,
} from "@k-msg/messaging/queue";
export type {
  ApiFailoverAttemptContext,
  ApiFailoverClassificationContext,
  ApiFailoverSender,
  DeliveryTrackingApiFailoverConfig,
  DeliveryTrackingServiceConfig,
} from "@k-msg/messaging/tracking";
export {
  createDeliveryTrackingHooks,
  DeliveryTrackingService,
  InMemoryDeliveryTrackingStore,
} from "@k-msg/messaging/tracking";
export type { AligoConfig, IWINVConfig, SolapiConfig } from "@k-msg/provider";
export {
  AligoProvider,
  IWINVProvider,
  MockProvider,
  SolapiProvider,
} from "@k-msg/provider";
