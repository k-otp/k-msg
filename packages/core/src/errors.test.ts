import { describe, expect, test } from "bun:test";
import {
  ErrorUtils,
  KMsgError,
  KMsgErrorCode,
  normalizeErrorRetryPolicy,
  normalizeProviderError,
  parseErrorRetryPolicyFromJson,
  validateErrorRetryPolicy,
} from "./errors";

describe("KMsgError", () => {
  test("should create error with correct properties", () => {
    const error = new KMsgError(
      KMsgErrorCode.TEMPLATE_NOT_FOUND,
      "Template not found",
      { templateId: "TEST_001" },
    );

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(KMsgError);
    expect(error.name).toBe("KMsgError");
    expect(error.code).toBe(KMsgErrorCode.TEMPLATE_NOT_FOUND);
    expect(error.message).toBe("Template not found");
    expect(error.details?.templateId).toBe("TEST_001");
  });

  test("should serialize to JSON correctly", () => {
    const error = new KMsgError(
      KMsgErrorCode.INVALID_REQUEST,
      "Invalid request",
      { field: "phoneNumber" },
    );

    const json = error.toJSON();
    expect(json.name).toBe("KMsgError");
    expect(json.code).toBe(KMsgErrorCode.INVALID_REQUEST);
    expect(json.message).toBe("Invalid request");
    expect(json.details?.field).toBe("phoneNumber");
  });
});

