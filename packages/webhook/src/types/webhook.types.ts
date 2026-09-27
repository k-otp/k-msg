import { z } from "zod/mini";

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
  /**
   * Signs every delivery with HMAC. While on, a delivery is never sent
   * unsigned: endpoints need a `secret` (or `secretKey` must be set), and a
   * stored endpoint without one gets a failed delivery and no request.
   */
  enableSecurity: boolean;
  /** Signs deliveries to endpoints that have no `secret` of their own. */
  secretKey?: string;
  algorithm?: "sha256" | "sha1";
  signatureHeader?: string;
  signaturePrefix?: string;

  // 이벤트 설정
  enabledEvents: WebhookEventType[];

  // 배치 처리 설정
  /**
   * How many events queued by `emit()` go out in one batch. The `emit()` call
   * that fills a batch sends it, retries included, before it resolves, unless
   * another batch is still being sent: then the full batch follows that one,
   * or, if that one fails, goes with the timer, the next call, or `flush()`.
   * `Infinity` leaves every event for `flush()` or the timer. Defaults to 10,
   * which also replaces a value below 1. `emitSync()` does not use it.
   */
  batchSize?: number;
  /**
   * With `autoStart`, how long in milliseconds the first event queued by
   * `emit()` waits before its batch is sent. Defaults to 5000. `emitSync()`
   * does not use it.
   */
  batchTimeoutMs?: number;
}

export enum WebhookEventType {
  // 메시지 이벤트
  MESSAGE_SENT = "message.sent",
  MESSAGE_DELIVERED = "message.delivered",
  MESSAGE_FAILED = "message.failed",
  MESSAGE_CLICKED = "message.clicked",
  MESSAGE_READ = "message.read",
  /** The message was cancelled (delivery status `CANCELLED`). */
  MESSAGE_CANCELLED = "message.cancelled",
  /**
   * Tracking ended without a final result (delivery status `UNKNOWN`), for
   * example when the provider has no status lookup.
   */
  MESSAGE_UNKNOWN = "message.unknown",

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

const WebhookEventMetadataSchema = z.object({
  providerId: z.optional(z.string()),
  channelId: z.optional(z.string()),
  templateId: z.optional(z.string()),
  messageId: z.optional(z.string()),
  userId: z.optional(z.string()),
  organizationId: z.optional(z.string()),
  correlationId: z.optional(z.string()),
  retryCount: z.optional(z.number()),
});

const WebhookRetryConfigSchema = z.object({
  maxRetries: z.number().check(z.minimum(0), z.maximum(10)),
  retryDelayMs: z.number().check(z.minimum(1000)),
  backoffMultiplier: z.number().check(z.minimum(1), z.maximum(5)),
});

const WebhookFiltersSchema = z.object({
  providerId: z.optional(z.array(z.string())),
  channelId: z.optional(z.array(z.string())),
  templateId: z.optional(z.array(z.string())),
});

export const WebhookAttemptSchema = z.object({
  attemptNumber: z.number(),
  timestamp: z.date(),
  httpStatus: z.optional(z.number()),
  responseBody: z.optional(z.string()),
  responseHeaders: z.optional(z.record(z.string(), z.string())),
  error: z.optional(z.string()),
  latencyMs: z.number(),
});

export const WebhookEventSchema = z.object({
  id: z.string(),
  type: z.nativeEnum(WebhookEventType),
  timestamp: z.pipe(
    z.transform((value) => {
      if (value instanceof Date) return value;
      if (typeof value === "string" || typeof value === "number") {
        return new Date(value);
      }
      return value;
    }),
    z.date(),
  ),
  data: z.any(),
  metadata: WebhookEventMetadataSchema,
  version: z.string(),
});

export const WebhookEndpointSchema = z.object({
  id: z.string(),
  url: z.url(),
  name: z.optional(z.string()),
  description: z.optional(z.string()),
  active: z.boolean(),
  events: z.array(z.nativeEnum(WebhookEventType)),
  headers: z.optional(z.record(z.string(), z.string())),
  secret: z.optional(z.string()),
  retryConfig: z.optional(WebhookRetryConfigSchema),
  filters: z.optional(WebhookFiltersSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
  lastTriggeredAt: z.optional(z.date()),
  status: z.enum(["active", "inactive", "error", "suspended"]),
});

export const WebhookDeliverySchema = z.object({
  id: z.string(),
  endpointId: z.string(),
  eventId: z.string(),
  eventType: z.optional(z.nativeEnum(WebhookEventType)),
  url: z.url(),
  httpMethod: z.enum(["POST", "PUT", "PATCH"]),
  headers: z.record(z.string(), z.string()),
  payload: z.string(),
  attempts: z.array(WebhookAttemptSchema),
  status: z.enum(["pending", "success", "failed", "exhausted"]),
  createdAt: z.date(),
  completedAt: z.optional(z.date()),
  nextRetryAt: z.optional(z.date()),
});

// biome-ignore lint/suspicious/noExplicitAny: event payload shape is caller-defined
export type WebhookEvent<T = any> = Omit<WebhookEventData, "data"> & {
  data: T;
};
export type WebhookEndpoint = z.infer<typeof WebhookEndpointSchema>;
export type WebhookAttempt = z.infer<typeof WebhookAttemptSchema>;
export type WebhookDelivery = z.infer<typeof WebhookDeliverySchema>;
export type WebhookEventData = z.infer<typeof WebhookEventSchema>;
export type WebhookEndpointData = WebhookEndpoint;
export type WebhookDeliveryData = WebhookDelivery;
