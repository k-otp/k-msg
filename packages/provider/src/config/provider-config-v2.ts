/**
 * Enhanced Provider Configuration System
 * 개선된 프로바이더 설정 시스템
 */

// 기본 설정 인터페이스
export interface ProviderConfigBase {
  apiKey: string;
  baseUrl: string;
  timeout?: number;
  retries?: number;
  debug?: boolean;
}

// AlimTalk 전용 설정
export interface AlimTalkConfig extends ProviderConfigBase {
  type: "alimtalk";
  senderKey?: string;
  fallbackSettings?: {
    enableSMSFallback: boolean;
    smsConfig?: SMSConfig;
  };
  templateValidation?: {
    enableStrictMode: boolean;
    allowDynamicTemplates: boolean;
  };
}

// SMS 전용 설정
export interface SMSConfig extends ProviderConfigBase {
  type: "sms";
  senderNumber: string;
  defaultMsgType: "SMS" | "LMS" | "MMS";
  autoDetectMessageType?: boolean;
  lengthLimits?: {
    sms: number;
    lms: number;
  };
}

// MMS 전용 설정
export interface MMSConfig extends ProviderConfigBase {
  type: "mms";
  senderNumber: string;
  mediaSettings?: {
    maxFileSize: number;
    allowedTypes: string[];
    compressionQuality: number;
  };
}

// 연결 풀 설정
export interface ConnectionPoolConfig {
  maxConnections: number;
  idleTimeout: number;
  connectionTimeout: number;
  keepAlive: boolean;
}

// 캐시 설정
export interface CacheConfig {
  enabled: boolean;
  ttl: number;
  maxSize: number;
  strategy: "LRU" | "FIFO" | "TTL";
}

// 서킷 브레이커 설정
export interface CircuitBreakerConfig {
  enabled: boolean;
  failureThreshold: number;
  timeoutMs: number;
  retryDelayMs: number;
  maxRetries: number;
}

// 레이트 리미팅 설정
export interface RateLimitConfig {
  requestsPerSecond: number;
  burstSize: number;
  strategy: "token_bucket" | "sliding_window";
}

// 환경별 설정
export interface EnvironmentConfig {
  environment: "development" | "staging" | "production";
  rateLimits: RateLimitConfig;
  monitoring: {
    enableMetrics: boolean;
    enableTracing: boolean;
    enableHealthChecks: boolean;
    metricsInterval: number;
  };
  logging: {
    level: "debug" | "info" | "warn" | "error";
    structured: boolean;
    sensitiveDataMasking: boolean;
  };
}

// 통합 설정 인터페이스
export interface IWINVConfigV2 {
  environment: EnvironmentConfig;

  // 각 채널별 설정 (옵셔널)
  alimtalk?: AlimTalkConfig;
  sms?: SMSConfig;
  mms?: MMSConfig;

  // 공유 설정
  shared: {
    connectionPool: ConnectionPoolConfig;
    cache: CacheConfig;
    circuitBreaker: CircuitBreakerConfig;
  };

  // 보안 설정
  security?: {
    enableApiKeyValidation: boolean;
    enableRequestSigning: boolean;
    allowedDomains?: string[];
  };
}

// 설정 빌더 패턴
export class IWINVConfigBuilder {
  private config: Partial<IWINVConfigV2> = {};

  static create(): IWINVConfigBuilder {
    return new IWINVConfigBuilder();
  }

  environment(env: EnvironmentConfig): this {
    this.config.environment = env;
    return this;
  }

  alimtalk(config: AlimTalkConfig): this {
    this.config.alimtalk = config;
    return this;
  }

  sms(config: SMSConfig): this {
    this.config.sms = config;
    return this;
  }

  mms(config: MMSConfig): this {
    this.config.mms = config;
    return this;
  }

  shared(config: IWINVConfigV2["shared"]): this {
    this.config.shared = config;
    return this;
  }

  security(config: IWINVConfigV2["security"]): this {
    this.config.security = config;
    return this;
  }

  build(): IWINVConfigV2 {
    if (!this.config.environment) {
      throw new Error("Environment configuration is required");
    }

    if (!this.config.shared) {
      throw new Error("Shared configuration is required");
    }

    if (!this.config.alimtalk && !this.config.sms && !this.config.mms) {
      throw new Error(
        "At least one channel configuration (alimtalk, sms, or mms) is required",
      );
    }

    return this.config as IWINVConfigV2;
  }
}

// 기본 설정 팩토리
export class ConfigFactory {
  static development(): IWINVConfigV2 {
    return IWINVConfigBuilder.create()
      .environment({
        environment: "development",
        rateLimits: {
          requestsPerSecond: 10,
          burstSize: 20,
          strategy: "token_bucket",
        },
        monitoring: {
          enableMetrics: true,
          enableTracing: true,
          enableHealthChecks: true,
          metricsInterval: 5000,
        },
        logging: {
          level: "debug",
          structured: true,
          sensitiveDataMasking: true,
        },
      })
      .shared({
        connectionPool: {
          maxConnections: 10,
          idleTimeout: 30000,
          connectionTimeout: 5000,
          keepAlive: true,
        },
        cache: {
          enabled: true,
          ttl: 300000, // 5분
          maxSize: 1000,
          strategy: "LRU",
        },
        circuitBreaker: {
          enabled: true,
          failureThreshold: 5,
          timeoutMs: 30000,
          retryDelayMs: 10000,
          maxRetries: 3,
        },
      })
      .build();
  }

