/**
 * Composition-based Provider Architecture
 * 컴포지션 기반 프로바이더 아키텍처
 */

import {
  TemplateCode,
  TypedRequest,
  TypedResult,
  TemplateValidator,
  ExtractChannels
} from '../types/typed-templates';
import { IWINVConfigV2, AlimTalkConfig, SMSConfig, MMSConfig } from '../config/provider-config-v2';

// 채널 타입 정의
export type ChannelType = 'alimtalk' | 'sms' | 'mms';

// 기본 채널 인터페이스
export interface MessageChannel<T extends TemplateCode = TemplateCode> {
  readonly type: ChannelType;
  readonly name: string;

  send<K extends T>(request: TypedRequest<K>): Promise<TypedResult<K>>;
  healthCheck(): Promise<HealthStatus>;
  getCapabilities(): ChannelCapabilities;
  isReady(): boolean;
  destroy(): Promise<void>;
}

// 헬스 상태
export interface HealthStatus {
  healthy: boolean;
  issues: string[];
  lastChecked: Date;
  metadata?: Record<string, any>;
}

// 채널 능력
export interface ChannelCapabilities {
  maxRecipientsPerRequest: number;
  maxRequestsPerSecond: number;
  supportsBulk: boolean;
  supportsScheduling: boolean;
  supportsTemplating: boolean;
  supportedTemplates?: TemplateCode[];
}

// 성능 및 안정성 컴포넌트들
export interface RateLimiter {
  execute<T>(operation: () => Promise<T>): Promise<T>;
  checkLimit(): Promise<boolean>;
  getStats(): RateLimitStats;
}

export interface CircuitBreaker {
  execute<T>(operation: () => Promise<T>): Promise<T>;
  getState(): 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  getMetrics(): CircuitBreakerMetrics;
}

export interface Cache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface HttpClient {
  request<T>(options: HttpRequestOptions): Promise<HttpResponse<T>>;
}

// 인터페이스 정의들
export interface RateLimitStats {
  requestCount: number;
  rejectedCount: number;
  currentRate: number;
  windowStart: Date;
}

export interface CircuitBreakerMetrics {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  successCount: number;
  lastFailureTime?: Date;
  nextRetryTime?: Date;
}

export interface HttpRequestOptions {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

export interface HttpResponse<T> {
  status: number;
  data: T;
  headers: Record<string, string>;
}

// AlimTalk 채널 구현
export class AlimTalkChannel implements MessageChannel {
  readonly type = 'alimtalk' as const;
  readonly name = 'IWINV AlimTalk Channel';

  constructor(
    private config: AlimTalkConfig,
    private httpClient: HttpClient,
    private rateLimiter: RateLimiter,
    private circuitBreaker: CircuitBreaker,
    private cache: Cache
  ) {}

  async send<K extends TemplateCode>(request: TypedRequest<K>): Promise<TypedResult<K>> {
    // 템플릿 검증
    const validation = TemplateValidator.validateVariables(request.templateCode, request.variables);
    if (!validation.isValid) {
      throw new Error(`Template validation failed: ${validation.errors.join(', ')}`);
    }

    // 채널 지원 여부 확인
    if (!TemplateValidator.validateChannel(request.templateCode, 'alimtalk')) {
      throw new Error(`Template ${request.templateCode} does not support alimtalk channel`);
    }

    return this.circuitBreaker.execute(() =>
      this.rateLimiter.execute(() =>
        this.executeAlimTalkRequest(request, validation.validatedVariables)
      )
    );
  }

