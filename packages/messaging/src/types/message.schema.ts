import { z } from "zod/mini";
import { MessageStatus } from "./message.runtime";

export const VariableMapSchema = z.record(
  z.string(),
  z.union([z.string(), z.number(), z.date()]),
);

export const RecipientSchema = z.object({
  phoneNumber: z.string().check(z.regex(/^[0-9]{10,11}$/)),
  variables: z.optional(VariableMapSchema),
  metadata: z.optional(z.record(z.string(), z.any())),
});

export const SchedulingOptionsSchema = z.object({
  scheduledAt: z.date().check(z.minimum(new Date())),
  timezone: z.optional(z.string()),
  retryCount: z._default(
    z.optional(z.number().check(z.minimum(0), z.maximum(5))),
    3,
  ),
});

export const SendingOptionsSchema = z.object({
  priority: z._default(z.optional(z.enum(["high", "normal", "low"])), "normal"),
  ttl: z.optional(z.number().check(z.minimum(0))),
  failover: z.optional(
    z.object({
      enabled: z.boolean(),
      fallbackChannel: z.optional(z.enum(["sms", "lms"])),
      fallbackContent: z.optional(z.string()),
      fallbackTitle: z.optional(z.string()),
    }),
  ),
  deduplication: z.optional(
    z.object({
      enabled: z.boolean(),
      window: z.number().check(z.minimum(0), z.maximum(3600)),
    }),
  ),
  tracking: z.optional(
    z.object({
      enabled: z.boolean(),
      webhookUrl: z.optional(z.url()),
    }),
  ),
});

export const MessageRequestSchema = z.object({
  templateId: z.string().check(z.minLength(1)),
  recipients: z
    .array(RecipientSchema)
    .check(z.minLength(1), z.maxLength(10000)),
  variables: VariableMapSchema,
  scheduling: z.optional(SchedulingOptionsSchema),
  options: z.optional(SendingOptionsSchema),
});

export const MessageErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.optional(z.record(z.string(), z.any())),
});

export const RecipientResultSchema = z.object({
  phoneNumber: z.string(),
  messageId: z.optional(z.string()),
  status: z.nativeEnum(MessageStatus),
  error: z.optional(MessageErrorSchema),
  metadata: z.optional(z.record(z.string(), z.any())),
});

export const MessageResultSchema = z.object({
  requestId: z.string(),
  results: z.array(RecipientResultSchema),
  summary: z.object({
    total: z.number().check(z.minimum(0)),
    queued: z.number().check(z.minimum(0)),
    sent: z.number().check(z.minimum(0)),
    failed: z.number().check(z.minimum(0)),
  }),
  metadata: z.object({
    createdAt: z.date(),
    provider: z.string(),
    templateId: z.string(),
  }),
});

export type MessageRequestType = z.infer<typeof MessageRequestSchema>;
export type RecipientType = z.infer<typeof RecipientSchema>;
export type MessageResultType = z.infer<typeof MessageResultSchema>;
