import { KMsgError, type KMsgErrorCode } from "@k-msg/core";

const PROVIDER_CODE_PATTERN = /^[A-Za-z0-9_-]{1,32}$/;

/**
 * Returns IWINV's result code as a string, or `undefined` when the response
 * carried none. A body that is not a code (an HTML error page, say) is not
 * reported as one.
 */
export function toIwinvProviderCode(value: unknown): string | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return PROVIDER_CODE_PATTERN.test(trimmed) ? trimmed : undefined;
  }
  return undefined;
}

/** Returns IWINV's result message, or `undefined` when it sent none. */
export function toIwinvProviderText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Builds the error for a send IWINV answered with a failure. IWINV's own code
 * and text go on `providerErrorCode`/`providerErrorText` and the HTTP status
 * on `httpStatus`; `details.originalCode` keeps the raw code as before.
 */
export function toIwinvSendError(params: {
  providerId: string;
  code: KMsgErrorCode;
  message: string;
  httpStatus: number;
  originalCode: unknown;
  providerCode?: string;
  providerText?: string;
}): KMsgError {
  const {
    providerId,
    code,
    message,
    httpStatus,
    originalCode,
    providerCode,
    providerText,
  } = params;

  return new KMsgError(
    code,
    message,
    { providerId, originalCode },
    {
      ...(providerCode !== undefined
        ? { providerErrorCode: providerCode }
        : {}),
      ...(providerText !== undefined
        ? { providerErrorText: providerText }
        : {}),
      httpStatus,
    },
  );
}
