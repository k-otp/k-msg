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

export type ErrorRetryPolicyMode = "safe" | "compat";

export interface ErrorRetryPolicyIssue {
  code: string;
  message: string;
  path: string;
}

export interface ErrorRetryPolicyValidationResult {
  policy: ErrorRetryPolicy | null;
  issues: ErrorRetryPolicyIssue[];
}

export interface ErrorRetryPolicyNormalizeOptions {
  mode?: ErrorRetryPolicyMode;
}

export type ProviderErrorSource =
  | "metadata"
  | "details"
  | "http"
  | "fallback"
  | "policy"
  | "input";

export interface NormalizedProviderErrorSources {
  code: ProviderErrorSource;
  classification: ProviderErrorSource;
  providerErrorCode?: ProviderErrorSource;
  providerErrorText?: ProviderErrorSource;
  httpStatus?: ProviderErrorSource;
  requestId?: ProviderErrorSource;
  retryAfterMs?: ProviderErrorSource;
  causeChain?: ProviderErrorSource;
  attempt?: ProviderErrorSource;
}

export interface NormalizedProviderError {
  code: KMsgErrorCode;
  classification: ProviderRetryHint;
  providerErrorCode?: string;
  providerErrorText?: string;
  httpStatus?: number;
  requestId?: string;
  retryAfterMs?: number;
  causeChain?: unknown[];
  attempt?: number;
  sources: NormalizedProviderErrorSources;
}

export interface NormalizeProviderErrorOptions {
  mode?: ErrorRetryPolicyMode;
  policy?: ErrorRetryPolicy;
  attempt?: number;
  defaultCode?: KMsgErrorCode;
}

const KNOWN_KMSG_ERROR_CODES: ReadonlySet<string> = new Set(
  Object.values(KMsgErrorCode),
);

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

const toTrimmedString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
};

const isObjectRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const pickByKey = (
  value: Record<string, unknown>,
  keys: readonly string[],
): unknown => {
  for (const key of keys) {
    if (key in value) {
      return value[key];
    }
  }
  return undefined;
};

const ensureIssuePath = (path: string): string => {
  return path.length > 0 ? path : "$";
};

const normalizePolicyMode = (
  mode: ErrorRetryPolicyMode | undefined,
): ErrorRetryPolicyMode => {
  return mode === "compat" ? "compat" : "safe";
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

const normalizeIntegerLike = (
  value: unknown,
  mode: ErrorRetryPolicyMode,
): number | undefined => {
  const normalized = normalizeNumber(value);
  if (normalized !== undefined) return normalized;

  if (mode === "compat" && typeof value === "string") {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed)) {
      return Math.trunc(parsed);
    }
  }

  return undefined;
};

const normalizeStringLike = (
  value: unknown,
  mode: ErrorRetryPolicyMode,
): string | undefined => {
  const fromString = toTrimmedString(value);
  if (fromString) return fromString;

  if (
    mode === "compat" &&
    (typeof value === "number" || typeof value === "boolean")
  ) {
    return String(value);
  }

  return undefined;
};

const normalizeKMsgErrorCode = (value: unknown): KMsgErrorCode | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim().toUpperCase();
  if (!KNOWN_KMSG_ERROR_CODES.has(normalized)) {
    return undefined;
  }

  return normalized as KMsgErrorCode;
};

const pushPolicyIssue = (
  issues: ErrorRetryPolicyIssue[],
  issue: ErrorRetryPolicyIssue,
) => {
  issues.push({
    ...issue,
    path: ensureIssuePath(issue.path),
  });
};

