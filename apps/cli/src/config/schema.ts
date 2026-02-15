import { z } from "zod";

export const providerTypeSchema = z.enum(["solapi", "iwinv", "aligo", "mock"]);

export const providerEntrySchema = z
  .object({
    type: providerTypeSchema,
    id: z.string().min(1),
    config: z.record(z.string(), z.unknown()).default({}),
  })
  .passthrough();

export const routingSchema = z
  .object({
    defaultProviderId: z.string().min(1).optional(),
    strategy: z.enum(["first", "round_robin"]).optional(),
    byType: z
      .record(
        z.string(),
        z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]),
      )
      .optional(),
  })
  .passthrough()
  .optional();

export const defaultsSchema = z
  .object({
    from: z.string().min(1).optional(),
    sms: z
      .object({
        autoLmsBytes: z.number().int().positive().optional(),
      })
      .optional(),
    kakao: z
      .object({
        channel: z.string().min(1).optional(),
        senderKey: z.string().min(1).optional(),
      })
      .optional(),
  })
  .passthrough()
  .optional();

export const aliasesSchema = z
  .object({
    kakaoChannels: z
      .record(
        z.string(),
        z
          .object({
            providerId: z.string().min(1),
            plusId: z.string().min(1).optional(),
            senderKey: z.string().min(1),
            name: z.string().min(1).optional(),
          })
          .passthrough(),
      )
      .optional(),
    templates: z
      .record(
        z.string(),
        z
          .object({
            providerId: z.string().min(1),
            templateCode: z.string().min(1),
            kakaoChannel: z.string().min(1).optional(),
          })
          .passthrough(),
      )
      .optional(),
  })
  .passthrough()
  .optional();

export const kMsgCliConfigSchema = z
  .object({
    version: z.literal(1).default(1),
    providers: z.array(providerEntrySchema).default([]),
    routing: routingSchema,
    defaults: defaultsSchema,
    aliases: aliasesSchema,
  })
  .passthrough();

export type KMsgCliConfig = z.infer<typeof kMsgCliConfigSchema>;
