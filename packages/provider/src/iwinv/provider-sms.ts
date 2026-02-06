/**
 * IWINV SMS Provider - New Adapter Pattern Implementation
 * 새 어댑터 패턴을 사용한 IWINV SMS 프로바이더 구현
 */

import { IWINVProviderFactory, IWINVProvider } from './provider';
import type { IWINVConfig } from './types/iwinv';

/**
 * SMS 특화 IWINV 프로바이더
 * 새 어댑터 패턴 기반으로 SMS 기능에 최적화
 */
export class IWINVSMSProvider extends IWINVProvider {
  constructor(config: IWINVConfig) {
    super(config);
  }

  /**
   * SMS 전송 (표준 인터페이스 사용)
   */
  async sendSMS(phoneNumber: string, message: string, options?: {
    senderNumber?: string;
    scheduledAt?: Date;
    priority?: 'high' | 'normal' | 'low';
  }) {
    return this.send({
      type: 'SMS',
      templateId: 'SMS_DIRECT', // SMS는 템플릿 없이 직접 전송
      to: phoneNumber,
      from: options?.senderNumber || '',
      variables: { message },
      ...options
    } as any);
  }

  /**
   * LMS 전송 (긴 문자 메시지)
   */
  async sendLMS(phoneNumber: string, subject: string, message: string, options?: {
    senderNumber?: string;
    scheduledAt?: Date;
    priority?: 'high' | 'normal' | 'low';
  }) {
    return this.send({
      type: 'LMS',
      templateId: 'LMS_DIRECT',
      to: phoneNumber,
      from: options?.senderNumber || '',
      variables: { subject, message },
      ...options
    } as any);
  }

  /**
   * 대량 SMS 전송
   */
  async sendBulkSMS(recipients: Array<{
    phoneNumber: string;
    message: string;
    variables?: Record<string, string>;
  }>, options?: {
    senderNumber?: string;
    scheduledAt?: Date;
    batchSize?: number;
  }) {
    const results = [];
    const batchSize = options?.batchSize || 100;

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      const batchPromises = batch.map(recipient =>
        this.sendSMS(recipient.phoneNumber, recipient.message, {
          senderNumber: options?.senderNumber,
          scheduledAt: options?.scheduledAt
        })
      );

      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * SMS/LMS 자동 판별 전송
   */
  async sendMessage(phoneNumber: string, message: string, options?: {
    senderNumber?: string;
    scheduledAt?: Date;
    subject?: string;
    priority?: 'high' | 'normal' | 'low';
  }) {
    // 90자 이하는 SMS, 초과는 LMS
    if (message.length <= 90) {
      return this.sendSMS(phoneNumber, message, options);
    } else {
      const subject = options?.subject || message.substring(0, 30) + '...';
      return this.sendLMS(phoneNumber, subject, message, options);
    }
  }
}

/**
 * SMS Provider 팩토리 함수들
 */
export const createIWINVSMSProvider = (config: IWINVConfig) => new IWINVSMSProvider(config);

export const createDefaultIWINVSMSProvider = () => {
  const config: IWINVConfig = {
    apiKey: process.env.IWINV_API_KEY || '',
    baseUrl: process.env.IWINV_BASE_URL || 'https://alimtalk.bizservice.iwinv.kr',
    debug: process.env.NODE_ENV === 'development'
  };

  if (!config.apiKey) {
    throw new Error('IWINV_API_KEY environment variable is required');
  }

  return new IWINVSMSProvider(config);
};