const normalizePolicyCodeList = (
  value: unknown,
  path: string,
  mode: ErrorRetryPolicyMode,
  issues: ErrorRetryPolicyIssue[],
): KMsgErrorCode[] => {
  if (value === undefined) return [];

  const items: unknown[] = (() => {
    if (Array.isArray(value)) return value;
    if (mode === "compat" && typeof value === "string") {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    }

    pushPolicyIssue(issues, {
      code: "invalid_type",
      message: "expected array of KMsgErrorCode values",
      path,
    });
    return [];
  })();

  const out: KMsgErrorCode[] = [];
  const seen = new Set<KMsgErrorCode>();

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const code = normalizeKMsgErrorCode(
      typeof item === "string" ? item : mode === "compat" ? String(item) : item,
    );

    if (!code) {
      pushPolicyIssue(issues, {
        code: "unknown_code",
        message: `unknown retry policy code: ${String(item)}`,
        path: `${path}[${index}]`,
      });
      continue;
    }

    if (seen.has(code)) {
      pushPolicyIssue(issues, {
        code: "duplicate_code",
        message: `duplicate retry policy code: ${code}`,
        path: `${path}[${index}]`,
      });
      continue;
    }

    seen.add(code);
    out.push(code);
  }

  return out;
};

const normalizeRetryFallback = (
  value: unknown,
  mode: ErrorRetryPolicyMode,
  issues: ErrorRetryPolicyIssue[],
): ProviderRetryHint | undefined => {
  if (value === undefined) return undefined;

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "retryable") return "retryable";
    if (normalized === "non_retryable" || normalized === "non-retryable") {
      return "non_retryable";
    }
  }

  if (mode === "compat" && typeof value === "boolean") {
    return value ? "retryable" : "non_retryable";
  }

  pushPolicyIssue(issues, {
    code: "invalid_fallback",
    message: `invalid fallback value: ${String(value)}`,
    path: "fallback",
  });
  return undefined;
};

export function validateErrorRetryPolicy(
  input: unknown,
  options: ErrorRetryPolicyNormalizeOptions = {},
): ErrorRetryPolicyValidationResult {
  const mode = normalizePolicyMode(options.mode);
  const issues: ErrorRetryPolicyIssue[] = [];

  if (!isObjectRecord(input)) {
    pushPolicyIssue(issues, {
      code: "invalid_root",
      message: "retry policy must be an object",
      path: "$",
    });
    return { policy: null, issues };
  }

  const knownKeys = new Set([
    "retryableCodes",
    "nonRetryableCodes",
    "fallback",
  ]);
  for (const key of Object.keys(input)) {
    if (knownKeys.has(key)) continue;
    pushPolicyIssue(issues, {
      code: "unknown_field",
      message: `unknown retry policy field: ${key}`,
      path: key,
    });
  }

  const retryableCodes = normalizePolicyCodeList(
    input.retryableCodes,
    "retryableCodes",
    mode,
    issues,
  );
  const nonRetryableCodes = normalizePolicyCodeList(
    input.nonRetryableCodes,
    "nonRetryableCodes",
    mode,
    issues,
  );
  const fallback = normalizeRetryFallback(input.fallback, mode, issues);

  const retryableSet = new Set(retryableCodes);
  const nonRetryableSet = new Set(nonRetryableCodes);

  for (const code of retryableSet) {
    if (!nonRetryableSet.has(code)) continue;
    retryableSet.delete(code);
    pushPolicyIssue(issues, {
      code: "conflicting_code",
      message: `code '${code}' is both retryable and nonRetryable; nonRetryable wins`,
      path: "retryableCodes",
    });
  }

  const policy: ErrorRetryPolicy = {
    ...(retryableSet.size > 0
      ? { retryableCodes: Array.from(retryableSet) }
      : {}),
    ...(nonRetryableSet.size > 0
      ? { nonRetryableCodes: Array.from(nonRetryableSet) }
      : {}),
    ...(fallback ? { fallback } : {}),
  };

  const hasConfig =
    policy.retryableCodes !== undefined ||
    policy.nonRetryableCodes !== undefined ||
    policy.fallback !== undefined;

  return {
    policy: hasConfig ? policy : null,
    issues,
  };
}

export function normalizeErrorRetryPolicy(
  input: unknown,
  options: ErrorRetryPolicyNormalizeOptions = {},
): ErrorRetryPolicy | null {
  return validateErrorRetryPolicy(input, options).policy;
}

export function parseErrorRetryPolicyFromJson(
  raw: string,
  options: ErrorRetryPolicyNormalizeOptions = {},
): ErrorRetryPolicy | null {
  if (typeof raw !== "string" || raw.trim().length === 0) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    return normalizeErrorRetryPolicy(parsed, options);
  } catch {
    return null;
  }
}

