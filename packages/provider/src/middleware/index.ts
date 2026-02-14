import type { MiddlewareContext, ProviderMiddleware } from "../interfaces";

export function createRetryMiddleware(options: {
  maxRetries: number;
  retryDelay: number;
  retryableErrors?: string[];
  retryableStatusCodes?: number[];
}): ProviderMiddleware {
  return {
    name: "retry",
    error: async (error: any, context: MiddlewareContext) => {
      const retries = context.metadata.retries || 0;

      if (retries >= options.maxRetries) {
        throw error;
      }

      // 재시도 가능한 에러인지 확인
      const isRetryable =
        options.retryableErrors?.includes(error.code) ||
        options.retryableStatusCodes?.includes(error.status) ||
        error.code === "ETIMEDOUT" ||
        error.code === "ECONNRESET";

      if (!isRetryable) {
        throw error;
      }

      // 지연 후 재시도
      await new Promise((resolve) =>
        setTimeout(resolve, options.retryDelay * (retries + 1)),
      );

      context.metadata.retries = retries + 1;
      // 실제 재시도 로직은 호출하는 쪽에서 처리
      throw { ...error, shouldRetry: true };
    },
  };
}

export function createRateLimitMiddleware(options: {
  messagesPerSecond?: number;
  messagesPerMinute?: number;
  messagesPerHour?: number;
  messagesPerDay?: number;
  strategy?: "sliding-window" | "fixed-window";
}): ProviderMiddleware {
  const windows = new Map<string, number[]>();

  return {
    name: "rate-limit",
    pre: async (context: MiddlewareContext) => {
      const now = Date.now();
      const key = "global"; // 프로바이더별로 구분 가능

      if (!windows.has(key)) {
        windows.set(key, []);
      }

      const timestamps = windows.get(key)!;

      // 초당 제한 확인
      if (options.messagesPerSecond) {
        const recentCount = timestamps.filter((t) => now - t < 1000).length;
        if (recentCount >= options.messagesPerSecond) {
          throw new Error("Rate limit exceeded: messages per second");
        }
      }

      // 분당 제한 확인
      if (options.messagesPerMinute) {
        const recentCount = timestamps.filter((t) => now - t < 60000).length;
        if (recentCount >= options.messagesPerMinute) {
          throw new Error("Rate limit exceeded: messages per minute");
        }
      }

      // 타임스탬프 추가
      timestamps.push(now);

      // 오래된 타임스탬프 정리 (1시간 이상)
      const cutoff = now - 3600000;
      const filtered = timestamps.filter((t) => t > cutoff);
      windows.set(key, filtered);
    },
  };
}

export function createLoggingMiddleware(options: {
  logger: any;
  logLevel?: string;
}): ProviderMiddleware {
  return {
    name: "logging",
    pre: async (context: MiddlewareContext) => {
      if (options.logLevel === "debug") {
        options.logger.debug("Request started", {
          metadata: context.metadata,
          timestamp: context.startTime,
        });
      }
    },
    post: async (context: MiddlewareContext) => {
      const duration = Date.now() - context.startTime;
      options.logger.info("Request completed", {
        duration,
        success: true,
      });
    },
    error: async (error: Error, context: MiddlewareContext) => {
      const duration = Date.now() - context.startTime;
      options.logger.error("Request failed", {
        error: error.message,
        duration,
        stack: error.stack,
      });
    },
  };
}

export function createMetricsMiddleware(options: {
  collector: any;
  labels?: Record<string, string>;
}): ProviderMiddleware {
  return {
    name: "metrics",
    pre: async (context: MiddlewareContext) => {
      options.collector.increment("requests_total", options.labels);
    },
    post: async (context: MiddlewareContext) => {
      const duration = Date.now() - context.startTime;
      options.collector.histogram(
        "request_duration_ms",
        duration,
        options.labels,
      );
      options.collector.increment("requests_success_total", options.labels);
    },
    error: async (error: Error, context: MiddlewareContext) => {
      const duration = Date.now() - context.startTime;
      options.collector.histogram(
        "request_duration_ms",
        duration,
        options.labels,
      );
      options.collector.increment("requests_error_total", {
        ...options.labels,
        error_type: error.constructor.name,
      });
    },
  };
}

export function createCircuitBreakerMiddleware(options: {
  threshold: number;
  timeout: number;
  resetTimeout: number;
}): ProviderMiddleware {
  let state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";
  let failures = 0;
  let nextAttempt = 0;

  return {
    name: "circuit-breaker",
    pre: async (context: MiddlewareContext) => {
      const now = Date.now();

      if (state === "OPEN") {
        if (now < nextAttempt) {
          throw new Error("Circuit breaker is OPEN");
        }
        state = "HALF_OPEN";
      }
    },
    post: async (context: MiddlewareContext) => {
      if (state === "HALF_OPEN") {
        state = "CLOSED";
        failures = 0;
      }
    },
    error: async (error: Error, context: MiddlewareContext) => {
      failures++;

      if (failures >= options.threshold) {
        state = "OPEN";
        nextAttempt = Date.now() + options.resetTimeout;
      }

      throw error;
    },
  };
}
