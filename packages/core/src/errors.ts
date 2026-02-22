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
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

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
