import {
  type DeliveryStatus,
  type DeliveryStatusQuery,
  type DeliveryStatusResult,
  fail,
  KMsgError,
  KMsgErrorCode,
  type MessageBinaryInput,
  type MessageButton,
  type MessageType,
  type MessageVariables,
  ok,
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
import { getProviderOnboardingSpec } from "../onboarding/specs";
import { isObjectRecord } from "../shared/type-guards";
import type { SolapiConfig } from "./types/solapi";

export type SolapiSdkClient = Pick<
  SolapiMessageService,
  "sendOne" | "getMessages" | "getBalance" | "uploadFile"
>;

type SolapiSendOneMessage = Parameters<SolapiSdkClient["sendOne"]>[0];
type SolapiMessageType = Exclude<SolapiSendOneMessage["type"], undefined>;

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

  getOnboardingSpec() {
    const spec = getProviderOnboardingSpec(this.id);
    if (!spec) {
      throw new Error(`Onboarding spec missing for provider: ${this.id}`);
    }
    return spec;
  }

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
      client ??
      new SolapiMessageService(this.config.apiKey, this.config.apiSecret);
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
      const warnings = this.collectSendWarnings(normalized);
      const message = await this.buildSolapiSendOneMessage(normalized);
      const response = await this.client.sendOne(message, this.config.appId);
      return ok(this.adaptSendResult(normalized, response, warnings));
    } catch (error) {
      return fail(this.mapError(error));
    }
  }

  async getDeliveryStatus(
    query: DeliveryStatusQuery,
  ): Promise<Result<DeliveryStatusResult | null, KMsgError>> {
    const providerMessageId = query.providerMessageId.trim();
    if (!providerMessageId) {
      return fail(
        new KMsgError(
          KMsgErrorCode.INVALID_REQUEST,
          "providerMessageId is required",
          { providerId: this.id },
        ),
      );
    }

    try {
      const response = await this.client.getMessages({
        messageId: providerMessageId,
        limit: 1,
      });

      const record = (isObjectRecord(response) ? response : {}) as Record<
        string,
        unknown
      >;
      const messageList = record.messageList;
      if (
        !messageList ||
        typeof messageList !== "object" ||
        Array.isArray(messageList)
      ) {
        return ok(null);
      }

      const recordList = messageList as Record<string, unknown>;
      const direct = recordList[providerMessageId];

      const values = Object.values(recordList);
      const found = values.find((v) => {
        if (!isObjectRecord(v)) return false;
        const mid = v.messageId;
        return typeof mid === "string" ? mid === providerMessageId : false;
      });

      const message = isObjectRecord(direct)
        ? direct
        : isObjectRecord(found)
          ? found
          : undefined;
      if (!message) return ok(null);

      const statusCode =
        typeof message.statusCode === "string" ? message.statusCode : undefined;
      const status = this.mapSolapiStatusCode(statusCode);

      const sentAt = this.parseDate(message.dateSent);
      const deliveredAt = this.parseDate(message.dateCompleted);

      return ok({
        providerId: this.id,
        providerMessageId,
        status,
        statusCode,
        statusMessage:
          typeof message.statusMessage === "string"
            ? message.statusMessage
            : undefined,
        sentAt,
        deliveredAt,
        raw: message,
      });
    } catch (error) {
      return fail(this.mapError(error));
    }
  }

  private adaptSendResult(
    options: SendOptions,
    response: unknown,
    warnings?: SendResult["warnings"],
  ): SendResult {
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
      ...(Array.isArray(warnings) && warnings.length > 0 ? { warnings } : {}),
      raw: response,
    };
  }

  private collectSendWarnings(options: SendOptions): SendResult["warnings"] {
    if (options.type !== "ALIMTALK") return undefined;
    if (options.failover?.enabled !== true) return undefined;

    return [
      {
        code: "FAILOVER_PARTIAL_PROVIDER",
        message:
          "SOLAPI failover mapping is partial. API-level fallback may be attempted for non-Kakao-user failures.",
        details: {
          providerId: this.id,
          mappedFields: ["kakao.disableSms", "text", "subject"],
          unsupportedFields: ["fallbackChannel"],
        },
      },
    ];
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

  private mapSolapiStatusCode(statusCode?: string): DeliveryStatus {
    if (!statusCode) return "UNKNOWN";
    if (statusCode === "2000") return "PENDING";
    if (statusCode === "3000") return "SENT";
    if (statusCode === "4000") return "DELIVERED";
    if (/^[123]\\d{3}$/.test(statusCode)) return "FAILED";
    return "UNKNOWN";
  }

  private parseDate(value: unknown): Date | undefined {
    if (typeof value !== "string" || value.trim().length === 0) {
      return undefined;
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return undefined;
    return date;
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

  private toKakaoButtons(
    buttons: MessageButton[] | undefined,
  ): SolapiKakaoButton[] | undefined {
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

  private resolveImageRef(options: {
    imageUrl?: string;
    media?: { image?: MessageBinaryInput };
  }) {
    const imageUrl =
      typeof options.imageUrl === "string" && options.imageUrl.trim().length > 0
        ? options.imageUrl.trim()
        : undefined;
    if (imageUrl) return imageUrl;

    const image = options.media?.image;
    if (!image) return undefined;

    if ("ref" in image) {
      const ref = image.ref.trim();
      return ref.length > 0 ? ref : undefined;
    }

    // SOLAPI SDK's `uploadFile()` accepts a file path / URL string.
    // If a caller provides bytes/blob, they must pre-host the file (or provide a local path).
    throw new KMsgError(
      KMsgErrorCode.INVALID_REQUEST,
      "SOLAPI image upload requires `options.imageUrl` or `options.media.image.ref` (url/path).",
      { providerId: this.id },
    );
  }

  private extractFileId(upload: unknown): string | undefined {
    return isObjectRecord(upload) && typeof upload.fileId === "string"
      ? upload.fileId
      : undefined;
  }

  private toSolapiMessageType(options: SendOptions): SolapiMessageType {
    switch (options.type) {
      case "ALIMTALK":
        return "ATA";
      case "FRIENDTALK":
        return (typeof options.imageUrl === "string" &&
          options.imageUrl.trim().length > 0) ||
          Boolean(options.media?.image)
          ? "CTI"
          : "CTA";
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
      typeof options.options?.country === "string" &&
      options.options.country.length > 0
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
      const smsOptions = options as Extract<
        SendOptions,
        { type: "SMS" | "LMS" | "MMS" }
      >;
      const text = smsOptions.text;
      if (text.length === 0) {
        throw new KMsgError(
          KMsgErrorCode.INVALID_REQUEST,
          "text is required for SMS/LMS/MMS",
          { providerId: this.id, type: options.type },
        );
      }

      base.text = text;
      const subject = smsOptions.subject;
      if (subject) {
        base.subject = subject;
      }

      if (type === "MMS") {
        const imageRef = this.resolveImageRef(smsOptions);
        if (!imageRef) {
          throw new KMsgError(
            KMsgErrorCode.INVALID_REQUEST,
            "image is required for MMS (options.imageUrl or options.media.image.ref)",
            { providerId: this.id },
          );
        }

        const upload = await this.client.uploadFile(imageRef, "MMS");
        const fileId = this.extractFileId(upload);
        if (typeof fileId === "string" && fileId.length > 0) {
          base.imageId = fileId;
        } else {
          throw new KMsgError(
            KMsgErrorCode.PROVIDER_ERROR,
            "Failed to upload MMS image",
            { providerId: this.id },
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
          : this.config.kakaoPfId;

      if (!pfId || pfId.length === 0) {
        throw new KMsgError(
          KMsgErrorCode.INVALID_REQUEST,
          "kakao profileId is required (options.kakao.profileId or config.kakaoPfId)",
          { providerId: this.id },
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
        variables: this.stringifyVariables(alimtalkOptions.variables),
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
          { providerId: this.id },
        );
      }

      const pfId =
        typeof friendTalkOptions.kakao?.profileId === "string" &&
        friendTalkOptions.kakao.profileId.length > 0
          ? friendTalkOptions.kakao.profileId
          : this.config.kakaoPfId;

      if (!pfId || pfId.length === 0) {
        throw new KMsgError(
          KMsgErrorCode.INVALID_REQUEST,
          "kakao profileId is required (options.kakao.profileId or config.kakaoPfId)",
          { providerId: this.id },
        );
      }

      const kakaoButtons = this.toKakaoButtons(friendTalkOptions.buttons);
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
        const imageRef = this.resolveImageRef(friendTalkOptions);
        if (!imageRef) {
          throw new KMsgError(
            KMsgErrorCode.INVALID_REQUEST,
            "image is required for CTI (friendtalk image) (options.imageUrl or options.media.image.ref)",
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
          imageRef,
          "KAKAO",
          undefined,
          imageLink,
        );
        const fileId = this.extractFileId(upload);
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
        variables: this.stringifyVariables(friendTalkOptions.variables),
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
          : this.config.naverTalkId;

      if (!talkId || talkId.length === 0) {
        throw new KMsgError(
          KMsgErrorCode.INVALID_REQUEST,
          "naver talkId is required (options.naver.talkId or config.naverTalkId)",
          { providerId: this.id },
        );
      }

      const templateId =
        typeof nsaOptions.naver?.templateCode === "string" &&
        nsaOptions.naver.templateCode.length > 0
          ? nsaOptions.naver.templateCode
          : nsaOptions.templateCode;

      const variables = {
        ...this.stringifyVariables(nsaOptions.variables),
        ...this.stringifyVariables(nsaOptions.naver?.variables),
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
          { providerId: this.id },
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
          const fileId = this.extractFileId(upload);
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
      buttons: Array.isArray(rcs?.buttons) ? rcs.buttons : undefined,
      copyAllowed: rcs?.copyAllowed,
      mmsType: rcs?.mmsType,
      commercialType: rcs?.commercialType,
      disableSms: rcs?.disableSms,
      variables: {
        ...this.stringifyVariables(rcsOptions.variables),
        ...this.stringifyVariables(rcs?.variables),
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
          { providerId: this.id },
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
        // SOLAPI expects `imaggeId` for RCS additionalBody.
        normalized.imaggeId = imaggeId;
      }

      return normalized;
    };

    if (type === "RCS_MMS") {
      const rcsTextOptions = options as Extract<
        SendOptions,
        { type: "RCS_SMS" | "RCS_LMS" | "RCS_MMS" }
      >;

      const imageRef = this.resolveImageRef(rcsTextOptions);
      if (imageRef) {
        const upload = await this.client.uploadFile(imageRef, "RCS");
        const fileId = this.extractFileId(upload);
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
