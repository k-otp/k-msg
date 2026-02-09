/**
 * @k-msg/provider
 * Complete provider system with adapters and implementations
 */

// =============================================================================
// CORE PROVIDER SYSTEM
// =============================================================================

// Interfaces
export type {
  NotificationRequest,
  NotificationResponse,
} from "./interfaces";
// Plugin interfaces
export * from "./interfaces/plugin";
export * from "./middleware";

// Provider registry and plugin system
export * from "./registry";
// Base types and interfaces - avoid conflicts with explicit exports
export type {
  BaseProvider,
  BaseProviderConfig,
  ChannelInfo,
  HealthCheckResult,
  HistoryFilters,
  MediaAttachment,
  MessageButton,
  MessageChannel,
  MessageContent,
  MessageType,
  SenderNumber,
  SenderVerificationResult,
  SendOptions,
  SendResult,
  TemplateCreateRequest,
  TemplateFilters,
  TemplateResult,
  TemplateUpdateRequest,
} from "./types/base";
export * from "./utils";

// =============================================================================
// PROVIDER CONTRACTS AND ADAPTERS
// =============================================================================

// Abstract base provider (from provider-adapter)
export { BaseAlimTalkProvider } from "./abstract/provider.base";
export { AligoAdapter } from "./adapters/aligo.adapter";

// ADAPTER PATTERN IMPLEMENTATION (using @k-msg/core)
export {
  IWINVAdapter,
  IWINVAdapterFactory,
} from "./adapters/iwinv.adapter";
// Provider contracts (from provider-adapter)
export type {
  AccountContract,
  AnalyticsContract,
  ChannelContract,
  ConfigurationField,
  MessagingContract,
  ProviderCapabilities,
  ProviderConfiguration,
  ProviderMessageRequest,
  ProviderMessageResult,
  ScheduleResult,
  TemplateContract,
} from "./contracts/provider.contract";

export { MockProvider } from "./mock";

// Provider manager service (from provider-adapter)
export * from "./services/provider.manager";
export * from "./services/provider.service";

// =============================================================================
// PROVIDER IMPLEMENTATIONS
// =============================================================================

export {
  AligoProvider,
  AligoProviderFactory,
  createAligoProvider,
  createDefaultAligoProvider,
  initializeAligo,
} from "./aligo/provider";
// SMS Provider Contracts
export type * from "./contracts/sms.contract";
// IWINV Providers (New Adapter Pattern)
export {
  createDefaultIWINVProvider,
  createIWINVProvider,
  IWINVProvider,
  IWINVProviderFactory,
  initializeIWINV,
} from "./iwinv/provider";
export {
  createDefaultIWINVMultiProvider,
  createIWINVMultiProvider,
  IWINVMultiProvider,
} from "./iwinv/provider-multi";
export {
  createDefaultIWINVSMSProvider,
  createIWINVSMSProvider,
  IWINVSMSProvider,
} from "./iwinv/provider-sms";
export type * from "./iwinv/types/iwinv";
export type * from "./types/aligo";

// =============================================================================
// NEW TYPE SAFETY SYSTEMS
// =============================================================================

export type {
  TemplateCode,
  TemplateVariables,
  TypedRequest,
  TypedResult,
  ValidationResult,
} from "./types/typed-templates";
// Typed Template System
export {
  TEMPLATE_REGISTRY,
  TemplateTypeConverter,
  TemplateValidator,
  TypedProvider,
} from "./types/typed-templates";
export type {
  AlimTalkConfig,
  IWINVBaseConfig,
  MonitoringConfig,
  PerformanceConfig,
  SMSConfig,
  UnifiedProviderConfig,
} from "./types/unified-config";
// Unified Configuration System
export {
  isValidIWINVBaseConfig,
  isValidUnifiedConfig,
  toLegacyIWINVConfig,
  UnifiedConfigBuilder,
  UnifiedConfigFactory,
} from "./types/unified-config";
export type {
  BaseErrorInfo,
  ErrorStats,
  NetworkErrorInfo,
  ProviderErrorInfo,
  TemplateErrorInfo,
  UnifiedErrorInfo,
} from "./types/unified-errors";
// Unified Error System
export {
  ErrorAnalyzer,
  ErrorCategory,
  ErrorConverter,
  ErrorFactory,
  ErrorSeverity,
  isNetworkError,
  isProviderError,
  isRetryableError,
  isTemplateError,
  isUnifiedError,
  NetworkError,
  ProviderError,
  TemplateError,
  UnifiedError,
} from "./types/unified-errors";
