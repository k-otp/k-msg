import type { KMsgError, Result, RetryOptions, SendResult } from "@k-msg/core";

export interface BatchSendResult {
  total: number;
  results: Array<Result<SendResult, KMsgError>>;
}

export interface MessageRequest {
  templateId: string;
  recipients: Recipient[];
  variables: VariableMap;
  scheduling?: SchedulingOptions;
  options?: SendingOptions;
}

export interface Recipient {
  phoneNumber: string;
  variables?: VariableMap;
  metadata?: Record<string, unknown>;
}

export interface VariableMap {
  [key: string]: string | number | Date;
}

export interface SchedulingOptions {
  scheduledAt: Date;
  timezone?: string;
  retryCount?: number;
}

export interface SendingOptions {
  priority?: "high" | "normal" | "low";
  ttl?: number;
  failover?: {
    enabled: boolean;
    fallbackChannel?: "sms" | "lms";
    fallbackContent?: string;
    fallbackTitle?: string;
  };
  deduplication?: {
    enabled: boolean;
    window: number;
  };
  tracking?: {
    enabled: boolean;
    webhookUrl?: string;
  };
}

export interface MessageResult {
  requestId: string;
  results: RecipientResult[];
  summary: {
    total: number;
    queued: number;
    sent: number;
    failed: number;
  };
  metadata: {
    createdAt: Date;
    provider: string;
    templateId: string;
  };
}

export interface RecipientResult {
  phoneNumber: string;
  messageId?: string;
  status: MessageStatus;
  error?: MessageError;
  metadata?: Record<string, unknown>;
}

export enum MessageStatus {
  QUEUED = "QUEUED",
  SENDING = "SENDING",
  SENT = "SENT",
  DELIVERED = "DELIVERED",
  FAILED = "FAILED",
  CLICKED = "CLICKED",
  CANCELLED = "CANCELLED",
}

export interface MessageError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface DeliveryReport {
  messageId: string;
  phoneNumber: string;
  status: MessageStatus;
  sentAt?: Date;
  deliveredAt?: Date;
  clickedAt?: Date;
  failedAt?: Date;
  error?: MessageError;
  attempts: DeliveryAttempt[];
  metadata: Record<string, unknown>;
}

export interface DeliveryAttempt {
  attemptNumber: number;
  attemptedAt: Date;
  status: MessageStatus;
  error?: MessageError;
  provider: string;
}

export type BulkMessageType =
  | "ALIMTALK"
  | "NSA"
  | "RCS_TPL"
  | "RCS_ITPL"
  | "RCS_LTPL";

export interface BulkMessageRequest {
  type?: BulkMessageType;
  templateId: string;
  recipients: BulkRecipient[];
  commonVariables?: VariableMap;
  options?: BulkSendingOptions;
}

export interface BulkRecipient {
  phoneNumber: string;
  variables: VariableMap;
  metadata?: Record<string, unknown>;
}

export interface BulkSendingOptions extends SendingOptions {
  from?: string;
  senderNumber?: string;
  batchSize?: number;
  batchDelay?: number;
  maxConcurrency?: number;
  retryOptions?: Partial<RetryOptions>;
}

export interface BulkMessageResult {
  requestId: string;
  totalRecipients: number;
  batches: BulkBatchResult[];
  summary: {
    queued: number;
    sent: number;
    failed: number;
    processing: number;
  };
  createdAt: Date;
  completedAt?: Date;
}

export interface BulkBatchResult {
  batchId: string;
  batchNumber: number;
  recipients: RecipientResult[];
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: Date;
  completedAt?: Date;
}

export enum MessageEventType {
  TEMPLATE_CREATED = "template.created",
  TEMPLATE_APPROVED = "template.approved",
  TEMPLATE_REJECTED = "template.rejected",
  TEMPLATE_UPDATED = "template.updated",
  TEMPLATE_DELETED = "template.deleted",

  MESSAGE_QUEUED = "message.queued",
  MESSAGE_SENT = "message.sent",
  MESSAGE_DELIVERED = "message.delivered",
  MESSAGE_FAILED = "message.failed",
  MESSAGE_CLICKED = "message.clicked",
  MESSAGE_CANCELLED = "message.cancelled",

  CHANNEL_CREATED = "channel.created",
  CHANNEL_VERIFIED = "channel.verified",
  SENDER_NUMBER_ADDED = "sender_number.added",

  QUOTA_WARNING = "system.quota_warning",
  QUOTA_EXCEEDED = "system.quota_exceeded",
  PROVIDER_ERROR = "system.provider_error",
}

export interface MessageEvent<T = unknown> {
  id: string;
  type: MessageEventType;
  timestamp: Date;
  data: T;
  metadata: {
    providerId?: string;
    userId?: string;
    organizationId?: string;
    correlationId?: string;
  };
}
