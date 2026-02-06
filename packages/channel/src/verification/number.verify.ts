/**
 * Phone Number Verification System
 * 발신번호 인증 및 검증 시스템
 */

import { EventEmitter } from 'events';
import { SenderNumber, SenderNumberStatus, SenderNumberCategory } from '../types/channel.types';

export interface PhoneVerificationRequest {
  id: string;
  senderNumberId: string;
  phoneNumber: string;
  verificationType: VerificationType;
  verificationCode: string;
  status: PhoneVerificationStatus;
  attempts: VerificationAttempt[];
  expiresAt: Date;
  createdAt: Date;
  completedAt?: Date;
  metadata: {
    userAgent?: string;
    ipAddress?: string;
    deviceId?: string;
    smsProvider?: string;
    callProvider?: string;
  };
}

export interface VerificationAttempt {
  attemptNumber: number;
  attemptedAt: Date;
  method: VerificationMethod;
  status: 'sent' | 'delivered' | 'failed' | 'verified' | 'expired';
  failureReason?: string;
  responseTime?: number; // in milliseconds
}

export enum VerificationType {
  SMS = 'sms',
  VOICE_CALL = 'voice_call',
  HYBRID = 'hybrid' // Try SMS first, fallback to voice
}

export enum VerificationMethod {
  SMS = 'sms',
  VOICE_CALL = 'voice_call',
  MISSED_CALL = 'missed_call'
}

export enum PhoneVerificationStatus {
  PENDING = 'pending',
  CODE_SENT = 'code_sent',
  VERIFIED = 'verified',
  FAILED = 'failed',
  EXPIRED = 'expired',
  BLOCKED = 'blocked'
}

export interface NumberVerifierOptions {
  codeLength: number;
  codeExpiryMinutes: number;
  maxAttempts: number;
  maxDailyAttempts: number;
  smsTemplate: string;
  voiceTemplate: string;
  rateLimitMinutes: number;
  enableVoiceFallback: boolean;
  enableMissedCallVerification: boolean;
  blockedNumbers: string[];
  allowedCountries: string[];
  smsProvider?: SMSProvider;
  voiceProvider?: VoiceProvider;
}

export interface SMSProvider {
  id: string;
  name: string;
  sendSMS(phoneNumber: string, message: string, options?: any): Promise<SMSResult>;
  getDeliveryStatus?(messageId: string): Promise<DeliveryStatus>;
}

export interface VoiceProvider {
  id: string;
  name: string;
  makeCall(phoneNumber: string, message: string, options?: any): Promise<VoiceResult>;
  makeMissedCall?(phoneNumber: string, options?: any): Promise<MissedCallResult>;
}

export interface SMSResult {
  messageId: string;
  status: 'sent' | 'failed';
  cost?: number;
  error?: string;
}

export interface VoiceResult {
  callId: string;
  status: 'initiated' | 'answered' | 'failed' | 'busy' | 'no_answer';
  duration?: number;
  cost?: number;
  error?: string;
}

export interface MissedCallResult {
  callId: string;
  status: 'initiated' | 'completed' | 'failed';
  missedCallNumber?: string;
  error?: string;
}

export interface DeliveryStatus {
  messageId: string;
  status: 'pending' | 'delivered' | 'failed' | 'expired';
  deliveredAt?: Date;
  failureReason?: string;
}

export interface PhoneNumberInfo {
  phoneNumber: string;
  countryCode: string;
  nationalNumber: string;
  carrier?: string;
  lineType?: 'mobile' | 'landline' | 'voip' | 'unknown';
  isValid: boolean;
  isPossible: boolean;
  region?: string;
}

export class NumberVerifier extends EventEmitter {
  private verificationRequests = new Map<string, PhoneVerificationRequest>();
  private phoneNumberCache = new Map<string, PhoneNumberInfo>();
  private rateLimitTracker = new Map<string, Date[]>();
  private dailyAttemptTracker = new Map<string, { date: string; count: number }>();
  private blockedNumbers = new Set<string>();

  private defaultOptions: NumberVerifierOptions = {
    codeLength: 6,
    codeExpiryMinutes: 5,
    maxAttempts: 3,
    maxDailyAttempts: 10,
    smsTemplate: '인증번호: {code}. {expiry}분 내에 입력해주세요.',
    voiceTemplate: '인증번호는 {code}입니다. 다시 한 번, {code}입니다.',
    rateLimitMinutes: 1,
    enableVoiceFallback: true,
    enableMissedCallVerification: false,
    blockedNumbers: [],
    allowedCountries: ['KR']
  };

