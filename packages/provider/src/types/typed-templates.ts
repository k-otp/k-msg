/**
 * Typed Template System
 * 템플릿별 강타입 시스템
 */

import type { StandardRequest, StandardResult } from "@k-msg/core";

// 지원되는 채널 타입
export type MessageChannel = "alimtalk" | "sms" | "mms";

// 기본 변수 타입들
export interface VariableType {
  string: string;
  number: number;
  boolean: boolean;
  date: string; // ISO 날짜 문자열
  phoneNumber: string;
  url: string;
  email: string;
}

// 변수 정의 인터페이스
export interface VariableDefinition<
  T extends keyof VariableType = keyof VariableType,
> {
  type: T;
  required: boolean;
  description?: string;
  validation?: {
    pattern?: RegExp;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  };
  defaultValue?: VariableType[T];
}

// 템플릿 스키마 정의
export interface TemplateSchema<
  V extends Record<string, VariableDefinition> = Record<
    string,
    VariableDefinition
  >,
> {
  templateCode: string;
  name: string;
  description?: string;
  channels: MessageChannel[];
  variables: V;
  metadata?: {
    category?: string;
    version?: string;
    author?: string;
    createdAt?: string;
    updatedAt?: string;
  };
}

// 실제 사용되는 템플릿 레지스트리
export interface TemplateRegistry {
  // AlimTalk 템플릿들
  WELCOME_001: TemplateSchema<{
    name: VariableDefinition<"string">;
    service: VariableDefinition<"string">;
    date: VariableDefinition<"date">;
  }>;

  OTP_AUTH_001: TemplateSchema<{
    code: VariableDefinition<"string">;
    expiry: VariableDefinition<"string">;
    serviceName: VariableDefinition<"string">;
  }>;

  ORDER_CONFIRM_001: TemplateSchema<{
    orderNumber: VariableDefinition<"string">;
    productName: VariableDefinition<"string">;
    amount: VariableDefinition<"string">;
    deliveryDate: VariableDefinition<"date">;
    customerName: VariableDefinition<"string">;
  }>;

  PAYMENT_COMPLETE_001: TemplateSchema<{
    amount: VariableDefinition<"string">;
    paymentMethod: VariableDefinition<"string">;
    transactionId: VariableDefinition<"string">;
    customerName: VariableDefinition<"string">;
  }>;

  // SMS 직접 발송
  SMS_DIRECT: TemplateSchema<{
    message: VariableDefinition<"string">;
  }>;

  LMS_DIRECT: TemplateSchema<{
    subject: VariableDefinition<"string">;
    message: VariableDefinition<"string">;
  }>;

  // 다중 채널 지원 템플릿
  EMERGENCY_NOTIFICATION: TemplateSchema<{
    alertType: VariableDefinition<"string">;
    message: VariableDefinition<"string">;
    contactInfo: VariableDefinition<"string">;
    urgencyLevel: VariableDefinition<"string">;
  }>;
}

// 템플릿 코드 타입
export type TemplateCode = keyof TemplateRegistry;

// 특정 템플릿의 변수 타입 추출
export type ExtractVariables<T extends TemplateCode> = {
  [K in keyof TemplateRegistry[T]["variables"]]: TemplateRegistry[T]["variables"][K] extends VariableDefinition<
    infer VT
  >
    ? VariableType[VT]
    : never;
};

// 필수 변수만 추출
export type ExtractRequiredVariables<T extends TemplateCode> = {
  [K in keyof TemplateRegistry[T]["variables"] as TemplateRegistry[T]["variables"][K] extends {
    required: true;
  }
    ? K
    : never]: TemplateRegistry[T]["variables"][K] extends VariableDefinition<
    infer VT
  >
    ? VariableType[VT]
    : never;
};

// 선택적 변수만 추출
export type ExtractOptionalVariables<T extends TemplateCode> = {
  [K in keyof TemplateRegistry[T]["variables"] as TemplateRegistry[T]["variables"][K] extends {
    required: false;
  }
    ? K
    : never]?: TemplateRegistry[T]["variables"][K] extends VariableDefinition<
    infer VT
  >
    ? VariableType[VT]
    : never;
};

