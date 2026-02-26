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
});

describe("retry policy parser", () => {
  test("normalizes valid policy in safe mode", () => {
    const result = validateErrorRetryPolicy({
      retryableCodes: ["NETWORK_ERROR", "PROVIDER_ERROR"],
      nonRetryableCodes: ["INVALID_REQUEST"],
      fallback: "retryable",
    });

    expect(result.policy).toEqual({
      retryableCodes: ["NETWORK_ERROR", "PROVIDER_ERROR"],
      nonRetryableCodes: ["INVALID_REQUEST"],
      fallback: "retryable",
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
        fallback: "non-retryable",
      },
      { mode: "compat" },
    );

    expect(normalized).toEqual({
      retryableCodes: ["NETWORK_ERROR", "PROVIDER_ERROR"],
      nonRetryableCodes: ["INVALID_REQUEST"],
      fallback: "non_retryable",
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
});
