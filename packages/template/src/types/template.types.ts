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

export interface TemplateVariable {
  name: string; // 변수명 (#{name} 형식)
  type: "string" | "number" | "date" | "custom";
  required: boolean;
  maxLength?: number;
  format?: string; // 날짜 포맷 등
  description?: string;
  example?: string;
}

export interface TemplateButton {
  type: "WL" | "AL" | "DS" | "BK" | "MD";
  name: string;
  linkMobile?: string;
  linkPc?: string;
  linkIos?: string;
  linkAndroid?: string;
  schemeIos?: string;
  schemeAndroid?: string;
}

export interface AlimTalkTemplate {
  id: string;
  code: string; // 프로바이더 템플릿 코드
  name: string;
  content: string; // #{변수} 포함 내용
  variables?: TemplateVariable[]; // 변수 정의 (선택적)
  buttons?: TemplateButton[]; // 버튼 정의
  category: TemplateCategory; // 인증, 알림, 프로모션 등
  status: TemplateStatus; // 승인, 검수중, 반려
  provider: string; // 프로바이더 ID
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    approvedAt?: Date;
    rejectedAt?: Date;
    rejectionReason?: string;
    usage: {
      sent: number;
      delivered: number;
      failed: number;
    };
  };
}

// Zod schemas
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
  variables: z.array(TemplateVariableSchema),
  buttons: z.optional(z.array(TemplateButtonSchema)),
  category: z.nativeEnum(TemplateCategory),
  status: z.nativeEnum(TemplateStatus),
  provider: z.string(),
  metadata: z.object({
    createdAt: z.date(),
    updatedAt: z.date(),
    approvedAt: z.optional(z.date()),
    rejectedAt: z.optional(z.date()),
    rejectionReason: z.optional(z.string()),
    usage: z.object({
      sent: z.number().check(z.minimum(0)),
      delivered: z.number().check(z.minimum(0)),
      failed: z.number().check(z.minimum(0)),
    }),
  }),
});

export type AlimTalkTemplateType = z.infer<typeof AlimTalkTemplateSchema>;
export type TemplateVariableType = z.infer<typeof TemplateVariableSchema>;
export type TemplateButtonType = z.infer<typeof TemplateButtonSchema>;
