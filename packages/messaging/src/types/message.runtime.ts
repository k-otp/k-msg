import type { KMsgError, Result, RetryOptions, SendResult } from "@k-msg/core";
import type * as zt from "zod/mini";

type VariableMapSchema = typeof import("./message.schema").VariableMapSchema;
type RecipientSchema = typeof import("./message.schema").RecipientSchema;
type SchedulingOptionsSchema =
  typeof import("./message.schema").SchedulingOptionsSchema;
type SendingOptionsSchema = typeof import("./message.schema").SendingOptionsSchema;
type MessageRequestSchema =
  typeof import("./message.schema").MessageRequestSchema;
type MessageErrorSchema = typeof import("./message.schema").MessageErrorSchema;
type RecipientResultSchema =
  typeof import("./message.schema").RecipientResultSchema;
type MessageResultSchema = typeof import("./message.schema").MessageResultSchema;

export interface BatchSendResult {
  total: number;
  results: Array<Result<SendResult, KMsgError>>;
}

export type VariableMap = zt.output<VariableMapSchema>;
export type Recipient = zt.input<RecipientSchema>;
export type SchedulingOptions = zt.input<SchedulingOptionsSchema>;
export type SendingOptions = zt.input<SendingOptionsSchema>;
export type MessageRequest = zt.input<MessageRequestSchema>;
export type MessageError = zt.output<MessageErrorSchema>;
export type RecipientResult = zt.output<RecipientResultSchema>;
export type MessageResult = zt.output<MessageResultSchema>;

export enum MessageStatus {
  QUEUED = "QUEUED",
  SENDING = "SENDING",
  SENT = "SENT",
  DELIVERED = "DELIVERED",
  FAILED = "FAILED",
  CLICKED = "CLICKED",
  CANCELLED = "CANCELLED",
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
