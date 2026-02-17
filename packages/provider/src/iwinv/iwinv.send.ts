import {
  fail,
  KMsgError,
  KMsgErrorCode,
  ok,
  type Result,
  type SendOptions,
  type SendResult,
} from "@k-msg/core";
import { safeParseJson } from "../shared/http-json";
import { isObjectRecord } from "../shared/type-guards";
import {
  getAlimTalkHeaders,
  getSendEndpoint,
  mapIwinvCodeToKMsgErrorCode,
  normalizeIwinvCode,
} from "./iwinv.alimtalk.helpers";
import {
  resolveImageFilename,
  resolveImageInput,
  toImageBlob,
} from "./iwinv.image";
import type {
  IWINVSendResponse,
  NormalizedIwinvConfig,
  SmsV2MessageType,
  SmsV2SendResponse,
} from "./iwinv.internal.types";
import {
  buildLmsTitle,
  buildSmsSecretHeader,
  canSendSmsV2,
  mapSmsErrorCode,
  mapSmsResponseMessage,
  normalizeCode,
  normalizePhoneNumber,
  resolveSmsBaseUrl,
} from "./iwinv.sms.helpers";
import { formatIwinvDate, formatSmsReserveDate } from "./iwinv.time";

export async function sendAlimTalk(params: {
  providerId: string;
  config: NormalizedIwinvConfig;
  options: Extract<SendOptions, { type: "ALIMTALK" }>;
}): Promise<Result<SendResult, KMsgError>> {
  const { providerId, config, options } = params;

  if (!options.templateCode || options.templateCode.length === 0) {
    return fail(
      new KMsgError(
        KMsgErrorCode.INVALID_REQUEST,
        "templateCode is required for ALIMTALK",
        { providerId },
      ),
    );
  }

  const scheduledAt = options.options?.scheduledAt;
  const scheduledAtValid =
    scheduledAt instanceof Date && !Number.isNaN(scheduledAt.getTime());
  const reserve: "Y" | "N" = scheduledAtValid ? "Y" : "N";
  const sendDate = scheduledAtValid
    ? formatIwinvDate(scheduledAt as Date)
    : undefined;

  const to = normalizePhoneNumber(options.to);
  if (!to) {
    return fail(
      new KMsgError(KMsgErrorCode.INVALID_REQUEST, "to is required", {
        providerId,
      }),
    );
  }

  const templateParamOverride = options.providerOptions?.templateParam;
  const templateParam = Array.isArray(templateParamOverride)
    ? templateParamOverride.map((v) =>
        v === null || v === undefined ? "" : String(v),
      )
    : Object.values(options.variables || {}).map((v) =>
        v === null || v === undefined ? "" : String(v),
      );
  const failover = options.failover;

  const senderNumber =
    (typeof options.from === "string" && options.from.length > 0
      ? options.from
      : config.senderNumber || config.smsSenderNumber) || "";
  const normalizedSender = senderNumber
    ? normalizePhoneNumber(senderNumber)
    : "";

  const reSendOverrideRaw =
    typeof options.providerOptions?.reSend === "string"
      ? options.providerOptions.reSend.trim().toUpperCase()
      : "";
  const reSendOverride =
    reSendOverrideRaw === "Y" || reSendOverrideRaw === "N"
      ? (reSendOverrideRaw as "Y" | "N")
      : undefined;
  const reSendFromFailover =
    failover?.enabled === true
      ? "Y"
      : failover?.enabled === false
        ? "N"
        : undefined;
  const reSend =
    reSendOverride ?? reSendFromFailover ?? (normalizedSender ? "Y" : "N");

  const resendCallbackOverride =
    typeof options.providerOptions?.resendCallback === "string"
      ? normalizePhoneNumber(options.providerOptions.resendCallback)
      : "";
  const resendCallback = resendCallbackOverride || normalizedSender;

  if (reSend === "Y" && !resendCallback) {
    return fail(
      new KMsgError(
        KMsgErrorCode.INVALID_REQUEST,
        "resendCallback is required when reSend is 'Y' (options.from or providerOptions.resendCallback)",
        { providerId },
      ),
    );
  }

  const resendTypeRaw =
    typeof options.providerOptions?.resendType === "string"
      ? options.providerOptions.resendType.trim().toUpperCase()
      : "";
  const resendType =
    resendTypeRaw === "Y" || resendTypeRaw === "N"
      ? (resendTypeRaw as "Y" | "N")
      : undefined;
  if (
    typeof options.providerOptions?.resendType === "string" &&
    options.providerOptions.resendType.length > 0 &&
    !resendType
  ) {
    return fail(
      new KMsgError(
        KMsgErrorCode.INVALID_REQUEST,
        "resendType must be 'Y' or 'N'",
        {
          providerId,
        },
      ),
    );
  }

  const resendTypeFromFailover =
    failover?.fallbackChannel === "lms"
      ? "Y"
      : failover?.fallbackChannel === "sms"
        ? "N"
        : undefined;

  const resendTitle =
    typeof options.providerOptions?.resendTitle === "string" &&
    options.providerOptions.resendTitle.trim().length > 0
      ? options.providerOptions.resendTitle.trim()
      : typeof failover?.fallbackTitle === "string" &&
          failover.fallbackTitle.trim().length > 0
        ? failover.fallbackTitle.trim()
        : undefined;

  const resendContent =
    typeof options.providerOptions?.resendContent === "string" &&
    options.providerOptions.resendContent.trim().length > 0
      ? options.providerOptions.resendContent.trim()
      : typeof failover?.fallbackContent === "string" &&
          failover.fallbackContent.trim().length > 0
        ? failover.fallbackContent.trim()
        : undefined;

  const payload: Record<string, unknown> = {
    templateCode: options.templateCode,
    reserve,
    ...(sendDate ? { sendDate } : {}),
    list: [
      {
        phone: to,
        templateParam: templateParam.length > 0 ? templateParam : undefined,
      },
    ],
    reSend,
    ...(resendCallback ? { resendCallback } : {}),
    ...((resendType ?? resendTypeFromFailover)
      ? { resendType: resendType ?? resendTypeFromFailover }
      : {}),
    ...(resendTitle ? { resendTitle } : {}),
    ...(resendContent ? { resendContent } : {}),
  };

  const url = `${config.baseUrl}${getSendEndpoint(config)}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: getAlimTalkHeaders(config),
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    const parsed = safeParseJson(responseText);

    const data: IWINVSendResponse = isObjectRecord(parsed)
      ? (parsed as IWINVSendResponse)
      : ({
          code: normalizeIwinvCode(parsed) ?? response.status,
          message: responseText || String(parsed || ""),
        } as IWINVSendResponse);

    if (!response.ok || data.code !== 200) {
      return fail(
        new KMsgError(
          mapIwinvCodeToKMsgErrorCode(data.code),
          data.message || "IWINV send failed",
          { providerId, originalCode: data.code },
        ),
      );
    }

    return ok({
      messageId: options.messageId || crypto.randomUUID(),
      providerId,
      providerMessageId:
        typeof data.seqNo === "number" ? String(data.seqNo) : undefined,
      status: scheduledAtValid ? "PENDING" : "SENT",
      type: options.type,
      to: options.to,
      raw: data,
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

async function sendSmsV2Mms(params: {
  providerId: string;
  config: NormalizedIwinvConfig;
  options: Extract<SendOptions, { type: SmsV2MessageType }>;
  to: string;
  from: string;
  text: string;
  scheduledAtValid: boolean;
  scheduledAt?: Date;
}): Promise<Result<SendResult, KMsgError>> {
  const {
    providerId,
    config,
    options,
    to,
    from,
    text,
    scheduledAtValid,
    scheduledAt,
  } = params;

  if (options.type !== "MMS") {
    return fail(
      new KMsgError(
        KMsgErrorCode.INVALID_REQUEST,
        "IWINVProvider: MMS handler called with non-MMS options",
        { providerId, type: options.type },
      ),
    );
  }

  const title = buildLmsTitle(text, options.subject);

  const imageInputResult = resolveImageInput(options, providerId);
  if (imageInputResult.isFailure) return imageInputResult;

  const imageInput = imageInputResult.value;
  if (!imageInput) {
    return fail(
      new KMsgError(
        KMsgErrorCode.INVALID_REQUEST,
        "image is required for MMS; caller must provide options.media.image.blob or bytes",
        { providerId },
      ),
    );
  }

  let image: {
    blob: Blob;
    filename: string;
    contentType: string;
    size: number;
  };

  try {
    image = await toImageBlob(imageInput);
  } catch (error) {
    return fail(
      error instanceof KMsgError
        ? error
        : new KMsgError(
            KMsgErrorCode.NETWORK_ERROR,
            error instanceof Error ? error.message : String(error),
            { providerId },
          ),
    );
  }

  if (image.size > 100 * 1024) {
    return fail(
      new KMsgError(
        KMsgErrorCode.INVALID_REQUEST,
        "MMS image must be <= 100KB",
        {
          providerId,
          bytes: image.size,
        },
      ),
    );
  }

  const form = new FormData();
  form.append("version", "1.0");
  form.append("from", from);
  form.append("to", to);
  form.append("title", title);
  form.append("text", text);

  if (scheduledAtValid && scheduledAt) {
    form.append("date", formatSmsReserveDate(scheduledAt));
  }

  form.append("image", image.blob, resolveImageFilename(image));

  const secretHeader = buildSmsSecretHeader(config);
  const headers: Record<string, string> = {
    secret: secretHeader,
  };

  if (
    typeof config.xForwardedFor === "string" &&
    config.xForwardedFor.length > 0
  ) {
    headers["X-Forwarded-For"] = config.xForwardedFor;
  }

  const mergedHeaders: Record<string, string> = { ...headers };
  if (config.extraHeaders && typeof config.extraHeaders === "object") {
    for (const [key, value] of Object.entries(config.extraHeaders)) {
      if (key.toLowerCase() === "content-type") continue;
      mergedHeaders[key] = value;
    }
  }

  const url = `${resolveSmsBaseUrl()}/api/v2/send/`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: mergedHeaders,
      body: form,
    });

    const responseText = await response.text();
    const parsed = safeParseJson(responseText);

    const data: SmsV2SendResponse = isObjectRecord(parsed)
      ? (parsed as SmsV2SendResponse)
      : ({ resultCode: parsed } as SmsV2SendResponse);

    const rawCode = data.resultCode ?? data.code;
    const code = normalizeCode(rawCode);
    const message =
      typeof data.message === "string" && data.message.length > 0
        ? data.message
        : mapSmsResponseMessage(code, "MMS send failed");

    const isSuccess = response.ok && code === "0";
    if (!isSuccess) {
      return fail(
        new KMsgError(mapSmsErrorCode(code, response.ok), message, {
          providerId,
          originalCode: rawCode,
        }),
      );
    }

    const providerMessageId =
      typeof data.requestNo === "string" && data.requestNo.length > 0
        ? data.requestNo
        : typeof data.msgid === "string" && data.msgid.length > 0
          ? data.msgid
          : undefined;

    return ok({
      messageId: options.messageId || crypto.randomUUID(),
      providerId,
      providerMessageId,
      status: scheduledAtValid ? "PENDING" : "SENT",
      type: options.type,
      to: options.to,
      raw: data,
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

export async function sendSmsV2(params: {
  providerId: string;
  config: NormalizedIwinvConfig;
  options: Extract<SendOptions, { type: SmsV2MessageType }>;
}): Promise<Result<SendResult, KMsgError>> {
  const { providerId, config, options } = params;

  if (!canSendSmsV2(config)) {
    return fail(
      new KMsgError(
        KMsgErrorCode.INVALID_REQUEST,
        "SMS v2 configuration missing (smsApiKey/smsAuthKey)",
        { providerId },
      ),
    );
  }

  const to = normalizePhoneNumber(options.to);
  if (!to) {
    return fail(
      new KMsgError(KMsgErrorCode.INVALID_REQUEST, "to is required", {
        providerId,
      }),
    );
  }

  const text = options.text;
  if (!text || text.trim().length === 0) {
    return fail(
      new KMsgError(
        KMsgErrorCode.INVALID_REQUEST,
        "text is required for SMS/LMS/MMS",
        {
          providerId,
        },
      ),
    );
  }

  const senderNumber =
    (typeof options.from === "string" && options.from.length > 0
      ? options.from
      : config.smsSenderNumber || config.senderNumber) || "";
  const from = senderNumber ? normalizePhoneNumber(senderNumber) : "";
  if (!from) {
    return fail(
      new KMsgError(
        KMsgErrorCode.INVALID_REQUEST,
        "from is required for SMS/LMS/MMS (options.from or config.smsSenderNumber)",
        { providerId },
      ),
    );
  }

  const scheduledAt = options.options?.scheduledAt;
  const scheduledAtValid =
    scheduledAt instanceof Date && !Number.isNaN(scheduledAt.getTime());

  if (options.type === "MMS") {
    return await sendSmsV2Mms({
      providerId,
      config,
      options,
      to,
      from,
      text,
      scheduledAtValid,
      scheduledAt: scheduledAtValid ? (scheduledAt as Date) : undefined,
    });
  }

  const payload: Record<string, unknown> = {
    version: "1.0",
    from,
    to: [to],
    text,
  };

  if (options.type === "LMS") {
    payload.title = buildLmsTitle(text, options.subject);
  } else {
    const msgTypeOverride =
      typeof options.providerOptions?.msgType === "string" &&
      options.providerOptions.msgType.trim().length > 0
        ? options.providerOptions.msgType.trim()
        : undefined;
    payload.msgType = msgTypeOverride || options.type;
  }

  if (scheduledAtValid) {
    payload.date = formatSmsReserveDate(scheduledAt as Date);
  }

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

  const url = `${resolveSmsBaseUrl()}/api/v2/send/`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: mergedHeaders,
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    const parsed = safeParseJson(responseText);

    const data: SmsV2SendResponse = isObjectRecord(parsed)
      ? (parsed as SmsV2SendResponse)
      : ({ resultCode: parsed } as SmsV2SendResponse);

    const rawCode = data.resultCode ?? data.code;
    const code = normalizeCode(rawCode);
    const message =
      typeof data.message === "string" && data.message.length > 0
        ? data.message
        : mapSmsResponseMessage(code, "SMS send failed");

    const isSuccess = response.ok && code === "0";
    if (!isSuccess) {
      return fail(
        new KMsgError(mapSmsErrorCode(code, response.ok), message, {
          providerId,
          originalCode: rawCode,
        }),
      );
    }

    const providerMessageId =
      typeof data.requestNo === "string" && data.requestNo.length > 0
        ? data.requestNo
        : typeof data.msgid === "string" && data.msgid.length > 0
          ? data.msgid
          : undefined;

    return ok({
      messageId: options.messageId || crypto.randomUUID(),
      providerId,
      providerMessageId,
      status: scheduledAtValid ? "PENDING" : "SENT",
      type: options.type,
      to: options.to,
      raw: data,
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
