/**
 * K-Message: Korean Multi-Channel Messaging Platform
 * Unified package that re-exports core functionality for easy use
 */

export * from "@k-msg/core";
export type {
  ApiFailoverAttemptContext,
  ApiFailoverClassificationContext,
  ApiFailoverSender,
  DeliveryTrackingApiFailoverConfig,
  DeliveryTrackingServiceConfig,
  Job,
  JobQueue,
} from "@k-msg/messaging";
export {
  createDeliveryTrackingHooks,
  DeliveryTrackingService,
  InMemoryDeliveryTrackingStore,
  KMsg,
} from "@k-msg/messaging";
export type { AligoConfig, IWINVConfig, SolapiConfig } from "@k-msg/provider";
export {
  AligoProvider,
  IWINVProvider,
  MockProvider,
  SolapiProvider,
} from "@k-msg/provider";
