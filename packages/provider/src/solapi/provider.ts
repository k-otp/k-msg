import {
  fail,
  KMsgError,
  KMsgErrorCode,
  ok,
  type MessageButton,
  type MessageType,
  type MessageVariables,
  type Provider,
  type ProviderHealthStatus,
  type Result,
  type SendOptions,
  type SendResult,
} from "@k-msg/core";
import {
  ApiKeyError,
  BadRequestError,
  ClientError,
  DefaultError,
  NetworkError,
  ServerError,
  SolapiMessageService,
} from "solapi";
import type { SolapiConfig } from "./types/solapi";

export type SolapiSdkClient = Pick<
  SolapiMessageService,
  "sendOne" | "getMessages" | "getBalance" | "uploadFile"
>;

type SolapiSendOneMessage = Parameters<SolapiSdkClient["sendOne"]>[0];
type SolapiMessageType = Exclude<SolapiSendOneMessage["type"], undefined>;

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

type SolapiKakaoButton = {
  buttonName: string;
  buttonType: "WL";
  linkMo: string;
  linkPc?: string;
};

export class SolapiProvider implements Provider {
  readonly id = "solapi";
  readonly name = "SOLAPI Messaging Provider";
  readonly supportedTypes: readonly MessageType[] = [
    "ALIMTALK",
    "FRIENDTALK",
    "SMS",
    "LMS",
    "MMS",
    "NSA",
    "VOICE",
    "FAX",
    "RCS_SMS",
    "RCS_LMS",
    "RCS_MMS",
    "RCS_TPL",
    "RCS_ITPL",
    "RCS_LTPL",
  ];

  private readonly config: SolapiConfig;
  private readonly client: SolapiSdkClient;

  constructor(config: SolapiConfig, client?: SolapiSdkClient) {
    if (!config || typeof config !== "object") {
      throw new Error("SolapiProvider requires a config object");
    }
    if (!config.apiKey || config.apiKey.length === 0) {
      throw new Error("SolapiProvider requires `apiKey`");
    }
    if (!config.apiSecret || config.apiSecret.length === 0) {
      throw new Error("SolapiProvider requires `apiSecret`");
    }

    this.config = {
      ...config,
      baseUrl:
        typeof config.baseUrl === "string" && config.baseUrl.length > 0
          ? config.baseUrl
          : "https://api.solapi.com",
    };
    this.client =
      client ?? new SolapiMessageService(this.config.apiKey, this.config.apiSecret);
  }

  async healthCheck(): Promise<ProviderHealthStatus> {
    const issues: string[] = [];
    const start = Date.now();

    try {
      if (!this.config.apiKey) issues.push("Missing apiKey");
      if (!this.config.apiSecret) issues.push("Missing apiSecret");
      if (this.config.baseUrl) {
        try {
          new URL(this.config.baseUrl);
        } catch {
          issues.push("Invalid baseUrl");
        }
      }

      return {
        healthy: issues.length === 0,
        issues,
        latencyMs: Date.now() - start,
        data: {
          provider: this.id,
          baseUrl: this.config.baseUrl,
        },
      };
    } catch (error) {
      issues.push(error instanceof Error ? error.message : String(error));
      return { healthy: false, issues, latencyMs: Date.now() - start };
    }
  }

  async send(options: SendOptions): Promise<Result<SendResult, KMsgError>> {
    const messageId = options.messageId || crypto.randomUUID();
    const normalized = { ...options, messageId } as SendOptions;

    try {
      const message = await this.buildSolapiSendOneMessage(normalized);
      const response = await this.client.sendOne(message, this.config.appId);
      return ok(this.adaptSendResult(normalized, response));
    } catch (error) {
      return fail(this.mapError(error));
    }
  }

  private adaptSendResult(options: SendOptions, response: unknown): SendResult {
    const record = isObjectRecord(response) ? response : {};
    const providerMessageId =
      typeof record.messageId === "string" ? record.messageId : undefined;

    return {
      messageId: options.messageId || crypto.randomUUID(),
      providerId: this.id,
      providerMessageId,
      status: "SENT",
      type: options.type,
      to: options.to,
      raw: response,
    };
  }

