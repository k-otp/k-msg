/**
 * IWINV Multi Provider - New Adapter Pattern Implementation
 * 새 어댑터 패턴을 사용한 IWINV 다중 프로바이더 구현
 */

import { IWINVProvider } from './provider';
import { IWINVSMSProvider } from './provider-sms';
import type { IWINVConfig } from './types/iwinv';
import type { StandardRequest, StandardResult } from '@k-msg/core';
import { StandardStatus, StandardErrorCode } from '@k-msg/core';

/**
 * AlimTalk과 SMS를 모두 지원하는 통합 IWINV 프로바이더
 */
export class IWINVMultiProvider {
  private alimtalkProvider: IWINVProvider;
  private smsProvider: IWINVSMSProvider;
  private config: IWINVConfig;

  constructor(config: IWINVConfig) {
    this.config = config;
    this.alimtalkProvider = new IWINVProvider(config);
    this.smsProvider = new IWINVSMSProvider(config);
  }

  get id(): string {
    return 'iwinv-multi';
  }

  get name(): string {
    return 'IWINV Multi Channel Provider';
  }

  get version(): string {
    return '1.0.0';
  }

  get type() {
    return 'messaging' as const;
  }

  /**
   * AlimTalk 프로바이더 인스턴스 반환
   */
  getAlimTalkProvider(): IWINVProvider {
    return this.alimtalkProvider;
  }

  /**
   * SMS 프로바이더 인스턴스 반환
   */
  getSMSProvider(): IWINVSMSProvider {
    return this.smsProvider;
  }

  /**
   * 채널 타입에 따른 자동 라우팅 전송
   */
  async send(request: StandardRequest & {
    channel?: 'alimtalk' | 'sms' | 'auto'
  }): Promise<StandardResult> {
    const channel = request.channel || 'auto';

    switch (channel) {
      case 'alimtalk':
        return this.alimtalkProvider.send(request);

      case 'sms':
        return this.smsProvider.send(request);

      case 'auto':
      default:
        // 템플릿 코드가 있으면 AlimTalk, 없으면 SMS
        if (request.templateCode && request.templateCode !== 'SMS_DIRECT' && request.templateCode !== 'LMS_DIRECT') {
          try {
            return await this.alimtalkProvider.send(request);
          } catch (error) {
            // AlimTalk 실패 시 SMS로 폴백
            console.warn('AlimTalk failed, falling back to SMS:', error);
            return this.smsProvider.send(request);
          }
        } else {
          return this.smsProvider.send(request);
        }
    }
  }

  /**
   * AlimTalk 전송 (템플릿 기반)
   */
  async sendAlimTalk(templateCode: string, phoneNumber: string, variables: Record<string, string>, options?: {
    scheduledAt?: Date;
    senderNumber?: string;
    priority?: 'high' | 'normal' | 'low';
  }): Promise<StandardResult> {
    return this.alimtalkProvider.send({
      templateCode,
      phoneNumber,
      variables,
      options
    });
  }

  /**
   * SMS 전송 (직접 메시지)
   */
  async sendSMS(phoneNumber: string, message: string, options?: {
    senderNumber?: string;
    scheduledAt?: Date;
    priority?: 'high' | 'normal' | 'low';
  }): Promise<StandardResult> {
    return this.smsProvider.sendSMS(phoneNumber, message, options);
  }

  /**
   * LMS 전송 (긴 메시지)
   */
  async sendLMS(phoneNumber: string, subject: string, message: string, options?: {
    senderNumber?: string;
    scheduledAt?: Date;
    priority?: 'high' | 'normal' | 'low';
  }): Promise<StandardResult> {
    return this.smsProvider.sendLMS(phoneNumber, subject, message, options);
  }

  /**
   * 폴백 전송 (AlimTalk 실패 시 SMS로 자동 전환)
   */
  async sendWithFallback(request: {
    templateCode: string;
    phoneNumber: string;
    variables: Record<string, string>;
    fallbackMessage?: string;
    options?: {
      scheduledAt?: Date;
      senderNumber?: string;
      priority?: 'high' | 'normal' | 'low';
    };
  }): Promise<StandardResult & { channel: 'alimtalk' | 'sms' }> {
    try {
      // 먼저 AlimTalk 시도
      const result = await this.sendAlimTalk(
        request.templateCode,
        request.phoneNumber,
        request.variables,
        request.options
      );
      return { ...result, channel: 'alimtalk' };
    } catch (alimtalkError) {
      console.warn('AlimTalk failed, attempting SMS fallback:', alimtalkError);

      // SMS 폴백
      const fallbackMessage = request.fallbackMessage ||
        Object.entries(request.variables)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');

      const result = await this.sendSMS(
        request.phoneNumber,
        fallbackMessage,
        request.options
      );
      return { ...result, channel: 'sms' };
    }
  }

