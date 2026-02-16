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
    sms: z
      .object({
        autoLmsBytes: z.number().int().positive().optional(),
      })
      .optional(),
    kakao: z
      .object({
        channel: z.string().min(1).optional(),
        senderKey: z.string().min(1).optional(),
        plusId: z.string().min(1).optional(),
      })
      .optional(),
  })
  .passthrough()
  .optional();

const onboardingManualCheckStateSchema = z
  .object({
    done: z.boolean(),
    checkedAt: z.string().optional(),
    note: z.string().optional(),
    evidence: z.string().optional(),
  })
  .passthrough();

export const onboardingSchema = z
  .object({
    manualChecks: z
      .record(
        z.string().min(1),
        z.record(z.string().min(1), onboardingManualCheckStateSchema),
      )
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
            senderKey: z.string().min(1).optional(),
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
    $schema: z.string().url().optional(),
    version: z.literal(1).default(1),
    providers: z.array(providerEntrySchema).default([]),
    routing: routingSchema,
    defaults: defaultsSchema,
    aliases: aliasesSchema,
    onboarding: onboardingSchema,
  })
  .passthrough();

export type KMsgCliConfig = z.infer<typeof kMsgCliConfigSchema>;