const resolveNestedHttpStatus = (
  record: Record<string, unknown>,
  mode: ErrorRetryPolicyMode,
): number | undefined => {
  const response = record.response;
  if (!isObjectRecord(response)) {
    return undefined;
  }

  return normalizeIntegerLike(
    pickByKey(response, ["status", "statusCode", "httpStatus"]),
    mode,
  );
};

const resolveCauseChain = (
  error: unknown,
  mode: ErrorRetryPolicyMode,
): unknown[] | undefined => {
  if (error instanceof KMsgError && Array.isArray(error.causeChain)) {
    return error.causeChain.slice();
  }

  if (isObjectRecord(error)) {
    const fromChain = error.causeChain;
    if (Array.isArray(fromChain)) {
      return fromChain.slice();
    }

    const details = error.details;
    if (mode === "compat" && isObjectRecord(details)) {
      const detailChain = details.causeChain;
      if (Array.isArray(detailChain)) {
        return detailChain.slice();
      }
      if (detailChain !== undefined) {
        return [detailChain];
      }
    }
  }

  const chain: unknown[] = [];
  const seen = new Set<unknown>();
  let cursor: unknown = error;

  for (let depth = 0; depth < 8; depth += 1) {
    if (!isObjectRecord(cursor)) break;
    const cause = cursor.cause;
    if (cause === undefined || seen.has(cause)) break;
    seen.add(cause);
    chain.push(cause);
    cursor = cause;
  }

  return chain.length > 0 ? chain : undefined;
};

const resolveErrorMessage = (error: unknown): string => {
  if (error instanceof Error && typeof error.message === "string") {
    return error.message;
  }

  if (isObjectRecord(error) && typeof error.message === "string") {
    return error.message;
  }

  return typeof error === "string" ? error : "Unknown error";
};

