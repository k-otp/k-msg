import { z } from 'zod';

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
  KAKAO_ALIMTALK = 'KAKAO_ALIMTALK',
  KAKAO_FRIENDTALK = 'KAKAO_FRIENDTALK',
  SMS = 'SMS',
  LMS = 'LMS',
  MMS = 'MMS'
}

export enum ChannelStatus {
  PENDING = 'PENDING',           // 등록 대기
  VERIFYING = 'VERIFYING',       // 검증 중
  ACTIVE = 'ACTIVE',             // 활성화
  SUSPENDED = 'SUSPENDED',       // 일시 정지
  BLOCKED = 'BLOCKED',           // 차단됨
  DELETED = 'DELETED'            // 삭제됨
}

export interface SenderNumber {
  id: string;
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
  PENDING = 'PENDING',           // 등록 대기
  VERIFYING = 'VERIFYING',       // 인증 중
  VERIFIED = 'VERIFIED',         // 인증 완료
  REJECTED = 'REJECTED',         // 반려됨
  BLOCKED = 'BLOCKED'            // 차단됨
}

export enum SenderNumberCategory {
  BUSINESS = 'BUSINESS',         // 사업자
  PERSONAL = 'PERSONAL',         // 개인
  GOVERNMENT = 'GOVERNMENT',     // 관공서
  NON_PROFIT = 'NON_PROFIT'      // 비영리단체
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
  NOT_REQUIRED = 'NOT_REQUIRED',
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED'
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
  BUSINESS_REGISTRATION = 'BUSINESS_REGISTRATION',
  BUSINESS_LICENSE = 'BUSINESS_LICENSE',
  ID_CARD = 'ID_CARD',
  AUTHORIZATION_LETTER = 'AUTHORIZATION_LETTER',
  OTHER = 'OTHER'
}

export enum DocumentStatus {
  UPLOADED = 'UPLOADED',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED'
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
  name: z.string().min(1).max(100),
  type: z.nativeEnum(ChannelType),
  provider: z.string().min(1),
  profileKey: z.string().min(1),
  businessInfo: z.object({
    name: z.string().min(1),
    registrationNumber: z.string().min(1),
    category: z.string().min(1),
    contactPerson: z.string().min(1),
    contactEmail: z.string().email(),
    contactPhone: z.string().regex(/^[0-9-+\s()]+$/),
  }).optional(),
  kakaoInfo: z.object({
    plusFriendId: z.string().min(1),
    brandName: z.string().min(1),
    logoUrl: z.string().url().optional(),
    description: z.string().max(500).optional(),
  }).optional(),
});

export const SenderNumberCreateRequestSchema = z.object({
  phoneNumber: z.string().regex(/^[0-9]{10,11}$/),
  category: z.nativeEnum(SenderNumberCategory),
  businessInfo: z.object({
    businessName: z.string().min(1),
    businessRegistrationNumber: z.string().min(1),
    contactPerson: z.string().min(1),
    contactEmail: z.string().email(),
  }).optional(),
});

export const ChannelFiltersSchema = z.object({
  provider: z.string().optional(),
  type: z.nativeEnum(ChannelType).optional(),
  status: z.nativeEnum(ChannelStatus).optional(),
  verified: z.boolean().optional(),
  createdAfter: z.date().optional(),
  createdBefore: z.date().optional(),
});

export const SenderNumberFiltersSchema = z.object({
  channelId: z.string().optional(),
  status: z.nativeEnum(SenderNumberStatus).optional(),
  category: z.nativeEnum(SenderNumberCategory).optional(),
  verified: z.boolean().optional(),
});

export type ChannelCreateRequestType = z.infer<typeof ChannelCreateRequestSchema>;
export type SenderNumberCreateRequestType = z.infer<typeof SenderNumberCreateRequestSchema>;
export type ChannelFiltersType = z.infer<typeof ChannelFiltersSchema>;
export type SenderNumberFiltersType = z.infer<typeof SenderNumberFiltersSchema>;

// Additional types for service compatibility
export interface ChannelConfig {
  id: string;
  name: string;
  type: 'alimtalk' | 'sms' | 'lms' | 'friendtalk';
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