  private async executeAlimTalkRequest<K extends TemplateCode>(
    request: TypedRequest<K>,
    validatedVariables: any
  ): Promise<TypedResult<K>> {
    // AlimTalk API 요청 구성
    const apiRequest = {
      templateCode: request.templateCode,
      list: [{
        phone: request.phoneNumber,
        templateParam: Object.values(validatedVariables)
      }],
      reserve: request.options?.scheduledAt ? 'Y' : 'N',
      sendDate: request.options?.scheduledAt ? this.formatDate(request.options.scheduledAt) : undefined
    };

    const response = await this.httpClient.request({
      url: `${this.config.baseUrl}/send/`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: apiRequest,
      timeout: this.config.timeout || 10000
    });

    const responseData = response.data as any;

    return {
      messageId: responseData?.messageId || `alimtalk_${Date.now()}`,
      templateCode: request.templateCode,
      phoneNumber: request.phoneNumber,
      channel: 'alimtalk' as ExtractChannels<K>,
      status: response.status === 200 ? 'sent' : 'failed',
      timestamp: new Date(),
      variables: validatedVariables,
      error: response.status !== 200 ? {
        code: responseData?.code || 'UNKNOWN_ERROR',
        message: responseData?.message || 'Unknown error occurred',
        retryable: response.status >= 500
      } : undefined
    };
  }

  async healthCheck(): Promise<HealthStatus> {
    try {
      const response = await this.httpClient.request({
        url: `${this.config.baseUrl}/balance/`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        timeout: 5000
      });

      return {
        healthy: response.status === 200,
        issues: response.status !== 200 ? ['API connection failed'] : [],
        lastChecked: new Date(),
        metadata: {
          apiStatus: response.status,
          balance: response.data?.balance
        }
      };
    } catch (error) {
      return {
        healthy: false,
        issues: [`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        lastChecked: new Date(),
        metadata: { error: String(error) }
      };
    }
  }

  getCapabilities(): ChannelCapabilities {
    return {
      maxRecipientsPerRequest: 1000,
      maxRequestsPerSecond: 100,
      supportsBulk: true,
      supportsScheduling: true,
      supportsTemplating: true,
      supportedTemplates: ['WELCOME_001', 'OTP_AUTH_001', 'ORDER_CONFIRM_001', 'PAYMENT_COMPLETE_001', 'EMERGENCY_NOTIFICATION']
    };
  }

  isReady(): boolean {
    return !!(this.config.apiKey && this.config.baseUrl);
  }

  async destroy(): Promise<void> {
    // 필요시 리소스 정리
  }

  private formatDate(date: Date): string {
    return date.toISOString().replace('T', ' ').substring(0, 19);
  }
}

// SMS 채널 구현
export class SMSChannel implements MessageChannel {
  readonly type = 'sms' as const;
  readonly name = 'IWINV SMS Channel';

  constructor(
    private config: SMSConfig,
    private httpClient: HttpClient,
    private rateLimiter: RateLimiter,
    private circuitBreaker: CircuitBreaker,
    private cache: Cache
  ) {}

  async send<K extends TemplateCode>(request: TypedRequest<K>): Promise<TypedResult<K>> {
    // 템플릿 검증
    const validation = TemplateValidator.validateVariables(request.templateCode, request.variables);
    if (!validation.isValid) {
      throw new Error(`Template validation failed: ${validation.errors.join(', ')}`);
    }

    // 채널 지원 여부 확인
    if (!TemplateValidator.validateChannel(request.templateCode, 'sms')) {
      throw new Error(`Template ${request.templateCode} does not support SMS channel`);
    }

    return this.circuitBreaker.execute(() =>
      this.rateLimiter.execute(() =>
        this.executeSMSRequest(request, validation.validatedVariables)
      )
    );
  }

  private async executeSMSRequest<K extends TemplateCode>(
    request: TypedRequest<K>,
    validatedVariables: any
  ): Promise<TypedResult<K>> {
    // SMS/LMS 자동 판별
    const message = this.buildMessage(request.templateCode, validatedVariables);
    const isLMS = message.length > 90;

    const apiRequest = {
      templateCode: isLMS ? 'LMS_DIRECT' : 'SMS_DIRECT',
      list: [{
        phone: request.phoneNumber,
        templateParam: isLMS
          ? [request.options?.subject || message.substring(0, 30) + '...', message]
          : [message]
      }],
      reserve: request.options?.scheduledAt ? 'Y' : 'N',
      sendDate: request.options?.scheduledAt ? this.formatDate(request.options.scheduledAt) : undefined,
      resendCallback: this.config.senderNumber
    };

    const response = await this.httpClient.request({
      url: `${this.config.baseUrl}/send/`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: apiRequest,
      timeout: this.config.timeout || 10000
    });

    return {
      messageId: response.data.messageId || `sms_${Date.now()}`,
      templateCode: request.templateCode,
      phoneNumber: request.phoneNumber,
      channel: 'sms' as ExtractChannels<K>,
      status: response.status === 200 ? 'sent' : 'failed',
      timestamp: new Date(),
      variables: validatedVariables,
      error: response.status !== 200 ? {
        code: response.data.code || 'UNKNOWN_ERROR',
        message: response.data.message || 'Unknown error occurred',
        retryable: response.status >= 500
      } : undefined
    };
  }

  private buildMessage(templateCode: TemplateCode, variables: any): string {
    if (templateCode === 'SMS_DIRECT') {
      return variables.message;
    }
    if (templateCode === 'LMS_DIRECT') {
      return variables.message;
    }
    if (templateCode === 'OTP_AUTH_001') {
      return `[${variables.serviceName || 'K-MSG'}] 인증번호는 ${variables.code}입니다. ${variables.expiry} 내에 입력해주세요.`;
    }
    // 기타 템플릿들은 fallback 메시지
    return `${Object.values(variables).join(', ')}`;
  }

  async healthCheck(): Promise<HealthStatus> {
    try {
      const response = await this.httpClient.request({
        url: `${this.config.baseUrl}/balance/`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        timeout: 5000
      });

      return {
        healthy: response.status === 200,
        issues: response.status !== 200 ? ['API connection failed'] : [],
        lastChecked: new Date(),
        metadata: {
          apiStatus: response.status,
          balance: response.data?.balance
        }
      };
    } catch (error) {
      return {
        healthy: false,
        issues: [`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        lastChecked: new Date(),
        metadata: { error: String(error) }
      };
    }
  }

  getCapabilities(): ChannelCapabilities {
    return {
      maxRecipientsPerRequest: 1000,
      maxRequestsPerSecond: 100,
      supportsBulk: true,
      supportsScheduling: true,
      supportsTemplating: false, // SMS는 템플릿보다는 직접 메시지
      supportedTemplates: ['SMS_DIRECT', 'LMS_DIRECT', 'OTP_AUTH_001', 'EMERGENCY_NOTIFICATION']
    };
  }

  isReady(): boolean {
    return !!(this.config.apiKey && this.config.baseUrl && this.config.senderNumber);
  }

  async destroy(): Promise<void> {
    // 필요시 리소스 정리
  }

  private formatDate(date: Date): string {
    return date.toISOString().replace('T', ' ').substring(0, 19);
  }
}

// 채널 라우터
export interface ChannelRouter {
  selectChannel<T extends TemplateCode>(request: TypedRequest<T>): MessageChannel<T>;
  getPreferredChannel<T extends TemplateCode>(templateCode: T): ExtractChannels<T>;
}

export class DefaultChannelRouter implements ChannelRouter {
  constructor(private channels: Map<string, MessageChannel>) {}

