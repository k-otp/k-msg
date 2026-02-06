import type { BaseProvider, DeliveryStatus } from '@k-msg/core';
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
    subject?: string;
    messageType?: 'SMS' | 'LMS';
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
export interface SMSProvider extends BaseProvider<SMSRequest, SMSResult> {
    readonly type: 'sms';
    sendBulkSMS?(requests: SMSRequest[]): Promise<BulkSMSResult>;
    sms: SMSContract;
    account: SMSAccountContract;
}
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
    subject?: string;
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
export declare enum SMSStatus {
    QUEUED = "QUEUED",
    SENDING = "SENDING",
    SENT = "SENT",
    DELIVERED = "DELIVERED",
    FAILED = "FAILED",
    CANCELLED = "CANCELLED"
}
export interface SMSAccountContract {
    getBalance(): Promise<SMSBalance>;
    getProfile(): Promise<SMSAccountProfile>;
    getSenderNumbers(): Promise<SMSSenderNumber[]>;
    addSenderNumber?(phoneNumber: string): Promise<SMSSenderNumber>;
    verifySenderNumber?(phoneNumber: string, verificationCode: string): Promise<boolean>;
}
export interface SMSBalance {
    sms: number;
    lms: number;
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
export interface SMSCapabilities {
    sms: {
        maxLength: number;
        supportsBulk: boolean;
        maxRecipientsPerRequest: number;
        maxRequestsPerSecond: number;
        supportsScheduling: boolean;
        maxScheduleDays: number;
    };
    lms: {
        maxLength: number;
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
