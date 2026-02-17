import {
  KMsgError,
  KMsgErrorCode,
  type MessageType,
  ok,
  type Result,
  type SendOptions,
  type SendResult,
} from "@k-msg/core";
import { isObjectRecord } from "../shared/type-guards";
import {
  extractFileId,
  normalizePhoneNumber,
  resolveImageRef,
  stringifyVariables,
  toKakaoButtons,
  toSolapiMessageType,
} from "./solapi.helpers";
import type {
  SolapiSdkClient,
  SolapiSendOneMessage,
} from "./solapi.internal.types";
import type { SolapiConfig } from "./types/solapi";

export function collectSolapiSendWarnings(
  options: SendOptions,
  providerId: string,
): SendResult["warnings"] {
  if (options.type !== "ALIMTALK") return undefined;
  if (options.failover?.enabled !== true) return undefined;

  return [
    {
      code: "FAILOVER_PARTIAL_PROVIDER",
      message:
        "SOLAPI failover mapping is partial. API-level fallback may be attempted for non-Kakao-user failures.",
      details: {
        providerId,
        mappedFields: ["kakao.disableSms", "text", "subject"],
        unsupportedFields: ["fallbackChannel"],
      },
    },
  ];
}

export function adaptSolapiSendResult(params: {
  options: SendOptions;
  response: unknown;
  providerId: string;
  warnings?: SendResult["warnings"];
}): SendResult {
  const { options, response, providerId, warnings } = params;
  const record = isObjectRecord(response) ? response : {};
  const providerMessageId =
    typeof record.messageId === "string" ? record.messageId : undefined;

  return {
    messageId: options.messageId || crypto.randomUUID(),
    providerId,
    providerMessageId,
    status: "SENT",
    type: options.type,
    to: options.to,
    ...(Array.isArray(warnings) && warnings.length > 0 ? { warnings } : {}),
    raw: response,
  };
}

