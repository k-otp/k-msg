/**
 * Test Helpers and Utilities
 * 테스트 헬퍼 및 유틸리티 함수들
 */

import type { StandardRequest, StandardResult } from "@k-msg/core";
import type { IWINVConfig } from "./iwinv/types/iwinv";

// 테스트 설정 상수
export const TEST_CONFIGS = {
  development: {
    apiKey: "test-key-dev-12345",
    baseUrl: "https://alimtalk.bizservice.iwinv.kr",
    debug: true,
  } as IWINVConfig,

  production: {
    apiKey: "prod-key-simulation",
    baseUrl: "https://alimtalk.bizservice.iwinv.kr",
    debug: false,
  } as IWINVConfig,

  invalid: {
    apiKey: "",
    baseUrl: "",
    debug: false,
  } as IWINVConfig,
};

// 실제 사용 시나리오 기반 테스트 데이터 생성기
export const createTestRequests = () => ({
  // 일반적인 AlimTalk 메시지
  alimtalk: {
    welcome: {
      templateCode: "WELCOME_001",
      phoneNumber: "010-1234-5678",
      variables: {
        name: "홍길동",
        service: "테스트 서비스",
        date: new Date().toISOString().split("T")[0],
      },
    } as StandardRequest,

    otp: {
      templateCode: "OTP_AUTH_001",
      phoneNumber: "010-9876-5432",
      variables: {
        code: Math.floor(100000 + Math.random() * 900000).toString(),
        expiry: "3분",
      },
    } as StandardRequest,

    order: {
      templateCode: "ORDER_CONFIRM_001",
      phoneNumber: "010-5555-6666",
      variables: {
        orderNumber: "ORD-" + Date.now(),
        productName: "테스트 상품",
        amount: "29,900",
        deliveryDate: "2024-01-15",
      },
    } as StandardRequest,
  },

  // SMS/LMS 메시지
  sms: {
    short: {
      templateCode: "SMS_DIRECT",
      phoneNumber: "010-1111-2222",
      variables: {
        message:
          "[테스트] 인증번호는 " +
          Math.floor(100000 + Math.random() * 900000) +
          "입니다.",
      },
    } as StandardRequest,

    long: {
      templateCode: "LMS_DIRECT",
      phoneNumber: "010-3333-4444",
      variables: {
        subject: "중요 공지사항",
        message:
          "안녕하세요. 이것은 긴 메시지 테스트입니다. ".repeat(10) +
          "감사합니다.",
      },
    } as StandardRequest,
  },

  // 에러 시나리오
  invalid: {
    emptyPhone: {
      templateCode: "TEST_TEMPLATE",
      phoneNumber: "",
      variables: { test: "empty phone" },
    } as StandardRequest,

    invalidPhone: {
      templateCode: "TEST_TEMPLATE",
      phoneNumber: "invalid-phone",
      variables: { test: "invalid phone" },
    } as StandardRequest,

    emptyTemplate: {
      templateCode: "",
      phoneNumber: "010-1234-5678",
      variables: { test: "empty template" },
    } as StandardRequest,
  },
});

// 대량 테스트 데이터 생성기
export const createBulkTestData = (count: number = 100) => {
  return Array.from({ length: count }, (_, i) => ({
    templateCode: i % 3 === 0 ? "BULK_ALIMTALK" : "SMS_DIRECT",
    phoneNumber: `010-${String(Math.floor(1000 + Math.random() * 9000))}-${String(Math.floor(1000 + Math.random() * 9000))}`,
    variables: {
      index: i.toString(),
      name: `사용자${i + 1}`,
      message: `메시지 ${i + 1}번 - ${new Date().toISOString()}`,
    },
    channel: (["alimtalk", "sms", "auto"] as const)[i % 3],
  }));
};

// 성능 측정 헬퍼
export const createPerformanceTracker = () => {
  const metrics = {
    startTime: 0,
    endTime: 0,
    duration: 0,
    memoryUsage: { start: 0, end: 0, peak: 0 },
    requestCount: 0,
    successCount: 0,
    errorCount: 0,
  };

  return {
    start: () => {
      metrics.startTime = performance.now();
      metrics.memoryUsage.start = process.memoryUsage().heapUsed;
    },

    end: () => {
      metrics.endTime = performance.now();
      metrics.duration = metrics.endTime - metrics.startTime;
      metrics.memoryUsage.end = process.memoryUsage().heapUsed;
    },

    record: (success: boolean) => {
      metrics.requestCount++;
      if (success) {
        metrics.successCount++;
      } else {
        metrics.errorCount++;
      }

      const current = process.memoryUsage().heapUsed;
      if (current > metrics.memoryUsage.peak) {
        metrics.memoryUsage.peak = current;
      }
    },

    getMetrics: () => ({ ...metrics }),

    reset: () => {
      Object.assign(metrics, {
        startTime: 0,
        endTime: 0,
        duration: 0,
        memoryUsage: { start: 0, end: 0, peak: 0 },
        requestCount: 0,
        successCount: 0,
        errorCount: 0,
      });
    },
  };
};