  selectChannel<T extends TemplateCode>(request: TypedRequest<T>): MessageChannel<T> {
    // 명시적 채널 지정이 있으면 해당 채널 사용
    if (request.options?.channel) {
      const channel = this.channels.get(request.options.channel);
      if (!channel) {
        throw new Error(`Channel '${request.options.channel}' not available`);
      }
      return channel as MessageChannel<T>;
    }

    // 템플릿 기반 자동 선택
    const preferredChannel = this.getPreferredChannel(request.templateCode);
    const channel = this.channels.get(preferredChannel);

    if (!channel) {
      throw new Error(`No available channel for template '${request.templateCode}'`);
    }

    return channel as MessageChannel<T>;
  }

  getPreferredChannel<T extends TemplateCode>(templateCode: T): ExtractChannels<T> {
    // 템플릿별 기본 채널 선택 로직
    if (templateCode.includes('SMS') || templateCode.includes('LMS')) {
      return 'sms' as ExtractChannels<T>;
    }
    return 'alimtalk' as ExtractChannels<T>;
  }
}

// 폴백 전략
export interface FallbackStrategy {
  handle<T extends TemplateCode>(error: Error, request: TypedRequest<T>): Promise<TypedResult<T>>;
}

export class DefaultFallbackStrategy implements FallbackStrategy {
  constructor(
    private channels: Map<string, MessageChannel>,
    private router: ChannelRouter
  ) {}

