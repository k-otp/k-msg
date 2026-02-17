import type { KMsgError, Result, RetryOptions, SendResult } from "@k-msg/core";
import { z } from "zod";

export interface BatchSendResult {
  total: number;
  results: Array<Result<SendResult, KMsgError>>;
}

export interface MessageRequest {
  templateCode: string; // 템플릿 코드
  recipients: Recipient[]; // 수신자 목록
  variables: VariableMap; // 공통 변수
  scheduling?: SchedulingOptions; // 예약 발송
  options?: SendingOptions; // 발송 옵션
}

export interface Recipient {
  phoneNumber: string;
  variables?: VariableMap; // 개별 변수 (공통 변수 오버라이드)
  metadata?: Record<string, unknown>; // 추적용 메타데이터
}

export interface VariableMap {
  [key: string]: string | number | Date;
}

export interface SchedulingOptions {
  scheduledAt: Date; // 예약 발송 시간
  timezone?: string; // 타임존
  retryCount?: number; // 재시도 횟수
}

export interface SendingOptions {
  priority?: "high" | "normal" | "low";
  ttl?: number; // Time to live (초)
  failover?: {
    enabled: boolean;
    fallbackChannel?: "sms" | "lms";
    fallbackContent?: string;
    fallbackTitle?: string;
  };
  deduplication?: {
    enabled: boolean;
    window: number; // 중복 제거 시간 (초)
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
    templateCode: string;
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
  QUEUED = "QUEUED", // 큐에 대기 중
  SENDING = "SENDING", // 발송 중
  SENT = "SENT", // 발송 완료
  DELIVERED = "DELIVERED", // 전달 완료
  FAILED = "FAILED", // 발송 실패
  CLICKED = "CLICKED", // 버튼 클릭됨
  CANCELLED = "CANCELLED", // 취소됨
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

// Bulk messaging types
export type BulkMessageType =
  | "ALIMTALK"
  | "NSA"
  | "RCS_TPL"
  | "RCS_ITPL"
  | "RCS_LTPL";

export interface BulkMessageRequest {
  /**
   * BulkMessageSender currently targets template-based channels.
   * Default: "ALIMTALK"
   */
  type?: BulkMessageType;
  templateCode: string;
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
  /**
   * Sender number / id for bulk sends (optional if KMsg defaults cover it).
   */
  from?: string;
  /**
   * Back-compat alias for legacy callers.
   */
  senderNumber?: string;
  batchSize?: number; // 배치 크기
  batchDelay?: number; // 배치 간 지연 시간 (ms)
  maxConcurrency?: number; // 최대 동시 처리 수
  retryOptions?: Partial<RetryOptions>; // 재시도 옵션
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

// Event types
export enum MessageEventType {
  // 템플릿 이벤트
  TEMPLATE_CREATED = "template.created",
  TEMPLATE_APPROVED = "template.approved",
  TEMPLATE_REJECTED = "template.rejected",
  TEMPLATE_UPDATED = "template.updated",
  TEMPLATE_DELETED = "template.deleted",

  // 메시지 이벤트
  MESSAGE_QUEUED = "message.queued",
  MESSAGE_SENT = "message.sent",
  MESSAGE_DELIVERED = "message.delivered",
  MESSAGE_FAILED = "message.failed",
  MESSAGE_CLICKED = "message.clicked",
  MESSAGE_CANCELLED = "message.cancelled",

  // 채널 이벤트
  CHANNEL_CREATED = "channel.created",
  CHANNEL_VERIFIED = "channel.verified",
  SENDER_NUMBER_ADDED = "sender_number.added",

  // 시스템 이벤트
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

// Zod schemas
export const VariableMapSchema = z.record(
  z.string(),
  z.union([z.string(), z.number(), z.date()]),
);

export const RecipientSchema = z.object({
  phoneNumber: z.string().regex(/^[0-9]{10,11}$/),
  variables: VariableMapSchema.optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const SchedulingOptionsSchema = z.object({
  scheduledAt: z.date().min(new Date()),
  timezone: z.string().optional(),
  retryCount: z.number().min(0).max(5).optional().default(3),
});

export const SendingOptionsSchema = z.object({
  priority: z.enum(["high", "normal", "low"]).optional().default("normal"),
  ttl: z.number().min(0).optional(),
  failover: z
    .object({
      enabled: z.boolean(),
      fallbackChannel: z.enum(["sms", "lms"]).optional(),
      fallbackContent: z.string().optional(),
      fallbackTitle: z.string().optional(),
    })
    .optional(),
  deduplication: z
    .object({
      enabled: z.boolean(),
      window: z.number().min(0).max(3600),
    })
    .optional(),
  tracking: z
    .object({
      enabled: z.boolean(),
      webhookUrl: z.string().url().optional(),
    })
    .optional(),
});

export const MessageRequestSchema = z.object({
  templateCode: z.string().min(1),
  recipients: z.array(RecipientSchema).min(1).max(10000),
  variables: VariableMapSchema,
  scheduling: SchedulingOptionsSchema.optional(),
  options: SendingOptionsSchema.optional(),
});

export const MessageErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.string(), z.any()).optional(),
});

export const RecipientResultSchema = z.object({
  phoneNumber: z.string(),
  messageId: z.string().optional(),
  status: z.nativeEnum(MessageStatus),
  error: MessageErrorSchema.optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const MessageResultSchema = z.object({
  requestId: z.string(),
  results: z.array(RecipientResultSchema),
  summary: z.object({
    total: z.number().min(0),
    queued: z.number().min(0),
    sent: z.number().min(0),
    failed: z.number().min(0),
  }),
  metadata: z.object({
    createdAt: z.date(),
    provider: z.string(),
    templateCode: z.string(),
  }),
});

export type MessageRequestType = z.infer<typeof MessageRequestSchema>;
export type RecipientType = z.infer<typeof RecipientSchema>;
export type MessageResultType = z.infer<typeof MessageResultSchema>;
