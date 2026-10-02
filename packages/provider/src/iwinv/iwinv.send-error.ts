import { KMsgError, KMsgErrorCode } from "@k-msg/core";
import { isObjectRecord } from "../shared/type-guards";
import {
  IWINV_SEND_ERROR_REASONS,
  type IWINVSendErrorReason,
} from "./types/iwinv";

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

export type IwinvSendChannel = "sms" | "alimtalk";

// SMS codes are from IWINV's SMS v2 send result-code table; AlimTalk 505 from
// its AlimTalk table and 206 from the IP note in this provider's README.
const REASON_BY_CODE: Record<
  IwinvSendChannel,
  Readonly<Record<string, IWINVSendErrorReason>>
> = {
  sms: {
    "13": "SENDER_NUMBER_NOT_REGISTERED",
    "15": "IP_NOT_ALLOWED",
    "206": "IP_NOT_ALLOWED",
    "41": "RECIPIENT_NUMBER_INVALID",
    "50": "AUTO_CHARGE_LIMIT_EXCEEDED",
  },
  alimtalk: {
    "505": "SENDER_NUMBER_NOT_REGISTERED",
    "206": "IP_NOT_ALLOWED",
  },
};

// IWINV also refuses with texts its code tables do not list, such as
// "조직(업체) 발신번호가 일치하지 않습니다.", so the text is read as well.
const SENDER_NUMBER_TEXT = /발신\s*번호/;
const NOT_REGISTERED_TEXT =
  /일치하지\s*않|등록되지\s*않|미\s*등록|사전에\s*등록/;
const IP_NOT_ALLOWED_TEXT = /(등록하지|허용되지)\s*않은\s*IP/i;

// The normalized code a reason read from IWINV's text implies. Both are
// refusals that a retry repeats.
const CODE_BY_TEXT_REASON: Partial<
  Record<IWINVSendErrorReason, KMsgErrorCode>
> = {
  SENDER_NUMBER_NOT_REGISTERED: KMsgErrorCode.INVALID_REQUEST,
  IP_NOT_ALLOWED: KMsgErrorCode.AUTHENTICATION_FAILED,
};

function isRateLimitOrServerFailure(value: number | undefined): boolean {
  return value !== undefined && (value === 429 || value >= 500);
}

/**
 * Returns the normalized code for a refusal whose reason came from IWINV's
 * text. The text replaces only the generic code an unlisted code falls back
 * to, so a rate limit, an HTTP 5xx or a 5xx code keeps its own code.
 */
function resolveTextReasonCode(
  reason: IWINVSendErrorReason,
  code: KMsgErrorCode,
  httpStatus: number,
  providerCode: string | undefined,
): KMsgErrorCode {
  const implied = CODE_BY_TEXT_REASON[reason];
  if (!implied) return code;
  if (
    code !== KMsgErrorCode.PROVIDER_ERROR &&
    code !== KMsgErrorCode.NETWORK_ERROR
  ) {
    return code;
  }
  const numericCode =
    providerCode !== undefined ? Number(providerCode) : undefined;
  if (
    isRateLimitOrServerFailure(httpStatus) ||
    isRateLimitOrServerFailure(
      Number.isFinite(numericCode) ? numericCode : undefined,
    )
  ) {
    return code;
  }
  return implied;
}

/**
 * Names why IWINV refused a send, from its code or else its text, or returns
 * `undefined` when neither says more than the normalized code does.
 */
export function classifyIwinvSendFailure(
  channel: IwinvSendChannel,
  providerCode: string | undefined,
  providerText: string | undefined,
): { reason: IWINVSendErrorReason; source: "code" | "text" } | undefined {
  const byCode =
    providerCode !== undefined
      ? REASON_BY_CODE[channel][providerCode]
      : undefined;
  if (byCode) return { reason: byCode, source: "code" };
  if (!providerText) return undefined;

  if (
    SENDER_NUMBER_TEXT.test(providerText) &&
    NOT_REGISTERED_TEXT.test(providerText)
  ) {
    return { reason: "SENDER_NUMBER_NOT_REGISTERED", source: "text" };
  }
  if (IP_NOT_ALLOWED_TEXT.test(providerText)) {
    return { reason: "IP_NOT_ALLOWED", source: "text" };
  }
  return undefined;
}

/**
 * Builds the error for a send IWINV answered with a failure. IWINV's own code
 * and text go on `providerErrorCode`/`providerErrorText` and the HTTP status
 * on `httpStatus`; `details.originalCode` keeps the raw code as before, and
 * `details.reason` names the refusal when IWINV's code or text identifies it.
 * A sender-number or IP refusal read from the text takes the normalized code it
 * implies in place of the generic one an unlisted code falls back to, so it is
 * not retried as a provider error.
 */
export function toIwinvSendError(params: {
  providerId: string;
  channel: IwinvSendChannel;
  code: KMsgErrorCode;
  message: string;
  httpStatus: number;
  originalCode: unknown;
  providerCode?: string;
  providerText?: string;
}): KMsgError {
  const {
    providerId,
    channel,
    code,
    message,
    httpStatus,
    originalCode,
    providerCode,
    providerText,
  } = params;
  const classified = classifyIwinvSendFailure(
    channel,
    providerCode,
    providerText,
  );
  const reason = classified?.reason;
  const resolvedCode =
    classified?.source === "text"
      ? resolveTextReasonCode(classified.reason, code, httpStatus, providerCode)
      : code;

  return new KMsgError(
    resolvedCode,
    message,
    { providerId, originalCode, ...(reason ? { reason } : {}) },
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

/**
 * Returns `details.reason` of an IWINV send error, or `undefined` when the
 * error has none (or a value this version does not know).
 */
export function getIWINVSendErrorReason(
  error: unknown,
): IWINVSendErrorReason | undefined {
  if (!isObjectRecord(error) || !isObjectRecord(error.details)) {
    return undefined;
  }
  const reason = error.details.reason;
  return (IWINV_SEND_ERROR_REASONS as readonly unknown[]).includes(reason)
    ? (reason as IWINVSendErrorReason)
    : undefined;
}
