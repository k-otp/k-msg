import {
  type DeliveryStatus,
  type DeliveryStatusQuery,
  type DeliveryStatusResult,
  fail,
  KMsgError,
  KMsgErrorCode,
  ok,
  type Result,
} from "@k-msg/core";
import { safeParseJson, toRecordOrFallback } from "../shared/http-json";
import { isObjectRecord } from "../shared/type-guards";
import {
  getAlimTalkHeaders,
  mapIwinvCodeToKMsgErrorCode,
  normalizeIwinvCode,
} from "./iwinv.alimtalk.helpers";
import type { NormalizedIwinvConfig } from "./iwinv.internal.types";
import {
  buildSmsSecretHeader,
  canSendSmsV2,
  mapSmsV2HistoryStatus,
  normalizePhoneNumber,
  resolveSmsBaseUrl,
} from "./iwinv.sms.helpers";
import {
  addDays,
  formatIwinvDate,
  formatSmsHistoryDate,
  parseIwinvDateTime,
} from "./iwinv.time";

export async function getAlimTalkDeliveryStatus(params: {
  providerId: string;
  config: NormalizedIwinvConfig;
  query: DeliveryStatusQuery;
}): Promise<Result<DeliveryStatusResult | null, KMsgError>> {
  const { providerId, config, query } = params;
  const providerMessageId = query.providerMessageId.trim();
  if (!providerMessageId) {
    return fail(
      new KMsgError(
        KMsgErrorCode.INVALID_REQUEST,
        "providerMessageId is required",
        { providerId },
      ),
    );
  }

  const to = normalizePhoneNumber(query.to);
  if (!to) {
    return fail(
      new KMsgError(KMsgErrorCode.INVALID_REQUEST, "to is required", {
        providerId,
      }),
    );
  }

  const seqNoValue = Number(providerMessageId);
  const seqNo = Number.isFinite(seqNoValue) ? seqNoValue : undefined;

  const startDate = formatIwinvDate(addDays(query.requestedAt, -1));
  const endDate = formatIwinvDate(new Date());

  const payload: Record<string, unknown> = {
    pageNum: 1,
    pageSize: 15,
    phone: to,
    startDate,
    endDate,
    ...(seqNo !== undefined ? { seqNo } : {}),
    ...(query.scheduledAt instanceof Date &&
    !Number.isNaN(query.scheduledAt.getTime())
      ? { reserve: "Y" }
      : {}),
  };

  const url = `${config.baseUrl}/api/history/`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: getAlimTalkHeaders(config),
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    const parsed = safeParseJson(responseText);

    const data = toRecordOrFallback(parsed, {});
    const codeRaw = data.code;
    const code = typeof codeRaw === "number" ? codeRaw : undefined;
    const message =
      typeof data.message === "string" && data.message.length > 0
        ? data.message
        : "IWINV history query failed";

    if (!response.ok || code !== 200) {
      return fail(
        new KMsgError(
          mapIwinvCodeToKMsgErrorCode(
            code ?? normalizeIwinvCode(parsed) ?? response.status,
          ),
          message,
          { providerId, originalCode: codeRaw ?? response.status },
        ),
      );
    }

    const listRaw = data.list;
    const list = Array.isArray(listRaw) ? (listRaw as Array<unknown>) : [];
    if (list.length === 0) return ok(null);

    const item = (() => {
      if (seqNo === undefined) return list[0];
      return (
        list.find((v) => isObjectRecord(v) && v.seqNo === seqNo) ?? list[0]
      );
    })();

    if (!isObjectRecord(item)) return ok(null);

    const statusCode =
      typeof item.statusCode === "string" ? item.statusCode : undefined;
    const statusMessage =
      typeof item.statusCodeName === "string" ? item.statusCodeName : undefined;

    const sendDate = parseIwinvDateTime(item.sendDate);
    const receiveDate = parseIwinvDateTime(item.receiveDate);

    const isDelivered =
      statusCode === "OK" ||
      (typeof statusMessage === "string" && statusMessage.includes("성공"));

    const status: DeliveryStatus = isDelivered
      ? "DELIVERED"
      : sendDate
        ? "FAILED"
        : "PENDING";

    return ok({
      providerId,
      providerMessageId,
      status,
      statusCode,
      statusMessage,
      sentAt: sendDate,
      deliveredAt: isDelivered ? receiveDate || sendDate : undefined,
      failedAt: !isDelivered && sendDate ? sendDate : undefined,
      raw: item,
    });
  } catch (error) {
    return fail(
      new KMsgError(
        KMsgErrorCode.NETWORK_ERROR,
        error instanceof Error ? error.message : String(error),
        { providerId },
      ),
    );
  }
}

