import type { WebhookConfig } from "../types/webhook.types";

export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  jitter: boolean;
}

export interface RetryAttempt {
  attemptNumber: number;
  timestamp: Date;
  success: boolean;
  error?: string;
  nextRetryAt?: Date;
}

/**
 * Webhook 재시도 관리자
 * 지수 백오프와 지터를 사용한 스마트 재시도 로직
 */
export class RetryManager {
  private config: RetryConfig;

  constructor(webhookConfig: WebhookConfig) {
    this.config = {
      maxRetries: webhookConfig.maxRetries,
      baseDelayMs: webhookConfig.retryDelayMs,
      maxDelayMs: webhookConfig.maxDelayMs || 300000, // 5분
      backoffMultiplier: webhookConfig.backoffMultiplier || 2,
      jitter: webhookConfig.jitter !== false, // 기본값 true
    };
  }

  /**
   * 다음 재시도 시간 계산
   */
  calculateNextRetry(attemptNumber: number): Date {
    if (attemptNumber >= this.config.maxRetries) {
      throw new Error(
        `Maximum retry attempts (${this.config.maxRetries}) exceeded`,
      );
    }

    // 지수 백오프 계산
    let delay =
      this.config.baseDelayMs * this.config.backoffMultiplier ** attemptNumber;

    // 최대 지연 시간 제한
    delay = Math.min(delay, this.config.maxDelayMs);

    // 지터 추가 (랜덤성으로 thundering herd 방지)
    if (this.config.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }

    return new Date(Date.now() + delay);
  }

  /**
   * 재시도 가능 여부 확인
   */
  shouldRetry(attemptNumber: number, error?: Error): boolean {
    // 최대 재시도 횟수 확인
    if (attemptNumber >= this.config.maxRetries) {
      return false;
    }

    // 에러 타입별 재시도 정책
    if (error) {
      return this.isRetryableError(error);
    }

    return true;
  }

  /**
   * 재시도 가능한 에러인지 판단
   */
  private isRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase();

    // 네트워크 관련 에러들은 재시도 가능
    const retryableErrors = [
      "timeout",
      "network",
      "connection",
      "econnreset",
      "enotfound",
      "econnrefused",
      "socket hang up",
    ];

    return retryableErrors.some((keyword) => message.includes(keyword));
  }

  /**
   * HTTP 상태 코드별 재시도 정책
   */
  shouldRetryStatus(statusCode: number): boolean {
    // 4xx 에러는 일반적으로 재시도하지 않음 (클라이언트 에러)
    if (statusCode >= 400 && statusCode < 500) {
      // 단, 일부 4xx는 재시도 가능
      const retryable4xx = [408, 429]; // Request Timeout, Too Many Requests
      return retryable4xx.includes(statusCode);
    }

    // 5xx 에러는 재시도 가능 (서버 에러)
    if (statusCode >= 500) {
      return true;
    }

    // 2xx, 3xx는 성공으로 간주하여 재시도 불필요
    return false;
  }

  /**
   * 재시도 통계 계산
   */
  calculateRetryStats(attempts: RetryAttempt[]): {
    totalAttempts: number;
    successfulAttempts: number;
    failedAttempts: number;
    averageDelayMs: number;
    totalTimeMs: number;
  } {
    if (attempts.length === 0) {
      return {
        totalAttempts: 0,
        successfulAttempts: 0,
        failedAttempts: 0,
        averageDelayMs: 0,
        totalTimeMs: 0,
      };
    }

    const successful = attempts.filter((a) => a.success).length;
    const failed = attempts.length - successful;

    // 시도 간 평균 지연 시간 계산
    let totalDelay = 0;
    for (let i = 1; i < attempts.length; i++) {
      totalDelay +=
        attempts[i].timestamp.getTime() - attempts[i - 1].timestamp.getTime();
    }
    const averageDelay =
      attempts.length > 1 ? totalDelay / (attempts.length - 1) : 0;

    // 전체 소요 시간
    const totalTime =
      attempts.length > 0
        ? attempts[attempts.length - 1].timestamp.getTime() -
          attempts[0].timestamp.getTime()
        : 0;

    return {
      totalAttempts: attempts.length,
      successfulAttempts: successful,
      failedAttempts: failed,
      averageDelayMs: averageDelay,
      totalTimeMs: totalTime,
    };
  }

  /**
   * 재시도 설정 업데이트
   */
  updateConfig(config: Partial<RetryConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 현재 재시도 설정 반환
   */
  getConfig(): RetryConfig {
    return { ...this.config };
  }

  /**
   * 백오프 지연 시간 계산 (테스트용)
   */
  getBackoffDelay(attemptNumber: number): number {
    const delay =
      this.config.baseDelayMs * this.config.backoffMultiplier ** attemptNumber;
    return Math.min(delay, this.config.maxDelayMs);
  }
}
