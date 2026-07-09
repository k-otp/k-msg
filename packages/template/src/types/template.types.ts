import { z } from "zod/mini";

export enum TemplateType {
  ALIMTALK = "ALIMTALK",
  SMS = "SMS",
  LMS = "LMS",
  MMS = "MMS",
  RCS = "RCS",
}

export enum TemplateCategory {
  AUTHENTICATION = "AUTHENTICATION", // 인증
  NOTIFICATION = "NOTIFICATION", // 알림
  PROMOTION = "PROMOTION", // 프로모션
  INFORMATION = "INFORMATION", // 정보성
  RESERVATION = "RESERVATION", // 예약
  SHIPPING = "SHIPPING", // 배송
  PAYMENT = "PAYMENT", // 결제
}

export enum TemplateStatus {
  DRAFT = "DRAFT", // 초안
  PENDING = "PENDING", // 검수 중
  APPROVED = "APPROVED", // 승인됨
  REJECTED = "REJECTED", // 반려됨
  DISABLED = "DISABLED", // 비활성화
}

const TemplateUsageStatsSchema = z.object({
  sent: z.number().check(z.minimum(0)),
  delivered: z.number().check(z.minimum(0)),
  failed: z.number().check(z.minimum(0)),
});

const TemplateMetadataSchema = z.object({
  createdAt: z.date(),
  updatedAt: z.date(),
  approvedAt: z.optional(z.date()),
  rejectedAt: z.optional(z.date()),
  rejectionReason: z.optional(z.string()),
  usage: TemplateUsageStatsSchema,
});

export const TemplateVariableSchema = z.object({
  name: z.string().check(z.minLength(1)),
  type: z.enum(["string", "number", "date", "custom"]),
  required: z.boolean(),
  maxLength: z.optional(z.number()),
  format: z.optional(z.string()),
  description: z.optional(z.string()),
  example: z.optional(z.string()),
});

export const TemplateButtonSchema = z.object({
  type: z.enum(["WL", "AL", "DS", "BK", "MD"]),
  name: z.string().check(z.minLength(1)),
  linkMobile: z.optional(z.url()),
  linkPc: z.optional(z.url()),
  linkIos: z.optional(z.url()),
  linkAndroid: z.optional(z.url()),
  schemeIos: z.optional(z.string()),
  schemeAndroid: z.optional(z.string()),
});

export const AlimTalkTemplateSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string().check(z.minLength(1)),
  content: z.string().check(z.minLength(1)),
  variables: z.optional(z.array(TemplateVariableSchema)),
  buttons: z.optional(z.array(TemplateButtonSchema)),
  category: z.nativeEnum(TemplateCategory),
  status: z.nativeEnum(TemplateStatus),
  provider: z.string(),
  metadata: TemplateMetadataSchema,
});

export type TemplateVariable = z.infer<typeof TemplateVariableSchema>;
export type TemplateButton = z.infer<typeof TemplateButtonSchema>;
export type AlimTalkTemplate = z.infer<typeof AlimTalkTemplateSchema>;

// Legacy alias exports kept stable while the schemas become the source of truth.
export type AlimTalkTemplateType = AlimTalkTemplate;
export type TemplateVariableType = TemplateVariable;
export type TemplateButtonType = TemplateButton;