export async function getSmsV2DeliveryStatus(params: {
  providerId: string;
  config: NormalizedIwinvConfig;
  query: DeliveryStatusQuery;
}): Promise<Result<DeliveryStatusResult | null, KMsgError>> {
  const { providerId, config, query } = params;

  if (!canSendSmsV2(config)) {
    return fail(
      new KMsgError(
        KMsgErrorCode.INVALID_REQUEST,
        "SMS v2 configuration missing (smsApiKey/smsAuthKey)",
        { providerId },
      ),
    );
  }

  if (!config.smsCompanyId || config.smsCompanyId.length === 0) {
    return fail(
      new KMsgError(
        KMsgErrorCode.INVALID_REQUEST,
        "smsCompanyId required for history (config.smsCompanyId)",
        { providerId },
      ),
    );
  }

  const providerMessageId = query.providerMessageId.trim();
  if (!providerMessageId) {
    return fail(
      new KMsgError(
        KMsgErrorCode.INVALID_REQUEST,
        "providerMessageId is required",
        { providerId },
      ),
    );
  }

  const to = normalizePhoneNumber(query.to);
  if (!to) {
    return fail(
      new KMsgError(KMsgErrorCode.INVALID_REQUEST, "to is required", {
        providerId,
      }),
    );
  }

  const start = addDays(query.requestedAt, -1);
  const end = new Date();
  const rangeMs = end.getTime() - start.getTime();
  const maxRangeMs = 90 * 24 * 60 * 60 * 1000;
  if (rangeMs > maxRangeMs) {
    return fail(
      new KMsgError(
        KMsgErrorCode.INVALID_REQUEST,
        "SMS history date range must be within 90 days",
        { providerId },
      ),
    );
  }

  const payload: Record<string, unknown> = {
    version: "1.0",
    companyid: config.smsCompanyId,
    startDate: formatSmsHistoryDate(start),
    endDate: formatSmsHistoryDate(end),
    requestNo: providerMessageId,
    pageNum: 1,
    pageSize: 15,
    phone: to,
  };

  const secretHeader = buildSmsSecretHeader(config);
  const headers: Record<string, string> = {
    "Content-Type": "application/json;charset=UTF-8",
    secret: secretHeader,
  };

  if (
    typeof config.xForwardedFor === "string" &&
    config.xForwardedFor.length > 0
  ) {
    headers["X-Forwarded-For"] = config.xForwardedFor;
  }

  const mergedHeaders =
    config.extraHeaders && typeof config.extraHeaders === "object"
      ? { ...headers, ...config.extraHeaders }
      : headers;

  const url = `${resolveSmsBaseUrl()}/api/history/`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: mergedHeaders,
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    const parsed = safeParseJson(responseText);

    const data = toRecordOrFallback(parsed, {});
    const codeRaw = data.resultCode;
    const code =
      typeof codeRaw === "number"
        ? codeRaw
        : typeof codeRaw === "string"
          ? Number(codeRaw)
          : NaN;
    const message =
      typeof data.message === "string" && data.message.length > 0
        ? data.message
        : "IWINV SMS history query failed";

    if (!response.ok || code !== 0) {
      return fail(
        new KMsgError(KMsgErrorCode.PROVIDER_ERROR, message, {
          providerId,
          originalCode: codeRaw ?? response.status,
        }),
      );
    }

    const listRaw = data.list;
    const list = Array.isArray(listRaw) ? (listRaw as Array<unknown>) : [];
    if (list.length === 0) return ok(null);

    const item = (() => {
      const found = list.find((v) => {
        if (!isObjectRecord(v)) return false;
        const req = v.requestNo;
        return req !== undefined && req !== null
          ? String(req) === providerMessageId
          : false;
      });
      return found ?? list[0];
    })();

    if (!isObjectRecord(item)) return ok(null);

    const statusCode =
      typeof item.sendStatusCode === "string" ? item.sendStatusCode : undefined;
    const statusMessage =
      typeof item.sendStatusMsg === "string"
        ? item.sendStatusMsg
        : typeof item.sendStatus === "string"
          ? item.sendStatus
          : undefined;

    const sendDate = parseIwinvDateTime(item.sendDate);
    const status = mapSmsV2HistoryStatus(statusCode, statusMessage);

    return ok({
      providerId,
      providerMessageId,
      status,
      statusCode,
      statusMessage,
      sentAt: sendDate,
      deliveredAt: status === "DELIVERED" ? sendDate : undefined,
      failedAt: status === "FAILED" ? sendDate : undefined,
      raw: item,
    });
  } catch (error) {
    return fail(
      new KMsgError(
        KMsgErrorCode.NETWORK_ERROR,
        error instanceof Error ? error.message : String(error),
        { providerId },
      ),
    );
  }
}
