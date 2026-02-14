// Provider response types
export interface ProviderResponse {
  success: boolean;
  data?: unknown;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface TemplateVariable {
  name: string;
  type: string;
  required: boolean;
  description?: string;
}

export interface TemplateButton {
  type: string;
  title: string;
  url?: string;
}

export interface AlimTalkTemplate {
  id: string;
  name: string;
  content: string;
  variables?: TemplateVariable[];
  buttons?: TemplateButton[];
}

// Channel and sender types (temporary local definitions)
export interface Channel {
  id: string;
  name: string;
  profileKey: string;
  status: "active" | "inactive" | "pending" | "blocked";
  createdAt: Date;
  updatedAt: Date;
}

export interface SenderNumber {
  id: string;
  channelId: string;
  phoneNumber: string;
  isVerified: boolean;
  verifiedAt?: Date;
  createdAt: Date;
}

import type {
  BaseProvider,
  DeliveryStatus,
  StandardRequest,
  StandardResult,
} from "@k-msg/core";

// AlimTalk 전용 요청/응답 타입
export interface AlimTalkRequest extends StandardRequest {
  templateCode: string;
  phoneNumber: string;
  variables: Record<string, any>;
  senderNumber?: string;
  options?: MessageOptions;
}

export interface AlimTalkResult extends StandardResult {
  messageId: string;
  status: any; // Using any for compatibility with different status enums/types
  provider: string;
  timestamp: Date;
  templateCode: string;
  phoneNumber: string;
  deliveredAt?: Date;
  error?: ProviderError;
}

// Core provider interface - extends the new generic base provider from core
export interface AlimTalkProvider
  extends BaseProvider<AlimTalkRequest, AlimTalkResult> {
  readonly type: "messaging";

  // Enhanced capabilities (required for AlimTalk providers)
  readonly capabilities: ProviderCapabilities;

  // Template management
  templates: TemplateContract;

  // Channel/sender number management
  channels: ChannelContract;

  // Message sending (기본 send는 BaseProvider에서 제공)
  messaging: MessagingContract;

  // Analytics and reporting
  analytics: AnalyticsContract;

  // Account management
  account: AccountContract;
}

// Provider capabilities
export interface ProviderCapabilities {
  templates: {
    maxLength: number;
    maxVariables: number;
    maxButtons: number;
    supportedButtonTypes: string[];
    requiresApproval: boolean;
    approvalTime: string; // "instant" | "1-2 days" | "2-3 days"
  };
  messaging: {
    maxRecipientsPerRequest: number;
    maxRequestsPerSecond: number;
    supportsBulk: boolean;
    supportsScheduling: boolean;
    maxScheduleDays: number;
    supportsFallback: boolean;
  };
  channels: {
    requiresBusinessVerification: boolean;
    maxSenderNumbers: number;
    supportsMultipleChannels: boolean;
  };
}

// Template management contract
export interface TemplateContract {
  create(template: TemplateCreateRequest): Promise<TemplateCreateResult>;
  update(
    templateId: string,
    template: TemplateUpdateRequest,
  ): Promise<TemplateUpdateResult>;
  delete(templateId: string): Promise<void>;
  get(templateId: string): Promise<ProviderTemplate>;
  list(filters?: TemplateFilters): Promise<ProviderTemplate[]>;
  sync(): Promise<SyncResult>; // Sync with provider
}

export interface TemplateCreateRequest {
  name: string;
  content: string;
  variables: TemplateVariableDefinition[];
  buttons?: TemplateButtonDefinition[];
  category?: string;
}

export interface TemplateUpdateRequest {
  name?: string;
  content?: string;
  variables?: TemplateVariableDefinition[];
  buttons?: TemplateButtonDefinition[];
}

export interface TemplateCreateResult {
  templateId: string;
  providerTemplateCode: string;
  status: TemplateStatus;
  message?: string;
}

export interface TemplateUpdateResult {
  templateId: string;
  status: TemplateStatus;
  message?: string;
}

export interface ProviderTemplate {
  id: string;
  code: string;
  name: string;
  content: string;
  status: TemplateStatus;
  createdAt: Date;
  updatedAt: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
}

export enum TemplateStatus {
  DRAFT = "DRAFT",
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  DISABLED = "DISABLED",
}

export interface TemplateVariableDefinition {
  name: string;
  type: string;
  required: boolean;
  maxLength?: number;
  format?: string;
}

export interface TemplateButtonDefinition {
  type: string;
  name: string;
  linkMobile?: string;
  linkPc?: string;
  linkIos?: string;
  linkAndroid?: string;
  schemeIos?: string;
  schemeAndroid?: string;
}

export interface TemplateFilters {
  status?: TemplateStatus;
  category?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  page?: number;
  size?: number;
}

export interface SyncResult {
  synced: number;
  created: number;
  updated: number;
  deleted: number;
  errors: SyncError[];
}

export interface SyncError {
  templateId: string;
  error: string;
}

// Channel management contract
export interface ChannelContract {
  register(channel: ChannelRequest): Promise<Channel>;
  list(): Promise<Channel[]>;
  addSenderNumber(channelId: string, number: string): Promise<SenderNumber>;
  verifySenderNumber(
    number: string,
    verificationCode: string,
  ): Promise<boolean>;
}

export interface ChannelRequest {
  name: string;
  profileKey: string;
  businessInfo?: BusinessInfo;
}

export interface BusinessInfo {
  name: string;
  registrationNumber: string;
  category: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
}

// Messaging contract
export interface MessagingContract {
  send(message: ProviderMessageRequest): Promise<ProviderMessageResult>;
  sendBulk(messages: ProviderMessageRequest[]): Promise<ProviderBulkResult>;
  schedule(
    message: ProviderMessageRequest,
    scheduledAt: Date,
  ): Promise<ScheduleResult>;
  cancel(messageId: string): Promise<void>;
  getStatus(messageId: string): Promise<MessageStatus>;
}

export interface ProviderMessageRequest {
  templateCode: string;
  phoneNumber: string;
  variables: Record<string, unknown>;
  senderNumber?: string;
  options?: MessageOptions;
}

export interface MessageOptions {
  priority?: "high" | "normal" | "low";
  ttl?: number;
  tracking?: boolean;
  webhookUrl?: string;
  scheduledAt?: Date;
}

export interface ProviderMessageResult {
  messageId: string;
  status: MessageStatus;
  sentAt?: Date;
  error?: ProviderError;
}

export interface ProviderBulkResult {
  requestId: string;
  results: ProviderMessageResult[];
  summary: {
    total: number;
    sent: number;
    failed: number;
  };
}

export interface ScheduleResult {
  scheduleId: string;
  messageId: string;
  scheduledAt: Date;
  status: "scheduled" | "cancelled";
}

export enum MessageStatus {
  QUEUED = "QUEUED",
  SENDING = "SENDING",
  SENT = "SENT",
  DELIVERED = "DELIVERED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

export interface ProviderError {
  code: any;
  message: string;
  retryable: boolean;
  details?: Record<string, any>;
}

// Analytics contract
export interface AnalyticsContract {
  getUsage(period: DateRange): Promise<UsageStats>;
  getTemplateStats(
    templateId: string,
    period: DateRange,
  ): Promise<TemplateStats>;
  getDeliveryReport(messageId: string): Promise<DeliveryReport>;
}

export interface DateRange {
  from: Date;
  to: Date;
}

export interface UsageStats {
  period: DateRange;
  totalMessages: number;
  sentMessages: number;
  deliveredMessages: number;
  failedMessages: number;
  deliveryRate: number;
  failureRate: number;
  breakdown: {
    byTemplate: Record<string, number>;
    byDay: Record<string, number>;
    byHour: Record<string, number>;
  };
}

export interface TemplateStats {
  templateId: string;
  period: DateRange;
  totalSent: number;
  delivered: number;
  failed: number;
  clickRate?: number;
  deliveryRate: number;
  averageDeliveryTime: number; // in seconds
}

export interface DeliveryReport {
  messageId: string;
  phoneNumber: string;
  templateCode: string;
  status: MessageStatus;
  sentAt?: Date;
  deliveredAt?: Date;
  failedAt?: Date;
  clickedAt?: Date;
  error?: ProviderError;
  attempts: DeliveryAttempt[];
}

export interface DeliveryAttempt {
  attemptNumber: number;
  attemptedAt: Date;
  status: MessageStatus;
  error?: ProviderError;
}

// Account contract
export interface AccountContract {
  getBalance(): Promise<Balance>;
  getProfile(): Promise<AccountProfile>;
}

export interface Balance {
  current: number;
  currency: string;
  lastUpdated: Date;
  threshold?: number;
}

export interface AccountProfile {
  accountId: string;
  name: string;
  email: string;
  phone: string;
  status: "active" | "suspended" | "blocked";
  tier: "basic" | "standard" | "premium" | "enterprise";
  features: string[];
  limits: {
    dailyMessageLimit: number;
    monthlyMessageLimit: number;
    rateLimit: number;
  };
}

// Provider registration
export interface ProviderRegistration {
  id: string;
  name: string;
  description: string;
  version: string;
  capabilities: ProviderCapabilities;
  configuration: ProviderConfiguration;
}

export interface ProviderConfiguration {
  required: ConfigurationField[];
  optional: ConfigurationField[];
}

export interface ConfigurationField {
  key: string;
  name: string;
  type: "string" | "number" | "boolean" | "password" | "url";
  description: string;
  required: boolean;
  default?: unknown;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
  };
}
