/**
 * K-Message: Korean Multi-Channel Messaging Platform
 * Lightweight facade focused on basic send flow
 */

export {
  type DeliveryStatus,
  type ErrorRetryPolicyIssue,
  type ErrorRetryPolicyMode,
  type ErrorRetryPolicyNormalizeOptions,
  type ErrorRetryPolicyValidationResult,
  ErrorUtils,
  fail,
  getPollableStatuses,
  isKMsgDeliveryStatus,
  isKMsgMessageType,
  isKMsgTerminalStatus,
  isPollableDeliveryStatus,
  isTerminalDeliveryStatus,
  KMSG_DELIVERY_STATUSES,
  KMSG_MESSAGE_TYPES,
  KMSG_POLLABLE_STATUSES,
  KMSG_TERMINAL_STATUSES,
  KMsgError,
  KMsgErrorCode,
  type MessageType,
  type NormalizedProviderError,
  type NormalizedProviderErrorSources,
  type NormalizeProviderErrorOptions,
  normalizeErrorRetryPolicy,
  normalizeProviderError,
  ok,
  type Provider,
  parseErrorRetryPolicyFromJson,
  type Result,
  type SendInput,
  type SendOptions,
  type SendResult,
  validateErrorRetryPolicy,
} from "@k-msg/core";
export {
  estimateSmsBytes,
  KMsg,
  type KMsgConfig,
  type KMsgDefaultsConfig,
  type KMsgRoutingConfig,
} from "@k-msg/messaging";
// Deprecated: field-crypto helpers moved to `k-msg/core`.
export * from "./deprecated-crypto";
