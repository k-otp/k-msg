import { z } from "zod";
import { MessageStatus } from "./message.runtime";

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
  templateId: z.string().min(1),
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
    templateId: z.string(),
  }),
});

export type MessageRequestType = z.infer<typeof MessageRequestSchema>;
export type RecipientType = z.infer<typeof RecipientSchema>;
export type MessageResultType = z.infer<typeof MessageResultSchema>;
