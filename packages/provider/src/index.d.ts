/**
 * @k-msg/provider
 * Complete provider system with adapters and implementations
 */
export type { MessageChannel, MessageType, SendOptions, MediaAttachment, HealthCheckResult, SendResult, TemplateResult, BaseProvider, MessageContent, MessageButton, TemplateCreateRequest, TemplateUpdateRequest, SenderNumber, SenderVerificationResult, ChannelInfo, BaseProviderConfig, TemplateFilters, HistoryFilters } from './types/base';
export type { NotificationRequest, NotificationResponse } from './interfaces';
export * from './interfaces/plugin';
export * from './registry';
export * from './middleware';
export * from './utils';
export type { ProviderCapabilities, ProviderConfiguration, ConfigurationField, MessagingContract, TemplateContract, ChannelContract, AnalyticsContract, AccountContract, ScheduleResult } from './contracts/provider.contract';
export { BaseAlimTalkProvider } from './abstract/provider.base';
export { BaseRequestAdapter, IWINVRequestAdapter, AligoRequestAdapter, KakaoRequestAdapter, RequestAdapterFactory } from './adapters/request.adapter';
export { BaseResponseAdapter, IWINVResponseAdapter, AligoResponseAdapter, KakaoResponseAdapter, NHNResponseAdapter, ResponseAdapterFactory } from './adapters/response.adapter';
export * from './services/provider.manager';
export * from './services/provider.service';
export { IWINVProvider } from './iwinv/provider';
export type * from './iwinv/types/iwinv';
//# sourceMappingURL=index.d.ts.map