// 완전한 변수 타입 (필수 + 선택적)
export type TemplateVariables<T extends TemplateCode> =
  ExtractRequiredVariables<T> & ExtractOptionalVariables<T>;

// 특정 템플릿이 지원하는 채널 추출
export type ExtractChannels<T extends TemplateCode> =
  TemplateRegistry[T]["channels"][number];

// 타입 안전한 요청 인터페이스
export interface TypedRequest<T extends TemplateCode> {
  templateCode: T;
  phoneNumber: string;
  variables: TemplateVariables<T>;
  options?: {
    senderNumber?: string;
    scheduledAt?: Date;
    priority?: "high" | "normal" | "low";
    channel?: ExtractChannels<T>;
    subject?: string; // LMS용
  };
}

// 타입 안전한 결과 인터페이스
export interface TypedResult<T extends TemplateCode> {
  messageId: string;
  templateCode: T;
  phoneNumber: string;
  channel: ExtractChannels<T>;
  status: "sent" | "pending" | "failed";
  timestamp: Date;
  variables: TemplateVariables<T>;
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
}

// =============================================================================
// Provider 시스템과의 타입 브리지
// =============================================================================

/**
 * TypedRequest를 StandardRequest로 변환하는 유틸리티 타입
 */
export type ToStandardRequest<T extends TemplateCode> = StandardRequest & {
  templateCode: T;
  variables: Record<string, string>;
};

/**
 * StandardResult를 TypedResult로 변환하는 유틸리티 타입
 */
export type ToTypedResult<T extends TemplateCode> = Omit<
  TypedResult<T>,
  "templateCode" | "channel"
> & {
  templateCode: T;
  channel: ExtractChannels<T>;
};

/**
 * 타입 안전한 템플릿 변환 함수들
 */
export class TemplateTypeConverter {
  /**
   * TypedRequest를 StandardRequest로 변환
   */
  static toStandardRequest<T extends TemplateCode>(
    typedRequest: TypedRequest<T>,
  ): StandardRequest {
    // 변수를 string으로 변환 (StandardRequest 요구사항)
    const variables: Record<string, string> = {};
    for (const [key, value] of Object.entries(typedRequest.variables)) {
      variables[key] = String(value);
    }

    return {
      templateCode: typedRequest.templateCode,
      phoneNumber: typedRequest.phoneNumber,
      variables,
      options: typedRequest.options
        ? {
            scheduledAt: typedRequest.options.scheduledAt,
            priority: typedRequest.options.priority,
            senderNumber: typedRequest.options.senderNumber,
            subject: typedRequest.options.subject,
          }
        : undefined,
    };
  }

  /**
   * StandardResult를 TypedResult로 변환
   */
  static toTypedResult<T extends TemplateCode>(
    standardResult: StandardResult,
    templateCode: T,
    originalVariables: TemplateVariables<T>,
  ): TypedResult<T> {
    return {
      messageId: standardResult.messageId,
      templateCode,
      phoneNumber: standardResult.phoneNumber,
      channel: TemplateTypeConverter.inferChannel(templateCode, standardResult),
      status: TemplateTypeConverter.mapStandardStatus(standardResult.status),
      timestamp: standardResult.timestamp,
      variables: originalVariables,
      error: standardResult.error
        ? {
            code: standardResult.error.code,
            message: standardResult.error.message,
            retryable: standardResult.error.retryable,
          }
        : undefined,
    };
  }

  /**
   * 템플릿 코드로부터 채널 추론
   */
  private static inferChannel<T extends TemplateCode>(
    templateCode: T,
    result: StandardResult,
  ): ExtractChannels<T> {
    const schema = TEMPLATE_REGISTRY[templateCode];

    // 결과에서 실제 사용된 채널을 찾거나, 첫 번째 지원 채널 반환
    if (result.metadata && "channel" in result.metadata) {
      const usedChannel = result.metadata.channel as string;
      if (schema.channels.includes(usedChannel as MessageChannel)) {
        return usedChannel as ExtractChannels<T>;
      }
    }

    return schema.channels[0] as ExtractChannels<T>;
  }

  /**
   * StandardStatus를 TypedResult 상태로 매핑
   */
  private static mapStandardStatus(status: any): "sent" | "pending" | "failed" {
    switch (status) {
      case "SENT":
      case "DELIVERED":
        return "sent";
      case "PENDING":
        return "pending";
      case "FAILED":
      case "CANCELLED":
      default:
        return "failed";
    }
  }
}

