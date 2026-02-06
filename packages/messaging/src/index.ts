// Types
export * from './types/message.types';

// Senders
export { SingleMessageSender, type Provider, type ProviderMessageRequest, type ProviderMessageResult } from './sender/single.sender';
export { BulkMessageSender } from './sender/bulk.sender';

// Services (기존)
export { MessageService } from './services/message.service';

// Services (새로운 공통 모듈)
export { 
  BaseMessageService, 
  type MessageServiceConfig, 
  type ServiceState,
  type ChannelLoaderFn,
  type TemplateLoaderFn,
  type ErrorHandlerFn
} from './services/base-message.service';

export { 
  IWINVMessageService, 
  type IWINVMessageServiceConfig 
} from './services/iwinv-message.service';

export { 
  MessageServiceFactory,
  type ServiceFactoryOptions
} from './services/message-service.factory';

// Queue system
export { JobProcessor, MessageJobProcessor } from './queue/job.processor';
export { MessageRetryHandler } from './queue/retry.handler';

// Delivery tracking
export { DeliveryTracker } from './delivery/tracker';

// Personalization
export { VariableReplacer, defaultVariableReplacer, VariableUtils } from './personalization/variable.replacer';

export { KMsg } from './k-msg';
export * from './hooks';