  constructor(private options: Partial<NumberVerifierOptions> = {}) {
    super();
    this.options = { ...this.defaultOptions, ...options };
    
    // Initialize blocked numbers
    this.options.blockedNumbers?.forEach(number => {
      this.blockedNumbers.add(number);
    });
  }

  /**
   * Start phone number verification process
   */
  async startVerification(
    senderNumberId: string,
    phoneNumber: string,
    verificationType: VerificationType = VerificationType.SMS,
    metadata: PhoneVerificationRequest['metadata'] = {}
  ): Promise<PhoneVerificationRequest> {
    // Validate phone number
    const phoneInfo = await this.getPhoneNumberInfo(phoneNumber);
    if (!phoneInfo.isValid) {
      throw new Error('Invalid phone number format');
    }

    // Check if number is blocked
    if (this.isNumberBlocked(phoneNumber)) {
      throw new Error('Phone number is blocked');
    }

    // Check rate limiting
    if (this.isRateLimited(phoneNumber)) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    // Check daily attempt limit
    if (this.isDailyLimitExceeded(phoneNumber)) {
      throw new Error('Daily verification attempt limit exceeded');
    }

    const requestId = this.generateRequestId();
    const verificationCode = this.generateVerificationCode();
    const expiresAt = new Date(Date.now() + this.options.codeExpiryMinutes! * 60 * 1000);

    const verificationRequest: PhoneVerificationRequest = {
      id: requestId,
      senderNumberId,
      phoneNumber,
      verificationType,
      verificationCode,
      status: PhoneVerificationStatus.PENDING,
      attempts: [],
      expiresAt,
      createdAt: new Date(),
      metadata
    };

    this.verificationRequests.set(requestId, verificationRequest);
    this.updateRateLimit(phoneNumber);
    this.updateDailyAttempts(phoneNumber);

    this.emit('verification:started', { verificationRequest, phoneInfo });

    // Send verification code
    await this.sendVerificationCode(verificationRequest, phoneInfo);

    return verificationRequest;
  }

  /**
   * Verify the provided code
   */
  async verifyCode(requestId: string, providedCode: string): Promise<{
    success: boolean;
    status: PhoneVerificationStatus;
    message: string;
  }> {
    const request = this.verificationRequests.get(requestId);
    if (!request) {
      return {
        success: false,
        status: PhoneVerificationStatus.FAILED,
        message: 'Verification request not found'
      };
    }

    // Check if already verified
    if (request.status === PhoneVerificationStatus.VERIFIED) {
      return {
        success: true,
        status: PhoneVerificationStatus.VERIFIED,
        message: 'Already verified'
      };
    }

    // Check if expired
    if (new Date() > request.expiresAt) {
      request.status = PhoneVerificationStatus.EXPIRED;
      this.emit('verification:expired', { verificationRequest: request });
      
      return {
        success: false,
        status: PhoneVerificationStatus.EXPIRED,
        message: 'Verification code has expired'
      };
    }

    // Check if blocked due to too many attempts
    if (request.status === PhoneVerificationStatus.BLOCKED) {
      return {
        success: false,
        status: PhoneVerificationStatus.BLOCKED,
        message: 'Verification blocked due to too many failed attempts'
      };
    }

    // Verify code
    const isCodeValid = this.validateCode(request.verificationCode, providedCode);
    
    if (isCodeValid) {
      request.status = PhoneVerificationStatus.VERIFIED;
      request.completedAt = new Date();

      this.emit('verification:success', { verificationRequest: request });

      return {
        success: true,
        status: PhoneVerificationStatus.VERIFIED,
        message: 'Phone number verified successfully'
      };
    } else {
      // Add failed verification attempt
      const failedAttempt: VerificationAttempt = {
        attemptNumber: request.attempts.length + 1,
        attemptedAt: new Date(),
        method: VerificationMethod.SMS, // Assuming SMS for verification attempts
        status: 'failed'
      };
      request.attempts.push(failedAttempt);

      // Handle failed attempt
      const failedAttempts = request.attempts.filter(a => a.status === 'failed').length;
      
      if (failedAttempts >= this.options.maxAttempts!) {
        request.status = PhoneVerificationStatus.BLOCKED;
        this.emit('verification:blocked', { verificationRequest: request });
        
        return {
          success: false,
          status: PhoneVerificationStatus.BLOCKED,
          message: 'Too many failed attempts. Verification blocked.'
        };
      } else {
        request.status = PhoneVerificationStatus.FAILED;
        this.emit('verification:failed_attempt', { 
          verificationRequest: request, 
          attemptsRemaining: this.options.maxAttempts! - failedAttempts 
        });

        return {
          success: false,
          status: PhoneVerificationStatus.FAILED,
          message: `Invalid code. ${this.options.maxAttempts! - failedAttempts} attempts remaining.`
        };
      }
    }
  }

