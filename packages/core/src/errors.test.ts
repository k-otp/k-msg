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
});
