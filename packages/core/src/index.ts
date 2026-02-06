/**
 * Core AlimTalk Platform types and interfaces
 */

// Export error handling system
export * from './errors';

// Export test utilities
export * from './test-utils';

// Export retry and error recovery
export * from './retry';

// Export platform implementation
export * from './platform';

// Export adapter pattern core components
export * from './universal-provider';
export * from './provider-registry';

export interface ProviderHealthStatus {
  healthy: boolean;
  issues: string[];
  latency?: number;
  data?: {
    balance?: string;
    status?: string;
    code?: number;
    message?: string;
    provider?: string;
    baseUrl?: string;
    configured?: boolean;
  };
}

export interface PlatformHealthStatus {
  healthy: boolean;
  providers: Record<string, boolean>;
  issues: string[];
}

export interface PlatformInfo {
  version: string;
  providers: string[];
  features: string[];
}

export interface MessageSendOptions {
  templateId: string;
  recipients: { phoneNumber: string; variables?: Record<string, any> }[];
  variables: Record<string, any>;
}

export interface MessageSendResult {
  results: Array<{
    messageId?: string;
    status: string;
    phoneNumber: string;
    error?: { message: string };
  }>;
  summary: {
    total: number;
    sent: number;
    failed: number;
  };
}

// Core provider interface - 제네릭으로 추상화된 기본 인터페이스
export interface BaseProvider<TRequest = StandardRequest, TResult = StandardResult> {
  // Identity
  readonly id: string;
  readonly name: string;
  readonly type: ProviderType;
  readonly version: string;

  // Lifecycle
  configure(config: Record<string, unknown>): void;
  isReady(): boolean;
  healthCheck(): Promise<ProviderHealthStatus>;
  destroy(): void;

  // Core operation - 제네릭으로 추상화 (공변성 지원)
  send<T extends TRequest = TRequest, R extends TResult = TResult>(
    request: T
  ): Promise<R>;

  // Status tracking
  getStatus(requestId: string): Promise<DeliveryStatus>;
  cancel?(requestId: string): Promise<boolean>;

  // Capabilities discovery
  getCapabilities(): any;
  getSupportedFeatures(): string[];
  getConfigurationSchema(): ConfigurationSchema;

  // Metadata and adapter access
  getMetadata?(): any;
  getAdapter?(): any;
}

// Provider Type 정의
export type ProviderType =
  | 'messaging'    // AlimTalk, KakaoTalk 등
  | 'sms'         // SMS 발송
  | 'email'       // 이메일 발송
  | 'push'        // Push 알림
  | 'voice';      // 음성 통화

// 공통 상태 추적 인터페이스
export interface DeliveryStatus {
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'cancelled';
  timestamp: Date;
  details?: Record<string, unknown>;
}

// 설정 스키마
export interface ConfigurationSchema {
  required: ConfigField[];
  optional: ConfigField[];
}

export interface ConfigField {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'url' | 'secret';
  description: string;
  validation?: ValidationRule;
}

export interface ValidationRule {
  pattern?: string;
  min?: number;
  max?: number;
  enum?: string[];
}

// Provider capabilities definition (for compatibility)
export interface ProviderCapabilities {
  templates?: {
    maxLength?: number;
    maxVariables?: number;
    maxButtons?: number;
    supportedButtonTypes?: string[];
    requiresApproval?: boolean;
    approvalTime?: string;
  };
  messaging?: {
    maxRecipientsPerRequest?: number;
    maxRequestsPerSecond?: number;
    supportsBulk?: boolean;
    supportsScheduling?: boolean;
    maxScheduleDays?: number;
    supportsFallback?: boolean;
  };
  channels?: {
    requiresBusinessVerification?: boolean;
    maxSenderNumbers?: number;
    supportsMultipleChannels?: boolean;
  };
}

/**
 * Core AlimTalk Platform interface
 */
export interface KMsg {
  // Basic information
  getInfo(): PlatformInfo;

  // Provider management
  registerProvider(provider: BaseProvider): void;
  getProvider(providerId: string): BaseProvider | null;
  listProviders(): string[];

  // Health monitoring
  healthCheck(): Promise<PlatformHealthStatus>;

  // Messaging interface
  messages: {
    send(options: MessageSendOptions): Promise<MessageSendResult>;
    getStatus(messageId: string): Promise<string>;
  };
}

/**
 * Configuration interface
 */
export interface Config {
  providers: string[];
  defaultProvider: string;
  features: {
    enableBulkSending?: boolean;
    enableScheduling?: boolean;
    enableAnalytics?: boolean;
  };
}

/**
 * Template categories
 */
export enum TemplateCategory {
  AUTHENTICATION = 'AUTHENTICATION',
  NOTIFICATION = 'NOTIFICATION',
  PROMOTION = 'PROMOTION',
  INFORMATION = 'INFORMATION',
  RESERVATION = 'RESERVATION',
  SHIPPING = 'SHIPPING',
  PAYMENT = 'PAYMENT'
}

