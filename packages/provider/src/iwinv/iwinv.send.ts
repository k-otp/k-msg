import {
  fail,
  KMsgError,
  KMsgErrorCode,
  ok,
  type ProviderRequestContext,
  type Result,
  type SendOptions,
  type SendResult,
} from "@k-msg/core";
import { safeParseJson } from "../shared/http-json";
import {
  fetchWithProviderContext,
  toProviderNetworkError,
  toProviderTransportError,
} from "../shared/provider-transport";
import type { TemplateContentCache } from "../shared/template-content-cache";
import {
  findMissingTemplateVariables,
  listTemplatePlaceholders,
} from "../shared/template-variables";
import { isObjectRecord } from "../shared/type-guards";
import {
  getAlimTalkHeaders,
  getSendEndpoint,
  mapIwinvCodeToKMsgErrorCode,
  normalizeIwinvCode,
  requireAlimTalkApiKey,
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
  toIwinvProviderCode,
  toIwinvProviderText,
  toIwinvSendError,
} from "./iwinv.send-error";
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
import { fetchIwinvTemplateContent } from "./iwinv.template-content";
import { formatIwinvDate, formatSmsReserveDate } from "./iwinv.time";

function toTemplateParamValue(value: unknown): string {
  return value === null || value === undefined ? "" : String(value);
}

/**
 * Builds IWINV's `templateParam`, which IWINV applies by position. Its spec
 * does not say how positions map to placeholders, so this sends one value per
 * distinct `#{name}`, in the order the names first appear in the template's
 * content and then its button links: the one value per variable that IWINV's
 * console asks for, and what the key-order mapping used to send. The text
 * comes from `providerOptions.templateContent` or else IWINV's template API.
 */
async function resolveTemplateParam(params: {
  providerId: string;
  config: NormalizedIwinvConfig;
  options: Extract<SendOptions, { type: "ALIMTALK" }>;
  context?: ProviderRequestContext;
  templateContents: TemplateContentCache;
}): Promise<Result<string[] | undefined, KMsgError>> {
  const { providerId, config, options, context, templateContents } = params;

  const override = options.providerOptions?.templateParam;
  if (Array.isArray(override)) {
    return ok(override.map(toTemplateParamValue));
  }

  const variables = options.variables ?? {};
  const inlineContent = options.providerOptions?.templateContent;
  const hasInlineContent =
    typeof inlineContent === "string" && inlineContent.length > 0;
  // Without variables there is nothing to place, so skip the lookup; a template
  // that needs values is then refused by IWINV (code 508). Inline content costs
  // no request, so it is still checked.
  if (Object.keys(variables).length === 0 && !hasInlineContent) {
    return ok(undefined);
  }

  const content = hasInlineContent
    ? ok(inlineContent)
    : await templateContents.get(options.templateId, context, () =>
        fetchIwinvTemplateContent({
          providerId,
          config,
          templateCode: options.templateId,
          context,
        }),
      );
  if (content.isFailure) return content;

  const placeholders = [...new Set(listTemplatePlaceholders(content.value))];
  const missing = findMissingTemplateVariables(placeholders, variables);
  if (missing.length > 0) {
    return fail(
      new KMsgError(
        KMsgErrorCode.INVALID_REQUEST,
        `Missing variables for IWINV template ${options.templateId}: ${missing.join(", ")}`,
        { providerId, templateId: options.templateId, missing },
      ),
    );
  }

  return ok(
    placeholders.length > 0
      ? placeholders.map((name) => toTemplateParamValue(variables[name]))
      : undefined,
  );
}

