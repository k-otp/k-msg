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
  ScheduleResult
} from './contracts/provider.contract';

// Abstract base provider (from provider-adapter)
export { BaseAlimTalkProvider } from './abstract/provider.base';

// ADAPTER PATTERN IMPLEMENTATION (using @k-msg/core)
export {
  IWINVAdapter,
  IWINVAdapterFactory
} from './adapters/iwinv.adapter';

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