  /**
   * Resend verification code
   */
  async resendCode(requestId: string, method?: VerificationMethod): Promise<PhoneVerificationRequest> {
    const request = this.verificationRequests.get(requestId);
    if (!request) {
      throw new Error('Verification request not found');
    }

    if (request.status === PhoneVerificationStatus.VERIFIED) {
      throw new Error('Verification already completed');
    }

    if (request.status === PhoneVerificationStatus.BLOCKED) {
      throw new Error('Verification is blocked');
    }

    // Check rate limiting
    if (this.isRateLimited(request.phoneNumber)) {
      throw new Error('Rate limit exceeded. Please wait before requesting a new code.');
    }

    // Generate new code and extend expiry
    request.verificationCode = this.generateVerificationCode();
    request.expiresAt = new Date(Date.now() + this.options.codeExpiryMinutes! * 60 * 1000);
    request.status = PhoneVerificationStatus.PENDING;

    this.updateRateLimit(request.phoneNumber);

    const phoneInfo = await this.getPhoneNumberInfo(request.phoneNumber);
    
    // Send using specified method or fallback logic
    if (method) {
      await this.sendVerificationByMethod(request, phoneInfo, method);
    } else {
      await this.sendVerificationCode(request, phoneInfo);
    }

    this.emit('verification:resent', { verificationRequest: request });

    return request;
  }

  /**
   * Get verification request status
   */
  getVerificationStatus(requestId: string): PhoneVerificationRequest | null {
    return this.verificationRequests.get(requestId) || null;
  }

  /**
   * Cancel verification request
   */
  async cancelVerification(requestId: string): Promise<boolean> {
    const request = this.verificationRequests.get(requestId);
    if (!request) {
      return false;
    }

    if (request.status === PhoneVerificationStatus.VERIFIED) {
      return false; // Cannot cancel completed verification
    }

    this.verificationRequests.delete(requestId);
    this.emit('verification:cancelled', { verificationRequest: request });

    return true;
  }

  /**
   * Block a phone number from verification
   */
  blockPhoneNumber(phoneNumber: string, reason?: string): void {
    this.blockedNumbers.add(phoneNumber);
    
    // Cancel any pending verifications for this number
    for (const [requestId, request] of this.verificationRequests) {
      if (request.phoneNumber === phoneNumber && 
          request.status !== PhoneVerificationStatus.VERIFIED) {
        request.status = PhoneVerificationStatus.BLOCKED;
      }
    }

    this.emit('phone:blocked', { phoneNumber, reason });
  }

  /**
   * Unblock a phone number
   */
  unblockPhoneNumber(phoneNumber: string): void {
    this.blockedNumbers.delete(phoneNumber);
    this.emit('phone:unblocked', { phoneNumber });
  }

  /**
   * Get verification statistics
   */
  getVerificationStats(): {
    total: number;
    byStatus: Record<string, number>;
    byMethod: Record<string, number>;
    successRate: number;
    averageCompletionTime: number;
  } {
    const requests = Array.from(this.verificationRequests.values());
    
    const byStatus: Record<string, number> = {};
    const byMethod: Record<string, number> = {};
    let totalCompletionTime = 0;
    let completedCount = 0;

    requests.forEach(request => {
      byStatus[request.status] = (byStatus[request.status] || 0) + 1;

      // Count by primary method used
      if (request.attempts.length > 0) {
        const primaryMethod = request.attempts[0].method;
        byMethod[primaryMethod] = (byMethod[primaryMethod] || 0) + 1;
      }

      // Calculate completion time for verified requests
      if (request.completedAt) {
        const completionTime = request.completedAt.getTime() - request.createdAt.getTime();
        totalCompletionTime += completionTime;
        completedCount++;
      }
    });

    const successCount = byStatus[PhoneVerificationStatus.VERIFIED] || 0;
    const successRate = requests.length > 0 ? (successCount / requests.length) * 100 : 0;

    return {
      total: requests.length,
      byStatus,
      byMethod,
      successRate,
      averageCompletionTime: completedCount > 0 ? totalCompletionTime / completedCount : 0
    };
  }