/**
 * 타입 안전한 Provider 래퍼
 * 기존 Provider를 감싸서 타입 안전성을 제공
 */
export class TypedProvider {
  constructor(private provider: import("@k-msg/core").BaseProvider) {}

  /**
   * 타입 안전한 메시지 전송
   */
  async send<T extends TemplateCode>(
    request: TypedRequest<T>,
  ): Promise<TypedResult<T>> {
    // 1. 타입 검증
    const validation = TemplateValidator.validateVariables(
      request.templateCode,
      request.variables as Record<string, any>,
    );

    if (!validation.isValid) {
      throw new Error(
        `Template validation failed: ${validation.errors.join(", ")}`,
      );
    }

    // 2. 채널 검증
    if (
      request.options?.channel &&
      !TemplateValidator.validateChannel(
        request.templateCode,
        request.options.channel,
      )
    ) {
      throw new Error(
        `Channel '${request.options.channel}' not supported for template '${request.templateCode}'`,
      );
    }

    // 3. StandardRequest로 변환
    const standardRequest = TemplateTypeConverter.toStandardRequest(request);

    // 4. 실제 전송
    const standardResult = await this.provider.send(standardRequest);

    // 5. TypedResult로 변환
    return TemplateTypeConverter.toTypedResult(
      standardResult,
      request.templateCode,
      validation.validatedVariables as TemplateVariables<T>,
    );
  }

  /**
   * 대량 전송 (타입 안전)
   */
  async sendBulk<T extends TemplateCode>(
    requests: TypedRequest<T>[],
    options?: {
      batchSize?: number;
      concurrency?: number;
      failFast?: boolean;
    },
  ): Promise<TypedResult<T>[]> {
    const { batchSize = 50, concurrency = 5, failFast = false } = options || {};
    const results: TypedResult<T>[] = [];

    // 배치 단위로 처리
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);

      // 동시성 제어
      const promises = batch.map(async (request) => {
        try {
          return await this.send(request);
        } catch (error) {
          if (failFast) {
            throw error;
          }
          // 실패 시 에러 결과 생성
          return {
            messageId: `error_${Date.now()}_${Math.random()}`,
            templateCode: request.templateCode,
            phoneNumber: request.phoneNumber,
            channel: TEMPLATE_REGISTRY[request.templateCode]
              .channels[0] as ExtractChannels<T>,
            status: "failed" as const,
            timestamp: new Date(),
            variables: request.variables,
            error: {
              code: "SEND_FAILED",
              message: error instanceof Error ? error.message : "Unknown error",
              retryable: true,
            },
          };
        }
      });

      // 동시성 제한
      const batchResults = await Promise.allSettled(promises);
      const settledResults = batchResults.map((result, index) => {
        if (result.status === "fulfilled") {
          return result.value;
        } else {
          const request = batch[index];
          return {
            messageId: `error_${Date.now()}_${Math.random()}`,
            templateCode: request.templateCode,
            phoneNumber: request.phoneNumber,
            channel: TEMPLATE_REGISTRY[request.templateCode]
              .channels[0] as ExtractChannels<T>,
            status: "failed" as const,
            timestamp: new Date(),
            variables: request.variables,
            error: {
              code: "SEND_FAILED",
              message:
                result.reason instanceof Error
                  ? result.reason.message
                  : "Unknown error",
              retryable: true,
            },
          };
        }
      });

      results.push(...settledResults);
    }

    return results;
  }

  /**
   * 상태 조회 (타입 안전하지 않은 부분 - messageId만 필요)
   */
  async getStatus(messageId: string) {
    if (!this.provider.getStatus) {
      throw new Error("Provider does not support status check");
    }
    return this.provider.getStatus(messageId);
  }

  /**
   * 기본 Provider 접근 (고급 사용자용)
   */
  getUnderlyingProvider() {
    return this.provider;
  }
}

