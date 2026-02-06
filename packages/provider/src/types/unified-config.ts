/**
 * Unified Configuration Types
 * 통합된 설정 타입 시스템
 */

import { ProviderConfig } from '@k-msg/core';

// =============================================================================
// 기본 설정 인터페이스
// =============================================================================

/**
 * 환경별 설정
 */
export type Environment = 'development' | 'staging' | 'production';

/**
 * 로그 레벨
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * 공통 설정 인터페이스
 */
export interface BaseConfig {
  environment: Environment;
  debug?: boolean;
  logLevel?: LogLevel;
  timeout?: number;
}

/**
 * IWINV 기본 설정 (모든 IWINV 관련 설정의 기준)
 */
export interface IWINVBaseConfig extends ProviderConfig, BaseConfig {
  apiKey: string;
  baseUrl: string;
  userId?: string;
  senderNumber?: string;
}

// =============================================================================
// 채널별 특화 설정
// =============================================================================

/**
 * AlimTalk 특화 설정
 */
export interface AlimTalkConfig extends IWINVBaseConfig {
  type: 'alimtalk';
  senderKey?: string;
  fallbackSettings?: {
    enableSMSFallback: boolean;
    fallbackSenderNumber?: string;
  };
}

/**
 * SMS 특화 설정
 */
export interface SMSConfig extends IWINVBaseConfig {
  type: 'sms';
  defaultMsgType?: 'SMS' | 'LMS' | 'MMS';
  autoDetectMessageType?: boolean;
  maxSMSLength?: number;
  maxLMSLength?: number;
}

/**
 * MMS 특화 설정
 */
export interface MMSConfig extends IWINVBaseConfig {
  type: 'mms';
  maxFileSize?: number;
  allowedMimeTypes?: string[];
  imageOptimization?: {
    enabled: boolean;
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  };
}

// =============================================================================
// 통합 설정 타입
// =============================================================================

/**
 * 채널별 설정 유니온
 */
export type ChannelConfig = AlimTalkConfig | SMSConfig | MMSConfig;

/**
 * 다중 채널 지원 설정
 */
export interface MultiChannelConfig {
  channels: ChannelConfig[];
  defaultChannel: 'alimtalk' | 'sms' | 'mms';
  fallbackChain?: ('alimtalk' | 'sms' | 'mms')[];
}

/**
 * 성능 및 안정성 설정
 */
export interface PerformanceConfig {
  rateLimiting?: {
    requestsPerSecond: number;
    burstSize: number;
    strategy: 'token_bucket' | 'sliding_window';
  };
  circuitBreaker?: {
    enabled: boolean;
    failureThreshold: number;
    timeoutMs: number;
    retryDelayMs: number;
  };
  caching?: {
    enabled: boolean;
    ttl: number;
    maxSize: number;
  };
  connectionPool?: {
    maxConnections: number;
    idleTimeout: number;
    connectionTimeout: number;
  };
}

/**
 * 모니터링 설정
 */
export interface MonitoringConfig {
  enableMetrics: boolean;
  enableTracing: boolean;
  enableHealthChecks: boolean;
  metricsInterval?: number;
  healthCheckInterval?: number;
}

/**
 * 완전한 통합 설정
 */
export interface UnifiedProviderConfig extends BaseConfig {
  // 필수 설정
  provider: {
    type: 'iwinv';
    apiKey: string;
    baseUrl: string;
  };

  // 채널 설정 (선택적)
  channels?: {
    alimtalk?: Omit<AlimTalkConfig, 'apiKey' | 'baseUrl' | 'type'>;
    sms?: Omit<SMSConfig, 'apiKey' | 'baseUrl' | 'type'>;
    mms?: Omit<MMSConfig, 'apiKey' | 'baseUrl' | 'type'>;
  };

  // 성능 설정
  performance?: PerformanceConfig;

  // 모니터링 설정
  monitoring?: MonitoringConfig;

  // 다중 채널 설정
  multiChannel?: {
    defaultChannel: 'alimtalk' | 'sms' | 'mms';
    fallbackChain: ('alimtalk' | 'sms' | 'mms')[];
  };
}

// =============================================================================
// 타입 가드 및 검증 함수
// =============================================================================

