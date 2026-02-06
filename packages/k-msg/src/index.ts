/**
 * K-Message: Korean Multi-Channel Messaging Platform
 * Unified package that re-exports core functionality for easy use
 */

// Re-export core result types
export { ok, fail, type Result } from '@k-msg/core';

// Re-export the most essential classes for basic usage
export { IWINVProvider, IWINVAdapter } from '@k-msg/provider';

// Re-export essential types 
export type { 
  ProviderMessageRequest,
  ProviderMessageResult 
} from '@k-msg/messaging';

// Re-export the main KMsg client
export { KMsg } from '@k-msg/messaging';

// Re-export new common message services
export { 
  /** @deprecated Use KMsg instead */
  MessageServiceFactory,
  /** @deprecated Use KMsg with IWINVAdapter instead */
  IWINVMessageService,
  /** @deprecated Use KMsg instead */
  BaseMessageService,
  type MessageServiceConfig,
  type IWINVMessageServiceConfig,
  type ServiceFactoryOptions
} from '@k-msg/messaging';

// Re-export simple modules for CLI/scripts
export { 
  /** @deprecated Use KMsg instead */
  createKMsgSender,
  /** @deprecated Use KMsg instead */
  createKMsgTemplates,
  /** @deprecated Use KMsg instead */
  createKMsgAnalytics
} from './modules';

// Remove admin exports for now as they are incomplete