// 템플릿 레지스트리 실제 구현
export const TEMPLATE_REGISTRY: TemplateRegistry = {
  WELCOME_001: {
    templateCode: "WELCOME_001",
    name: "환영 메시지",
    description: "신규 가입자를 위한 환영 메시지",
    channels: ["alimtalk"],
    variables: {
      name: {
        type: "string",
        required: true,
        description: "사용자 이름",
        validation: { minLength: 1, maxLength: 50 },
      },
      service: {
        type: "string",
        required: true,
        description: "서비스 이름",
        validation: { minLength: 1, maxLength: 100 },
      },
      date: {
        type: "date",
        required: true,
        description: "가입 날짜",
      },
    },
    metadata: {
      category: "onboarding",
      version: "1.0",
      author: "K-MSG Team",
    },
  },

  OTP_AUTH_001: {
    templateCode: "OTP_AUTH_001",
    name: "OTP 인증",
    description: "본인 인증을 위한 OTP 코드 발송",
    channels: ["alimtalk", "sms"],
    variables: {
      code: {
        type: "string",
        required: true,
        description: "6자리 인증 코드",
        validation: { pattern: /^\d{6}$/, minLength: 6, maxLength: 6 },
      },
      expiry: {
        type: "string",
        required: true,
        description: "만료 시간",
        validation: { minLength: 1, maxLength: 20 },
      },
      serviceName: {
        type: "string",
        required: false,
        description: "서비스 이름",
        defaultValue: "K-MSG",
      },
    },
    metadata: {
      category: "authentication",
      version: "1.0",
    },
  },

  ORDER_CONFIRM_001: {
    templateCode: "ORDER_CONFIRM_001",
    name: "주문 확인",
    description: "주문 완료 확인 메시지",
    channels: ["alimtalk"],
    variables: {
      orderNumber: {
        type: "string",
        required: true,
        description: "주문 번호",
        validation: { pattern: /^ORD-\d+$/ },
      },
      productName: {
        type: "string",
        required: true,
        description: "상품명",
        validation: { minLength: 1, maxLength: 200 },
      },
      amount: {
        type: "string",
        required: true,
        description: "결제 금액",
        validation: { pattern: /^[\d,]+원?$/ },
      },
      deliveryDate: {
        type: "date",
        required: true,
        description: "배송 예정일",
      },
      customerName: {
        type: "string",
        required: true,
        description: "고객명",
        validation: { minLength: 1, maxLength: 50 },
      },
    },
    metadata: {
      category: "commerce",
      version: "1.0",
    },
  },

  PAYMENT_COMPLETE_001: {
    templateCode: "PAYMENT_COMPLETE_001",
    name: "결제 완료",
    description: "결제 완료 알림 메시지",
    channels: ["alimtalk", "sms"],
    variables: {
      amount: {
        type: "string",
        required: true,
        description: "결제 금액",
      },
      paymentMethod: {
        type: "string",
        required: true,
        description: "결제 수단",
      },
      transactionId: {
        type: "string",
        required: true,
        description: "거래 ID",
      },
      customerName: {
        type: "string",
        required: true,
        description: "고객명",
      },
    },
    metadata: {
      category: "commerce",
      version: "1.0",
    },
  },

  SMS_DIRECT: {
    templateCode: "SMS_DIRECT",
    name: "SMS 직접 발송",
    description: "템플릿 없이 SMS 직접 발송",
    channels: ["sms"],
    variables: {
      message: {
        type: "string",
        required: true,
        description: "SMS 메시지",
        validation: { maxLength: 90 },
      },
    },
    metadata: {
      category: "direct",
      version: "1.0",
    },
  },

  LMS_DIRECT: {
    templateCode: "LMS_DIRECT",
    name: "LMS 직접 발송",
    description: "템플릿 없이 LMS 직접 발송",
    channels: ["sms"],
    variables: {
      subject: {
        type: "string",
        required: true,
        description: "LMS 제목",
        validation: { maxLength: 40 },
      },
      message: {
        type: "string",
        required: true,
        description: "LMS 메시지",
        validation: { maxLength: 2000 },
      },
    },
    metadata: {
      category: "direct",
      version: "1.0",
    },
  },

  EMERGENCY_NOTIFICATION: {
    templateCode: "EMERGENCY_NOTIFICATION",
    name: "긴급 알림",
    description: "긴급 상황 알림 메시지",
    channels: ["alimtalk", "sms", "mms"],
    variables: {
      alertType: {
        type: "string",
        required: true,
        description: "알림 유형",
      },
      message: {
        type: "string",
        required: true,
        description: "알림 메시지",
      },
      contactInfo: {
        type: "string",
        required: true,
        description: "연락처 정보",
      },
      urgencyLevel: {
        type: "string",
        required: true,
        description: "긴급도",
        validation: { pattern: /^(LOW|MEDIUM|HIGH|CRITICAL)$/ },
      },
    },
    metadata: {
      category: "emergency",
      version: "1.0",
    },
  },
};