  async handle<T extends TemplateCode>(error: Error, request: TypedRequest<T>): Promise<TypedResult<T>> {
    // AlimTalk 실패 시 SMS로 폴백
    if (request.options?.channel === 'alimtalk' || this.router.getPreferredChannel(request.templateCode) === 'alimtalk') {
      const smsChannel = this.channels.get('sms');
      if (smsChannel && TemplateValidator.validateChannel(request.templateCode, 'sms')) {
        const fallbackRequest = {
          ...request,
          options: { ...request.options, channel: 'sms' as const }
        };
        return smsChannel.send(fallbackRequest);
      }
    }

    // 폴백 실패 시 에러 결과 반환
    return {
      messageId: `fallback_failed_${Date.now()}`,
      templateCode: request.templateCode,
      phoneNumber: request.phoneNumber,
      channel: 'sms' as ExtractChannels<T>,
      status: 'failed',
      timestamp: new Date(),
      variables: request.variables,
      error: {
        code: 'FALLBACK_FAILED',
        message: `All channels failed. Original error: ${error.message}`,
        retryable: false
      }
    };
  }
}

// 통합 프로바이더 (컴포지션 기반)
export class IWINVProviderV2 {
  private channels = new Map<string, MessageChannel>();

  constructor(
    private config: IWINVConfigV2,
    private router: ChannelRouter,
    private fallbackStrategy: FallbackStrategy,
    channels: MessageChannel[]
  ) {
    channels.forEach(channel => {
      this.channels.set(channel.type, channel);
    });
  }

  async send<T extends TemplateCode>(request: TypedRequest<T>): Promise<TypedResult<T>> {
    try {
      const channel = this.router.selectChannel(request);
      return await channel.send(request);
    } catch (error) {
      return this.fallbackStrategy.handle(error as Error, request);
    }
  }

  async sendBulk<T extends TemplateCode>(
    requests: TypedRequest<T>[],
    options?: {
      batchSize?: number;
      concurrency?: number;
    }
  ): Promise<TypedResult<T>[]> {
    const batchSize = options?.batchSize || 100;
    const concurrency = options?.concurrency || 5;
    const results: TypedResult<T>[] = [];

    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      const batchPromises = batch.map(request => this.send(request));

      // 동시성 제한
      const batchResults = await this.limitConcurrency(batchPromises, concurrency);
      results.push(...batchResults);
    }

    return results;
  }

  async healthCheck(): Promise<Record<string, HealthStatus>> {
    const healthChecks = Array.from(this.channels.entries()).map(async ([type, channel]) => {
      const health = await channel.healthCheck();
      return [type, health] as const;
    });

    const results = await Promise.allSettled(healthChecks);
    const healthStatus: Record<string, HealthStatus> = {};

    results.forEach((result, index) => {
      const channelType = Array.from(this.channels.keys())[index];
      if (result.status === 'fulfilled') {
        healthStatus[channelType] = result.value[1];
      } else {
        healthStatus[channelType] = {
          healthy: false,
          issues: [`Health check failed: ${result.reason}`],
          lastChecked: new Date()
        };
      }
    });

    return healthStatus;
  }

  getChannels(): string[] {
    return Array.from(this.channels.keys());
  }

  getChannel(type: string): MessageChannel | undefined {
    return this.channels.get(type);
  }

  async destroy(): Promise<void> {
    const destroyPromises = Array.from(this.channels.values()).map(channel => channel.destroy());
    await Promise.allSettled(destroyPromises);
    this.channels.clear();
  }

  private async limitConcurrency<T>(promises: Promise<T>[], limit: number): Promise<T[]> {
    const results: T[] = [];
    for (let i = 0; i < promises.length; i += limit) {
      const batch = promises.slice(i, i + limit);
      const batchResults = await Promise.allSettled(batch);

      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          // 실패한 경우 기본값 처리 또는 에러 로깅
          console.error('Batch operation failed:', result.reason);
        }
      });
    }
    return results;
  }
}