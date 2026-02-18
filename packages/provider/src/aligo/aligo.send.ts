import {
  fail,
  KMsgError,
  KMsgErrorCode,
  ok,
  type Result,
  type SendOptions,
  type SendResult,
} from "@k-msg/core";
import { mapAligoError } from "./aligo.error";
import {
  formatAligoDate,
  getAligoEndpoint,
  interpolateMessage,
  resolveImageRef,
} from "./aligo.helpers";
import { requestAligo } from "./aligo.http";
import type {
  AligoMessageType,
  AligoRuntimeContext,
} from "./aligo.internal.types";
import type { AligoResponse, AligoSMSRequest } from "./types/aligo";

export function collectSendWarnings(
  options: SendOptions,
  providerId: string,
): SendResult["warnings"] {
  if (options.type !== "ALIMTALK") return undefined;
  if (options.failover?.enabled !== true) return undefined;

  return [
    {
      code: "FAILOVER_PARTIAL_PROVIDER",
      message:
        "Aligo failover mapping is partial. API-level fallback may be attempted for non-Kakao-user failures.",
      details: {
        providerId,
        mappedFields: ["failover", "fmessage_1", "fsubject_1"],
        unsupportedFields: ["fallbackChannel"],
      },
    },
  ];
}

async function sendSMS(
  ctx: AligoRuntimeContext,
  options: Extract<SendOptions, { type: "SMS" | "LMS" | "MMS" }>,
): Promise<Result<SendResult, KMsgError>> {
  const sender = options.from || ctx.config.sender || "";
  if (!sender) {
    return fail(
      new KMsgError(
        KMsgErrorCode.INVALID_REQUEST,
        "from is required for SMS/LMS/MMS (options.from or config.sender)",
        { providerId: ctx.providerId },
      ),
    );
  }

  const body: AligoSMSRequest = {
    key: ctx.config.apiKey,
    user_id: ctx.config.userId,
    sender,
    receiver: options.to,
    msg: options.text,
    msg_type: options.type,
    title: options.subject,
    testmode_yn: ctx.config.testMode ? "Y" : "N",
  };

  const scheduledAt = options.options?.scheduledAt;
  if (scheduledAt instanceof Date && !Number.isNaN(scheduledAt.getTime())) {
    const { date, time } = formatAligoDate(scheduledAt);
    body.rdate = date;
    body.rtime = time;
  }

  if (options.type === "MMS") {
    const imageRef = resolveImageRef({
      imageUrl: options.imageUrl,
      media: options.media,
      providerId: ctx.providerId,
    });
    if (!imageRef) {
      return fail(
        new KMsgError(
          KMsgErrorCode.INVALID_REQUEST,
          "image is required for MMS (options.imageUrl or options.media.image.ref)",
          { providerId: ctx.providerId },
        ),
      );
    }
    body.image = imageRef;
  }

  const response = (await requestAligo({
    host: ctx.smsHost,
    endpoint: getAligoEndpoint("sendSMS", ctx.config),
    data: body as unknown as Record<string, unknown>,
    providerId: ctx.providerId,
  })) as unknown as AligoResponse;

  if (response.result_code !== "1") {
    return fail(mapAligoError(response, ctx.providerId));
  }

  return ok({
    messageId: options.messageId || crypto.randomUUID(),
    providerId: ctx.providerId,
    providerMessageId: response.msg_id,
    status: "PENDING",
    type: options.type,
    to: options.to,
    raw: response,
  });
}

async function sendAlimTalk(
  ctx: AligoRuntimeContext,
  options: Extract<SendOptions, { type: "ALIMTALK" }>,
): Promise<Result<SendResult, KMsgError>> {
  const warnings = collectSendWarnings(options, ctx.providerId);
  const senderKey =
    (typeof options.kakao?.profileId === "string"
      ? options.kakao.profileId
      : ctx.config.senderKey) || "";
  if (!senderKey) {
    return fail(
      new KMsgError(
        KMsgErrorCode.INVALID_REQUEST,
        "kakao profileId is required (options.kakao.profileId or config.senderKey)",
        { providerId: ctx.providerId },
      ),
    );
  }

  const sender = options.from || ctx.config.sender || "";
  if (!sender) {
    return fail(
      new KMsgError(
        KMsgErrorCode.INVALID_REQUEST,
        "from is required for ALIMTALK (options.from or config.sender)",
        { providerId: ctx.providerId },
      ),
    );
  }

  const variables = options.variables as Record<string, unknown>;
  const templateId = options.templateId;
  if (!templateId || templateId.length === 0) {
    return fail(
      new KMsgError(
        KMsgErrorCode.INVALID_REQUEST,
        "templateId is required for ALIMTALK",
        { providerId: ctx.providerId },
      ),
    );
  }
  const templateContent =
    typeof options.providerOptions?.templateContent === "string"
      ? options.providerOptions.templateContent
      : undefined;

  const body: Record<string, unknown> = {
    apikey: ctx.config.apiKey,
    userid: ctx.config.userId,
    senderkey: senderKey,
    tpl_code: templateId,
    sender,
    receiver_1: options.to,
    subject_1: "알림톡",
    message_1: interpolateMessage(variables, templateContent),
    testMode: ctx.config.testMode ? "Y" : "N",
  };

  const failoverOverrideRaw =
    typeof options.providerOptions?.failover === "string"
      ? options.providerOptions.failover.trim().toUpperCase()
      : "";
  const failoverOverride =
    failoverOverrideRaw === "Y" || failoverOverrideRaw === "N"
      ? failoverOverrideRaw
      : undefined;
  const failoverFromOptions =
    options.failover?.enabled === true
      ? "Y"
      : options.failover?.enabled === false
        ? "N"
        : undefined;
  const failover = failoverOverride ?? failoverFromOptions;

  const fallbackTitle =
    typeof options.providerOptions?.fsubject_1 === "string" &&
    options.providerOptions.fsubject_1.trim().length > 0
      ? options.providerOptions.fsubject_1.trim()
      : typeof options.failover?.fallbackTitle === "string" &&
          options.failover.fallbackTitle.trim().length > 0
        ? options.failover.fallbackTitle.trim()
        : undefined;
  const fallbackContent =
    typeof options.providerOptions?.fmessage_1 === "string" &&
    options.providerOptions.fmessage_1.trim().length > 0
      ? options.providerOptions.fmessage_1.trim()
      : typeof options.failover?.fallbackContent === "string" &&
          options.failover.fallbackContent.trim().length > 0
        ? options.failover.fallbackContent.trim()
        : undefined;

  if (failover) {
    body.failover = failover;
  }
  if (fallbackTitle) {
    body.fsubject_1 = fallbackTitle;
  }
  if (fallbackContent) {
    body.fmessage_1 = fallbackContent;
  }

  const scheduledAt = options.options?.scheduledAt;
  if (scheduledAt instanceof Date && !Number.isNaN(scheduledAt.getTime())) {
    const { date, time } = formatAligoDate(scheduledAt);
    body.reserve = "Y";
    body.reserve_date = date;
    body.reserve_time = time;
  }

  const response = (await requestAligo({
    host: ctx.alimtalkHost,
    endpoint: getAligoEndpoint("sendAlimTalk", ctx.config),
    data: body,
    providerId: ctx.providerId,
  })) as unknown as AligoResponse;

  if (response.result_code !== "0") {
    return fail(mapAligoError(response, ctx.providerId));
  }

  return ok({
    messageId: options.messageId || crypto.randomUUID(),
    providerId: ctx.providerId,
    providerMessageId: response.msg_id,
    status: "PENDING",
    type: options.type,
    to: options.to,
    ...(Array.isArray(warnings) && warnings.length > 0 ? { warnings } : {}),
    raw: response,
  });
}