describe("ErrorUtils", () => {
  test("isRetryable should identify retryable errors", () => {
    const retryableError = new KMsgError(
      KMsgErrorCode.NETWORK_ERROR,
      "Network error",
    );
    expect(ErrorUtils.isRetryable(retryableError)).toBe(true);

    const nonRetryableError = new KMsgError(
      KMsgErrorCode.INVALID_REQUEST,
      "Invalid request",
    );
    expect(ErrorUtils.isRetryable(nonRetryableError)).toBe(false);

    const abortedError = new KMsgError(
      KMsgErrorCode.REQUEST_ABORTED,
      "Request aborted",
    );
    expect(ErrorUtils.isRetryable(abortedError)).toBe(false);
  });

  test("resolveRetryAfterMs should normalize valid delay and ignore invalid values", () => {
    const error = new KMsgError(
      KMsgErrorCode.RATE_LIMIT_EXCEEDED,
      "Rate limit exceeded",
      undefined,
      {
        retryAfterMs: 3_000,
      },
    );

    expect(ErrorUtils.resolveRetryAfterMs(error)).toBe(3000);

    const withInvalid = new KMsgError(
      KMsgErrorCode.UNKNOWN_ERROR,
      "No delay",
      undefined,
      {
        retryAfterMs: -1,
      },
    );

    expect(ErrorUtils.resolveRetryAfterMs(withInvalid)).toBeUndefined();
  });

  test("resolveRetryAfterMs applies declarative mappings after direct metadata", () => {
    const policy = {
      retryAfterMs: {
        defaultMs: 5_000,
        byCode: {
          VENDOR_BUSY: 2_000,
          RATE_LIMIT_EXCEEDED: 2_500,
        },
        byStatus: { "429": 3_000 },
      },
    } as const;

    const direct = new KMsgError(
      KMsgErrorCode.RATE_LIMIT_EXCEEDED,
      "rate limited",
      undefined,
      {
        providerErrorCode: "vendor_busy",
        httpStatus: 429,
        retryAfterMs: 750,
      },
    );
    expect(ErrorUtils.resolveRetryAfterMs(direct, policy)).toBe(750);

    const byProviderCode = new KMsgError(
      KMsgErrorCode.RATE_LIMIT_EXCEEDED,
      "rate limited",
      undefined,
      { providerErrorCode: "vendor_busy", httpStatus: 429 },
    );
    expect(ErrorUtils.resolveRetryAfterMs(byProviderCode, policy)).toBe(2000);
    expect(
      ErrorUtils.resolveRetryAfterMs(byProviderCode, {
        retryAfterMs: { byCode: { " vendor_busy ": 2_100 } },
      }),
    ).toBe(2100);

    const byCanonicalCode = new KMsgError(
      KMsgErrorCode.RATE_LIMIT_EXCEEDED,
      "rate limited",
    );
    expect(ErrorUtils.resolveRetryAfterMs(byCanonicalCode, policy)).toBe(2500);

    const byStatus = new KMsgError(
      KMsgErrorCode.PROVIDER_ERROR,
      "provider error",
      undefined,
      { httpStatus: 429 },
    );
    expect(ErrorUtils.resolveRetryAfterMs(byStatus, policy)).toBe(3000);

    const fallback = new KMsgError(
      KMsgErrorCode.PROVIDER_ERROR,
      "provider error",
    );
    expect(ErrorUtils.resolveRetryAfterMs(fallback, policy)).toBe(5000);
  });

  test("function retry-after resolvers remain overrides", () => {
    const error = new KMsgError(
      KMsgErrorCode.RATE_LIMIT_EXCEEDED,
      "rate limited",
      undefined,
      { retryAfterMs: 750 },
    );

    expect(
      ErrorUtils.resolveRetryAfterMs(error, { retryAfterMs: () => 250 }),
    ).toBe(250);
  });

  test("toRetryMetadata should preserve provider and request metadata", () => {
    const error = new KMsgError(
      KMsgErrorCode.NETWORK_ERROR,
      "Downstream timeout",
      undefined,
      {
        providerErrorCode: "ECONNRESET",
        providerErrorText: "socket hang up",
        httpStatus: 504,
        requestId: "req-123",
        retryAfterMs: 1500,
        attempt: 2,
        causeChain: ["first", "second"],
      },
    );

    expect(ErrorUtils.toRetryMetadata(error)).toMatchObject({
      providerErrorCode: "ECONNRESET",
      providerErrorText: "socket hang up",
      httpStatus: 504,
      requestId: "req-123",
      retryAfterMs: 1500,
      attempt: 2,
      causeChain: ["first", "second"],
    });
  });

  test("classifyForRetry should preserve provider status classifications", () => {
    const retryableByStatus = ErrorUtils.classifyForRetry(
      new KMsgError(KMsgErrorCode.PROVIDER_ERROR, "provider unavailable"),
    );
    expect(retryableByStatus).toBe("retryable");

    const nonRetryableByStatus = ErrorUtils.classifyForRetry(
      new KMsgError(KMsgErrorCode.INVALID_REQUEST, "bad request"),
    );
    expect(nonRetryableByStatus).toBe("non_retryable");
  });

  test("classifyForRetry should fallback to policy for unknown code", () => {
    const unknownError = { code: "OUT_OF_SKIN", message: "unknown" };
    expect(
      ErrorUtils.classifyForRetry(unknownError, { fallback: "retryable" }),
    ).toBe("retryable");
    expect(
      ErrorUtils.classifyForRetry(unknownError, { fallback: "non_retryable" }),
    ).toBe("non_retryable");
  });

  test("classifyForRetry applies explicit code and status policies", () => {
    const statusOverride = new KMsgError(
      KMsgErrorCode.UNKNOWN_ERROR,
      "too many requests",
      undefined,
      { httpStatus: 429 },
    );
    expect(
      ErrorUtils.classifyForRetry(statusOverride, {
        nonRetryableStatuses: ["429"],
      }),
    ).toBe("non_retryable");

    const codeOverride = new KMsgError(
      KMsgErrorCode.NETWORK_ERROR,
      "bad gateway",
      undefined,
      { httpStatus: 400 },
    );
    expect(
      ErrorUtils.classifyForRetry(codeOverride, {
        retryableCodes: [KMsgErrorCode.NETWORK_ERROR],
        nonRetryableStatuses: ["400"],
      }),
    ).toBe("retryable");

    expect(
      ErrorUtils.classifyForRetry(
        { status: 503, message: "maintenance" },
        { nonRetryableStatuses: ["503"] },
      ),
    ).toBe("non_retryable");

    expect(
      ErrorUtils.classifyForRetry(
        new KMsgError(KMsgErrorCode.UNKNOWN_ERROR, "do not retry"),
        { nonRetryableCodes: [KMsgErrorCode.UNKNOWN_ERROR] },
      ),
    ).toBe("non_retryable");
  });

  test("classifyForRetry preserves legacy raw 5xx callback precedence", () => {
    const policy = {
      classifyByStatusCode: () => "non_retryable" as const,
    };

    expect(ErrorUtils.classifyForRetry({ status: "503" }, policy)).toBe(
      "retryable",
    );
    expect(ErrorUtils.classifyForRetry({ status: 503 }, policy)).toBe(
      "non_retryable",
    );
  });
});

