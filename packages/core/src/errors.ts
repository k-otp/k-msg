export type Locale = "ko" | "en";

export enum KMsgErrorCode {
  INVALID_REQUEST = "INVALID_REQUEST",
  AUTHENTICATION_FAILED = "AUTHENTICATION_FAILED",
  INSUFFICIENT_BALANCE = "INSUFFICIENT_BALANCE",
  TEMPLATE_NOT_FOUND = "TEMPLATE_NOT_FOUND",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  NETWORK_ERROR = "NETWORK_ERROR",
  NETWORK_TIMEOUT = "NETWORK_TIMEOUT",
  NETWORK_SERVICE_UNAVAILABLE = "NETWORK_SERVICE_UNAVAILABLE",
  PROVIDER_ERROR = "PROVIDER_ERROR",
  MESSAGE_SEND_FAILED = "MESSAGE_SEND_FAILED",
  CRYPTO_CONFIG_ERROR = "CRYPTO_CONFIG_ERROR",
  CRYPTO_ENCRYPT_FAILED = "CRYPTO_ENCRYPT_FAILED",
  CRYPTO_DECRYPT_FAILED = "CRYPTO_DECRYPT_FAILED",
  CRYPTO_HASH_FAILED = "CRYPTO_HASH_FAILED",
  CRYPTO_POLICY_VIOLATION = "CRYPTO_POLICY_VIOLATION",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

const DEFAULT_LOCALE: Locale = "ko";

const ERROR_MESSAGES: Record<KMsgErrorCode, { ko: string; en: string }> = {
  [KMsgErrorCode.INVALID_REQUEST]: {
    ko: "잘못된 요청입니다",
    en: "Invalid request",
  },
  [KMsgErrorCode.AUTHENTICATION_FAILED]: {
    ko: "인증에 실패했습니다",
    en: "Authentication failed",
  },
  [KMsgErrorCode.INSUFFICIENT_BALANCE]: {
    ko: "잔액이 부족합니다",
    en: "Insufficient balance",
  },
  [KMsgErrorCode.TEMPLATE_NOT_FOUND]: {
    ko: "템플릿을 찾을 수 없습니다",
    en: "Template not found",
  },
  [KMsgErrorCode.RATE_LIMIT_EXCEEDED]: {
    ko: "요청 한도를 초과했습니다",
    en: "Rate limit exceeded",
  },
  [KMsgErrorCode.NETWORK_ERROR]: {
    ko: "네트워크 오류가 발생했습니다",
    en: "Network error",
  },
  [KMsgErrorCode.NETWORK_TIMEOUT]: {
    ko: "네트워크 요청 시간이 초과되었습니다",
    en: "Network timeout",
  },
  [KMsgErrorCode.NETWORK_SERVICE_UNAVAILABLE]: {
    ko: "서비스를 일시적으로 사용할 수 없습니다",
    en: "Service temporarily unavailable",
  },
  [KMsgErrorCode.PROVIDER_ERROR]: {
    ko: "제공자 오류가 발생했습니다",
    en: "Provider error",
  },
  [KMsgErrorCode.MESSAGE_SEND_FAILED]: {
    ko: "메시지 전송에 실패했습니다",
    en: "Message send failed",
  },
  [KMsgErrorCode.CRYPTO_CONFIG_ERROR]: {
    ko: "암호화 설정 오류가 발생했습니다",
    en: "Crypto configuration error",
  },
  [KMsgErrorCode.CRYPTO_ENCRYPT_FAILED]: {
    ko: "암호화에 실패했습니다",
    en: "Encryption failed",
  },
  [KMsgErrorCode.CRYPTO_DECRYPT_FAILED]: {
    ko: "복호화에 실패했습니다",
    en: "Decryption failed",
  },
  [KMsgErrorCode.CRYPTO_HASH_FAILED]: {
    ko: "해시 생성에 실패했습니다",
    en: "Hash generation failed",
  },
  [KMsgErrorCode.CRYPTO_POLICY_VIOLATION]: {
    ko: "암호화 정책 위반이 발생했습니다",
    en: "Crypto policy violation",
  },
  [KMsgErrorCode.UNKNOWN_ERROR]: {
    ko: "알 수 없는 오류가 발생했습니다",
    en: "Unknown error",
  },
};

export type RetryPolicyErrorCode = KMsgErrorCode;

export type ProviderRetryHint = "retryable" | "non_retryable";

export interface KMsgErrorMetadata {
  providerErrorCode?: string;
  providerErrorText?: string;
  httpStatus?: number;
  requestId?: string;
  retryAfterMs?: number;
  attempt?: number;
  causeChain?: unknown[];
}

export interface ErrorRetryPolicy {
  retryableCodes?: readonly KMsgErrorCode[];
  nonRetryableCodes?: readonly KMsgErrorCode[];
  classifyByStatusCode?: (status: number) => ProviderRetryHint;
  classifyByMessage?: (message: string) => ProviderRetryHint | undefined;
  /**
   * Optional override for retry hint inference.
   */
  fallback?: ProviderRetryHint;
  /**
   * Optional custom retry delay in milliseconds.
   */
  retryAfterMs?: (error: KMsgError) => number | undefined;
}

const DEFAULT_RETRYABLE_ERROR_CODES: ReadonlySet<RetryPolicyErrorCode> =
  new Set([
    KMsgErrorCode.NETWORK_ERROR,
    KMsgErrorCode.RATE_LIMIT_EXCEEDED,
    KMsgErrorCode.NETWORK_TIMEOUT,
    KMsgErrorCode.NETWORK_SERVICE_UNAVAILABLE,
    KMsgErrorCode.PROVIDER_ERROR,
    KMsgErrorCode.UNKNOWN_ERROR,
  ]);

const DEFAULT_NON_RETRYABLE_ERROR_CODES: ReadonlySet<RetryPolicyErrorCode> =
  new Set([
    KMsgErrorCode.INVALID_REQUEST,
    KMsgErrorCode.AUTHENTICATION_FAILED,
    KMsgErrorCode.INSUFFICIENT_BALANCE,
    KMsgErrorCode.TEMPLATE_NOT_FOUND,
    KMsgErrorCode.MESSAGE_SEND_FAILED,
    KMsgErrorCode.CRYPTO_CONFIG_ERROR,
    KMsgErrorCode.CRYPTO_ENCRYPT_FAILED,
    KMsgErrorCode.CRYPTO_DECRYPT_FAILED,
    KMsgErrorCode.CRYPTO_HASH_FAILED,
    KMsgErrorCode.CRYPTO_POLICY_VIOLATION,
  ]);

const normalizeNumber = (value: unknown): number | undefined => {
  if (
    typeof value !== "number" ||
    Number.isNaN(value) ||
    !Number.isFinite(value)
  ) {
    return undefined;
  }

  return Math.trunc(value);
};

export const normalizeRetryAfterMs = (value: unknown): number | undefined => {
  const normalized = normalizeNumber(value);
  if (normalized === undefined || normalized < 0) {
    return undefined;
  }

  return normalized;
};

const toLowerString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  return value.toLowerCase().trim();
};