async function sendFriendTalk(
  ctx: AligoRuntimeContext,
  options: Extract<SendOptions, { type: "FRIENDTALK" }>,
): Promise<Result<SendResult, KMsgError>> {
  const senderKey =
    (typeof options.kakao?.profileId === "string"
      ? options.kakao.profileId
      : ctx.config.senderKey) || "";
  if (!senderKey) {
    return fail(
      new KMsgError(
        KMsgErrorCode.INVALID_REQUEST,
        "kakao profileId is required (options.kakao.profileId or config.senderKey)",
        { providerId: ctx.providerId },
      ),
    );
  }

  const sender = options.from || ctx.config.sender || "";
  if (!sender) {
    return fail(
      new KMsgError(
        KMsgErrorCode.INVALID_REQUEST,
        "from is required for FRIENDTALK (options.from or config.sender)",
        { providerId: ctx.providerId },
      ),
    );
  }

  const body: Record<string, unknown> = {
    apikey: ctx.config.apiKey,
    userid: ctx.config.userId,
    senderkey: senderKey,
    sender,
    receiver_1: options.to,
    subject_1: "친구톡",
    message_1: options.text,
    testMode: ctx.config.testMode ? "Y" : "N",
  };

  const imageRef = resolveImageRef({
    imageUrl: options.imageUrl,
    media: options.media,
    providerId: ctx.providerId,
  });
  if (imageRef) {
    body.image_1 = imageRef;
  }

  const buttons = Array.isArray(options.kakao?.buttons)
    ? options.kakao.buttons
    : options.buttons;
  if (buttons) {
    body.button_1 = JSON.stringify(buttons);
  }

  const scheduledAt = options.options?.scheduledAt;
  if (scheduledAt instanceof Date && !Number.isNaN(scheduledAt.getTime())) {
    const { date, time } = formatAligoDate(scheduledAt);
    body.reserve = "Y";
    body.reserve_date = date;
    body.reserve_time = time;
  }

  const response = (await requestAligo({
    host: ctx.alimtalkHost,
    endpoint: getAligoEndpoint("sendFriendTalk", ctx.config),
    data: body,
    providerId: ctx.providerId,
  })) as unknown as AligoResponse;

  if (response.result_code !== "0") {
    return fail(mapAligoError(response, ctx.providerId));
  }

  return ok({
    messageId: options.messageId || crypto.randomUUID(),
    providerId: ctx.providerId,
    providerMessageId: response.msg_id,
    status: "PENDING",
    type: options.type,
    to: options.to,
    raw: response,
  });
}

export async function sendWithAligo(
  ctx: AligoRuntimeContext,
  options: SendOptions,
): Promise<Result<SendResult, KMsgError>> {
  try {
    switch (options.type as AligoMessageType) {
      case "ALIMTALK":
        return await sendAlimTalk(
          ctx,
          options as Extract<SendOptions, { type: "ALIMTALK" }>,
        );
      case "FRIENDTALK":
        return await sendFriendTalk(
          ctx,
          options as Extract<SendOptions, { type: "FRIENDTALK" }>,
        );
      case "SMS":
      case "LMS":
      case "MMS":
        return await sendSMS(
          ctx,
          options as Extract<SendOptions, { type: "SMS" | "LMS" | "MMS" }>,
        );
      default:
        return fail(
          new KMsgError(
            KMsgErrorCode.INVALID_REQUEST,
            `AligoProvider does not support type ${options.type}`,
            { providerId: ctx.providerId, type: options.type },
          ),
        );
    }
  } catch (error) {
    return fail(mapAligoError(error, ctx.providerId));
  }
}