  /**
   * Clean up expired verification requests
   */
  cleanup(): number {
    const now = new Date();
    let cleanedCount = 0;

    for (const [requestId, request] of this.verificationRequests) {
      if (now > request.expiresAt && request.status !== PhoneVerificationStatus.VERIFIED) {
        request.status = PhoneVerificationStatus.EXPIRED;
        this.verificationRequests.delete(requestId);
        cleanedCount++;
      }
    }

    // Clean up old rate limit entries
    const rateWindow = this.options.rateLimitMinutes! * 60 * 1000;
    for (const [phoneNumber, timestamps] of this.rateLimitTracker) {
      const validTimestamps = timestamps.filter(ts => now.getTime() - ts.getTime() < rateWindow);
      if (validTimestamps.length === 0) {
        this.rateLimitTracker.delete(phoneNumber);
      } else {
        this.rateLimitTracker.set(phoneNumber, validTimestamps);
      }
    }

    return cleanedCount;
  }

  // Private Methods
  private async sendVerificationCode(
    request: PhoneVerificationRequest,
    phoneInfo: PhoneNumberInfo
  ): Promise<void> {
    let method: VerificationMethod;

    switch (request.verificationType) {
      case VerificationType.SMS:
        method = VerificationMethod.SMS;
        break;
      case VerificationType.VOICE_CALL:
        method = VerificationMethod.VOICE_CALL;
        break;
      case VerificationType.HYBRID:
        // Try SMS first for mobile, voice for landline
        method = phoneInfo.lineType === 'landline' ? VerificationMethod.VOICE_CALL : VerificationMethod.SMS;
        break;
      default:
        method = VerificationMethod.SMS;
    }

    await this.sendVerificationByMethod(request, phoneInfo, method);
  }

  private async sendVerificationByMethod(
    request: PhoneVerificationRequest,
    phoneInfo: PhoneNumberInfo,
    method: VerificationMethod
  ): Promise<void> {
    const attempt: VerificationAttempt = {
      attemptNumber: request.attempts.length + 1,
      attemptedAt: new Date(),
      method,
      status: 'sent'
    };

    const startTime = Date.now();

    try {
      switch (method) {
        case VerificationMethod.SMS:
          await this.sendSMS(request, phoneInfo);
          break;
        case VerificationMethod.VOICE_CALL:
          await this.sendVoiceCall(request, phoneInfo);
          break;
        case VerificationMethod.MISSED_CALL:
          await this.sendMissedCall(request, phoneInfo);
          break;
      }

      attempt.status = 'delivered';
      attempt.responseTime = Date.now() - startTime;
      request.status = PhoneVerificationStatus.CODE_SENT;

    } catch (error) {
      attempt.status = 'failed';
      attempt.failureReason = error instanceof Error ? error.message : 'Unknown error';
      attempt.responseTime = Date.now() - startTime;

      // Try fallback method if enabled and this was SMS
      if (method === VerificationMethod.SMS && 
          this.options.enableVoiceFallback && 
          request.attempts.filter(a => a.method === VerificationMethod.VOICE_CALL).length === 0) {
        
        attempt.status = 'failed';
        request.attempts.push(attempt);
        
        // Try voice call as fallback
        await this.sendVerificationByMethod(request, phoneInfo, VerificationMethod.VOICE_CALL);
        return;
      }

      request.status = PhoneVerificationStatus.FAILED;
      throw error;
    }

    request.attempts.push(attempt);
  }

  private async sendSMS(request: PhoneVerificationRequest, phoneInfo: PhoneNumberInfo): Promise<void> {
    if (!this.options.smsProvider) {
      throw new Error('SMS provider not configured');
    }

    const message = this.options.smsTemplate!
      .replace('{code}', request.verificationCode)
      .replace('{expiry}', this.options.codeExpiryMinutes!.toString());

    const result = await this.options.smsProvider.sendSMS(request.phoneNumber, message);
    
    if (result.status === 'failed') {
      throw new Error(result.error || 'SMS sending failed');
    }
  }

  private async sendVoiceCall(request: PhoneVerificationRequest, phoneInfo: PhoneNumberInfo): Promise<void> {
    if (!this.options.voiceProvider) {
      throw new Error('Voice provider not configured');
    }

    const message = this.options.voiceTemplate!
      .replace('{code}', request.verificationCode.split('').join(' '));

    const result = await this.options.voiceProvider.makeCall(request.phoneNumber, message);
    
    if (result.status === 'failed') {
      throw new Error(result.error || 'Voice call failed');
    }
  }

