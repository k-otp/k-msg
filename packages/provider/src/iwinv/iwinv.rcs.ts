import {
  type DeliveryStatus,
  type DeliveryStatusQuery,
  type DeliveryStatusResult,
  fail,
  KMsgError,
  KMsgErrorCode,
  type MessageVariables,
  ok,
  type ProviderRequestContext,
  type RcsTemplateSendOptions,
  type Result,
  type SendResult,
} from "@k-msg/core";
import { utf8ToBase64 } from "../shared/base64";
import { safeParseJson, toRecordOrFallback } from "../shared/http-json";
import {
  fetchWithProviderContext,
  toProviderTransportError,
} from "../shared/provider-transport";
import { isObjectRecord } from "../shared/type-guards";
import { IWINV_RCS_BASE_URL } from "./iwinv.constants";
import type { NormalizedIwinvConfig } from "./iwinv.internal.types";
import {
  toIwinvProviderCode,
  toIwinvProviderText,
  toIwinvSendError,
} from "./iwinv.send-error";
import { normalizePhoneNumber } from "./iwinv.sms.helpers";
import { formatIwinvDate, parseIwinvDateTime } from "./iwinv.time";

export type IwinvRcsSendOptions = RcsTemplateSendOptions & { type: "RCS_TPL" };

const RCS_SEND_PATH = "/api/v1/send/";
const RCS_HISTORY_PATH = "/api/v1/history/";

/**
 * IWINV's RCS send answer carries no message key (its `msgkey` appears only in
 * the history API), so a send reports this prefix with its brand and template
 * as `providerMessageId`, and the status lookup finds the message by those,
 * the recipient and the request time.
 */
const RCS_CORRELATION_PREFIX = "iwinv-rcs:";

/** The longest fallback text IWINV takes, in bytes, per fallback type. */
const RCS_FALLBACK_MAX_BYTES = { SMS: 90, LMS: 2000 } as const;

/**
 * How far before a send's request time its history row may be stamped, to
 * allow for clock skew between this host and IWINV.
 */
const RCS_HISTORY_SKEW_MS = 60_000;

/**
 * Returns an error for an RCS operation on a provider configured without
 * `rcsApiKey`, before any request is made.
 */
export function requireRcsApiKey(
  config: NormalizedIwinvConfig,
  providerId: string,
): KMsgError | undefined {
  if (typeof config.rcsApiKey === "string" && config.rcsApiKey.length > 0) {
    return undefined;
  }
  return new KMsgError(
    KMsgErrorCode.INVALID_REQUEST,
    "IWINV RCS operations require `rcsApiKey` (the RCS send API key)",
    { providerId },
  );
}

function getRcsHeaders(config: NormalizedIwinvConfig): Record<string, string> {
  const headers: Record<string, string> = {
    AUTH: utf8ToBase64(config.rcsApiKey ?? ""),
    "Content-Type": "application/json;charset=UTF-8",
  };
  if (
    typeof config.xForwardedFor === "string" &&
    config.xForwardedFor.length > 0
  ) {
    headers["X-Forwarded-For"] = config.xForwardedFor;
  }
  return config.extraHeaders && typeof config.extraHeaders === "object"
    ? { ...headers, ...config.extraHeaders }
    : headers;
}

// IWINV's RCS send result codes: refusals of the account, brand, template,
// variables, numbers or balance. 223 (an auto-charge in progress) passes once
// the charge completes, so it stays retryable.
const RCS_ERROR_CODES: Readonly<Record<number, KMsgErrorCode>> = {
  202: KMsgErrorCode.AUTHENTICATION_FAILED,
  203: KMsgErrorCode.INVALID_REQUEST,
  204: KMsgErrorCode.AUTHENTICATION_FAILED,
  205: KMsgErrorCode.AUTHENTICATION_FAILED,
  206: KMsgErrorCode.AUTHENTICATION_FAILED,
  207: KMsgErrorCode.TEMPLATE_NOT_FOUND,
  208: KMsgErrorCode.INVALID_REQUEST,
  209: KMsgErrorCode.INVALID_REQUEST,
  210: KMsgErrorCode.INVALID_REQUEST,
  211: KMsgErrorCode.INVALID_REQUEST,
  212: KMsgErrorCode.INVALID_REQUEST,
  213: KMsgErrorCode.INVALID_REQUEST,
  214: KMsgErrorCode.INVALID_REQUEST,
  215: KMsgErrorCode.INVALID_REQUEST,
  216: KMsgErrorCode.INVALID_REQUEST,
  217: KMsgErrorCode.INVALID_REQUEST,
  218: KMsgErrorCode.INVALID_REQUEST,
  219: KMsgErrorCode.INVALID_REQUEST,
  220: KMsgErrorCode.INVALID_REQUEST,
  221: KMsgErrorCode.INVALID_REQUEST,
  222: KMsgErrorCode.INSUFFICIENT_BALANCE,
  223: KMsgErrorCode.PROVIDER_ERROR,
  224: KMsgErrorCode.INSUFFICIENT_BALANCE,
  225: KMsgErrorCode.INSUFFICIENT_BALANCE,
};