// =============================================================================
// Provider Adapter Pattern - Core Abstractions
// =============================================================================

/**
 * 표준화된 요청 인터페이스 (모든 프로바이더 공통)
 */
export interface StandardRequest {
  templateCode: string;
  phoneNumber: string;
  variables: Record<string, string>;
  options?: {
    scheduledAt?: Date;
    priority?: 'high' | 'normal' | 'low';
    senderNumber?: string;
    subject?: string; // LMS/이메일용
    webhookUrl?: string;
  };
}

/**
 * 표준화된 응답 인터페이스 (모든 프로바이더 공통)
 */
export interface StandardResult {
  messageId: string;
  status: StandardStatus;
  provider: string;
  timestamp: Date;
  phoneNumber: string;
  deliveredAt?: Date;
  error?: StandardError;
  metadata?: Record<string, unknown>;
}

/**
 * 표준화된 에러 인터페이스
 */
export interface StandardError {
  code: StandardErrorCode;
  message: string;
  retryable: boolean;
  details?: Record<string, unknown>;
}

/**
 * 표준화된 상태 코드
 */
export enum StandardStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

/**
 * 표준화된 에러 코드
 */
export enum StandardErrorCode {
  INVALID_REQUEST = 'INVALID_REQUEST',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  TEMPLATE_NOT_FOUND = 'TEMPLATE_NOT_FOUND',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  PROVIDER_ERROR = 'PROVIDER_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * 프로바이더 설정 인터페이스
 */
export interface ProviderConfig {
  apiKey: string;
  baseUrl: string;
  debug?: boolean;
  timeout?: number;
  [key: string]: unknown;
}

/**
 * 프로바이더 어댑터 기반 추상 클래스
 */
export abstract class BaseProviderAdapter {
  protected config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
    this.validateConfig(config);
  }

  /**
   * 표준 요청을 프로바이더별 요청 형식으로 변환
   */
  abstract adaptRequest(request: StandardRequest): any;

  /**
   * 프로바이더 응답을 표준 응답 형식으로 변환
   */
  abstract adaptResponse(response: any): StandardResult;

  /**
   * 프로바이더별 에러를 표준 에러 형식으로 변환
   */
  abstract mapError(error: any): StandardError;

  /**
   * 프로바이더별 인증 헤더 생성
   */
  abstract getAuthHeaders(): Record<string, string>;

  /**
   * 프로바이더별 기본 URL 반환
   */
  abstract getBaseUrl(): string;

  /**
   * 프로바이더별 엔드포인트 매핑
   */
  abstract getEndpoint(operation: string): string;

  /**
   * HTTP 요청 시 필요한 기본 설정
   */
  getRequestConfig(): RequestInit {
    return {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders()
      },
      signal: this.config.timeout ? AbortSignal.timeout(this.config.timeout) : undefined
    };
  }

  /**
   * 응답 검증
   */
  validateResponse(response: Response): boolean {
    return response.ok;
  }

  /**
   * 에러 재시도 가능 여부 판단
   */
  isRetryableError(error: any): boolean {
    if (error.status >= 500 || error.code === 'NETWORK_ERROR') {
      return true;
    }
    if (error.code === StandardErrorCode.RATE_LIMIT_EXCEEDED) {
      return true;
    }
    return false;
  }

  /**
   * 메시지 ID 생성 (프로바이더에서 제공하지 않는 경우)
   */
  protected generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 설정 검증
   */
  protected validateConfig(config: ProviderConfig): void {
    if (!config.apiKey) {
      throw new Error('API key is required');
    }
    if (!config.baseUrl) {
      throw new Error('Base URL is required');
    }
    try {
      new URL(config.baseUrl);
    } catch {
      throw new Error('Base URL must be a valid URL');
    }
  }

  /**
   * 디버그 로깅
   */
  protected log(message: string, data?: any): void {
    if (this.config.debug) {
      console.log(`[${this.constructor.name}] ${message}`, data || '');
    }
  }
}

/**
 * 프로바이더 메타데이터
 */
export interface ProviderMetadata {
  id: string;
  name: string;
  version: string;
  description: string;
  supportedFeatures: string[];
  capabilities: {
    maxRecipientsPerRequest: number;
    maxRequestsPerSecond: number;
    supportsBulk: boolean;
    supportsScheduling: boolean;
    supportsTemplating: boolean;
    supportsWebhooks: boolean;
  };
  endpoints: Record<string, string>;
  authType: 'header' | 'body' | 'query' | 'oauth';
  responseFormat: 'json' | 'xml' | 'form';
}

/**
 * 어댑터 팩토리 인터페이스
 */
export interface AdapterFactory {
  create(config: ProviderConfig): BaseProviderAdapter;
  supports(providerId: string): boolean;
  getMetadata(): ProviderMetadata;
}