  /**
   * 대량 전송 (채널 자동 선택)
   */
  async sendBulk(requests: Array<StandardRequest & {
    channel?: 'alimtalk' | 'sms' | 'auto'
  }>, options?: {
    batchSize?: number;
    concurrency?: number;
  }): Promise<StandardResult[]> {
    const batchSize = options?.batchSize || 100;
    const concurrency = options?.concurrency || 5;
    const results: StandardResult[] = [];

    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);

      // 동시성 제한을 위한 세마포어 구현
      const semaphore = new Array(concurrency).fill(null);
      const batchPromises = batch.map(async (request, index) => {
        const semIndex = index % concurrency;
        await semaphore[semIndex]; // 이전 작업 완료 대기

        const promise = this.send(request);
        semaphore[semIndex] = promise;

        return promise;
      });

      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults.map(result =>
        result.status === 'fulfilled' ? result.value : {
          messageId: `error_${Date.now()}`,
          status: StandardStatus.FAILED,
          provider: this.id,
          timestamp: new Date(),
          phoneNumber: '',
          error: {
            code: StandardErrorCode.UNKNOWN_ERROR,
            message: result.status === 'rejected' ? result.reason?.message || 'Unknown error' : 'Unknown error',
            retryable: true
          }
        }
      ));
    }

    return results;
  }

  /**
   * 헬스체크 (두 프로바이더 모두 확인)
   */
  async healthCheck() {
    const [alimtalkHealth, smsHealth] = await Promise.allSettled([
      this.alimtalkProvider.healthCheck(),
      this.smsProvider.healthCheck()
    ]);

    const issues: string[] = [];

    if (alimtalkHealth.status === 'rejected') {
      issues.push(`AlimTalk: ${alimtalkHealth.reason?.message || 'Health check failed'}`);
    } else if (!alimtalkHealth.value.healthy) {
      issues.push(`AlimTalk: ${alimtalkHealth.value.issues.join(', ')}`);
    }

    if (smsHealth.status === 'rejected') {
      issues.push(`SMS: ${smsHealth.reason?.message || 'Health check failed'}`);
    } else if (!smsHealth.value.healthy) {
      issues.push(`SMS: ${smsHealth.value.issues.join(', ')}`);
    }

    return {
      healthy: issues.length === 0,
      issues,
      data: {
        alimtalk: alimtalkHealth.status === 'fulfilled' ? alimtalkHealth.value : null,
        sms: smsHealth.status === 'fulfilled' ? smsHealth.value : null
      }
    };
  }

  /**
   * 지원 기능 목록
   */
  getSupportedFeatures(): string[] {
    return [
      'alimtalk',
      'sms',
      'lms',
      'multi_channel',
      'auto_fallback',
      'bulk_messaging',
      'scheduled_messaging'
    ];
  }

  /**
   * 설정 정보
   */
  getCapabilities() {
    return {
      channels: ['alimtalk', 'sms', 'lms'],
      maxRecipientsPerRequest: 1000,
      maxRequestsPerSecond: 100,
      supportsBulk: true,
      supportsScheduling: true,
      supportsTemplating: true,
      supportsAutoFallback: true,
      supportsWebhooks: false
    };
  }
}

/**
 * Multi Provider 팩토리 함수들
 */
export const createIWINVMultiProvider = (config: IWINVConfig) => new IWINVMultiProvider(config);

export const createDefaultIWINVMultiProvider = () => {
  const config: IWINVConfig = {
    apiKey: process.env.IWINV_API_KEY || '',
    baseUrl: process.env.IWINV_BASE_URL || 'https://alimtalk.bizservice.iwinv.kr',
    debug: process.env.NODE_ENV === 'development'
  };

  if (!config.apiKey) {
    throw new Error('IWINV_API_KEY environment variable is required');
  }

  return new IWINVMultiProvider(config);
};