import { z } from "zod";

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
  name: z.string().min(1),
  type: z.enum(["string", "number", "date", "custom"]),
  required: z.boolean(),
  maxLength: z.number().optional(),
  format: z.string().optional(),
  description: z.string().optional(),
  example: z.string().optional(),
});

export const TemplateButtonSchema = z.object({
  type: z.enum(["WL", "AL", "DS", "BK", "MD"]),
  name: z.string().min(1),
  linkMobile: z.string().url().optional(),
  linkPc: z.string().url().optional(),
  linkIos: z.string().url().optional(),
  linkAndroid: z.string().url().optional(),
  schemeIos: z.string().optional(),
  schemeAndroid: z.string().optional(),
});

export const AlimTalkTemplateSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string().min(1),
  content: z.string().min(1),
  variables: z.array(TemplateVariableSchema),
  buttons: z.array(TemplateButtonSchema).optional(),
  category: z.nativeEnum(TemplateCategory),
  status: z.nativeEnum(TemplateStatus),
  provider: z.string(),
  metadata: z.object({
    createdAt: z.date(),
    updatedAt: z.date(),
    approvedAt: z.date().optional(),
    rejectedAt: z.date().optional(),
    rejectionReason: z.string().optional(),
    usage: z.object({
      sent: z.number().min(0),
      delivered: z.number().min(0),
      failed: z.number().min(0),
    }),
  }),
});

export type AlimTalkTemplateType = z.infer<typeof AlimTalkTemplateSchema>;
export type TemplateVariableType = z.infer<typeof TemplateVariableSchema>;
export type TemplateButtonType = z.infer<typeof TemplateButtonSchema>;
