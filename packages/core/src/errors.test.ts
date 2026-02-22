import { describe, expect, test } from "bun:test";
import { ErrorUtils, KMsgError, KMsgErrorCode } from "./errors";

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
