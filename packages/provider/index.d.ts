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
export { IWINVAdapter, IWINVAdapterFactory } from './adapters/iwinv.adapter';
export * from './services/provider.manager';
export * from './services/provider.service';
export { IWINVProvider, IWINVProviderFactory, createIWINVProvider, createDefaultIWINVProvider, initializeIWINV } from './iwinv/provider';
export { IWINVSMSProvider, createIWINVSMSProvider, createDefaultIWINVSMSProvider } from './iwinv/provider-sms';
export { IWINVMultiProvider, createIWINVMultiProvider, createDefaultIWINVMultiProvider } from './iwinv/provider-multi';
export type * from './iwinv/types/iwinv';
export type * from './contracts/sms.contract';
