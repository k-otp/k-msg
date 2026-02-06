/**
 * @k-msg/provider
 * Complete provider system with adapters and implementations
 */

// =============================================================================
// CORE PROVIDER SYSTEM
// =============================================================================

// Base types and interfaces - avoid conflicts with explicit exports
export type {
  MessageChannel,
  MessageType,
  SendOptions,
  MediaAttachment,
  HealthCheckResult,
  SendResult,
  TemplateResult,
  BaseProvider,
  MessageContent,
  MessageButton,
  TemplateCreateRequest,
  TemplateUpdateRequest,
  SenderNumber,
  SenderVerificationResult,
  ChannelInfo,
  BaseProviderConfig,
  TemplateFilters,
  HistoryFilters
} from './types/base';

// Interfaces
export type {
  NotificationRequest,
  NotificationResponse
} from './interfaces';

// Plugin interfaces
export * from './interfaces/plugin';

// Provider registry and plugin system
export * from './registry';
export * from './middleware';
export * from './utils';

// =============================================================================
// PROVIDER CONTRACTS AND ADAPTERS
// =============================================================================

// Provider contracts (from provider-adapter)
export type {
  ProviderCapabilities,
  ProviderConfiguration,
  ConfigurationField,
  MessagingContract,
  TemplateContract,
  ChannelContract,
  AnalyticsContract,
  AccountContract,
  ScheduleResult,
  ProviderMessageRequest,
  ProviderMessageResult
} from './contracts/provider.contract';

// Abstract base provider (from provider-adapter)
export { BaseAlimTalkProvider } from './abstract/provider.base';

// ADAPTER PATTERN IMPLEMENTATION (using @k-msg/core)
export {
  IWINVAdapter,
  IWINVAdapterFactory
} from './adapters/iwinv.adapter';

export {
  MockProvider
} from './mock';

// Provider manager service (from provider-adapter)
export * from './services/provider.manager';
export * from './services/provider.service';

// =============================================================================
// PROVIDER IMPLEMENTATIONS
// =============================================================================

// IWINV Providers (New Adapter Pattern)
export {
  IWINVProvider,
  IWINVProviderFactory,
  createIWINVProvider,
  createDefaultIWINVProvider,
  initializeIWINV
} from './iwinv/provider';

export {
  IWINVSMSProvider,
  createIWINVSMSProvider,
  createDefaultIWINVSMSProvider
} from './iwinv/provider-sms';

export {
  IWINVMultiProvider,
  createIWINVMultiProvider,
  createDefaultIWINVMultiProvider
} from './iwinv/provider-multi';

export type * from './iwinv/types/iwinv';

// SMS Provider Contracts
export type * from './contracts/sms.contract';

// =============================================================================
// NEW TYPE SAFETY SYSTEMS
// =============================================================================

// Unified Configuration System
export {
  UnifiedConfigBuilder,
  UnifiedConfigFactory,
  isValidUnifiedConfig,
  isValidIWINVBaseConfig,
  toLegacyIWINVConfig
} from './types/unified-config';
export type {
  UnifiedProviderConfig,
  IWINVBaseConfig,
  AlimTalkConfig,
  SMSConfig,
  PerformanceConfig,
  MonitoringConfig
} from './types/unified-config';

// Typed Template System
export {
  TypedProvider,
  TemplateValidator,
  TemplateTypeConverter,
  TEMPLATE_REGISTRY
} from './types/typed-templates';
export type {
  TemplateCode,
  TypedRequest,
  TypedResult,
  TemplateVariables,
  ValidationResult
} from './types/typed-templates';

// Unified Error System
export {
  ErrorFactory,
  ErrorConverter,
  ErrorAnalyzer,
  UnifiedError,
  ProviderError,
  TemplateError,
  NetworkError,
  isUnifiedError,
  isProviderError,
  isTemplateError,
  isNetworkError,
  isRetryableError,
  ErrorCategory,
  ErrorSeverity
} from './types/unified-errors';
export type {
  BaseErrorInfo,
  ProviderErrorInfo,
  TemplateErrorInfo,
  NetworkErrorInfo,
  UnifiedErrorInfo,
  ErrorStats
} from './types/unified-errors';