  private mapError(error: unknown): KMsgError {
    if (error instanceof KMsgError) return error;

    const record = isObjectRecord(error) ? error : {};

    if (error instanceof ApiKeyError) {
      return new KMsgError(KMsgErrorCode.AUTHENTICATION_FAILED, error.message, {
        providerId: this.id,
      });
    }

    if (error instanceof BadRequestError) {
      return new KMsgError(KMsgErrorCode.INVALID_REQUEST, error.message, {
        providerId: this.id,
        validationErrors: record.validationErrors,
      });
    }

    if (error instanceof NetworkError) {
      return new KMsgError(KMsgErrorCode.NETWORK_ERROR, error.message, {
        providerId: this.id,
        url: typeof record.url === "string" ? record.url : undefined,
        method: typeof record.method === "string" ? record.method : undefined,
        isRetryable:
          typeof record.isRetryable === "boolean" ? record.isRetryable : true,
      });
    }

    if (error instanceof ClientError) {
      const httpStatus =
        typeof record.httpStatus === "number" ? record.httpStatus : undefined;
      const isInvalidRequest =
        typeof httpStatus === "number" && httpStatus >= 400 && httpStatus < 500;

      return new KMsgError(
        isInvalidRequest
          ? KMsgErrorCode.INVALID_REQUEST
          : KMsgErrorCode.PROVIDER_ERROR,
        error.message,
        {
          providerId: this.id,
          httpStatus,
          errorCode: record.errorCode,
          errorMessage: record.errorMessage,
          url: record.url,
        },
      );
    }

    if (error instanceof ServerError) {
      return new KMsgError(KMsgErrorCode.PROVIDER_ERROR, error.message, {
        providerId: this.id,
        httpStatus:
          typeof record.httpStatus === "number" ? record.httpStatus : undefined,
      });
    }

    if (error instanceof DefaultError) {
      return new KMsgError(KMsgErrorCode.PROVIDER_ERROR, error.message, {
        providerId: this.id,
        errorCode: record.errorCode,
        errorMessage: record.errorMessage,
      });
    }

    return new KMsgError(
      KMsgErrorCode.UNKNOWN_ERROR,
      error instanceof Error ? error.message : String(error),
      { providerId: this.id },
    );
  }

  private normalizePhoneNumber(phone: string): string {
    const trimmed = phone.trim();
    if (trimmed.startsWith("+")) {
      return `+${trimmed.slice(1).replace(/\\D/g, "")}`;
    }
    return trimmed.replace(/\\D/g, "");
  }

  private stringifyVariables(
    variables: MessageVariables | undefined,
  ): Record<string, string> {
    const output: Record<string, string> = {};
    if (!variables) return output;

    for (const [key, value] of Object.entries(variables)) {
      if (value === undefined) continue;
      output[key] =
        value === null
          ? ""
          : value instanceof Date
            ? value.toISOString()
            : typeof value === "string"
              ? value
              : String(value);
    }

    return output;
  }

  private toKakaoButtons(buttons: MessageButton[] | undefined): SolapiKakaoButton[] | undefined {
    if (!Array.isArray(buttons) || buttons.length === 0) return undefined;
    const out: SolapiKakaoButton[] = [];

    for (const button of buttons) {
      if (!button) continue;
      if (button.type !== "WL") continue;
      if (!button.name || !button.urlMobile) continue;
      out.push({
        buttonName: button.name,
        buttonType: "WL",
        linkMo: button.urlMobile,
        linkPc: button.urlPc,
      });
    }

    return out.length > 0 ? out : undefined;
  }

  private toSolapiMessageType(options: SendOptions): SolapiMessageType {
    switch (options.type) {
      case "ALIMTALK":
        return "ATA";
      case "FRIENDTALK":
        return options.imageUrl ? "CTI" : "CTA";
      default:
        return options.type as unknown as SolapiMessageType;
    }
  }

