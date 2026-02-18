import {
  providerConfigFieldSpecs,
  type ProviderConfigFieldMap,
  type ProviderConfigFieldSpec,
  type ProviderTypeWithConfig,
} from "@k-msg/provider";
import { z } from "zod";

const providerTypeValues = Object.keys(
  providerConfigFieldSpecs,
) as ProviderTypeWithConfig[];

const envReferenceSchema = z
  .string()
  .regex(/^env:[A-Za-z_][A-Za-z0-9_]*$/, {
    message: "Use env:NAME format for environment variable substitution",
  });

const numberLikeStringSchema = z
  .string()
  .regex(/^[+-]?(?:\d+\.?\d*|\d*\.?\d+)$/, {
    message: "Expected a number-like string (e.g. 1, 0.5)",
  });

const strictBooleanStringSchema = z.string().regex(/^(true|false)$/i, {
  message: "Expected true or false",
});

function asNonEmptyTuple<T>(values: T[], message: string): [T, ...T[]] {
  if (values.length === 0) {
    throw new Error(message);
  }
  return values as [T, ...T[]];
}

const providerTypeTuple = asNonEmptyTuple(
  providerTypeValues,
  "providerConfigFieldSpecs must include at least one provider",
);

export const providerTypeSchema = z.enum(providerTypeTuple);

function buildProviderConfigFieldSchema(
  fieldSpec: ProviderConfigFieldSpec,
): z.ZodTypeAny {
  const baseSchema: z.ZodTypeAny = (() => {
    switch (fieldSpec.type) {
      case "string":
        return z.string().min(1);
      case "number":
        return z.union([z.number(), numberLikeStringSchema, envReferenceSchema]);
      case "boolean":
        return z.union([z.boolean(), strictBooleanStringSchema, envReferenceSchema]);
      case "stringRecord":
        return z.record(z.string(), z.string());
    }
  })();

  const withDescription =
    typeof fieldSpec.description === "string" && fieldSpec.description.length > 0
      ? baseSchema.describe(fieldSpec.description)
      : baseSchema;

  return fieldSpec.required ? withDescription : withDescription.optional();
}

function buildProviderConfigSchema(
  fieldMap: ProviderConfigFieldMap,
) {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const [key, fieldSpec] of Object.entries(fieldMap)) {
    shape[key] = buildProviderConfigFieldSchema(fieldSpec);
  }

  return z.object(shape).passthrough().default({});
}

const providerConfigSchemaByType = Object.fromEntries(
  providerTypeValues.map((providerType) => [
    providerType,
    buildProviderConfigSchema(providerConfigFieldSpecs[providerType]),
  ]),
) as Record<
  ProviderTypeWithConfig,
  ReturnType<typeof buildProviderConfigSchema>
>;

const providerEntrySchemas = providerTypeValues.map((providerType) =>
  z
    .object({
      type: z.literal(providerType),
      id: z.string().min(1),
      config: providerConfigSchemaByType[providerType],
    })
    .passthrough(),
);

export const providerEntrySchema = z.discriminatedUnion(
  "type",
  asNonEmptyTuple(
    providerEntrySchemas,
    "provider entry schema list must include at least one provider",
  ),
);

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
            templateId: z.string().min(1),
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
    persistence: z
      .object({
        strategy: z.enum(["none", "log", "queue", "full"]).optional(),
      })
      .optional(),
    aliases: aliasesSchema,
    onboarding: onboardingSchema,
  })
  .passthrough();

export type KMsgCliConfig = z.infer<typeof kMsgCliConfigSchema>;