  private async sendMissedCall(request: PhoneVerificationRequest, phoneInfo: PhoneNumberInfo): Promise<void> {
    if (!this.options.voiceProvider?.makeMissedCall) {
      throw new Error('Missed call verification not supported');
    }

    const result = await this.options.voiceProvider.makeMissedCall(request.phoneNumber);
    
    if (result.status === 'failed') {
      throw new Error(result.error || 'Missed call failed');
    }

    // For missed call verification, the code is typically the last 4-6 digits of the caller ID
    if (result.missedCallNumber) {
      const codeFromNumber = result.missedCallNumber.slice(-this.options.codeLength!);
      request.verificationCode = codeFromNumber;
    }
  }

  private async getPhoneNumberInfo(phoneNumber: string): Promise<PhoneNumberInfo> {
    // Check cache first
    if (this.phoneNumberCache.has(phoneNumber)) {
      return this.phoneNumberCache.get(phoneNumber)!;
    }

    // Basic Korean phone number validation and parsing
    const phoneInfo = this.parseKoreanPhoneNumber(phoneNumber);
    
    // Cache the result
    this.phoneNumberCache.set(phoneNumber, phoneInfo);
    
    return phoneInfo;
  }

  private parseKoreanPhoneNumber(phoneNumber: string): PhoneNumberInfo {
    // Remove any non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Korean phone number patterns
    const mobilePattern = /^(010|011|016|017|018|019)(\d{7,8})$/;
    const landlinePattern = /^(02|031|032|033|041|042|043|044|051|052|053|054|055|061|062|063|064)(\d{7,8})$/;
    
    let isValid = false;
    let isPossible = false;
    let lineType: PhoneNumberInfo['lineType'] = 'unknown';
    let carrier: string | undefined;

    if (mobilePattern.test(cleaned)) {
      isValid = true;
      isPossible = true;
      lineType = 'mobile';
      
      const prefix = cleaned.substring(0, 3);
      switch (prefix) {
        case '010':
          carrier = 'Multiple carriers';
          break;
        case '011':
          carrier = 'SK Telecom';
          break;
        case '016':
          carrier = 'KT';
          break;
        case '017':
          carrier = 'LG U+';
          break;
        case '018':
          carrier = 'SK Telecom';
          break;
        case '019':
          carrier = 'LG U+';
          break;
      }
    } else if (landlinePattern.test(cleaned)) {
      isValid = true;
      isPossible = true;
      lineType = 'landline';
    } else if (cleaned.length >= 10 && cleaned.length <= 11) {
      isPossible = true;
    }

    return {
      phoneNumber: cleaned,
      countryCode: '82',
      nationalNumber: cleaned,
      carrier,
      lineType,
      isValid,
      isPossible,
      region: 'KR'
    };
  }

  private isNumberBlocked(phoneNumber: string): boolean {
    return this.blockedNumbers.has(phoneNumber);
  }

  private isRateLimited(phoneNumber: string): boolean {
    const timestamps = this.rateLimitTracker.get(phoneNumber) || [];
    const rateWindow = this.options.rateLimitMinutes! * 60 * 1000;
    const now = new Date();
    
    const recentAttempts = timestamps.filter(ts => now.getTime() - ts.getTime() < rateWindow);
    
    return recentAttempts.length >= 1; // Allow only 1 attempt per rate limit window
  }

  private isDailyLimitExceeded(phoneNumber: string): boolean {
    const today = new Date().toISOString().split('T')[0];
    const dailyData = this.dailyAttemptTracker.get(phoneNumber);
    
    if (!dailyData || dailyData.date !== today) {
      return false;
    }
    
    return dailyData.count >= this.options.maxDailyAttempts!;
  }

  private updateRateLimit(phoneNumber: string): void {
    const timestamps = this.rateLimitTracker.get(phoneNumber) || [];
    timestamps.push(new Date());
    this.rateLimitTracker.set(phoneNumber, timestamps);
  }

  private updateDailyAttempts(phoneNumber: string): void {
    const today = new Date().toISOString().split('T')[0];
    const dailyData = this.dailyAttemptTracker.get(phoneNumber);
    
    if (!dailyData || dailyData.date !== today) {
      this.dailyAttemptTracker.set(phoneNumber, { date: today, count: 1 });
    } else {
      dailyData.count++;
    }
  }

  private validateCode(expected: string, provided: string): boolean {
    return expected === provided.replace(/\s/g, ''); // Remove spaces
  }

  private generateVerificationCode(): string {
    const length = this.options.codeLength!;
    let code = '';
    
    for (let i = 0; i < length; i++) {
      code += Math.floor(Math.random() * 10).toString();
    }
    
    return code;
  }

  private generateRequestId(): string {
    return `phone_verify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}