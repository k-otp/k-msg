import { z } from "zod/mini";

export interface Channel {
  id: string;
  name: string;
  provider: string;
  type: ChannelType;
  status: ChannelStatus;
  profileKey: string;
  senderNumbers: SenderNumber[];
  metadata: ChannelMetadata;
  verification: ChannelVerification;
  createdAt: Date;
  updatedAt: Date;
}

export enum ChannelType {
  KAKAO_ALIMTALK = "KAKAO_ALIMTALK",
  KAKAO_FRIENDTALK = "KAKAO_FRIENDTALK",
  SMS = "SMS",
  LMS = "LMS",
  MMS = "MMS",
}

export enum ChannelStatus {
  PENDING = "PENDING", // 등록 대기
  VERIFYING = "VERIFYING", // 검증 중
  ACTIVE = "ACTIVE", // 활성화
  SUSPENDED = "SUSPENDED", // 일시 정지
  BLOCKED = "BLOCKED", // 차단됨
  DELETED = "DELETED", // 삭제됨
}

export interface SenderNumber {
  id: string;
  /**
   * Optional association to a Channel.
   * Some managers (e.g. KakaoSenderNumberManager) are channel-scoped.
   */
  channelId?: string;
  phoneNumber: string;
  status: SenderNumberStatus;
  verificationCode?: string;
  verifiedAt?: Date;
  category: SenderNumberCategory;
  metadata: {
    businessName?: string;
    businessRegistrationNumber?: string;
    contactPerson?: string;
    contactEmail?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export enum SenderNumberStatus {
  PENDING = "PENDING", // 등록 대기
  VERIFYING = "VERIFYING", // 인증 중
  VERIFIED = "VERIFIED", // 인증 완료
  REJECTED = "REJECTED", // 반려됨
  BLOCKED = "BLOCKED", // 차단됨
}

export enum SenderNumberCategory {
  BUSINESS = "BUSINESS", // 사업자
  PERSONAL = "PERSONAL", // 개인
  GOVERNMENT = "GOVERNMENT", // 관공서
  NON_PROFIT = "NON_PROFIT", // 비영리단체
}

export interface ChannelMetadata {
  businessInfo?: {
    name: string;
    registrationNumber: string;
    category: string;
    contactPerson: string;
    contactEmail: string;
    contactPhone: string;
  };
  kakaoInfo?: {
    plusFriendId: string;
    brandName: string;
    logoUrl?: string;
    description?: string;
  };
  limits: {
    dailyMessageLimit: number;
    monthlyMessageLimit: number;
    rateLimit: number; // messages per second
  };
  features: {
    supportsBulkSending: boolean;
    supportsScheduling: boolean;
    supportsButtons: boolean;
    maxButtonCount: number;
  };
}

export interface ChannelVerification {
  status: VerificationStatus;
  documents: VerificationDocument[];
  verifiedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  verifiedBy?: string;
}

export enum VerificationStatus {
  NOT_REQUIRED = "NOT_REQUIRED",
  PENDING = "PENDING",
  UNDER_REVIEW = "UNDER_REVIEW",
  VERIFIED = "VERIFIED",
  REJECTED = "REJECTED",
}

export interface VerificationDocument {
  id: string;
  type: DocumentType;
  fileName: string;
  fileUrl: string;
  uploadedAt: Date;
  status: DocumentStatus;
}

export enum DocumentType {
  BUSINESS_REGISTRATION = "BUSINESS_REGISTRATION",
  BUSINESS_LICENSE = "BUSINESS_LICENSE",
  ID_CARD = "ID_CARD",
  AUTHORIZATION_LETTER = "AUTHORIZATION_LETTER",
  OTHER = "OTHER",
}

export enum DocumentStatus {
  UPLOADED = "UPLOADED",
  VERIFIED = "VERIFIED",
  REJECTED = "REJECTED",
}

// Request/Response types
export interface ChannelCreateRequest {
  name: string;
  type: ChannelType;
  provider: string;
  profileKey: string;
  businessInfo?: {
    name: string;
    registrationNumber: string;
    category: string;
    contactPerson: string;
    contactEmail: string;
    contactPhone: string;
  };
  kakaoInfo?: {
    plusFriendId: string;
    brandName: string;
    logoUrl?: string;
    description?: string;
  };
}

export interface SenderNumberCreateRequest {
  phoneNumber: string;
  category: SenderNumberCategory;
  businessInfo?: {
    businessName: string;
    businessRegistrationNumber: string;
    contactPerson: string;
    contactEmail: string;
  };
}

export interface ChannelFilters {
  provider?: string;
  type?: ChannelType;
  status?: ChannelStatus;
  verified?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface SenderNumberFilters {
  channelId?: string;
  status?: SenderNumberStatus;
  category?: SenderNumberCategory;
  verified?: boolean;
}

// Zod schemas
export const ChannelCreateRequestSchema = z.object({
  name: z.string().check(z.minLength(1), z.maxLength(100)),
  type: z.nativeEnum(ChannelType),
  provider: z.string().check(z.minLength(1)),
  profileKey: z.string().check(z.minLength(1)),
  businessInfo: z.optional(
    z.object({
      name: z.string().check(z.minLength(1)),
      registrationNumber: z.string().check(z.minLength(1)),
      category: z.string().check(z.minLength(1)),
      contactPerson: z.string().check(z.minLength(1)),
      contactEmail: z.email(),
      contactPhone: z.string().check(z.regex(/^[0-9-+\s()]+$/)),
    }),
  ),
  kakaoInfo: z.optional(
    z.object({
      plusFriendId: z.string().check(z.minLength(1)),
      brandName: z.string().check(z.minLength(1)),
      logoUrl: z.optional(z.url()),
      description: z.optional(z.string().check(z.maxLength(500))),
    }),
  ),
});

export const SenderNumberCreateRequestSchema = z.object({
  phoneNumber: z.string().check(z.regex(/^[0-9]{10,11}$/)),
  category: z.nativeEnum(SenderNumberCategory),
  businessInfo: z.optional(
    z.object({
      businessName: z.string().check(z.minLength(1)),
      businessRegistrationNumber: z.string().check(z.minLength(1)),
      contactPerson: z.string().check(z.minLength(1)),
      contactEmail: z.email(),
    }),
  ),
});

export const ChannelFiltersSchema = z.object({
  provider: z.optional(z.string()),
  type: z.optional(z.nativeEnum(ChannelType)),
  status: z.optional(z.nativeEnum(ChannelStatus)),
  verified: z.optional(z.boolean()),
  createdAfter: z.optional(z.date()),
  createdBefore: z.optional(z.date()),
});

export const SenderNumberFiltersSchema = z.object({
  channelId: z.optional(z.string()),
  status: z.optional(z.nativeEnum(SenderNumberStatus)),
  category: z.optional(z.nativeEnum(SenderNumberCategory)),
  verified: z.optional(z.boolean()),
});

export type ChannelCreateRequestType = z.infer<
  typeof ChannelCreateRequestSchema
>;
export type SenderNumberCreateRequestType = z.infer<
  typeof SenderNumberCreateRequestSchema
>;
export type ChannelFiltersType = z.infer<typeof ChannelFiltersSchema>;
export type SenderNumberFiltersType = z.infer<typeof SenderNumberFiltersSchema>;

// Additional types for service compatibility
export interface ChannelConfig {
  id: string;
  name: string;
  type: "alimtalk" | "sms" | "lms" | "friendtalk";
  providerId: string;
  active: boolean;
  settings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChannelVerificationResult {
  success: boolean;
  status: string;
  verificationCode?: string;
  error?: string;
}