// HTTP 응답 모킹 헬퍼
export const createMockHttpResponse = (
  options: {
    success?: boolean;
    delay?: number;
    statusCode?: number;
    data?: any;
  } = {},
) => {
  const {
    success = true,
    delay = 0,
    statusCode = success ? 200 : 400,
    data = {},
  } = options;

  const response = {
    status: statusCode,
    data: success
      ? {
          result: "success",
          messageId:
            "msg_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
          resultCode: "0000",
          resultMessage: "Success",
          ...data,
        }
      : {
          result: "fail",
          resultCode: "9999",
          resultMessage: "API Error",
          errorDetail: "Simulated error for testing",
          ...data,
        },
  };

  if (delay > 0) {
    return new Promise((resolve) => {
      setTimeout(() => resolve(response), delay);
    });
  }

  return Promise.resolve(response);
};

// 동시성 테스트 헬퍼
export const createConcurrencyTester = () => {
  return {
    // 지정된 개수의 동시 요청 실행
    runConcurrent: async <T>(
      operations: (() => Promise<T>)[],
      maxConcurrency: number = 10,
    ): Promise<
      Array<{ result: T | null; error: Error | null; duration: number }>
    > => {
      const results: Array<{
        result: T | null;
        error: Error | null;
        duration: number;
      }> = [];

      for (let i = 0; i < operations.length; i += maxConcurrency) {
        const batch = operations.slice(i, i + maxConcurrency);

        const batchResults = await Promise.allSettled(
          batch.map(async (op) => {
            const start = performance.now();
            try {
              const result = await op();
              return {
                result,
                error: null,
                duration: performance.now() - start,
              };
            } catch (error) {
              return {
                result: null,
                error: error as Error,
                duration: performance.now() - start,
              };
            }
          }),
        );

        batchResults.forEach((settledResult) => {
          if (settledResult.status === "fulfilled") {
            results.push(settledResult.value);
          } else {
            results.push({
              result: null,
              error: settledResult.reason,
              duration: 0,
            });
          }
        });
      }

      return results;
    },

    // 레이트 리미팅 테스트
    testRateLimit: async <T>(
      operation: () => Promise<T>,
      requestsPerSecond: number,
      duration: number,
    ): Promise<{
      attempted: number;
      successful: number;
      failed: number;
      actualRate: number;
    }> => {
      const startTime = Date.now();
      const endTime = startTime + duration * 1000;
      const interval = 1000 / requestsPerSecond;

      let attempted = 0;
      let successful = 0;
      let failed = 0;

      while (Date.now() < endTime) {
        const requestStart = Date.now();
        attempted++;

        try {
          await operation();
          successful++;
        } catch {
          failed++;
        }

        const elapsed = Date.now() - requestStart;
        const waitTime = Math.max(0, interval - elapsed);

        if (waitTime > 0) {
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }

      const actualDuration = (Date.now() - startTime) / 1000;
      const actualRate = attempted / actualDuration;

      return { attempted, successful, failed, actualRate };
    },
  };
};

// 테스트 데이터 검증 헬퍼
export const createValidationHelpers = () => ({
  // 전화번호 형식 검증
  isValidPhoneNumber: (phone: string): boolean => {
    const patterns = [
      /^010-\d{4}-\d{4}$/, // 010-1234-5678
      /^01[016789]-\d{3,4}-\d{4}$/, // 기타 휴대폰
      /^0\d{1,2}-\d{3,4}-\d{4}$/, // 지역번호
      /^1\d{3}-\d{4}$/, // 대표번호
      /^\+82-10-\d{4}-\d{4}$/, // 국제 형식
    ];

    return patterns.some((pattern) => pattern.test(phone));
  },

  // 템플릿 코드 검증
  isValidTemplateCode: (code: string): boolean => {
    return code.length > 0 && /^[A-Z0-9_]+$/.test(code);
  },

  // 변수 검증 (민감 정보 포함 여부)
  containsSensitiveData: (variables: Record<string, string>): boolean => {
    const sensitivePatterns = [
      /\d{6}-\d{7}/, // 주민번호
      /\d{4}-\d{4}-\d{4}-\d{4}/, // 카드번호
      /password|pwd|pass/i, // 비밀번호
      /token|key|secret/i, // 토큰/키
    ];

    return Object.values(variables).some((value) =>
      sensitivePatterns.some((pattern) => pattern.test(value)),
    );
  },

  // 메시지 길이 분류
  getMessageType: (message: string): "sms" | "lms" | "mms" => {
    if (message.length <= 90) return "sms";
    if (message.length <= 2000) return "lms";
    return "mms";
  },
});

// 테스트 상태 추적 헬퍼
export const createTestStateTracker = () => {
  const state = {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    skippedTests: 0,
    duration: 0,
    errors: [] as Array<{ test: string; error: string }>,
  };

  return {
    recordTest: (
      name: string,
      passed: boolean,
      duration: number,
      error?: string,
    ) => {
      state.totalTests++;
      state.duration += duration;

      if (passed) {
        state.passedTests++;
      } else {
        state.failedTests++;
        if (error) {
          state.errors.push({ test: name, error });
        }
      }
    },

    skip: (name: string) => {
      state.totalTests++;
      state.skippedTests++;
    },

    getStats: () => ({ ...state }),

    getSummary: () => ({
      ...state,
      successRate:
        state.totalTests > 0 ? (state.passedTests / state.totalTests) * 100 : 0,
      averageDuration:
        state.totalTests > 0 ? state.duration / state.totalTests : 0,
    }),

    reset: () => {
      Object.assign(state, {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0,
        duration: 0,
        errors: [],
      });
    },
  };
};