// 템플릿 검증 유틸리티
export class TemplateValidator {
  static validateVariables<T extends TemplateCode>(
    templateCode: T,
    variables: Record<string, any>,
  ): ValidationResult<TemplateVariables<T>> {
    const schema = TEMPLATE_REGISTRY[templateCode];
    const errors: string[] = [];
    const warnings: string[] = [];

    // 필수 변수 검증
    for (const [key, definition] of Object.entries(schema.variables)) {
      if (definition.required && !(key in variables)) {
        errors.push(`Required variable '${key}' is missing`);
        continue;
      }

      const value = variables[key];
      if (value === undefined || value === null) {
        if (definition.required) {
          errors.push(`Required variable '${key}' cannot be null or undefined`);
        }
        continue;
      }

      // 타입 검증
      if (!TemplateValidator.validateType(value, definition.type)) {
        errors.push(`Variable '${key}' must be of type ${definition.type}`);
        continue;
      }

      // 상세 검증
      const validationErrors = TemplateValidator.validateValue(
        key,
        value,
        definition,
      );
      errors.push(...validationErrors);
    }

    // 추가 변수 검증 (스키마에 없는 변수)
    for (const key of Object.keys(variables)) {
      if (!(key in schema.variables)) {
        warnings.push(`Unknown variable '${key}' will be ignored`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      validatedVariables: TemplateValidator.applyDefaults(
        variables,
        schema,
      ) as TemplateVariables<T>,
    };
  }

  static validateChannel<T extends TemplateCode>(
    templateCode: T,
    channel: string,
  ): boolean {
    const schema = TEMPLATE_REGISTRY[templateCode];
    return schema.channels.includes(channel as MessageChannel);
  }

  private static validateType(value: any, type: keyof VariableType): boolean {
    switch (type) {
      case "string":
        return typeof value === "string";
      case "number":
        return typeof value === "number" && !isNaN(value);
      case "boolean":
        return typeof value === "boolean";
      case "date":
        return typeof value === "string" && !isNaN(Date.parse(value));
      case "phoneNumber":
        return typeof value === "string" && /^[0-9-+\s()]+$/.test(value);
      case "url":
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      case "email":
        return (
          typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        );
      default:
        return false;
    }
  }

  private static validateValue(
    key: string,
    value: any,
    definition: VariableDefinition,
  ): string[] {
    const errors: string[] = [];

    if (!definition.validation) return errors;

    const { pattern, minLength, maxLength, min, max } = definition.validation;

    if (typeof value === "string") {
      if (pattern && !pattern.test(value)) {
        errors.push(`Variable '${key}' does not match required pattern`);
      }
      if (minLength !== undefined && value.length < minLength) {
        errors.push(
          `Variable '${key}' must be at least ${minLength} characters long`,
        );
      }
      if (maxLength !== undefined && value.length > maxLength) {
        errors.push(
          `Variable '${key}' must be at most ${maxLength} characters long`,
        );
      }
    }

    if (typeof value === "number") {
      if (min !== undefined && value < min) {
        errors.push(`Variable '${key}' must be at least ${min}`);
      }
      if (max !== undefined && value > max) {
        errors.push(`Variable '${key}' must be at most ${max}`);
      }
    }

    return errors;
  }

  private static applyDefaults(
    variables: Record<string, any>,
    schema: TemplateSchema,
  ): Record<string, any> {
    const result = { ...variables };

    for (const [key, definition] of Object.entries(schema.variables)) {
      if (!(key in result) && definition.defaultValue !== undefined) {
        result[key] = definition.defaultValue;
      }
    }

    return result;
  }
}

export interface ValidationResult<T> {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  validatedVariables: T;
}
