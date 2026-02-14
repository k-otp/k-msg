import { z } from "zod";

export interface WebhookConfig {
  // 재시도 설정
  maxRetries: number;
  retryDelayMs: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  jitter?: boolean;

  // 네트워크 설정
  timeoutMs: number;

  // 보안 설정
  enableSecurity: boolean;
  secretKey?: string;
  algorithm?: "sha256" | "sha1";
  signatureHeader?: string;
  signaturePrefix?: string;

  // 이벤트 설정
  enabledEvents: WebhookEventType[];

  // 배치 처리 설정
  batchSize: number;
  batchTimeoutMs: number;
}

export enum WebhookEventType {
  // 메시지 이벤트
  MESSAGE_SENT = "message.sent",
  MESSAGE_DELIVERED = "message.delivered",
  MESSAGE_FAILED = "message.failed",
  MESSAGE_CLICKED = "message.clicked",
  MESSAGE_READ = "message.read",

  // 템플릿 이벤트
  TEMPLATE_CREATED = "template.created",
  TEMPLATE_APPROVED = "template.approved",
  TEMPLATE_REJECTED = "template.rejected",
  TEMPLATE_UPDATED = "template.updated",
  TEMPLATE_DELETED = "template.deleted",

  // 채널 이벤트
  CHANNEL_CREATED = "channel.created",
  CHANNEL_VERIFIED = "channel.verified",
  SENDER_NUMBER_ADDED = "sender_number.added",
  SENDER_NUMBER_VERIFIED = "sender_number.verified",

  // 시스템 이벤트
  QUOTA_WARNING = "system.quota_warning",
  QUOTA_EXCEEDED = "system.quota_exceeded",
  PROVIDER_ERROR = "system.provider_error",
  SYSTEM_MAINTENANCE = "system.maintenance",

  // 분석 이벤트
  ANOMALY_DETECTED = "analytics.anomaly_detected",
  THRESHOLD_EXCEEDED = "analytics.threshold_exceeded",
}

export interface WebhookEvent<T = any> {
  id: string;
  type: WebhookEventType;
  timestamp: Date;
  data: T;
  metadata: {
    providerId?: string;
    channelId?: string;
    templateId?: string;
    messageId?: string;
    userId?: string;
    organizationId?: string;
    correlationId?: string;
    retryCount?: number;
  };
  version: string; // API 버전
}

export interface WebhookEndpoint {
  id: string;
  url: string;
  name?: string;
  description?: string;
  active: boolean;
  events: WebhookEventType[];
  headers?: Record<string, string>;
  secret?: string;
  retryConfig?: {
    maxRetries: number;
    retryDelayMs: number;
    backoffMultiplier: number;
  };
  filters?: {
    providerId?: string[];
    channelId?: string[];
    templateId?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
  lastTriggeredAt?: Date;
  status: "active" | "inactive" | "error" | "suspended";
}

export interface WebhookDelivery {
  id: string;
  endpointId: string;
  eventId: string;
  url: string;
  httpMethod: "POST" | "PUT" | "PATCH";
  headers: Record<string, string>;
  payload: string; // JSON stringified
  attempts: WebhookAttempt[];
  status: "pending" | "success" | "failed" | "exhausted";
  createdAt: Date;
  completedAt?: Date;
  nextRetryAt?: Date;
}

export interface WebhookAttempt {
  attemptNumber: number;
  timestamp: Date;
  httpStatus?: number;
  responseBody?: string;
  responseHeaders?: Record<string, string>;
  error?: string;
  latencyMs: number;
}

export interface WebhookSecurity {
  algorithm: "sha256" | "sha1";
  header: string; // 예: 'X-Webhook-Signature'
  prefix?: string; // 예: 'sha256='
}

export interface WebhookBatch {
  id: string;
  endpointId: string;
  events: WebhookEvent[];
  createdAt: Date;
  scheduledAt: Date;
  status: "pending" | "processing" | "completed" | "failed";
}

export interface WebhookStats {
  endpointId: string;
  timeRange: {
    start: Date;
    end: Date;
  };
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  averageLatencyMs: number;
  successRate: number;
  eventBreakdown: Record<WebhookEventType, number>;
  errorBreakdown: Record<string, number>;
}

export interface WebhookTestResult {
  endpointId: string;
  url: string;
  success: boolean;
  httpStatus?: number;
  responseTime: number;
  error?: string;
  testedAt: Date;
}

// Zod Schemas
export const WebhookEventSchema = z.object({
  id: z.string(),
  type: z.string(),
  timestamp: z.date(),
  data: z.any(),
  metadata: z.object({
    providerId: z.string().optional(),
    channelId: z.string().optional(),
    templateId: z.string().optional(),
    messageId: z.string().optional(),
    userId: z.string().optional(),
    organizationId: z.string().optional(),
    correlationId: z.string().optional(),
    retryCount: z.number().optional(),
  }),
  version: z.string(),
});

export const WebhookEndpointSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  name: z.string().optional(),
  description: z.string().optional(),
  active: z.boolean(),
  events: z.array(z.string()),
  headers: z.record(z.string(), z.string()).optional(),
  secret: z.string().optional(),
  retryConfig: z
    .object({
      maxRetries: z.number().min(0).max(10),
      retryDelayMs: z.number().min(1000),
      backoffMultiplier: z.number().min(1).max(5),
    })
    .optional(),
  filters: z
    .object({
      providerId: z.array(z.string()).optional(),
      channelId: z.array(z.string()).optional(),
      templateId: z.array(z.string()).optional(),
    })
    .optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  lastTriggeredAt: z.date().optional(),
  status: z.enum(["active", "inactive", "error", "suspended"]),
});

export const WebhookDeliverySchema = z.object({
  id: z.string(),
  endpointId: z.string(),
  eventId: z.string(),
  url: z.string().url(),
  httpMethod: z.enum(["POST", "PUT", "PATCH"]),
  headers: z.record(z.string(), z.string()),
  payload: z.string(),
  attempts: z.array(
    z.object({
      attemptNumber: z.number(),
      timestamp: z.date(),
      httpStatus: z.number().optional(),
      responseBody: z.string().optional(),
      responseHeaders: z.record(z.string(), z.string()).optional(),
      error: z.string().optional(),
      latencyMs: z.number(),
    }),
  ),
  status: z.enum(["pending", "success", "failed", "exhausted"]),
  createdAt: z.date(),
  completedAt: z.date().optional(),
  nextRetryAt: z.date().optional(),
});

export type WebhookEventData = z.infer<typeof WebhookEventSchema>;
export type WebhookEndpointData = z.infer<typeof WebhookEndpointSchema>;
export type WebhookDeliveryData = z.infer<typeof WebhookDeliverySchema>;