export function normalizeProviderError(
  error: unknown,
  options: NormalizeProviderErrorOptions = {},
): NormalizedProviderError {
  const mode = normalizePolicyMode(options.mode);
  const defaultCode = options.defaultCode ?? KMsgErrorCode.UNKNOWN_ERROR;

  let code = defaultCode;
  const sources: NormalizedProviderErrorSources = {
    code: "fallback",
    classification: options.policy ? "policy" : "fallback",
  };

  let providerErrorCode: string | undefined;
  let providerErrorText: string | undefined;
  let httpStatus: number | undefined;
  let requestId: string | undefined;
  let retryAfterMs: number | undefined;
  let attempt: number | undefined;
  let causeChain: unknown[] | undefined;

  const assignFromMetadata = (candidate: KMsgError) => {
    if (candidate.providerErrorCode !== undefined) {
      providerErrorCode = candidate.providerErrorCode;
      sources.providerErrorCode = "metadata";
    }
    if (candidate.providerErrorText !== undefined) {
      providerErrorText = candidate.providerErrorText;
      sources.providerErrorText = "metadata";
    }
    if (candidate.httpStatus !== undefined) {
      httpStatus = candidate.httpStatus;
      sources.httpStatus = "metadata";
    }
    if (candidate.requestId !== undefined) {
      requestId = candidate.requestId;
      sources.requestId = "metadata";
    }
    if (candidate.retryAfterMs !== undefined) {
      retryAfterMs = normalizeRetryAfterMs(candidate.retryAfterMs);
      sources.retryAfterMs = "metadata";
    }
    if (candidate.attempt !== undefined) {
      attempt = normalizeIntegerLike(candidate.attempt, mode);
      sources.attempt = "metadata";
    }
    if (Array.isArray(candidate.causeChain)) {
      causeChain = candidate.causeChain.slice();
      sources.causeChain = "metadata";
    }
  };

  const assignFromRecord = (
    record: Record<string, unknown>,
    source: ProviderErrorSource,
  ) => {
    if (providerErrorCode === undefined) {
      const next = normalizeStringLike(
        pickByKey(record, ["providerErrorCode", "errorCode", "resultCode"]),
        mode,
      );
      if (next !== undefined) {
        providerErrorCode = next;
        sources.providerErrorCode = source;
      }
    }

    if (providerErrorText === undefined) {
      const next = normalizeStringLike(
        pickByKey(record, [
          "providerErrorText",
          "errorMessage",
          "msg",
          "message",
        ]),
        mode,
      );
      if (next !== undefined) {
        providerErrorText = next;
        sources.providerErrorText = source;
      }
    }

    if (httpStatus === undefined) {
      const next =
        normalizeIntegerLike(
          pickByKey(record, ["httpStatus", "statusCode", "status"]),
          mode,
        ) ?? resolveNestedHttpStatus(record, mode);
      if (next !== undefined) {
        httpStatus = next;
        sources.httpStatus = source === "details" ? "details" : "http";
      }
    }

    if (requestId === undefined) {
      const next = normalizeStringLike(
        pickByKey(record, ["requestId", "request_id", "reqId", "traceId"]),
        mode,
      );
      if (next !== undefined) {
        requestId = next;
        sources.requestId = source;
      }
    }

    if (retryAfterMs === undefined) {
      const next = normalizeRetryAfterMs(
        normalizeIntegerLike(
          pickByKey(record, ["retryAfterMs", "retry_after_ms", "retryAfter"]),
          mode,
        ),
      );
      if (next !== undefined) {
        retryAfterMs = next;
        sources.retryAfterMs = source;
      }
    }

    if (attempt === undefined) {
      const next = normalizeIntegerLike(record.attempt, mode);
      if (next !== undefined && next > 0) {
        attempt = next;
        sources.attempt = source;
      }
    }
  };

  if (error instanceof KMsgError) {
    code = error.code;
    sources.code = "input";
    assignFromMetadata(error);

    if (mode === "compat" && isObjectRecord(error.details)) {
      assignFromRecord(error.details, "details");
    }
  } else if (isObjectRecord(error)) {
    const candidateCode = normalizeKMsgErrorCode(
      pickByKey(error, ["code", "errorCode", "resultCode"]),
    );
    if (candidateCode !== undefined) {
      code = candidateCode;
      sources.code = "input";
    } else if (httpStatus === undefined) {
      const nextStatus =
        normalizeIntegerLike(
          pickByKey(error, ["httpStatus", "statusCode", "status"]),
          mode,
        ) ?? resolveNestedHttpStatus(error, mode);
      if (nextStatus !== undefined && nextStatus >= 500) {
        code = KMsgErrorCode.PROVIDER_ERROR;
        sources.code = "http";
      }
    }

    assignFromRecord(error, "input");
    if (mode === "compat" && isObjectRecord(error.details)) {
      assignFromRecord(error.details, "details");
    }
  }

  if (causeChain === undefined) {
    const nextCauseChain = resolveCauseChain(error, mode);
    if (nextCauseChain !== undefined) {
      causeChain = nextCauseChain;
      sources.causeChain = "input";
    }
  }

  if (
    options.attempt !== undefined &&
    normalizeIntegerLike(options.attempt, mode) !== undefined
  ) {
    const normalizedAttempt = normalizeIntegerLike(options.attempt, mode);
    if (normalizedAttempt !== undefined && normalizedAttempt > 0) {
      attempt = normalizedAttempt;
      sources.attempt = "input";
    }
  }

  const classificationProbe = new KMsgError(
    code,
    resolveErrorMessage(error),
    undefined,
    {
      providerErrorCode,
      providerErrorText,
      httpStatus,
      requestId,
      retryAfterMs,
      attempt,
      causeChain,
    },
  );
  const classification = ErrorUtils.classifyForRetry(
    classificationProbe,
    options.policy,
  );

  return {
    code,
    classification,
    ...(providerErrorCode !== undefined ? { providerErrorCode } : {}),
    ...(providerErrorText !== undefined ? { providerErrorText } : {}),
    ...(httpStatus !== undefined ? { httpStatus } : {}),
    ...(requestId !== undefined ? { requestId } : {}),
    ...(retryAfterMs !== undefined ? { retryAfterMs } : {}),
    ...(attempt !== undefined ? { attempt } : {}),
    ...(causeChain !== undefined ? { causeChain } : {}),
    sources,
  };
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