  private async buildSolapiSendOneMessage(
    options: SendOptions,
  ): Promise<SolapiSendOneMessage> {
    const type = this.toSolapiMessageType(options);
    const scheduledAt = options.options?.scheduledAt;
    const senderNumber =
      typeof options.from === "string" && options.from.length > 0
        ? options.from
        : this.config.defaultFrom;

    const base: Record<string, unknown> = {
      to: this.normalizePhoneNumber(options.to),
      type,
    };

    const country =
      typeof options.options?.country === "string" && options.options.country.length > 0
        ? options.options.country
        : typeof this.config.defaultCountry === "string"
          ? this.config.defaultCountry
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
          { providerId: this.id, type: options.type },
        );
      }
      base.from = this.normalizePhoneNumber(senderNumber);
    } else if (senderNumber) {
      base.from = this.normalizePhoneNumber(senderNumber);
    }

    if (type === "SMS" || type === "LMS" || type === "MMS") {
      const text = (options as any).text as string | undefined;
      if (!text || text.length === 0) {
        throw new KMsgError(
          KMsgErrorCode.INVALID_REQUEST,
          "text is required for SMS/LMS/MMS",
          { providerId: this.id, type: options.type },
        );
      }

      base.text = text;
      const subject = (options as any).subject as string | undefined;
      if (subject) {
        base.subject = subject;
      }

      if (type === "MMS" && typeof (options as any).imageUrl === "string") {
        const upload = await this.client.uploadFile((options as any).imageUrl, "MMS");
        const fileId = (upload as any)?.fileId;
        if (typeof fileId === "string" && fileId.length > 0) {
          base.imageId = fileId;
        }
      }

      return base as unknown as SolapiSendOneMessage;
    }

    if (type === "ATA") {
      const pfId =
        typeof (options as any).kakao?.profileId === "string" &&
        (options as any).kakao.profileId.length > 0
          ? (options as any).kakao.profileId
          : this.config.kakaoPfId;

      if (!pfId || pfId.length === 0) {
        throw new KMsgError(
          KMsgErrorCode.INVALID_REQUEST,
          "kakao profileId is required (options.kakao.profileId or config.kakaoPfId)",
          { providerId: this.id },
        );
      }

      base.kakaoOptions = {
        pfId,
        templateId: (options as any).templateCode,
        variables: this.stringifyVariables((options as any).variables),
        disableSms: (options as any).kakao?.disableSms,
        adFlag: (options as any).kakao?.adFlag,
        buttons: Array.isArray((options as any).kakao?.buttons)
          ? (options as any).kakao.buttons
          : undefined,
        imageId: (options as any).kakao?.imageId,
      };

      return base as unknown as SolapiSendOneMessage;
    }

    if (type === "CTA" || type === "CTI") {
      const text = (options as any).text as string | undefined;
      if (!text || text.length === 0) {
        throw new KMsgError(
          KMsgErrorCode.INVALID_REQUEST,
          "text is required for FRIENDTALK",
          { providerId: this.id },
        );
      }

      const pfId =
        typeof (options as any).kakao?.profileId === "string" &&
        (options as any).kakao.profileId.length > 0
          ? (options as any).kakao.profileId
          : this.config.kakaoPfId;

      if (!pfId || pfId.length === 0) {
        throw new KMsgError(
          KMsgErrorCode.INVALID_REQUEST,
          "kakao profileId is required (options.kakao.profileId or config.kakaoPfId)",
          { providerId: this.id },
        );
      }

      const kakaoButtons = this.toKakaoButtons((options as any).buttons);
      const buttons = Array.isArray((options as any).kakao?.buttons)
        ? (options as any).kakao.buttons
        : kakaoButtons;

      const imageLinkFromOptions =
        typeof (options as any).kakao?.imageLink === "string" &&
        (options as any).kakao.imageLink.length > 0
          ? (options as any).kakao.imageLink
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
        const imageUrl = (options as any).imageUrl as string | undefined;
        if (!imageUrl) {
          throw new KMsgError(
            KMsgErrorCode.INVALID_REQUEST,
            "imageUrl is required for CTI (friendtalk image)",
            { providerId: this.id },
          );
        }
        if (!imageLink) {
          throw new KMsgError(
            KMsgErrorCode.INVALID_REQUEST,
            "imageLink is required for friendtalk image upload (options.kakao.imageLink or WL button)",
            { providerId: this.id },
          );
        }

        const upload = await this.client.uploadFile(
          imageUrl,
          "KAKAO",
          undefined,
          imageLink,
        );
        const fileId = (upload as any)?.fileId;
        if (typeof fileId === "string" && fileId.length > 0) {
          imageId = fileId;
        } else {
          throw new KMsgError(
            KMsgErrorCode.PROVIDER_ERROR,
            "Failed to upload friendtalk image",
            { providerId: this.id },
          );
        }
      }

      base.text = text;
      base.kakaoOptions = {
        pfId,
        variables: this.stringifyVariables((options as any).variables),
        disableSms: (options as any).kakao?.disableSms,
        adFlag: (options as any).kakao?.adFlag,
        buttons,
        imageId,
      };

      return base as unknown as SolapiSendOneMessage;
    }

    if (type === "NSA") {
      const talkId =
        typeof (options as any).naver?.talkId === "string" &&
        (options as any).naver.talkId.length > 0
          ? (options as any).naver.talkId
          : this.config.naverTalkId;

      if (!talkId || talkId.length === 0) {
        throw new KMsgError(
          KMsgErrorCode.INVALID_REQUEST,
          "naver talkId is required (options.naver.talkId or config.naverTalkId)",
          { providerId: this.id },
        );
      }

      const templateId =
        typeof (options as any).naver?.templateCode === "string" &&
        (options as any).naver.templateCode.length > 0
          ? (options as any).naver.templateCode
          : (options as any).templateCode;

      const variables = {
        ...this.stringifyVariables((options as any).variables),
        ...this.stringifyVariables((options as any).naver?.variables),
      };

      base.naverOptions = {
        talkId,
        templateId,
        variables,
        disableSms: (options as any).naver?.disableSms,
        buttons: Array.isArray((options as any).naver?.buttons)
          ? (options as any).naver.buttons
          : undefined,
      };

      return base as unknown as SolapiSendOneMessage;
    }

    if (type === "VOICE") {
      const text = (options as any).text as string | undefined;
      if (!text || text.length === 0) {
        throw new KMsgError(
          KMsgErrorCode.INVALID_REQUEST,
          "text is required for VOICE",
          { providerId: this.id },
        );
      }

      const voiceTypeRaw = (options as any).voice?.voiceType;
      const voiceType =
        voiceTypeRaw === "FEMALE" || voiceTypeRaw === "MALE"
          ? voiceTypeRaw
          : "FEMALE";

      base.text = text;
      base.voiceOptions = isObjectRecord((options as any).voice)
        ? { ...(options as any).voice, voiceType }
        : { voiceType };

      return base as unknown as SolapiSendOneMessage;
    }

    if (type === "FAX") {
      const fax = (options as any).fax;
      const fileIdsFromOptions = Array.isArray(fax?.fileIds)
        ? fax.fileIds.filter((value: unknown): value is string => {
            return typeof value === "string" && value.length > 0;
          })
        : [];

      let fileIds = fileIdsFromOptions;

      if (fileIds.length === 0) {
        const fileUrls = Array.isArray(fax?.fileUrls)
          ? fax.fileUrls.filter((value: unknown): value is string => {
              return typeof value === "string" && value.length > 0;
            })
          : [];

        if (fileUrls.length === 0) {
          throw new KMsgError(
            KMsgErrorCode.INVALID_REQUEST,
            "fax.fileIds or fax.fileUrls is required",
            { providerId: this.id },
          );
        }

        fileIds = [];
        for (const url of fileUrls) {
          const upload = await this.client.uploadFile(url, "FAX");
          const fileId = (upload as any)?.fileId;
          if (typeof fileId === "string" && fileId.length > 0) {
            fileIds.push(fileId);
          }
        }
      }

      if (fileIds.length === 0) {
        throw new KMsgError(
          KMsgErrorCode.PROVIDER_ERROR,
          "Failed to resolve fax fileIds",
          { providerId: this.id },
        );
      }

      base.faxOptions = { fileIds };
      return base as unknown as SolapiSendOneMessage;
    }

    // RCS
    const brandId =
      typeof (options as any).rcs?.brandId === "string" &&
      (options as any).rcs.brandId.length > 0
        ? (options as any).rcs.brandId
        : this.config.rcsBrandId;

    if (!brandId || brandId.length === 0) {
      throw new KMsgError(
        KMsgErrorCode.INVALID_REQUEST,
        "rcs brandId is required (options.rcs.brandId or config.rcsBrandId)",
        { providerId: this.id },
      );
    }

    const rcsPayload: Record<string, unknown> = {
      brandId,
      buttons: Array.isArray((options as any).rcs?.buttons)
        ? (options as any).rcs.buttons
        : undefined,
      copyAllowed: (options as any).rcs?.copyAllowed,
      mmsType: (options as any).rcs?.mmsType,
      commercialType: (options as any).rcs?.commercialType,
      disableSms: (options as any).rcs?.disableSms,
      variables: {
        ...this.stringifyVariables((options as any).variables),
        ...this.stringifyVariables((options as any).rcs?.variables),
      },
    };

    if (type === "RCS_TPL" || type === "RCS_ITPL" || type === "RCS_LTPL") {
      rcsPayload.templateId =
        typeof (options as any).rcs?.templateCode === "string" &&
        (options as any).rcs.templateCode.length > 0
          ? (options as any).rcs.templateCode
          : (options as any).templateCode;
    }

    const text = (options as any).text as string | undefined;
    const subject = (options as any).subject as string | undefined;

    if (!text && (type === "RCS_SMS" || type === "RCS_LMS" || type === "RCS_MMS")) {
      throw new KMsgError(
        KMsgErrorCode.INVALID_REQUEST,
        "text is required for RCS text types",
        { providerId: this.id },
      );
    }
    if (text) base.text = text;
    if (subject) base.subject = subject;

    const additionalBodyRaw = (options as any).rcs?.additionalBody;
    const additionalBody = isObjectRecord(additionalBodyRaw)
      ? additionalBodyRaw
      : undefined;
    const additionalBodyImageId =
      additionalBody &&
      typeof additionalBody.imageId === "string" &&
      additionalBody.imageId.length > 0
        ? additionalBody.imageId
        : additionalBody &&
            typeof (additionalBody as any).imaggeId === "string" &&
            (additionalBody as any).imaggeId.length > 0
          ? (additionalBody as any).imaggeId
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
        // SOLAPI expects `imaggeId` for RCS additionalBody.
        normalized.imaggeId = imaggeId;
      }

      return normalized;
    };

    if (type === "RCS_MMS" && typeof (options as any).imageUrl === "string") {
      const upload = await this.client.uploadFile((options as any).imageUrl, "RCS");
      const fileId = (upload as any)?.fileId;
      if (typeof fileId === "string" && fileId.length > 0) {
        rcsPayload.additionalBody = buildAdditionalBody(fileId);
      } else if (additionalBody) {
        rcsPayload.additionalBody = buildAdditionalBody(undefined);
      }
    } else if (additionalBody) {
      rcsPayload.additionalBody = buildAdditionalBody(undefined);
    }

    base.rcsOptions = rcsPayload;
    return base as unknown as SolapiSendOneMessage;
  }
}

