/**
 * Unified Error System
 * 통합 에러 처리 시스템
 */

import { StandardError, StandardErrorCode } from '@k-msg/core';

// =============================================================================
// 에러 분류 체계
// =============================================================================

/**
 * 에러 카테고리
 */
export enum ErrorCategory {
  // 시스템 레벨 에러
  SYSTEM = 'SYSTEM',
  NETWORK = 'NETWORK',
  CONFIGURATION = 'CONFIGURATION',

  // 비즈니스 레벨 에러
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  BUSINESS_LOGIC = 'BUSINESS_LOGIC',

  // 외부 서비스 에러
  PROVIDER = 'PROVIDER',
  TEMPLATE = 'TEMPLATE',
  RATE_LIMIT = 'RATE_LIMIT',

  // 알 수 없는 에러
  UNKNOWN = 'UNKNOWN'
}

/**
 * 에러 심각도
 */
export enum ErrorSeverity {
  LOW = 'LOW',        // 로깅만, 재시도 불필요
  MEDIUM = 'MEDIUM',  // 경고, 재시도 가능
  HIGH = 'HIGH',      // 에러, 재시도 필요
  CRITICAL = 'CRITICAL' // 치명적, 즉시 조치 필요
}

// =============================================================================
// 통합 에러 인터페이스
// =============================================================================

/**
 * 기본 에러 정보
 */
export interface BaseErrorInfo {
  code: string;
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  retryable: boolean;
  timestamp: Date;
  context?: Record<string, unknown>;
}

/**
 * Provider 특화 에러 정보
 */
export interface ProviderErrorInfo extends BaseErrorInfo {
  provider: string;
  originalCode?: string | number;
  originalMessage?: string;
  endpoint?: string;
  requestId?: string;
}

/**
 * 템플릿 관련 에러 정보
 */
export interface TemplateErrorInfo extends BaseErrorInfo {
  templateCode?: string;
  templateName?: string;
  validationErrors?: string[];
  missingVariables?: string[];
}

/**
 * 네트워크 관련 에러 정보
 */
export interface NetworkErrorInfo extends BaseErrorInfo {
  url?: string;
  method?: string;
  statusCode?: number;
  timeout?: boolean;
  connectionRefused?: boolean;
}

/**
 * 통합 에러 타입
 */
export type UnifiedErrorInfo =
  | ProviderErrorInfo
  | TemplateErrorInfo
  | NetworkErrorInfo
  | BaseErrorInfo;

// =============================================================================
// 에러 클래스 계층
// =============================================================================

/**
 * 기본 통합 에러 클래스
 */
export class UnifiedError extends Error {
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly retryable: boolean;
  public readonly timestamp: Date;
  public readonly context: Record<string, unknown>;

  constructor(info: BaseErrorInfo) {
    super(info.message);
    this.name = this.constructor.name;
    this.category = info.category;
    this.severity = info.severity;
    this.retryable = info.retryable;
    this.timestamp = info.timestamp;
    this.context = info.context || {};
  }

  /**
   * StandardError 형식으로 변환
   */
  toStandardError(): StandardError {
    return {
      code: this.mapToStandardErrorCode(),
      message: this.message,
      retryable: this.retryable,
      details: {
        category: this.category,
        severity: this.severity,
        timestamp: this.timestamp,
        context: this.context
      }
    };
  }

  /**
   * 에러 카테고리를 StandardErrorCode로 매핑
   */
  private mapToStandardErrorCode(): StandardErrorCode {
    switch (this.category) {
      case ErrorCategory.AUTHENTICATION:
        return StandardErrorCode.AUTHENTICATION_FAILED;
      case ErrorCategory.VALIDATION:
        return StandardErrorCode.INVALID_REQUEST;
      case ErrorCategory.TEMPLATE:
        return StandardErrorCode.TEMPLATE_NOT_FOUND;
      case ErrorCategory.RATE_LIMIT:
        return StandardErrorCode.RATE_LIMIT_EXCEEDED;
      case ErrorCategory.NETWORK:
        return StandardErrorCode.NETWORK_ERROR;
      case ErrorCategory.PROVIDER:
        return StandardErrorCode.PROVIDER_ERROR;
      default:
        return StandardErrorCode.UNKNOWN_ERROR;
    }
  }
}

/**
 * Provider 에러 클래스
 */
export class ProviderError extends UnifiedError {
  public readonly provider: string;
  public readonly originalCode?: string | number;
  public readonly originalMessage?: string;
  public readonly endpoint?: string;
  public readonly requestId?: string;

  constructor(info: ProviderErrorInfo) {
    super(info);
    this.provider = info.provider;
    this.originalCode = info.originalCode;
    this.originalMessage = info.originalMessage;
    this.endpoint = info.endpoint;
    this.requestId = info.requestId;
  }
}