export async function buildSolapiSendOneMessage(params: {
  options: SendOptions;
  providerId: string;
  config: SolapiConfig;
  client: SolapiSdkClient;
}): Promise<SolapiSendOneMessage> {
  const { options, providerId, config, client } = params;

  const type = toSolapiMessageType(options);
  const scheduledAt = options.options?.scheduledAt;
  const senderNumber =
    typeof options.from === "string" && options.from.length > 0
      ? options.from
      : config.defaultFrom;

  const base: Record<string, unknown> = {
    to: normalizePhoneNumber(options.to),
    type,
  };

  const country =
    typeof options.options?.country === "string" &&
    options.options.country.length > 0
      ? options.options.country
      : typeof config.defaultCountry === "string"
        ? config.defaultCountry
        : undefined;
  if (country) {
    base.country = country;
  }

  const customFieldsRaw = options.options?.customFields;
  if (customFieldsRaw && typeof customFieldsRaw === "object") {
    const customFields: Record<string, string> = {};
    for (const [key, value] of Object.entries(customFieldsRaw)) {
      if (value === undefined) continue;
      customFields[key] = typeof value === "string" ? value : String(value);
    }
    if (Object.keys(customFields).length > 0) {
      base.customFields = customFields;
    }
  }

  if (scheduledAt) {
    base.scheduledDate = scheduledAt;
  }

  const requiresFrom =
    type === "SMS" ||
    type === "LMS" ||
    type === "MMS" ||
    type === "VOICE" ||
    type === "FAX" ||
    String(type).startsWith("RCS_");

  if (requiresFrom) {
    if (!senderNumber || senderNumber.length === 0) {
      throw new KMsgError(
        KMsgErrorCode.INVALID_REQUEST,
        "from is required (options.from or config.defaultFrom)",
        { providerId, type: options.type as MessageType },
      );
    }
    base.from = normalizePhoneNumber(senderNumber);
  } else if (senderNumber) {
    base.from = normalizePhoneNumber(senderNumber);
  }

  if (type === "SMS" || type === "LMS" || type === "MMS") {
    const smsOptions = options as Extract<
      SendOptions,
      { type: "SMS" | "LMS" | "MMS" }
    >;
    const text = smsOptions.text;
    if (text.length === 0) {
      throw new KMsgError(
        KMsgErrorCode.INVALID_REQUEST,
        "text is required for SMS/LMS/MMS",
        { providerId, type: options.type as MessageType },
      );
    }

    base.text = text;
    const subject = smsOptions.subject;
    if (subject) {
      base.subject = subject;
    }

    if (type === "MMS") {
      const imageRef = resolveImageRef({
        imageUrl: smsOptions.imageUrl,
        media: smsOptions.media,
        providerId,
      });
      if (!imageRef) {
        throw new KMsgError(
          KMsgErrorCode.INVALID_REQUEST,
          "image is required for MMS (options.imageUrl or options.media.image.ref)",
          { providerId },
        );
      }

      const upload = await client.uploadFile(imageRef, "MMS");
      const fileId = extractFileId(upload);
      if (typeof fileId === "string" && fileId.length > 0) {
        base.imageId = fileId;
      } else {
        throw new KMsgError(
          KMsgErrorCode.PROVIDER_ERROR,
          "Failed to upload MMS image",
          {
            providerId,
          },
        );
      }
    }

    return base as unknown as SolapiSendOneMessage;
  }

  if (type === "ATA") {
    const alimtalkOptions = options as Extract<
      SendOptions,
      { type: "ALIMTALK" }
    >;
    const failover = alimtalkOptions.failover;
    const pfId =
      typeof alimtalkOptions.kakao?.profileId === "string" &&
      alimtalkOptions.kakao.profileId.length > 0
        ? alimtalkOptions.kakao.profileId
        : config.kakaoPfId;

    if (!pfId || pfId.length === 0) {
      throw new KMsgError(
        KMsgErrorCode.INVALID_REQUEST,
        "kakao profileId is required (options.kakao.profileId or config.kakaoPfId)",
        { providerId },
      );
    }

    const fallbackContent =
      typeof failover?.fallbackContent === "string" &&
      failover.fallbackContent.trim().length > 0
        ? failover.fallbackContent.trim()
        : undefined;
    const fallbackTitle =
      typeof failover?.fallbackTitle === "string" &&
      failover.fallbackTitle.trim().length > 0
        ? failover.fallbackTitle.trim()
        : undefined;
    const disableSms =
      failover?.enabled === true
        ? false
        : failover?.enabled === false
          ? true
          : alimtalkOptions.kakao?.disableSms;

    if (fallbackContent) {
      base.text = fallbackContent;
    }
    if (fallbackTitle) {
      base.subject = fallbackTitle;
    }

    base.kakaoOptions = {
      pfId,
      templateId: alimtalkOptions.templateCode,
      variables: stringifyVariables(alimtalkOptions.variables),
      disableSms,
      adFlag: alimtalkOptions.kakao?.adFlag,
      buttons: Array.isArray(alimtalkOptions.kakao?.buttons)
        ? alimtalkOptions.kakao.buttons
        : undefined,
      imageId: alimtalkOptions.kakao?.imageId,
    };

    return base as unknown as SolapiSendOneMessage;
  }

  if (type === "CTA" || type === "CTI") {
    const friendTalkOptions = options as Extract<
      SendOptions,
      { type: "FRIENDTALK" }
    >;
    const text = friendTalkOptions.text;
    if (text.length === 0) {
      throw new KMsgError(
        KMsgErrorCode.INVALID_REQUEST,
        "text is required for FRIENDTALK",
        { providerId },
      );
    }

    const pfId =
      typeof friendTalkOptions.kakao?.profileId === "string" &&
      friendTalkOptions.kakao.profileId.length > 0
        ? friendTalkOptions.kakao.profileId
        : config.kakaoPfId;

    if (!pfId || pfId.length === 0) {
      throw new KMsgError(
        KMsgErrorCode.INVALID_REQUEST,
        "kakao profileId is required (options.kakao.profileId or config.kakaoPfId)",
        { providerId },
      );
    }

    const kakaoButtons = toKakaoButtons(friendTalkOptions.buttons);
    const buttons = Array.isArray(friendTalkOptions.kakao?.buttons)
      ? friendTalkOptions.kakao.buttons
      : kakaoButtons;

    const imageLinkFromOptions =
      typeof friendTalkOptions.kakao?.imageLink === "string" &&
      friendTalkOptions.kakao.imageLink.length > 0
        ? friendTalkOptions.kakao.imageLink
        : undefined;
    const firstButton =
      Array.isArray(buttons) && buttons.length > 0 ? buttons[0] : undefined;
    const imageLinkFromButton =
      isObjectRecord(firstButton) && typeof firstButton.linkMo === "string"
        ? (firstButton.linkMo as string)
        : undefined;
    const imageLink = imageLinkFromOptions ?? imageLinkFromButton;

    let imageId: string | undefined;
    if (type === "CTI") {
      const imageRef = resolveImageRef({
        imageUrl: friendTalkOptions.imageUrl,
        media: friendTalkOptions.media,
        providerId,
      });
      if (!imageRef) {
        throw new KMsgError(
          KMsgErrorCode.INVALID_REQUEST,
          "image is required for CTI (friendtalk image) (options.imageUrl or options.media.image.ref)",
          { providerId },
        );
      }
      if (!imageLink) {
        throw new KMsgError(
          KMsgErrorCode.INVALID_REQUEST,
          "imageLink is required for friendtalk image upload (options.kakao.imageLink or WL button)",
          { providerId },
        );
      }

      const upload = await client.uploadFile(
        imageRef,
        "KAKAO",
        undefined,
        imageLink,
      );
      const fileId = extractFileId(upload);
      if (typeof fileId === "string" && fileId.length > 0) {
        imageId = fileId;
      } else {
        throw new KMsgError(
          KMsgErrorCode.PROVIDER_ERROR,
          "Failed to upload friendtalk image",
          {
            providerId,
          },
        );
      }
    }

    base.text = text;
    base.kakaoOptions = {
      pfId,
      variables: stringifyVariables(friendTalkOptions.variables),
      disableSms: friendTalkOptions.kakao?.disableSms,
      adFlag: friendTalkOptions.kakao?.adFlag,
      buttons,
      imageId,
    };

    return base as unknown as SolapiSendOneMessage;
  }

  if (type === "NSA") {
    const nsaOptions = options as Extract<SendOptions, { type: "NSA" }>;
    const talkId =
      typeof nsaOptions.naver?.talkId === "string" &&
      nsaOptions.naver.talkId.length > 0
        ? nsaOptions.naver.talkId
        : config.naverTalkId;

    if (!talkId || talkId.length === 0) {
      throw new KMsgError(
        KMsgErrorCode.INVALID_REQUEST,
        "naver talkId is required (options.naver.talkId or config.naverTalkId)",
        { providerId },
      );
    }

    const templateId =
      typeof nsaOptions.naver?.templateCode === "string" &&
      nsaOptions.naver.templateCode.length > 0
        ? nsaOptions.naver.templateCode
        : nsaOptions.templateCode;

    const variables = {
      ...stringifyVariables(nsaOptions.variables),
      ...stringifyVariables(nsaOptions.naver?.variables),
    };

    base.naverOptions = {
      talkId,
      templateId,
      variables,
      disableSms: nsaOptions.naver?.disableSms,
      buttons: Array.isArray(nsaOptions.naver?.buttons)
        ? nsaOptions.naver.buttons
        : undefined,
    };

    return base as unknown as SolapiSendOneMessage;
  }

  if (type === "VOICE") {
    const voiceMessageOptions = options as Extract<
      SendOptions,
      { type: "VOICE" }
    >;
    const text = voiceMessageOptions.text;
    if (text.length === 0) {
      throw new KMsgError(
        KMsgErrorCode.INVALID_REQUEST,
        "text is required for VOICE",
        {
          providerId,
        },
      );
    }

    const voiceTypeRaw = voiceMessageOptions.voice?.voiceType;
    const voiceType =
      voiceTypeRaw === "FEMALE" || voiceTypeRaw === "MALE"
        ? voiceTypeRaw
        : "FEMALE";

    base.text = text;
    base.voiceOptions = voiceMessageOptions.voice
      ? { ...voiceMessageOptions.voice, voiceType }
      : { voiceType };

    return base as unknown as SolapiSendOneMessage;
  }

  if (type === "FAX") {
    const faxOptions = options as Extract<SendOptions, { type: "FAX" }>;
    const fax = faxOptions.fax;
    const fileIdsFromOptions = Array.isArray(fax?.fileIds)
      ? fax.fileIds.filter(
          (value: unknown): value is string =>
            typeof value === "string" && value.length > 0,
        )
      : [];

    let fileIds = fileIdsFromOptions;

    if (fileIds.length === 0) {
      const fileUrls = Array.isArray(fax?.fileUrls)
        ? fax.fileUrls.filter(
            (value: unknown): value is string =>
              typeof value === "string" && value.length > 0,
          )
        : [];

      if (fileUrls.length === 0) {
        throw new KMsgError(
          KMsgErrorCode.INVALID_REQUEST,
          "fax.fileIds or fax.fileUrls is required",
          {
            providerId,
          },
        );
      }

      fileIds = [];
      for (const url of fileUrls) {
        const upload = await client.uploadFile(url, "FAX");
        const fileId = extractFileId(upload);
        if (typeof fileId === "string" && fileId.length > 0) {
          fileIds.push(fileId);
        }
      }
    }

    if (fileIds.length === 0) {
      throw new KMsgError(
        KMsgErrorCode.PROVIDER_ERROR,
        "Failed to resolve fax fileIds",
        {
          providerId,
        },
      );
    }

    base.faxOptions = { fileIds };
    return base as unknown as SolapiSendOneMessage;
  }

  const rcsOptions = options as Extract<
    SendOptions,
    {
      type:
        | "RCS_SMS"
        | "RCS_LMS"
        | "RCS_MMS"
        | "RCS_TPL"
        | "RCS_ITPL"
        | "RCS_LTPL";
    }
  >;
  const rcs = rcsOptions.rcs;

  const brandId =
    typeof rcs?.brandId === "string" && rcs.brandId.length > 0
      ? rcs.brandId
      : config.rcsBrandId;

  if (!brandId || brandId.length === 0) {
    throw new KMsgError(
      KMsgErrorCode.INVALID_REQUEST,
      "rcs brandId is required (options.rcs.brandId or config.rcsBrandId)",
      { providerId },
    );
  }

  const rcsPayload: Record<string, unknown> = {
    brandId,
    buttons: Array.isArray(rcs?.buttons) ? rcs.buttons : undefined,
    copyAllowed: rcs?.copyAllowed,
    mmsType: rcs?.mmsType,
    commercialType: rcs?.commercialType,
    disableSms: rcs?.disableSms,
    variables: {
      ...stringifyVariables(rcsOptions.variables),
      ...stringifyVariables(rcs?.variables),
    },
  };

  if (type === "RCS_TPL" || type === "RCS_ITPL" || type === "RCS_LTPL") {
    const templateOptions = options as Extract<
      SendOptions,
      { type: "RCS_TPL" | "RCS_ITPL" | "RCS_LTPL" }
    >;
    rcsPayload.templateId =
      typeof templateOptions.rcs?.templateCode === "string" &&
      templateOptions.rcs.templateCode.length > 0
        ? templateOptions.rcs.templateCode
        : templateOptions.templateCode;
  }

  let text: string | undefined;
  let subject: string | undefined;
  if (type === "RCS_SMS" || type === "RCS_LMS" || type === "RCS_MMS") {
    const textOptions = options as Extract<
      SendOptions,
      { type: "RCS_SMS" | "RCS_LMS" | "RCS_MMS" }
    >;
    text = textOptions.text;
    subject = textOptions.subject;

    if (!text || text.length === 0) {
      throw new KMsgError(
        KMsgErrorCode.INVALID_REQUEST,
        "text is required for RCS text types",
        { providerId },
      );
    }
    base.text = text;
    if (subject) base.subject = subject;
  }

  const additionalBodyRaw = rcs?.additionalBody;
  const additionalBody = isObjectRecord(additionalBodyRaw)
    ? additionalBodyRaw
    : undefined;
  const additionalBodyImageId =
    additionalBody &&
    typeof additionalBody.imageId === "string" &&
    additionalBody.imageId.length > 0
      ? additionalBody.imageId
      : additionalBody &&
          typeof additionalBody.imaggeId === "string" &&
          additionalBody.imaggeId.length > 0
        ? additionalBody.imaggeId
        : undefined;

  const buildAdditionalBody = (uploadedImageId?: string) => {
    const record = additionalBody ? { ...additionalBody } : {};
    const title =
      typeof record.title === "string" && record.title.length > 0
        ? record.title
        : subject || "RCS";
    const description =
      typeof record.description === "string" && record.description.length > 0
        ? record.description
        : text || "";
    const imaggeId = additionalBodyImageId ?? uploadedImageId;

    const normalized: Record<string, unknown> = {
      ...record,
      title,
      description,
    };

    if (typeof imaggeId === "string" && imaggeId.length > 0) {
      normalized.imaggeId = imaggeId;
    }

    return normalized;
  };

  if (type === "RCS_MMS") {
    const rcsTextOptions = options as Extract<
      SendOptions,
      { type: "RCS_SMS" | "RCS_LMS" | "RCS_MMS" }
    >;

    const imageRef = resolveImageRef({
      imageUrl: rcsTextOptions.imageUrl,
      media: rcsTextOptions.media,
      providerId,
    });
    if (imageRef) {
      const upload = await client.uploadFile(imageRef, "RCS");
      const fileId = extractFileId(upload);
      if (typeof fileId === "string" && fileId.length > 0) {
        rcsPayload.additionalBody = buildAdditionalBody(fileId);
      } else if (additionalBody) {
        rcsPayload.additionalBody = buildAdditionalBody(undefined);
      }
    } else if (additionalBody) {
      rcsPayload.additionalBody = buildAdditionalBody(undefined);
    }
  } else if (additionalBody) {
    rcsPayload.additionalBody = buildAdditionalBody(undefined);
  }

  base.rcsOptions = rcsPayload;
  return base as unknown as SolapiSendOneMessage;
}

export async function sendWithSolapi(params: {
  providerId: string;
  client: SolapiSdkClient;
  config: SolapiConfig;
  options: SendOptions;
}): Promise<Result<SendResult, KMsgError>> {
  const { providerId, client, config, options } = params;

  const warnings = collectSolapiSendWarnings(options, providerId);
  const message = await buildSolapiSendOneMessage({
    options,
    providerId,
    config,
    client,
  });
  const response = await client.sendOne(message, config.appId);

  return ok(
    adaptSolapiSendResult({
      options,
      response,
      providerId,
      warnings,
    }),
  );
}