export const createSolapiProvider = (config: SolapiConfig) =>
  new SolapiProvider(config);

export const createDefaultSolapiProvider = () => {
  const config: SolapiConfig = {
    apiKey: process.env.SOLAPI_API_KEY || "",
    apiSecret: process.env.SOLAPI_API_SECRET || "",
    baseUrl: process.env.SOLAPI_BASE_URL || "https://api.solapi.com",
    defaultFrom: process.env.SOLAPI_DEFAULT_FROM,
    kakaoPfId: process.env.SOLAPI_KAKAO_PF_ID,
    rcsBrandId: process.env.SOLAPI_RCS_BRAND_ID,
    naverTalkId: process.env.SOLAPI_NAVER_TALK_ID,
    appId: process.env.SOLAPI_APP_ID,
    defaultCountry: process.env.SOLAPI_DEFAULT_COUNTRY,
    debug: process.env.NODE_ENV === "development",
  };

  if (!config.apiKey || !config.apiSecret) {
    throw new Error(
      "SOLAPI_API_KEY and SOLAPI_API_SECRET environment variables are required",
    );
  }

  return createSolapiProvider(config);
};

// biome-ignore lint/complexity/noStaticOnlyClass: kept as a factory for convenience
export class SolapiProviderFactory {
  static create(config: SolapiConfig): SolapiProvider {
    return new SolapiProvider(config);
  }

  static createDefault(): SolapiProvider {
    return createDefaultSolapiProvider();
  }
}

export function initializeSolapi(): void {}