const classifyByHttpStatus = (status: number): ProviderRetryHint => {
  if (status >= 500) {
    return "retryable";
  }

  if (status === 408 || status === 425 || status === 429) {
    return "retryable";
  }

  return "non_retryable";
};

const classifyByMessage = (message: string): ProviderRetryHint | undefined => {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("timeout") ||
    normalized.includes("temporar") ||
    normalized.includes("network") ||
    normalized.includes("retry")
  ) {
    return "retryable";
  }

  return undefined;
};

export class KMsgError extends Error {
  public readonly code: KMsgErrorCode;
  public readonly details?: Record<string, unknown>;
  public readonly providerErrorCode?: string;
  public readonly providerErrorText?: string;
  public readonly httpStatus?: number;
  public readonly requestId?: string;
  public readonly retryAfterMs?: number;
  public readonly attempt?: number;
  public readonly causeChain?: unknown[];

  constructor(
    code: KMsgErrorCode,
    message: string,
    details?: Record<string, unknown>,
    metadata: KMsgErrorMetadata = {},
  ) {
    super(message);
    this.name = "KMsgError";
    this.code = code;
    this.details = details;

    this.providerErrorCode = metadata.providerErrorCode;
    this.providerErrorText = metadata.providerErrorText;
    this.httpStatus = normalizeNumber(metadata.httpStatus);
    this.requestId =
      typeof metadata.requestId === "string" ? metadata.requestId : undefined;
    this.retryAfterMs = normalizeNumber(metadata.retryAfterMs);
    this.attempt = normalizeNumber(metadata.attempt);

    if (Array.isArray(metadata.causeChain)) {
      this.causeChain = metadata.causeChain;
    } else if (metadata.causeChain !== undefined) {
      this.causeChain = [metadata.causeChain];
    }

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, KMsgError);
    }
  }

  /**
   * Returns a localized error message based on the provided locale.
   * Falls back to Korean (default) if locale is not provided.
   * Falls back to the original message if no localized message exists.
   */
  getLocalizedMessage(locale: Locale = DEFAULT_LOCALE): string {
    const messages = ERROR_MESSAGES[this.code];
    if (messages?.[locale]) {
      return messages[locale];
    }
    return this.message;
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
      providerErrorCode: this.providerErrorCode,
      providerErrorText: this.providerErrorText,
      httpStatus: this.httpStatus,
      requestId: this.requestId,
      retryAfterMs: this.retryAfterMs,
      attempt: this.attempt,
      causeChain: this.causeChain,
    };
  }
}