/**
 * 템플릿 에러 클래스
 */
export class TemplateError extends UnifiedError {
  public readonly templateCode?: string;
  public readonly templateName?: string;
  public readonly validationErrors?: string[];
  public readonly missingVariables?: string[];

  constructor(info: TemplateErrorInfo) {
    super(info);
    this.templateCode = info.templateCode;
    this.templateName = info.templateName;
    this.validationErrors = info.validationErrors;
    this.missingVariables = info.missingVariables;
  }
}

/**
 * 네트워크 에러 클래스
 */
export class NetworkError extends UnifiedError {
  public readonly url?: string;
  public readonly method?: string;
  public readonly statusCode?: number;
  public readonly timeout?: boolean;
  public readonly connectionRefused?: boolean;

  constructor(info: NetworkErrorInfo) {
    super(info);
    this.url = info.url;
    this.method = info.method;
    this.statusCode = info.statusCode;
    this.timeout = info.timeout;
    this.connectionRefused = info.connectionRefused;
  }
}

// =============================================================================
// 에러 팩토리
// =============================================================================

export class ErrorFactory {
  /**
   * Provider 에러 생성
   */
  static createProviderError(params: {
    provider: string;
    message: string;
    originalCode?: string | number;
    originalMessage?: string;
    endpoint?: string;
    retryable?: boolean;
    context?: Record<string, unknown>;
  }): ProviderError {
    return new ProviderError({
      code: `PROVIDER_${params.provider.toUpperCase()}_ERROR`,
      message: params.message,
      category: ErrorCategory.PROVIDER,
      severity: ErrorSeverity.HIGH,
      retryable: params.retryable ?? true,
      timestamp: new Date(),
      context: params.context,
      provider: params.provider,
      originalCode: params.originalCode,
      originalMessage: params.originalMessage,
      endpoint: params.endpoint
    });
  }

  /**
   * 템플릿 에러 생성
   */
  static createTemplateError(params: {
    templateCode?: string;
    message: string;
    validationErrors?: string[];
    missingVariables?: string[];
    retryable?: boolean;
  }): TemplateError {
    return new TemplateError({
      code: 'TEMPLATE_ERROR',
      message: params.message,
      category: ErrorCategory.TEMPLATE,
      severity: ErrorSeverity.MEDIUM,
      retryable: params.retryable ?? false,
      timestamp: new Date(),
      templateCode: params.templateCode,
      validationErrors: params.validationErrors,
      missingVariables: params.missingVariables
    });
  }

  /**
   * 네트워크 에러 생성
   */
  static createNetworkError(params: {
    url?: string;
    method?: string;
    statusCode?: number;
    message: string;
    timeout?: boolean;
    connectionRefused?: boolean;
  }): NetworkError {
    const isRetryable = params.statusCode ?
      params.statusCode >= 500 || params.statusCode === 429 :
      true;

    return new NetworkError({
      code: 'NETWORK_ERROR',
      message: params.message,
      category: ErrorCategory.NETWORK,
      severity: params.statusCode && params.statusCode >= 500 ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM,
      retryable: isRetryable,
      timestamp: new Date(),
      url: params.url,
      method: params.method,
      statusCode: params.statusCode,
      timeout: params.timeout,
      connectionRefused: params.connectionRefused
    });
  }

  /**
   * 인증 에러 생성
   */
  static createAuthenticationError(message: string = 'Authentication failed'): UnifiedError {
    return new UnifiedError({
      code: 'AUTHENTICATION_FAILED',
      message,
      category: ErrorCategory.AUTHENTICATION,
      severity: ErrorSeverity.HIGH,
      retryable: false,
      timestamp: new Date()
    });
  }

  /**
   * 검증 에러 생성
   */
  static createValidationError(message: string, context?: Record<string, unknown>): UnifiedError {
    return new UnifiedError({
      code: 'VALIDATION_ERROR',
      message,
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.MEDIUM,
      retryable: false,
      timestamp: new Date(),
      context
    });
  }

  /**
   * 요율 제한 에러 생성
   */
  static createRateLimitError(message: string = 'Rate limit exceeded', retryAfter?: number): UnifiedError {
    return new UnifiedError({
      code: 'RATE_LIMIT_EXCEEDED',
      message,
      category: ErrorCategory.RATE_LIMIT,
      severity: ErrorSeverity.MEDIUM,
      retryable: true,
      timestamp: new Date(),
      context: retryAfter ? { retryAfter } : undefined
    });
  }
}

// =============================================================================
// 에러 변환 유틸리티
// =============================================================================