/**
 * 기본 설정 검증
 */
export function isValidBaseConfig(config: unknown): config is BaseConfig {
  return typeof config === 'object' && config !== null &&
         'environment' in config &&
         ['development', 'staging', 'production'].includes((config as BaseConfig).environment);
}

/**
 * IWINV 기본 설정 검증
 */
export function isValidIWINVBaseConfig(config: unknown): config is IWINVBaseConfig {
  return isValidBaseConfig(config) &&
         'apiKey' in config && typeof (config as IWINVBaseConfig).apiKey === 'string' &&
         'baseUrl' in config && typeof (config as IWINVBaseConfig).baseUrl === 'string';
}

/**
 * AlimTalk 설정 검증
 */
export function isValidAlimTalkConfig(config: unknown): config is AlimTalkConfig {
  return isValidIWINVBaseConfig(config) &&
         'type' in config && (config as AlimTalkConfig).type === 'alimtalk';
}

/**
 * SMS 설정 검증
 */
export function isValidSMSConfig(config: unknown): config is SMSConfig {
  return isValidIWINVBaseConfig(config) &&
         'type' in config && (config as SMSConfig).type === 'sms';
}

/**
 * MMS 설정 검증
 */
export function isValidMMSConfig(config: unknown): config is MMSConfig {
  return isValidIWINVBaseConfig(config) &&
         'type' in config && (config as MMSConfig).type === 'mms';
}

/**
 * 통합 설정 검증
 */
export function isValidUnifiedConfig(config: unknown): config is UnifiedProviderConfig {
  return isValidBaseConfig(config) &&
         typeof config === 'object' && config !== null &&
         'provider' in config &&
         typeof (config as UnifiedProviderConfig).provider === 'object' &&
         (config as UnifiedProviderConfig).provider !== null &&
         'apiKey' in (config as UnifiedProviderConfig).provider &&
         'baseUrl' in (config as UnifiedProviderConfig).provider;
}

// =============================================================================
// 설정 빌더 클래스
// =============================================================================

/**
 * 타입 안전한 설정 빌더
 */
export class UnifiedConfigBuilder {
  private config: Partial<UnifiedProviderConfig> = {};

  static create(): UnifiedConfigBuilder {
    return new UnifiedConfigBuilder();
  }

  environment(env: Environment): this {
    this.config.environment = env;
    return this;
  }

  provider(apiKey: string, baseUrl: string): this {
    this.config.provider = { type: 'iwinv', apiKey, baseUrl };
    return this;
  }

  alimtalk(config: Omit<AlimTalkConfig, 'apiKey' | 'baseUrl' | 'type'>): this {
    if (!this.config.channels) this.config.channels = {};
    this.config.channels.alimtalk = config;
    return this;
  }

  sms(config: Omit<SMSConfig, 'apiKey' | 'baseUrl' | 'type'>): this {
    if (!this.config.channels) this.config.channels = {};
    this.config.channels.sms = config;
    return this;
  }

  mms(config: Omit<MMSConfig, 'apiKey' | 'baseUrl' | 'type'>): this {
    if (!this.config.channels) this.config.channels = {};
    this.config.channels.mms = config;
    return this;
  }

  performance(config: PerformanceConfig): this {
    this.config.performance = config;
    return this;
  }

  monitoring(config: MonitoringConfig): this {
    this.config.monitoring = config;
    return this;
  }

  multiChannel(defaultChannel: 'alimtalk' | 'sms' | 'mms', fallbackChain: ('alimtalk' | 'sms' | 'mms')[]): this {
    this.config.multiChannel = { defaultChannel, fallbackChain };
    return this;
  }

  build(): UnifiedProviderConfig {
    if (!isValidUnifiedConfig(this.config)) {
      throw new Error('Invalid configuration: missing required fields');
    }
    return this.config;
  }
}

// =============================================================================
// 설정 팩토리
// =============================================================================