  static production(): IWINVConfigV2 {
    return IWINVConfigBuilder.create()
      .environment({
        environment: "production",
        rateLimits: {
          requestsPerSecond: 100,
          burstSize: 200,
          strategy: "sliding_window",
        },
        monitoring: {
          enableMetrics: true,
          enableTracing: false, // 성능상 비활성화
          enableHealthChecks: true,
          metricsInterval: 10000,
        },
        logging: {
          level: "info",
          structured: true,
          sensitiveDataMasking: true,
        },
      })
      .shared({
        connectionPool: {
          maxConnections: 50,
          idleTimeout: 60000,
          connectionTimeout: 10000,
          keepAlive: true,
        },
        cache: {
          enabled: true,
          ttl: 600000, // 10분
          maxSize: 10000,
          strategy: "LRU",
        },
        circuitBreaker: {
          enabled: true,
          failureThreshold: 10,
          timeoutMs: 60000,
          retryDelayMs: 30000,
          maxRetries: 5,
        },
      })
      .build();
  }

  static fromEnvironment(): IWINVConfigV2 {
    const env =
      (process.env.NODE_ENV as "development" | "staging" | "production") ||
      "development";

    const builder = IWINVConfigBuilder.create();

    // 환경 설정
    if (env === "production") {
      builder.environment(ConfigFactory.production().environment);
      builder.shared(ConfigFactory.production().shared);
    } else {
      builder.environment(ConfigFactory.development().environment);
      builder.shared(ConfigFactory.development().shared);
    }

    // AlimTalk 설정 (환경변수 기반)
    if (process.env.IWINV_API_KEY) {
      builder.alimtalk({
        type: "alimtalk",
        apiKey: process.env.IWINV_API_KEY,
        baseUrl:
          process.env.IWINV_BASE_URL || "https://alimtalk.bizservice.iwinv.kr",
        senderKey: process.env.IWINV_SENDER_KEY,
        timeout: parseInt(process.env.IWINV_TIMEOUT || "10000"),
        retries: parseInt(process.env.IWINV_RETRIES || "3"),
        debug: process.env.IWINV_DEBUG === "true",
        fallbackSettings: {
          enableSMSFallback: process.env.IWINV_ENABLE_SMS_FALLBACK === "true",
        },
      });
    }

    // SMS 설정 (환경변수 기반)
    if (process.env.IWINV_SMS_SENDER_NUMBER) {
      builder.sms({
        type: "sms",
        apiKey: process.env.IWINV_API_KEY || "",
        baseUrl:
          process.env.IWINV_SMS_BASE_URL ||
          process.env.IWINV_BASE_URL ||
          "https://alimtalk.bizservice.iwinv.kr",
        senderNumber: process.env.IWINV_SMS_SENDER_NUMBER,
        defaultMsgType:
          (process.env.IWINV_SMS_DEFAULT_TYPE as "SMS" | "LMS" | "MMS") ||
          "SMS",
        autoDetectMessageType: process.env.IWINV_SMS_AUTO_DETECT === "true",
        timeout: parseInt(process.env.IWINV_SMS_TIMEOUT || "10000"),
        retries: parseInt(process.env.IWINV_SMS_RETRIES || "3"),
      });
    }

    return builder.build();
  }
}

// 설정 검증 유틸리티
export class ConfigValidator {
  static validate(config: IWINVConfigV2): ConfigValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 필수 필드 검증
    if (!config.environment) {
      errors.push("Environment configuration is required");
    }

    if (!config.shared) {
      errors.push("Shared configuration is required");
    }

    // API 키 검증
    if (config.alimtalk && !config.alimtalk.apiKey) {
      errors.push("AlimTalk API key is required");
    }

    if (config.sms && !config.sms.apiKey) {
      errors.push("SMS API key is required");
    }

    // URL 검증
    [config.alimtalk, config.sms, config.mms].forEach(
      (channelConfig, index) => {
        if (
          channelConfig &&
          !ConfigValidator.isValidUrl(channelConfig.baseUrl)
        ) {
          errors.push(
            `Invalid base URL for ${["alimtalk", "sms", "mms"][index]}`,
          );
        }
      },
    );

    // 성능 설정 검증
    if (config.shared?.connectionPool?.maxConnections < 1) {
      errors.push("Connection pool max connections must be greater than 0");
    }

    // 권장사항 경고
    if (config.environment.environment === "production") {
      if (config.environment.logging.level === "debug") {
        warnings.push("Debug logging is not recommended for production");
      }

      if (config.shared.cache?.ttl < 60000) {
        warnings.push(
          "Cache TTL less than 1 minute may impact performance in production",
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