describe("retry policy parser", () => {
  test("normalizes valid policy in safe mode", () => {
    const result = validateErrorRetryPolicy({
      retryableCodes: ["NETWORK_ERROR", "PROVIDER_ERROR"],
      nonRetryableCodes: ["INVALID_REQUEST"],
      retryableStatuses: ["503", "VENDOR_BUSY"],
      nonRetryableStatuses: ["400"],
      fallback: "retryable",
      retryAfterMs: {
        defaultMs: 1_000,
        byCode: { VENDOR_BUSY: 2_000 },
        byStatus: { "429": 3_000 },
      },
    });

    expect(result.policy).toEqual({
      retryableCodes: ["NETWORK_ERROR", "PROVIDER_ERROR"],
      nonRetryableCodes: ["INVALID_REQUEST"],
      retryableStatuses: ["503", "VENDOR_BUSY"],
      nonRetryableStatuses: ["400"],
      fallback: "retryable",
      retryAfterMs: {
        defaultMs: 1_000,
        byCode: { VENDOR_BUSY: 2_000 },
        byStatus: { "429": 3_000 },
      },
    });
    expect(result.issues).toHaveLength(0);
  });

  test("safe mode removes unknown and conflicting codes with issues", () => {
    const result = validateErrorRetryPolicy({
      retryableCodes: ["NETWORK_ERROR", "OUT_OF_SKIN", "INVALID_REQUEST"],
      nonRetryableCodes: ["INVALID_REQUEST"],
    });

    expect(result.policy).toEqual({
      retryableCodes: ["NETWORK_ERROR"],
      nonRetryableCodes: ["INVALID_REQUEST"],
    });
    expect(result.issues.some((issue) => issue.code === "unknown_code")).toBe(
      true,
    );
    expect(
      result.issues.some((issue) => issue.code === "conflicting_code"),
    ).toBe(true);
  });

  test("compat mode accepts comma-delimited code strings", () => {
    const normalized = normalizeErrorRetryPolicy(
      {
        retryableCodes: "NETWORK_ERROR, PROVIDER_ERROR",
        nonRetryableCodes: "INVALID_REQUEST",
        retryableStatuses: "503, vendor_busy",
        nonRetryableStatuses: [400],
        fallback: "non-retryable",
        retryAfterMs: {
          defaultMs: "1000",
          byCode: { " vendor_busy ": "2000" },
          byStatus: { " 429 ": "3000" },
        },
      },
      { mode: "compat" },
    );

    expect(normalized).toEqual({
      retryableCodes: ["NETWORK_ERROR", "PROVIDER_ERROR"],
      nonRetryableCodes: ["INVALID_REQUEST"],
      retryableStatuses: ["503", "VENDOR_BUSY"],
      nonRetryableStatuses: ["400"],
      fallback: "non_retryable",
      retryAfterMs: {
        defaultMs: 1_000,
        byCode: { VENDOR_BUSY: 2_000 },
        byStatus: { "429": 3_000 },
      },
    });
  });

  test("removes conflicting statuses and invalid retry-after entries", () => {
    const result = validateErrorRetryPolicy({
      retryableStatuses: ["429", "503", " 503 "],
      nonRetryableStatuses: ["429"],
      retryAfterMs: {
        defaultMs: -1,
        byCode: {
          VENDOR_BUSY: 2_000,
          " vendor_busy ": 3_000,
          INVALID: Number.NaN,
        },
        byStatus: "invalid",
        unknown: true,
      },
    });

    expect(result.policy).toEqual({
      retryableStatuses: ["503"],
      nonRetryableStatuses: ["429"],
      retryAfterMs: {
        byCode: { VENDOR_BUSY: 2_000 },
      },
    });
    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        "duplicate_status",
        "conflicting_status",
        "invalid_retry_after",
        "duplicate_key",
        "invalid_type",
        "unknown_field",
      ]),
    );
  });

  test("preserves programmatic retry-after resolvers", () => {
    const retryAfterMs = () => 250;
    const result = validateErrorRetryPolicy({ retryAfterMs });

    expect(result.policy?.retryAfterMs).toBe(retryAfterMs);
    expect(result.issues).toHaveLength(0);
  });

  test("parses status and retry-after policy from json", () => {
    const parsed = parseErrorRetryPolicyFromJson(
      JSON.stringify({
        retryableStatuses: [429, "503"],
        retryAfterMs: {
          byCode: { vendor_busy: "2000" },
          byStatus: { "429": 3_000 },
        },
      }),
      { mode: "compat" },
    );

    expect(parsed).toEqual({
      retryableStatuses: ["429", "503"],
      retryAfterMs: {
        byCode: { VENDOR_BUSY: 2_000 },
        byStatus: { "429": 3_000 },
      },
    });
  });

  test("returns null for invalid json payload", () => {
    expect(parseErrorRetryPolicyFromJson("{bad-json")).toBeNull();
  });
});