export async function sendAlimTalk(params: {
  providerId: string;
  config: NormalizedIwinvConfig;
  options: Extract<SendOptions, { type: "ALIMTALK" }>;
  context?: ProviderRequestContext;
  templateContents: TemplateContentCache;
}): Promise<Result<SendResult, KMsgError>> {
  const { providerId, config, options, context, templateContents } = params;
  const missingApiKey = requireAlimTalkApiKey(config, providerId);
  if (missingApiKey) return fail(missingApiKey);

  const templateId = options.templateId;

  if (!templateId || templateId.length === 0) {
    return fail(
      new KMsgError(
        KMsgErrorCode.INVALID_REQUEST,
        "templateId is required for ALIMTALK",
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

  // resendType picks the fallback text, not the channel: "Y" (IWINV's default)
  // resends the AlimTalk text and "N" sends resendContent. IWINV sends SMS or
  // LMS by the text's length, so failover.fallbackChannel has no IWINV field.
  const effectiveResendType = resendType ?? (resendContent ? "N" : undefined);
  if (reSend === "Y" && effectiveResendType === "N" && !resendContent) {
    return fail(
      new KMsgError(
        KMsgErrorCode.INVALID_REQUEST,
        "resendContent is required when resendType is 'N' (failover.fallbackContent or providerOptions.resendContent)",
        { providerId },
      ),
    );
  }

  const templateParam = await resolveTemplateParam({
    providerId,
    config,
    options,
    context,
    templateContents,
  });
  if (templateParam.isFailure) return templateParam;

  const payload: Record<string, unknown> = {
    templateCode: templateId,
    reserve,
    ...(sendDate ? { sendDate } : {}),
    list: [
      {
        phone: to,
        templateParam: templateParam.value,
      },
    ],
    reSend,
    ...(resendCallback ? { resendCallback } : {}),
    ...(effectiveResendType ? { resendType: effectiveResendType } : {}),
    ...(resendTitle ? { resendTitle } : {}),
    ...(resendContent ? { resendContent } : {}),
  };

  const url = `${config.baseUrl}${getSendEndpoint(config)}`;

  try {
    const response = await fetchWithProviderContext(
      context,
      url,
      {
        method: "POST",
        headers: getAlimTalkHeaders(config),
        body: JSON.stringify(payload),
      },
      providerId,
    );

    const responseText = await response.text();
    const parsed = safeParseJson(responseText);

    const isRecord = isObjectRecord(parsed);
    const data: IWINVSendResponse = isRecord
      ? (parsed as IWINVSendResponse)
      : ({
          code: normalizeIwinvCode(parsed) ?? response.status,
          message: responseText || String(parsed || ""),
        } as IWINVSendResponse);

    if (!response.ok || data.code !== 200) {
      return fail(
        toIwinvSendError({
          providerId,
          channel: "alimtalk",
          // Without a code in the body, the HTTP status classifies the failure.
          code: mapIwinvCodeToKMsgErrorCode(
            normalizeIwinvCode(data.code) ?? response.status,
          ),
          message:
            toIwinvProviderText(isRecord ? data.message : responseText) ??
            "IWINV send failed",
          httpStatus: response.status,
          originalCode: data.code,
          // A bare-code body is IWINV's code; any other body (an HTML error
          // page) is neither its code nor its text.
          providerCode: toIwinvProviderCode(isRecord ? data.code : parsed),
          providerText: isRecord
            ? toIwinvProviderText(data.message)
            : undefined,
        }),
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
    return fail(toProviderTransportError(error, context?.signal, providerId));
  }
}

/**
 * Returns the error for an SMS v2 send IWINV did not accept, or `undefined`
 * when it did (`resultCode` 0 on an OK response). When IWINV sends a bare code
 * without text, `providerErrorText` is the text its documentation gives for
 * that code.
 */
function toSmsV2SendFailure(
  providerId: string,
  response: Response,
  data: SmsV2SendResponse,
  fallbackMessage: string,
): KMsgError | undefined {
  const rawCode = data.resultCode ?? data.code;
  const code = normalizeCode(rawCode);
  if (response.ok && code === "0") return undefined;

  const providerText =
    toIwinvProviderText(data.message) ??
    toIwinvProviderText(mapSmsResponseMessage(code, ""));

  return toIwinvSendError({
    providerId,
    channel: "sms",
    code: mapSmsErrorCode(code, response.ok, response.status),
    message: providerText ?? fallbackMessage,
    httpStatus: response.status,
    originalCode: rawCode,
    providerCode: toIwinvProviderCode(rawCode),
    providerText,
  });
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
  context?: ProviderRequestContext;
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
    context,
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
    return fail(toProviderNetworkError(error, providerId));
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
    const response = await fetchWithProviderContext(
      context,
      url,
      {
        method: "POST",
        headers: mergedHeaders,
        body: form,
      },
      providerId,
    );

    const responseText = await response.text();
    const parsed = safeParseJson(responseText);

    const data: SmsV2SendResponse = isObjectRecord(parsed)
      ? (parsed as SmsV2SendResponse)
      : // A bare-code body is IWINV's code; other text is not.
        ({
          resultCode:
            toIwinvProviderCode(parsed) !== undefined ? parsed : undefined,
        } as SmsV2SendResponse);

    const failure = toSmsV2SendFailure(
      providerId,
      response,
      data,
      "MMS send failed",
    );
    if (failure) return fail(failure);

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
    return fail(toProviderTransportError(error, context?.signal, providerId));
  }
}

export async function sendSmsV2(params: {
  providerId: string;
  config: NormalizedIwinvConfig;
  options: Extract<SendOptions, { type: SmsV2MessageType }>;
  context?: ProviderRequestContext;
}): Promise<Result<SendResult, KMsgError>> {
  const { providerId, config, options, context } = params;

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
      context,
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
    const response = await fetchWithProviderContext(
      context,
      url,
      {
        method: "POST",
        headers: mergedHeaders,
        body: JSON.stringify(payload),
      },
      providerId,
    );

    const responseText = await response.text();
    const parsed = safeParseJson(responseText);

    const data: SmsV2SendResponse = isObjectRecord(parsed)
      ? (parsed as SmsV2SendResponse)
      : // A bare-code body is IWINV's code; other text is not.
        ({
          resultCode:
            toIwinvProviderCode(parsed) !== undefined ? parsed : undefined,
        } as SmsV2SendResponse);

    const failure = toSmsV2SendFailure(
      providerId,
      response,
      data,
      "SMS send failed",
    );
    if (failure) return fail(failure);

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
    return fail(toProviderTransportError(error, context?.signal, providerId));
  }
}
