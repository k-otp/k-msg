import type { BaseProvider, DeliveryStatus } from '@k-msg/core';

// SMS 전용 요청/응답 타입
export interface SMSRequest {
  phoneNumber: string;
  text: string;
  senderNumber?: string;
  options?: SMSOptions;
}

export interface SMSOptions {
  priority?: 'high' | 'normal' | 'low';
  encoding?: 'UTF-8' | 'EUC-KR';
  scheduledAt?: Date;
  subject?: string; // LMS용
  messageType?: 'SMS' | 'LMS'; // SMS(단문) vs LMS(장문)
}

export interface SMSResult {
  messageId: string;
  status: DeliveryStatus;
  provider: string;
  timestamp: Date;
  phoneNumber: string;
  messageType: 'SMS' | 'LMS';
  deliveredAt?: Date;
  error?: SMSError;
}

export interface BulkSMSResult {
  requestId: string;
  results: SMSResult[];
  summary: {
    total: number;
    sent: number;
    failed: number;
  };
}

export interface SMSError {
  code: string;
  message: string;
  retryable: boolean;
  details?: Record<string, unknown>;
}

// SMS Provider 인터페이스
export interface SMSProvider extends BaseProvider<SMSRequest, SMSResult> {
  readonly type: 'sms';

  // SMS 전용 기능들
  sendBulkSMS?(requests: SMSRequest[]): Promise<BulkSMSResult>;

  // SMS 계약들
  sms: SMSContract;
  account: SMSAccountContract;
}

// SMS 전송 계약
export interface SMSContract {
  send(request: SMSSendRequest): Promise<SMSResult>;
  sendBulk?(requests: SMSSendRequest[]): Promise<BulkSMSResult>;
  schedule?(request: SMSSendRequest, scheduledAt: Date): Promise<ScheduleResult>;
  cancel?(messageId: string): Promise<void>;
  getStatus(messageId: string): Promise<SMSStatus>;
}

export interface SMSSendRequest {
  phoneNumber: string;
  text: string;
  senderNumber?: string;
  messageType?: 'SMS' | 'LMS';
  subject?: string; // LMS용
  options?: SMSSendOptions;
}

export interface SMSSendOptions {
  priority?: 'high' | 'normal' | 'low';
  encoding?: 'UTF-8' | 'EUC-KR';
  webhookUrl?: string;
  tracking?: boolean;
  scheduledAt?: Date;
}

export interface ScheduleResult {
  scheduleId: string;
  messageId: string;
  scheduledAt: Date;
  status: 'scheduled' | 'cancelled';
}

export enum SMSStatus {
  QUEUED = 'QUEUED',
  SENDING = 'SENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

// SMS 계정 관리 계약
export interface SMSAccountContract {
  getBalance(): Promise<SMSBalance>;
  getProfile(): Promise<SMSAccountProfile>;
  getSenderNumbers(): Promise<SMSSenderNumber[]>;
  addSenderNumber?(phoneNumber: string): Promise<SMSSenderNumber>;
  verifySenderNumber?(phoneNumber: string, verificationCode: string): Promise<boolean>;
}

export interface SMSBalance {
  sms: number;        // SMS 잔여 건수
  lms: number;        // LMS 잔여 건수
  currency: string;
  lastUpdated: Date;
}

export interface SMSAccountProfile {
  accountId: string;
  name: string;
  status: 'active' | 'suspended' | 'blocked';
  tier: 'basic' | 'standard' | 'premium';
  limits: {
    dailySMSLimit: number;
    dailyLMSLimit: number;
    monthlyLimit: number;
    rateLimit: number;
  };
}

export interface SMSSenderNumber {
  id: string;
  phoneNumber: string;
  isVerified: boolean;
  verifiedAt?: Date;
  status: 'active' | 'inactive' | 'pending';
  createdAt: Date;
}

// SMS Provider 기능
export interface SMSCapabilities {
  sms: {
    maxLength: number;           // SMS 최대 길이 (보통 90자)
    supportsBulk: boolean;
    maxRecipientsPerRequest: number;
    maxRequestsPerSecond: number;
    supportsScheduling: boolean;
    maxScheduleDays: number;
  };
  lms: {
    maxLength: number;           // LMS 최대 길이 (보통 2000자)
    supportsSubject: boolean;
    maxSubjectLength: number;
    supportsBulk: boolean;
  };
  senderNumbers: {
    requiresVerification: boolean;
    maxSenderNumbers: number;
    supportsCustomNumbers: boolean;
  };
}