/**
 * K-Message: Korean Multi-Channel Messaging Platform
 * Unified package that re-exports core functionality for easy use
 */

// Re-export the most essential classes for basic usage
export { IWINVProvider } from '@k-msg/provider';

// Re-export essential types 
export type { 
  ProviderMessageRequest,
  ProviderMessageResult 
} from '@k-msg/messaging';

// Re-export new common message services
export { 
  MessageServiceFactory,
  IWINVMessageService,
  BaseMessageService,
  type MessageServiceConfig,
  type IWINVMessageServiceConfig,
  type ServiceFactoryOptions
} from '@k-msg/messaging';

// Re-export simple modules for CLI/scripts
export { 
  createKMsgSender,
  createKMsgTemplates,
  createKMsgAnalytics
} from './modules';

// Remove admin exports for now as they are incomplete