export class UnifiedConfigFactory {
  /**
   * 개발 환경 기본 설정
   */
  static development(apiKey: string, baseUrl?: string): UnifiedProviderConfig {
    return UnifiedConfigBuilder.create()
      .environment('development')
      .provider(apiKey, baseUrl || 'https://alimtalk.bizservice.iwinv.kr')
      .performance({
        rateLimiting: { requestsPerSecond: 10, burstSize: 20, strategy: 'token_bucket' },
        circuitBreaker: { enabled: true, failureThreshold: 5, timeoutMs: 30000, retryDelayMs: 5000 },
        caching: { enabled: true, ttl: 300000, maxSize: 1000 }
      })
      .monitoring({
        enableMetrics: true,
        enableTracing: true,
        enableHealthChecks: true,
        metricsInterval: 60000
      })
      .build();
  }

  /**
   * 프로덕션 환경 기본 설정
   */
  static production(apiKey: string, baseUrl?: string): UnifiedProviderConfig {
    return UnifiedConfigBuilder.create()
      .environment('production')
      .provider(apiKey, baseUrl || 'https://alimtalk.bizservice.iwinv.kr')
      .performance({
        rateLimiting: { requestsPerSecond: 100, burstSize: 200, strategy: 'token_bucket' },
        circuitBreaker: { enabled: true, failureThreshold: 10, timeoutMs: 60000, retryDelayMs: 30000 },
        caching: { enabled: true, ttl: 600000, maxSize: 10000 },
        connectionPool: { maxConnections: 50, idleTimeout: 60000, connectionTimeout: 10000 }
      })
      .monitoring({
        enableMetrics: true,
        enableTracing: false,
        enableHealthChecks: true,
        metricsInterval: 30000
      })
      .build();
  }

  /**
   * 환경 변수에서 설정 생성
   */
  static fromEnvironment(): UnifiedProviderConfig {
    const apiKey = process.env.IWINV_API_KEY;
    const baseUrl = process.env.IWINV_BASE_URL;
    const environment = (process.env.NODE_ENV || 'development') as Environment;

    if (!apiKey) {
      throw new Error('IWINV_API_KEY environment variable is required');
    }

    const builder = UnifiedConfigBuilder.create()
      .environment(environment)
      .provider(apiKey, baseUrl || 'https://alimtalk.bizservice.iwinv.kr');

    // 환경별 기본 설정 적용
    if (environment === 'production') {
      return builder
        .performance({
          rateLimiting: { requestsPerSecond: 100, burstSize: 200, strategy: 'token_bucket' },
          circuitBreaker: { enabled: true, failureThreshold: 10, timeoutMs: 60000, retryDelayMs: 30000 },
          caching: { enabled: true, ttl: 600000, maxSize: 10000 }
        })
        .monitoring({ enableMetrics: true, enableTracing: false, enableHealthChecks: true })
        .build();
    } else {
      return builder
        .performance({
          rateLimiting: { requestsPerSecond: 10, burstSize: 20, strategy: 'token_bucket' },
          circuitBreaker: { enabled: true, failureThreshold: 5, timeoutMs: 30000, retryDelayMs: 5000 },
          caching: { enabled: true, ttl: 300000, maxSize: 1000 }
        })
        .monitoring({ enableMetrics: true, enableTracing: true, enableHealthChecks: true })
        .build();
    }
  }
}

// =============================================================================
// 레거시 호환성 유틸리티
// =============================================================================

/**
 * 통합 설정을 레거시 IWINVConfig로 변환
 */
export function toLegacyIWINVConfig(config: UnifiedProviderConfig): IWINVBaseConfig {
  return {
    apiKey: config.provider.apiKey,
    baseUrl: config.provider.baseUrl,
    environment: config.environment,
    debug: config.debug,
    logLevel: config.logLevel,
    timeout: config.timeout,
    userId: config.channels?.alimtalk?.userId || config.channels?.sms?.userId,
    senderNumber: config.channels?.alimtalk?.senderNumber || config.channels?.sms?.senderNumber
  };
}

/**
 * 레거시 IWINVConfig를 통합 설정으로 변환
 */
export function fromLegacyIWINVConfig(legacyConfig: IWINVBaseConfig): UnifiedProviderConfig {
  return UnifiedConfigBuilder.create()
    .environment(legacyConfig.environment)
    .provider(legacyConfig.apiKey, legacyConfig.baseUrl)
    .build();
}