describe("normalizeProviderError", () => {
  test("keeps metadata from KMsgError and reports metadata sources", () => {
    const normalized = normalizeProviderError(
      new KMsgError(KMsgErrorCode.NETWORK_TIMEOUT, "timeout", undefined, {
        providerErrorCode: "ETIMEDOUT",
        providerErrorText: "gateway timeout",
        httpStatus: 504,
        requestId: "req-1",
        retryAfterMs: 1000,
        attempt: 2,
        causeChain: ["root"],
      }),
    );

    expect(normalized.code).toBe(KMsgErrorCode.NETWORK_TIMEOUT);
    expect(normalized.providerErrorCode).toBe("ETIMEDOUT");
    expect(normalized.sources.providerErrorCode).toBe("metadata");
    expect(normalized.sources.httpStatus).toBe("metadata");
    expect(normalized.sources.classification).toBe("fallback");
  });

  test("compat mode can read legacy fields from details", () => {
    const normalized = normalizeProviderError(
      new KMsgError(KMsgErrorCode.UNKNOWN_ERROR, "failed", {
        errorCode: "LEGACY_1",
        errorMessage: "legacy message",
        httpStatus: 503,
        requestId: "legacy-req",
        retryAfterMs: 1200,
        attempt: 3,
      }),
      { mode: "compat" },
    );

    expect(normalized.providerErrorCode).toBe("LEGACY_1");
    expect(normalized.providerErrorText).toBe("legacy message");
    expect(normalized.httpStatus).toBe(503);
    expect(normalized.requestId).toBe("legacy-req");
    expect(normalized.retryAfterMs).toBe(1200);
    expect(normalized.attempt).toBe(3);
    expect(normalized.sources.providerErrorCode).toBe("details");
  });

  test("normalizes http-like errors and respects policy source", () => {
    const normalized = normalizeProviderError(
      { status: 503, message: "server down", requestId: "req-http" },
      { policy: { fallback: "retryable" } },
    );

    expect(normalized.code).toBe(KMsgErrorCode.PROVIDER_ERROR);
    expect(normalized.classification).toBe("retryable");
    expect(normalized.sources.code).toBe("http");
    expect(normalized.sources.classification).toBe("policy");
  });

  test("applies status classification and retry-after mappings", () => {
    const normalized = normalizeProviderError(
      {
        status: 429,
        message: "provider busy",
        providerErrorCode: "vendor_busy",
      },
      {
        mode: "compat",
        policy: {
          nonRetryableStatuses: ["429"],
          retryAfterMs: {
            defaultMs: 5_000,
            byCode: { VENDOR_BUSY: 2_000 },
            byStatus: { "429": 3_000 },
          },
        },
      },
    );

    expect(normalized.classification).toBe("non_retryable");
    expect(normalized.retryAfterMs).toBe(2000);
    expect(normalized.sources.retryAfterMs).toBe("policy");
  });

  test("keeps direct retry-after metadata ahead of declarative mappings", () => {
    const normalized = normalizeProviderError(
      new KMsgError(
        KMsgErrorCode.RATE_LIMIT_EXCEEDED,
        "rate limited",
        undefined,
        {
          providerErrorCode: "VENDOR_BUSY",
          httpStatus: 429,
          retryAfterMs: 750,
        },
      ),
      {
        policy: {
          retryAfterMs: {
            defaultMs: 5_000,
            byCode: { VENDOR_BUSY: 2_000 },
            byStatus: { "429": 3_000 },
          },
        },
      },
    );

    expect(normalized.retryAfterMs).toBe(750);
    expect(normalized.sources.retryAfterMs).toBe("metadata");
  });

  test("reflects function retry-after overrides in normalized output", () => {
    const normalized = normalizeProviderError(
      new KMsgError(
        KMsgErrorCode.RATE_LIMIT_EXCEEDED,
        "rate limited",
        undefined,
        { retryAfterMs: 750 },
      ),
      { policy: { retryAfterMs: () => 250 } },
    );

    expect(normalized.retryAfterMs).toBe(250);
    expect(normalized.sources.retryAfterMs).toBe("policy");
  });
});