export const ErrorUtils = {
  isRetryable(error: unknown, policy: ErrorRetryPolicy = {}): boolean {
    return ErrorUtils.classifyForRetry(error, policy) === "retryable";
  },

  classifyForRetry(
    error: unknown,
    policy: ErrorRetryPolicy = {},
  ): ProviderRetryHint {
    if (error instanceof KMsgError) {
      const retryableCodes = new Set(
        policy.retryableCodes ?? Array.from(DEFAULT_RETRYABLE_ERROR_CODES),
      );
      if (retryableCodes.has(error.code)) {
        return "retryable";
      }

      const nonRetryableCodes = new Set(
        policy.nonRetryableCodes ??
          Array.from(DEFAULT_NON_RETRYABLE_ERROR_CODES),
      );
      if (nonRetryableCodes.has(error.code)) {
        return "non_retryable";
      }

      if (error.httpStatus !== undefined) {
        return classifyByHttpStatus(error.httpStatus);
      }

      const classifiedByMessage = classifyByMessage(error.message);
      if (classifiedByMessage) {
        return classifiedByMessage;
      }

      if (policy.classifyByMessage && error.message) {
        const classified = policy.classifyByMessage(error.message);
        if (classified) {
          return classified;
        }
      }

      if (policy.fallback) {
        return policy.fallback;
      }

      return "non_retryable";
    }

    const candidate =
      error && typeof error === "object"
        ? (error as {
            status?: unknown;
            statusCode?: unknown;
            httpStatus?: unknown;
            code?: unknown;
            message?: unknown;
          })
        : undefined;

    const status =
      toLowerString(candidate?.status) ??
      toLowerString(candidate?.statusCode) ??
      toLowerString(candidate?.code);
    const statusCode =
      normalizeNumber(candidate?.status) ??
      normalizeNumber(candidate?.statusCode) ??
      normalizeNumber(candidate?.httpStatus);

    if (typeof status === "string" && status.startsWith("5")) {
      return "retryable";
    }

    if (statusCode !== undefined) {
      if (policy.classifyByStatusCode) {
        return policy.classifyByStatusCode(statusCode);
      }

      return classifyByHttpStatus(statusCode);
    }

    const classifiedByMessage =
      typeof candidate?.message === "string"
        ? classifyByMessage(candidate.message)
        : undefined;

    if (classifiedByMessage) {
      return classifiedByMessage;
    }

    if (policy.classifyByMessage && typeof candidate?.message === "string") {
      const classified = policy.classifyByMessage(candidate.message);
      if (classified) {
        return classified;
      }
    }

    return policy.fallback ?? "non_retryable";
  },

  resolveRetryAfterMs(
    error: KMsgError,
    policy?: ErrorRetryPolicy,
  ): number | undefined {
    if (policy?.retryAfterMs) {
      const override = policy.retryAfterMs(error);
      const normalized = normalizeRetryAfterMs(override);
      if (normalized !== undefined) {
        return normalized;
      }
    }

    if (error.retryAfterMs !== undefined) {
      return normalizeRetryAfterMs(error.retryAfterMs);
    }

    if (
      error.code === KMsgErrorCode.RATE_LIMIT_EXCEEDED &&
      error.retryAfterMs === undefined
    ) {
      return undefined;
    }

    return undefined;
  },

  isUnknownStatus: (statusCode: number | undefined): boolean => {
    if (
      statusCode === undefined ||
      Number.isNaN(statusCode) ||
      !Number.isFinite(statusCode)
    ) {
      return false;
    }

    return statusCode < 500;
  },

  toRetryMetadata(error: KMsgError): KMsgErrorMetadata {
    return {
      providerErrorCode: error.providerErrorCode,
      providerErrorText: error.providerErrorText,
      httpStatus: error.httpStatus,
      requestId: error.requestId,
      retryAfterMs: error.retryAfterMs,
      attempt: error.attempt,
      causeChain: error.causeChain,
    };
  },

  withAttempt(error: KMsgError, attempt: number): KMsgError {
    return new KMsgError(error.code, error.message, error.details, {
      ...ErrorUtils.toRetryMetadata(error),
      attempt: normalizeNumber(attempt),
    });
  },

  DEFAULT_RETRYABLE_ERROR_CODES,
  DEFAULT_NON_RETRYABLE_ERROR_CODES,
};