/**
 * Maps an RCS answer that is not a success to a normalized code. As for
 * AlimTalk, HTTP `429` and 5xx decide first. Then IWINV's listed codes do; an
 * unlisted code, or a 2xx answer without one, is `PROVIDER_ERROR`, since IWINV
 * may have accepted the send. A non-2xx answer without a code maps by its
 * status.
 */
export function mapRcsErrorCode(
  code: number | undefined,
  httpStatus: number,
): KMsgErrorCode {
  if (httpStatus === 429) return KMsgErrorCode.RATE_LIMIT_EXCEEDED;
  if (httpStatus >= 500) return KMsgErrorCode.PROVIDER_ERROR;
  if (code === undefined) {
    if (httpStatus >= 200 && httpStatus < 300) {
      return KMsgErrorCode.PROVIDER_ERROR;
    }
    return httpStatus === 401 || httpStatus === 403
      ? KMsgErrorCode.AUTHENTICATION_FAILED
      : KMsgErrorCode.INVALID_REQUEST;
  }
  if (code === 429) return KMsgErrorCode.RATE_LIMIT_EXCEEDED;
  return RCS_ERROR_CODES[code] ?? KMsgErrorCode.PROVIDER_ERROR;
}

function trimmedText(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

/**
 * Counts SMS bytes the way `KMsg` sizes SMS and LMS: one byte per ASCII
 * character, two for any other (Hangul).
 */
function countSmsBytes(text: string): number {
  let bytes = 0;
  for (let index = 0; index < text.length; index += 1) {
    bytes += text.charCodeAt(index) <= 0x7f ? 1 : 2;
  }
  return bytes;
}

function invalid(
  providerId: string,
  message: string,
): Result<never, KMsgError> {
  return fail(
    new KMsgError(KMsgErrorCode.INVALID_REQUEST, message, { providerId }),
  );
}

function readYesNo(
  value: unknown,
  name: string,
  providerId: string,
): Result<"Y" | "N" | undefined, KMsgError> {
  if (value === undefined) return ok(undefined);
  const normalized =
    typeof value === "string" ? value.trim().toUpperCase() : "";
  if (normalized === "Y" || normalized === "N") return ok(normalized);
  return invalid(providerId, `${name} must be 'Y' or 'N'`);
}

/**
 * Builds IWINV's fallback fields (`reSend`, `resendType`, `resendTitle`,
 * `resendContent`) from `failover`, with `providerOptions` fields of the same
 * names taking precedence. A fallback is sent when `failover.enabled` is
 * true, or when it is unset and fallback text is given, unless
 * `rcs.disableSms` is true; otherwise IWINV's default (none) applies.
 */
function resolveRcsFallback(
  options: IwinvRcsSendOptions,
  providerId: string,
): Result<Record<string, string>, KMsgError> {
  const providerOptions = options.providerOptions ?? {};
  const failover = options.failover;

  const content =
    trimmedText(providerOptions.resendContent) ??
    trimmedText(failover?.fallbackContent);
  const title =
    trimmedText(providerOptions.resendTitle) ??
    trimmedText(failover?.fallbackTitle);

  const reSendOverride = readYesNo(
    providerOptions.reSend,
    "providerOptions.reSend",
    providerId,
  );
  if (reSendOverride.isFailure) return reSendOverride;
  const reSend =
    reSendOverride.value ??
    (failover?.enabled === true
      ? "Y"
      : failover?.enabled === false || options.rcs?.disableSms === true
        ? "N"
        : content
          ? "Y"
          : "N");
  if (reSend === "N") return ok({ reSend });

  let resendType: "SMS" | "LMS" | undefined;
  if (providerOptions.resendType !== undefined) {
    const raw =
      typeof providerOptions.resendType === "string"
        ? providerOptions.resendType.trim().toUpperCase()
        : "";
    if (raw !== "SMS" && raw !== "LMS") {
      return invalid(
        providerId,
        "providerOptions.resendType must be 'SMS' or 'LMS'",
      );
    }
    resendType = raw;
  } else if (failover?.fallbackChannel === "sms") {
    resendType = "SMS";
  } else if (failover?.fallbackChannel === "lms") {
    resendType = "LMS";
  } else if (content) {
    resendType =
      countSmsBytes(content) > RCS_FALLBACK_MAX_BYTES.SMS ? "LMS" : "SMS";
  }

  if (content) {
    const maxBytes = RCS_FALLBACK_MAX_BYTES[resendType ?? "LMS"];
    if (countSmsBytes(content) > maxBytes) {
      return invalid(
        providerId,
        `RCS fallback ${resendType ?? "LMS"} content must be at most ${maxBytes} bytes`,
      );
    }
  }

  return ok({
    reSend,
    ...(resendType ? { resendType } : {}),
    ...(title && resendType !== "SMS" ? { resendTitle: title } : {}),
    ...(content ? { resendContent: content } : {}),
  });
}

function toTemplateParamValue(
  value: MessageVariables[string],
): string | undefined {
  if (value === undefined) return undefined;
  if (value === null) return "";
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

/** IWINV takes RCS template variables by name, as strings. */
function buildTemplateParam(
  options: IwinvRcsSendOptions,
): Record<string, string> | undefined {
  const merged: MessageVariables = {
    ...(options.variables ?? {}),
    ...(isObjectRecord(options.rcs?.variables)
      ? (options.rcs.variables as MessageVariables)
      : {}),
  };
  const param: Record<string, string> = {};
  for (const [name, value] of Object.entries(merged)) {
    const text = toTemplateParamValue(value);
    if (text !== undefined) param[name] = text;
  }
  return Object.keys(param).length > 0 ? param : undefined;
}

function toRcsCorrelationId(brandId: string, templateCode: string): string {
  return `${RCS_CORRELATION_PREFIX}${encodeURIComponent(brandId)}:${encodeURIComponent(templateCode)}`;
}

function parseRcsCorrelationId(
  value: string,
): { brandId: string; templateCode: string } | undefined {
  if (!value.startsWith(RCS_CORRELATION_PREFIX)) return undefined;
  const [brandId, templateCode, ...rest] = value
    .slice(RCS_CORRELATION_PREFIX.length)
    .split(":");
  if (!brandId || !templateCode || rest.length > 0) return undefined;
  try {
    return {
      brandId: decodeURIComponent(brandId),
      templateCode: decodeURIComponent(templateCode),
    };
  } catch {
    return undefined;
  }
}

/** Reads IWINV's integer code from a response body, number or string. */
function readRcsCode(
  body: unknown,
  isRecord: boolean,
): { providerCode?: string; code?: number } {
  const providerCode = toIwinvProviderCode(
    isRecord ? (body as Record<string, unknown>).code : body,
  );
  return {
    providerCode,
    code: providerCode !== undefined ? Number(providerCode) : undefined,
  };
}

function toCount(value: unknown): number | undefined {
  const code = toIwinvProviderCode(value);
  return code !== undefined ? Number(code) : undefined;
}

export async function sendRcs(params: {
  providerId: string;
  config: NormalizedIwinvConfig;
  options: IwinvRcsSendOptions;
  context?: ProviderRequestContext;
}): Promise<Result<SendResult, KMsgError>> {
  const { providerId, config, options, context } = params;
  const missingKey = requireRcsApiKey(config, providerId);
  if (missingKey) return fail(missingKey);

  const templateCode =
    trimmedText(options.rcs?.templateId) ?? trimmedText(options.templateId);
  if (!templateCode) {
    return invalid(providerId, "templateId is required for RCS_TPL");
  }

  const brandId =
    trimmedText(options.rcs?.brandId) ?? trimmedText(config.rcsBrandId);
  if (!brandId) {
    return invalid(
      providerId,
      "RCS brandId is required (options.rcs.brandId or config.rcsBrandId)",
    );
  }

  const to = normalizePhoneNumber(options.to);
  if (!to) return invalid(providerId, "to is required");

  const callback = normalizePhoneNumber(
    trimmedText(options.from) ??
      trimmedText(config.rcsSenderNumber) ??
      trimmedText(config.senderNumber) ??
      "",
  );
  if (!callback) {
    return invalid(
      providerId,
      "from is required for RCS_TPL (options.from, config.rcsSenderNumber or config.senderNumber)",
    );
  }

  const fallback = resolveRcsFallback(options, providerId);
  if (fallback.isFailure) return fallback;

  const scheduledAt = options.options?.scheduledAt;
  const scheduled =
    scheduledAt instanceof Date && !Number.isNaN(scheduledAt.getTime());
  const templateParam = buildTemplateParam(options);

  const payload: Record<string, unknown> = {
    brandId,
    templateCode,
    callback,
    reserve: scheduled ? "Y" : "N",
    ...(scheduled ? { sendDate: formatIwinvDate(scheduledAt) } : {}),
    list: [{ phone: to, ...(templateParam ? { templateParam } : {}) }],
    ...fallback.value,
  };

  try {
    const response = await fetchWithProviderContext(
      context,
      `${IWINV_RCS_BASE_URL}${RCS_SEND_PATH}`,
      {
        method: "POST",
        headers: getRcsHeaders(config),
        body: JSON.stringify(payload),
      },
      providerId,
    );

    const responseText = await response.text();
    const parsed = safeParseJson(responseText);
    const isRecord = isObjectRecord(parsed);
    const data = isRecord ? parsed : {};
    // A bare-code body is IWINV's code; any other body (an HTML error page)
    // is neither its code nor its text.
    const { providerCode, code } = readRcsCode(parsed, isRecord);

    if (!response.ok || code !== 200) {
      return fail(
        toIwinvSendError({
          providerId,
          channel: "rcs",
          code: mapRcsErrorCode(code, response.status),
          message:
            toIwinvProviderText(isRecord ? data.message : responseText) ??
            "IWINV RCS send failed",
          httpStatus: response.status,
          originalCode: isRecord ? data.code : (code ?? response.status),
          providerCode,
          providerText: isRecord
            ? toIwinvProviderText(data.message)
            : undefined,
        }),
      );
    }

    // `success` counts the recipients IWINV took. None taken means the send
    // did not go out, although IWINV answered 200.
    if (toCount(data.success) === 0) {
      return fail(
        new KMsgError(
          KMsgErrorCode.PROVIDER_ERROR,
          "IWINV accepted no recipient of the RCS send",
          {
            providerId,
            originalCode: data.code,
            success: data.success,
            fail: data.fail,
          },
          {
            providerErrorCode: providerCode,
            ...(toIwinvProviderText(data.message) !== undefined
              ? { providerErrorText: toIwinvProviderText(data.message) }
              : {}),
            httpStatus: response.status,
          },
        ),
      );
    }

    return ok({
      messageId: options.messageId || crypto.randomUUID(),
      providerId,
      providerMessageId: toRcsCorrelationId(brandId, templateCode),
      status: scheduled ? "PENDING" : "SENT",
      type: options.type,
      to: options.to,
      raw: data,
    });
  } catch (error) {
    return fail(toProviderTransportError(error, context?.signal, providerId));
  }
}

/**
 * Maps an RCS history row to a delivery status. IWINV documents `state` as
 * 수신완료 (received), 수신실패 (failed) or 대기 (waiting), and its example
 * shows 발송완료 (sent) with `done_code` "10000" and `done_message` "성공"; it
 * publishes no `done_code` table, so any other `done_code` counts as failed,
 * and a row with neither is still pending.
 */
export function mapIwinvRcsHistoryStatus(
  state: string | undefined,
  doneCode: string | undefined,
  doneMessage: string | undefined,
): DeliveryStatus {
  if (state?.includes("수신완료")) return "DELIVERED";
  if (state?.includes("실패")) return "FAILED";
  if (state?.includes("대기")) return "PENDING";
  if (doneCode === "10000" || doneMessage?.includes("성공")) {
    return "DELIVERED";
  }
  if (doneCode) return "FAILED";
  if (state) return "SENT";
  return "PENDING";
}

function readString(value: unknown): string | undefined {
  if (typeof value === "number") return String(value);
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

/**
 * Picks the history row of a send whose `providerMessageId` was a correlation
 * id: a row of the brand and template (sent through the API when IWINV says),
 * requested no earlier than the send less {@link RCS_HISTORY_SKEW_MS}, whose
 * request time is closest to the send's (or to its scheduled time). Two sends
 * of one template to one recipient within moments of each other cannot be
 * told apart this way.
 */
function pickCorrelatedRow(
  rows: readonly Record<string, unknown>[],
  correlation: { brandId: string; templateCode: string },
  query: DeliveryStatusQuery,
): Record<string, unknown> | undefined {
  const references = [query.requestedAt.getTime()];
  if (
    query.scheduledAt instanceof Date &&
    !Number.isNaN(query.scheduledAt.getTime())
  ) {
    references.push(query.scheduledAt.getTime());
  }
  const earliest = query.requestedAt.getTime() - RCS_HISTORY_SKEW_MS;

  let best: { row: Record<string, unknown>; distance: number } | undefined;
  for (const row of rows) {
    const templateCode = readString(row.template_code);
    if (
      templateCode !== undefined &&
      templateCode !== correlation.templateCode
    ) {
      continue;
    }
    const sendMethod = readString(row.send_method);
    if (sendMethod !== undefined && sendMethod.toUpperCase() !== "API") {
      continue;
    }
    const requested = parseIwinvDateTime(row.req_date)?.getTime();
    if (requested === undefined || requested < earliest) continue;
    const distance = Math.min(
      ...references.map((reference) => Math.abs(requested - reference)),
    );
    if (!best || distance < best.distance) best = { row, distance };
  }
  return best?.row;
}

export async function getRcsDeliveryStatus(params: {
  providerId: string;
  config: NormalizedIwinvConfig;
  query: DeliveryStatusQuery;
  context?: ProviderRequestContext;
}): Promise<Result<DeliveryStatusResult | null, KMsgError>> {
  const { providerId, config, query, context } = params;
  const missingKey = requireRcsApiKey(config, providerId);
  if (missingKey) return fail(missingKey);

  const providerMessageId = query.providerMessageId.trim();
  if (!providerMessageId) {
    return invalid(providerId, "providerMessageId is required");
  }
  const to = normalizePhoneNumber(query.to);
  if (!to) return invalid(providerId, "to is required");

  // A correlation id from `sendRcs`, or else IWINV's own `msgkey`.
  const correlation = parseRcsCorrelationId(providerMessageId);
  const start = new Date(query.requestedAt.getTime() - RCS_HISTORY_SKEW_MS);
  const end = new Date(
    Math.max(
      Date.now(),
      query.scheduledAt instanceof Date ? query.scheduledAt.getTime() : 0,
    ) + RCS_HISTORY_SKEW_MS,
  );

  const payload: Record<string, unknown> = {
    pageNum: 1,
    pageSize: 100,
    startDate: formatIwinvDate(start),
    endDate: formatIwinvDate(end),
    phone: to,
    ...(correlation
      ? {
          brandId: correlation.brandId,
          templateCode: correlation.templateCode,
        }
      : { msgkey: providerMessageId }),
  };

  try {
    const response = await fetchWithProviderContext(
      context,
      `${IWINV_RCS_BASE_URL}${RCS_HISTORY_PATH}`,
      {
        method: "POST",
        headers: getRcsHeaders(config),
        body: JSON.stringify(payload),
      },
      providerId,
    );

    const responseText = await response.text();
    const parsed = safeParseJson(responseText);
    const data = toRecordOrFallback(parsed, {});
    const { providerCode, code } = readRcsCode(parsed, isObjectRecord(parsed));

    if (!response.ok || code !== 200) {
      const providerText = toIwinvProviderText(data.message);
      return fail(
        new KMsgError(
          mapRcsErrorCode(code, response.status),
          providerText ?? "IWINV RCS history query failed",
          { providerId, originalCode: data.code ?? response.status },
          {
            ...(providerCode !== undefined
              ? { providerErrorCode: providerCode }
              : {}),
            ...(providerText !== undefined
              ? { providerErrorText: providerText }
              : {}),
            httpStatus: response.status,
          },
        ),
      );
    }

    const rows = (Array.isArray(data.list) ? data.list : []).filter(
      isObjectRecord,
    );
    const row = correlation
      ? pickCorrelatedRow(rows, correlation, query)
      : rows.find((item) => readString(item.msgkey) === providerMessageId);
    if (!row) return ok(null);

    const state = readString(row.state);
    const statusCode = readString(row.done_code);
    const doneMessage = readString(row.done_message);
    const status = mapIwinvRcsHistoryStatus(state, statusCode, doneMessage);

    return ok({
      providerId,
      providerMessageId,
      status,
      statusCode,
      statusMessage: doneMessage ?? state,
      sentAt: parseIwinvDateTime(row.req_date),
      raw: row,
    });
  } catch (error) {
    return fail(toProviderTransportError(error, context?.signal, providerId));
  }
}