export class ErrorConverter {
  /**
   * 임의의 에러를 UnifiedError로 변환
   */
  static toUnifiedError(error: unknown, context?: Record<string, unknown>): UnifiedError {
    if (error instanceof UnifiedError) {
      return error;
    }

    if (error instanceof Error) {
      return new UnifiedError({
        code: 'GENERIC_ERROR',
        message: error.message,
        category: ErrorCategory.UNKNOWN,
        severity: ErrorSeverity.MEDIUM,
        retryable: false,
        timestamp: new Date(),
        context: { ...context, originalName: error.name, originalStack: error.stack }
      });
    }

    if (typeof error === 'string') {
      return new UnifiedError({
        code: 'STRING_ERROR',
        message: error,
        category: ErrorCategory.UNKNOWN,
        severity: ErrorSeverity.LOW,
        retryable: false,
        timestamp: new Date(),
        context
      });
    }

    return new UnifiedError({
      code: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred',
      category: ErrorCategory.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      retryable: false,
      timestamp: new Date(),
      context: { ...context, originalError: error }
    });
  }

  /**
   * IWINV 에러를 ProviderError로 변환
   */
  static fromIWINVError(error: {
    code: number;
    message: string;
    status?: number;
    data?: unknown;
  }): ProviderError {
    const retryable = error.code >= 500 || error.code === 429;
    const severity = error.code >= 500 ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM;

    return new ProviderError({
      code: `IWINV_${error.code}`,
      message: error.message,
      category: ErrorCategory.PROVIDER,
      severity,
      retryable,
      timestamp: new Date(),
      provider: 'iwinv',
      originalCode: error.code,
      originalMessage: error.message,
      context: error.data ? { data: error.data } : undefined
    });
  }

  /**
   * HTTP 에러를 NetworkError로 변환
   */
  static fromHttpError(params: {
    url: string;
    method: string;
    statusCode: number;
    statusText?: string;
    responseBody?: unknown;
  }): NetworkError {
    const { url, method, statusCode, statusText, responseBody } = params;
    const retryable = statusCode >= 500 || statusCode === 429;

    return new NetworkError({
      code: `HTTP_${statusCode}`,
      message: `HTTP ${statusCode}: ${statusText || 'Unknown error'}`,
      category: ErrorCategory.NETWORK,
      severity: statusCode >= 500 ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM,
      retryable,
      timestamp: new Date(),
      url,
      method,
      statusCode,
      context: responseBody ? { responseBody } : undefined
    });
  }
}

// =============================================================================
// 에러 타입 가드
// =============================================================================

export function isUnifiedError(error: unknown): error is UnifiedError {
  return error instanceof UnifiedError;
}

export function isProviderError(error: unknown): error is ProviderError {
  return error instanceof ProviderError;
}

export function isTemplateError(error: unknown): error is TemplateError {
  return error instanceof TemplateError;
}

export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}

export function isRetryableError(error: unknown): boolean {
  if (isUnifiedError(error)) {
    return error.retryable;
  }
  // 기본적으로 네트워크 에러는 재시도 가능
  return error instanceof Error &&
         (error.message.includes('network') ||
          error.message.includes('timeout') ||
          error.message.includes('ECONNREFUSED'));
}

// =============================================================================
// 에러 집계 및 분석
// =============================================================================

export interface ErrorStats {
  total: number;
  byCategory: Record<ErrorCategory, number>;
  bySeverity: Record<ErrorSeverity, number>;
  retryable: number;
  nonRetryable: number;
}

export class ErrorAnalyzer {
  /**
   * 에러 목록 통계 분석
   */
  static analyze(errors: UnifiedError[]): ErrorStats {
    const stats: ErrorStats = {
      total: errors.length,
      byCategory: {} as Record<ErrorCategory, number>,
      bySeverity: {} as Record<ErrorSeverity, number>,
      retryable: 0,
      nonRetryable: 0
    };

    // 초기화
    Object.values(ErrorCategory).forEach(category => {
      stats.byCategory[category] = 0;
    });
    Object.values(ErrorSeverity).forEach(severity => {
      stats.bySeverity[severity] = 0;
    });

    // 집계
    errors.forEach(error => {
      stats.byCategory[error.category]++;
      stats.bySeverity[error.severity]++;
      if (error.retryable) {
        stats.retryable++;
      } else {
        stats.nonRetryable++;
      }
    });

    return stats;
  }

  /**
   * 중요 에러 필터링
   */
  static getCriticalErrors(errors: UnifiedError[]): UnifiedError[] {
    return errors.filter(error =>
      error.severity === ErrorSeverity.CRITICAL ||
      error.severity === ErrorSeverity.HIGH
    );
  }

  /**
   * 재시도 가능한 에러 필터링
   */
  static getRetryableErrors(errors: UnifiedError[]): UnifiedError[] {
    return errors.filter(error => error.retryable);
  }
}