import type {
  HistoryQuery,
  StandardError,
  StandardRequest,
  StandardResult,
} from "@k-msg/core";
import {
  BaseProviderAdapter,
  StandardErrorCode,
  StandardStatus,
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
import type { SolapiConfig } from "../solapi/types/solapi";

export type SolapiSdkClient = Pick<
  SolapiMessageService,
  "sendOne" | "getMessages" | "getBalance" | "uploadFile"
>;

type SolapiSendOneMessage = Parameters<SolapiSdkClient["sendOne"]>[0];
type SolapiMessageType = Exclude<SolapiSendOneMessage["type"], undefined>;
type SolapiGetMessagesRequest = Exclude<
  Parameters<SolapiSdkClient["getMessages"]>[0],
  undefined
>;

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

type SolapiKakaoButton = {
  buttonName: string;
  buttonType: "WL";
  linkMo: string;
  linkPc?: string;
};

type SolapiRcsButton = {
  buttonName: string;
  buttonType: "WL";
  link: string;
};

export class SolapiAdapter extends BaseProviderAdapter {
  private static readonly directTemplates = new Set([
    "SMS_DIRECT",
    "LMS_DIRECT",
    "MMS_DIRECT",
    "FRIENDTALK_DIRECT",
    "RCS_SMS_DIRECT",
    "RCS_LMS_DIRECT",
    "RCS_MMS_DIRECT",
  ]);

  private readonly solapiConfig: SolapiConfig;
  private readonly client: SolapiSdkClient;

  constructor(config: SolapiConfig, client?: SolapiSdkClient) {
    const baseUrl =
      typeof config.baseUrl === "string" && config.baseUrl.length > 0
        ? config.baseUrl
        : "https://api.solapi.com";
    const normalizedConfig: SolapiConfig = {
      ...config,
      baseUrl,
    };

    super(normalizedConfig);
    this.solapiConfig = normalizedConfig;
    this.client =
      client ?? new SolapiMessageService(config.apiKey, config.apiSecret);
  }

  adaptRequest(request: StandardRequest): Record<string, unknown> {
    // This adapter uses the official SOLAPI SDK in sendStandard().
    // Keep adaptRequest deterministic for debugging purposes.
    return {
      to: request.phoneNumber,
      templateCode: request.templateCode,
      channel: request.channel,
      variables: request.variables,
      text: request.text,
      imageUrl: request.imageUrl,
      buttons: request.buttons,
      options: request.options,
    };
  }

  adaptResponse(response: unknown): StandardResult {
    const record = isObjectRecord(response) ? response : {};
    const messageId =
      typeof record.messageId === "string"
        ? record.messageId
        : this.generateMessageId();

    const statusCode =
      typeof record.statusCode === "string" ? record.statusCode : undefined;
    const statusMessage =
      typeof record.statusMessage === "string"
        ? record.statusMessage
        : undefined;

    return {
      messageId,
      status: StandardStatus.SENT,
      provider: "solapi",
      timestamp: new Date(),
      phoneNumber: typeof record.to === "string" ? record.to : "",
      metadata: {
        groupId:
          typeof record.groupId === "string" ? record.groupId : undefined,
        accountId:
          typeof record.accountId === "string" ? record.accountId : undefined,
        type: typeof record.type === "string" ? record.type : undefined,
        statusCode,
        statusMessage,
      },
    };
  }

  mapError(error: unknown): StandardError {
    const record = isObjectRecord(error) ? error : {};

    if (error instanceof ApiKeyError) {
      return {
        code: StandardErrorCode.AUTHENTICATION_FAILED,
        message: error.message,
        retryable: false,
      };
    }

    if (error instanceof BadRequestError) {
      return {
        code: StandardErrorCode.INVALID_REQUEST,
        message: error.message,
        retryable: false,
        details: {
          validationErrors: record.validationErrors,
        },
      };
    }

    if (error instanceof NetworkError) {
      const retryable =
        typeof record.isRetryable === "boolean" ? record.isRetryable : true;
      const url = typeof record.url === "string" ? record.url : undefined;
      const method =
        typeof record.method === "string" ? record.method : undefined;

      return {
        code: StandardErrorCode.NETWORK_ERROR,
        message: error.message,
        retryable,
        details: {
          url,
          method,
        },
      };
    }

    if (error instanceof ClientError) {
      const httpStatus =
        typeof record.httpStatus === "number" ? record.httpStatus : undefined;
      const asInvalidRequest =
        typeof httpStatus === "number" && httpStatus >= 400 && httpStatus < 500;

      return {
        code: asInvalidRequest
          ? StandardErrorCode.INVALID_REQUEST
          : StandardErrorCode.PROVIDER_ERROR,
        message: error.message,
        retryable: !asInvalidRequest,
        details: {
          httpStatus,
          errorCode: record.errorCode,
          errorMessage: record.errorMessage,
          url: record.url,
        },
      };
    }

    if (error instanceof ServerError) {
      return {
        code: StandardErrorCode.PROVIDER_ERROR,
        message: error.message,
        retryable: true,
        details: {
          httpStatus:
            typeof record.httpStatus === "number"
              ? record.httpStatus
              : undefined,
        },
      };
    }

    if (error instanceof DefaultError) {
      return {
        code: StandardErrorCode.PROVIDER_ERROR,
        message: error.message,
        retryable: false,
        details: {
          errorCode: record.errorCode,
          errorMessage: record.errorMessage,
        },
      };
    }

    return {
      code: StandardErrorCode.UNKNOWN_ERROR,
      message: error instanceof Error ? error.message : String(error),
      retryable: false,
    };
  }

  getAuthHeaders(): Record<string, string> {
    // UniversalProvider.healthCheck expects non-empty auth header output.
    return {
      "X-SOLAPI-API-KEY": this.solapiConfig.apiKey,
    };
  }

  getBaseUrl(): string {
    return this.solapiConfig.baseUrl;
  }

  getEndpoint(_operation: string): string {
    return "/";
  }

  async sendStandard(request: StandardRequest): Promise<StandardResult> {
    try {
      const message = await this.buildSolapiSendOneMessage(request);
      const response = await this.client.sendOne(
        message,
        this.solapiConfig.appId,
      );
      const result = this.adaptResponse(response);
      result.phoneNumber = request.phoneNumber;
      return result;
    } catch (error) {
      return {
        messageId: this.generateMessageId(),
        status: StandardStatus.FAILED,
        provider: "solapi",
        timestamp: new Date(),
        phoneNumber: request.phoneNumber,
        error: this.mapError(error),
      };
    }
  }

  async getSmsCharge(): Promise<number> {
    try {
      const response = await this.client.getBalance();
      return response.balance;
    } catch (error) {
      this.log("Failed to get SOLAPI balance", error);
      return 0;
    }
  }

  async getBalance(): Promise<number> {
    return this.getSmsCharge();
  }

  async getSmsHistory(params: {
    channel?: HistoryQuery["channel"];
    startDate: string | Date;
    endDate: string | Date;
    requestNo?: string;
    pageNum?: number;
    pageSize?: number;
    phone?: string;
    startKey?: string;
  }): Promise<{
    totalCount: number;
    list: unknown[];
    message: string;
    nextKey?: string | null;
    raw?: unknown;
  }> {
    const limit = this.clampLimit(params.pageSize);
    const type = this.toSolapiTypeFromChannel(params.channel);

    const baseQuery: Record<string, unknown> = {
      dateType: "CREATED",
      startDate: params.startDate,
      endDate: params.endDate,
      limit,
    };

    if (typeof params.phone === "string" && params.phone.length > 0) {
      baseQuery.to = this.normalizePhoneNumber(params.phone);
    }
    if (typeof params.requestNo === "string" && params.requestNo.length > 0) {
      baseQuery.messageId = params.requestNo;
    }
    if (typeof type === "string") {
      baseQuery.type = type;
    }

    let startKey =
      typeof params.startKey === "string" ? params.startKey : undefined;

    const pageNum =
      typeof params.pageNum === "number" && params.pageNum > 0
        ? Math.floor(params.pageNum)
        : 1;
    if (!startKey && pageNum > 1) {
      // Cursor pagination: walk forward to reach the requested page.
      for (let i = 1; i < pageNum; i++) {
        const page = await this.client.getMessages({
          ...baseQuery,
          startKey,
        } as unknown as SolapiGetMessagesRequest);
        const nextKey = page.nextKey;
        if (typeof nextKey !== "string" || nextKey.length === 0) {
          startKey = undefined;
          break;
        }
        startKey = nextKey;
      }
    }

    const response = await this.client.getMessages({
      ...baseQuery,
      startKey,
    } as unknown as SolapiGetMessagesRequest);
    const list = Object.values(response.messageList) as unknown[];
    const nextKey = response.nextKey;

    return {
      totalCount: list.length,
      list,
      message: "ok",
      nextKey,
      raw: response,
    };
  }

  async getHistory(query: HistoryQuery): Promise<unknown> {
    const limit = this.clampLimit(query.pageSize);
    const baseQuery: Record<string, unknown> = {
      dateType: "CREATED",
      startDate: query.startDate,
      endDate: query.endDate,
      limit,
    };

    if (typeof query.phone === "string" && query.phone.length > 0) {
      baseQuery.to = this.normalizePhoneNumber(query.phone);
    }
    if (typeof query.requestNo === "string" && query.requestNo.length > 0) {
      baseQuery.messageId = query.requestNo;
    }
    if (typeof query.startKey === "string" && query.startKey.length > 0) {
      baseQuery.startKey = query.startKey;
    }

    if (query.channel === "ALIMTALK") {
      baseQuery.type = "ATA";
      return await this.client.getMessages(
        baseQuery as unknown as SolapiGetMessagesRequest,
      );
    }

    if (
      query.channel === "NSA" ||
      query.channel === "VOICE" ||
      query.channel === "FAX"
    ) {
      baseQuery.type = query.channel;
      return await this.client.getMessages(
        baseQuery as unknown as SolapiGetMessagesRequest,
      );
    }

    if (query.channel === "FRIENDTALK") {
      const response = await this.client.getMessages(
        baseQuery as unknown as SolapiGetMessagesRequest,
      );
      const list = Object.values(response.messageList);
      const filtered = list.filter((item) => {
        return item.type === "CTA" || item.type === "CTI";
      });
      return {
        ...response,
        list: filtered,
      };
    }

    // Fallback: return raw response without type filter.
    return await this.client.getMessages(
      baseQuery as unknown as SolapiGetMessagesRequest,
    );
  }

  private clampLimit(pageSize: unknown): number {
    const n = typeof pageSize === "number" ? pageSize : Number(pageSize);
    const limit = Number.isFinite(n) ? n : 15;
    // SOLAPI getMessages limit is commonly capped (docs show patterns like max 500 elsewhere).
    return Math.min(Math.max(Math.floor(limit), 1), 500);
  }

  private normalizePhoneNumber(phone: string): string {
    // Keep digits and leading '+' only.
    const trimmed = phone.trim();
    if (trimmed.startsWith("+")) {
      return `+${trimmed.slice(1).replace(/\D/g, "")}`;
    }
    return trimmed.replace(/\D/g, "");
  }

  private toSolapiTypeFromChannel(
    channel: HistoryQuery["channel"] | undefined,
  ): SolapiMessageType | undefined {
    switch (channel) {
      case "SMS":
      case "LMS":
      case "MMS":
      case "NSA":
      case "VOICE":
      case "FAX":
      case "RCS_SMS":
      case "RCS_LMS":
      case "RCS_MMS":
      case "RCS_TPL":
      case "RCS_ITPL":
      case "RCS_LTPL":
        return channel;
      default:
        return undefined;
    }
  }

  private stringifyVariables(
    variables: Record<string, unknown> | undefined,
  ): Record<string, string> {
    const output: Record<string, string> = {};
    if (!variables) return output;
    for (const [key, value] of Object.entries(variables)) {
      if (value === undefined) continue;
      output[key] = typeof value === "string" ? value : String(value);
    }
    return output;
  }

  private extractText(request: StandardRequest): string | undefined {
    if (typeof request.text === "string" && request.text.trim().length > 0) {
      return request.text;
    }
    const message = request.variables.message;
    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
    const fullText = request.variables._full_text;
    if (typeof fullText === "string" && fullText.trim().length > 0) {
      return fullText;
    }
    return undefined;
  }

  private extractSubject(request: StandardRequest): string | undefined {
    if (
      typeof request.options?.subject === "string" &&
      request.options.subject.trim().length > 0
    ) {
      return request.options.subject;
    }
    const subject = request.variables?.subject;
    if (typeof subject === "string" && subject.trim().length > 0) {
      return subject;
    }
    return undefined;
  }

  private resolveChannelLike(request: StandardRequest): string {
    const channel =
      typeof request.channel === "string" && request.channel.length > 0
        ? request.channel.trim().toUpperCase()
        : "";
    if (channel.length > 0) return channel;

    const templateCode =
      typeof request.templateCode === "string"
        ? request.templateCode.trim().toUpperCase()
        : "";

    if (templateCode === "MMS_DIRECT") return "MMS";
    if (templateCode === "LMS_DIRECT") return "LMS";
    if (templateCode === "SMS_DIRECT") return "SMS";
    if (templateCode === "FRIENDTALK_DIRECT") return "FRIENDTALK";
    if (templateCode === "VOICE_DIRECT") return "VOICE";
    if (templateCode === "FAX_DIRECT") return "FAX";
    if (templateCode === "RCS_SMS_DIRECT") return "RCS_SMS";
    if (templateCode === "RCS_LMS_DIRECT") return "RCS_LMS";
    if (templateCode === "RCS_MMS_DIRECT") return "RCS_MMS";

    if (SolapiAdapter.directTemplates.has(templateCode)) {
      return "SMS";
    }

    return "ALIMTALK";
  }

  private toSolapiMessageType(request: StandardRequest): SolapiMessageType {
    const channel = this.resolveChannelLike(request);
    switch (channel) {
      case "SMS":
      case "LMS":
      case "MMS":
      case "NSA":
      case "VOICE":
      case "FAX":
      case "RCS_SMS":
      case "RCS_LMS":
      case "RCS_MMS":
      case "RCS_TPL":
      case "RCS_ITPL":
      case "RCS_LTPL":
        return channel as SolapiMessageType;
      case "FRIENDTALK":
        return request.imageUrl ? "CTI" : "CTA";
      default:
        return "ATA";
    }
  }

  private toKakaoButtons(buttons: unknown): SolapiKakaoButton[] | undefined {
    if (!Array.isArray(buttons) || buttons.length === 0) return undefined;
    const out: SolapiKakaoButton[] = [];

    for (const raw of buttons) {
      if (!raw || typeof raw !== "object") continue;
      const record = raw as Record<string, unknown>;
      const type = typeof record.type === "string" ? record.type : undefined;
      if (type !== "WL") continue;

      const name = typeof record.name === "string" ? record.name : "";
      const urlMobile =
        typeof record.urlMobile === "string" ? record.urlMobile : undefined;
      const urlPc = typeof record.urlPc === "string" ? record.urlPc : undefined;

      if (!name || !urlMobile) continue;
      out.push({
        buttonName: name,
        buttonType: "WL",
        linkMo: urlMobile,
        linkPc: urlPc,
      });
    }

    return out.length > 0 ? out : undefined;
  }

  private toRcsButtons(buttons: unknown): SolapiRcsButton[] | undefined {
    if (!Array.isArray(buttons) || buttons.length === 0) return undefined;
    const out: SolapiRcsButton[] = [];

    for (const raw of buttons) {
      if (!raw || typeof raw !== "object") continue;
      const record = raw as Record<string, unknown>;
      const type = typeof record.type === "string" ? record.type : undefined;
      if (type !== "WL") continue;

      const name = typeof record.name === "string" ? record.name : "";
      const urlMobile =
        typeof record.urlMobile === "string" ? record.urlMobile : undefined;
      const urlPc = typeof record.urlPc === "string" ? record.urlPc : undefined;

      const link = urlMobile || urlPc;
      if (!name || !link) continue;
      out.push({
        buttonName: name,
        buttonType: "WL",
        link,
      });
    }

    return out.length > 0 ? out : undefined;
  }

  private async buildSolapiSendOneMessage(
    request: StandardRequest,
  ): Promise<SolapiSendOneMessage> {
    const type = this.toSolapiMessageType(request);
    const messageText = this.extractText(request);
    const subject = this.extractSubject(request);

    const scheduledAt = request.options?.scheduledAt;
    const senderNumber =
      typeof request.options?.senderNumber === "string" &&
      request.options.senderNumber.length > 0
        ? request.options.senderNumber
        : this.solapiConfig.defaultFrom;

    const base: Record<string, unknown> = {
      to: this.normalizePhoneNumber(request.phoneNumber),
      type,
    };

    const country =
      typeof request.options?.country === "string" &&
      request.options.country.length > 0
        ? request.options.country
        : typeof this.solapiConfig.defaultCountry === "string"
          ? this.solapiConfig.defaultCountry
          : undefined;
    if (country) {
      base.country = country;
    }

    const customFieldsRaw = request.options?.customFields;
    if (isObjectRecord(customFieldsRaw)) {
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

    // SMS/LMS/MMS and all RCS types require a sender number.
    const requiresFrom =
      type === "SMS" ||
      type === "LMS" ||
      type === "MMS" ||
      type === "VOICE" ||
      type === "FAX" ||
      String(type).startsWith("RCS_");

    if (requiresFrom) {
      if (!senderNumber || senderNumber.length === 0) {
        throw new Error(
          "senderNumber is required (options.senderNumber or config.defaultFrom)",
        );
      }
      base.from = this.normalizePhoneNumber(senderNumber);
    } else if (senderNumber) {
      base.from = this.normalizePhoneNumber(senderNumber);
    }

    if (type === "SMS" || type === "LMS" || type === "MMS") {
      if (!messageText) {
        throw new Error("text or variables.message is required");
      }
      base.text = messageText;
      if (subject) {
        base.subject = subject;
      }

      if (type === "MMS" && typeof request.imageUrl === "string") {
        const upload = await this.client.uploadFile(request.imageUrl, "MMS");
        const fileId = upload.fileId;
        if (typeof fileId === "string" && fileId.length > 0) {
          base.imageId = fileId;
        }
      }

      return base as unknown as SolapiSendOneMessage;
    }

    if (type === "ATA") {
      const kakaoOptions = request.options?.kakaoOptions;
      const pfId =
        typeof kakaoOptions?.pfId === "string" && kakaoOptions.pfId.length > 0
          ? kakaoOptions.pfId
          : this.solapiConfig.kakaoPfId;

      if (!pfId || pfId.length === 0) {
        throw new Error(
          "kakao pfId is required (options.kakaoOptions.pfId or config.kakaoPfId)",
        );
      }

      const buttons = Array.isArray(kakaoOptions?.buttons)
        ? kakaoOptions.buttons
        : this.toKakaoButtons(request.buttons);

      base.kakaoOptions = {
        pfId,
        templateId: request.templateCode,
        variables: this.stringifyVariables(request.variables),
        disableSms: kakaoOptions?.disableSms,
        adFlag: kakaoOptions?.adFlag,
        buttons,
        imageId: kakaoOptions?.imageId,
      };

      return base as unknown as SolapiSendOneMessage;
    }

    if (type === "CTA" || type === "CTI") {
      if (!messageText) {
        throw new Error("text or variables.message is required");
      }

      const kakaoOptions = request.options?.kakaoOptions;
      const pfId =
        typeof kakaoOptions?.pfId === "string" && kakaoOptions.pfId.length > 0
          ? kakaoOptions.pfId
          : this.solapiConfig.kakaoPfId;

      if (!pfId || pfId.length === 0) {
        throw new Error(
          "kakao pfId is required (options.kakaoOptions.pfId or config.kakaoPfId)",
        );
      }

      const buttons = Array.isArray(kakaoOptions?.buttons)
        ? kakaoOptions.buttons
        : this.toKakaoButtons(request.buttons);

      const imageLinkRaw = kakaoOptions?.imageLink;
      const imageLinkFromOptions =
        typeof imageLinkRaw === "string" && imageLinkRaw.length > 0
          ? imageLinkRaw
          : undefined;

      const firstButton =
        Array.isArray(buttons) && buttons.length > 0 ? buttons[0] : undefined;
      const imageLinkFromButton =
        isObjectRecord(firstButton) && typeof firstButton.linkMo === "string"
          ? firstButton.linkMo
          : undefined;

      const imageLink = imageLinkFromOptions ?? imageLinkFromButton;

      let imageId: string | undefined;
      if (type === "CTI") {
        if (!request.imageUrl) {
          throw new Error("imageUrl is required for CTI (friendtalk image)");
        }
        if (!imageLink) {
          throw new Error(
            "imageLink is required for friendtalk image upload (options.kakaoOptions.imageLink or WL button)",
          );
        }
        const upload = await this.client.uploadFile(
          request.imageUrl,
          "KAKAO",
          undefined,
          imageLink,
        );
        const fileId = upload.fileId;
        if (typeof fileId === "string" && fileId.length > 0) {
          imageId = fileId;
        } else {
          throw new Error("Failed to upload friendtalk image");
        }
      }

      base.text = messageText;
      base.kakaoOptions = {
        pfId,
        variables: this.stringifyVariables(request.variables),
        disableSms: kakaoOptions?.disableSms,
        adFlag: kakaoOptions?.adFlag,
        buttons,
        imageId,
      };

      return base as unknown as SolapiSendOneMessage;
    }

    if (type === "NSA") {
      const naverOptions = request.options?.naverOptions;

      const talkId =
        typeof naverOptions?.talkId === "string" &&
        naverOptions.talkId.length > 0
          ? naverOptions.talkId
          : this.solapiConfig.naverTalkId;

      if (!talkId || talkId.length === 0) {
        throw new Error(
          "naver talkId is required (options.naverOptions.talkId or config.naverTalkId)",
        );
      }

      const templateId =
        typeof naverOptions?.templateId === "string" &&
        naverOptions.templateId.length > 0
          ? naverOptions.templateId
          : request.templateCode;

      const buttons = Array.isArray(naverOptions?.buttons)
        ? naverOptions.buttons
        : this.toKakaoButtons(request.buttons);

      const variables = {
        ...this.stringifyVariables(request.variables),
        ...this.stringifyVariables(naverOptions?.variables),
      };

      base.naverOptions = {
        talkId,
        templateId,
        variables,
        disableSms: naverOptions?.disableSms,
        buttons,
      };

      return base as unknown as SolapiSendOneMessage;
    }

    if (type === "VOICE") {
      if (!messageText) {
        throw new Error("text or variables.message is required");
      }

      const voiceOptionsRaw = request.options?.voiceOptions;
      const voiceTypeRaw = isObjectRecord(voiceOptionsRaw)
        ? voiceOptionsRaw.voiceType
        : undefined;
      const voiceType =
        voiceTypeRaw === "FEMALE" || voiceTypeRaw === "MALE"
          ? voiceTypeRaw
          : "FEMALE";

      base.text = messageText;
      base.voiceOptions = isObjectRecord(voiceOptionsRaw)
        ? { ...voiceOptionsRaw, voiceType }
        : { voiceType };

      return base as unknown as SolapiSendOneMessage;
    }

    if (type === "FAX") {
      const faxOptions = request.options?.faxOptions;
      const fileIdsFromOptions = Array.isArray(faxOptions?.fileIds)
        ? faxOptions.fileIds.filter((value): value is string => {
            return typeof value === "string" && value.length > 0;
          })
        : [];

      let fileIds = fileIdsFromOptions;

      if (fileIds.length === 0) {
        const fileUrls = Array.isArray(faxOptions?.fileUrls)
          ? faxOptions.fileUrls.filter((value): value is string => {
              return typeof value === "string" && value.length > 0;
            })
          : [];

        if (fileUrls.length === 0) {
          throw new Error(
            "fax fileIds or fileUrls is required (options.faxOptions.fileIds/fileUrls)",
          );
        }

        fileIds = [];
        for (const url of fileUrls) {
          const upload = await this.client.uploadFile(url, "FAX");
          const fileId = upload.fileId;
          if (typeof fileId === "string" && fileId.length > 0) {
            fileIds.push(fileId);
          }
        }
      }

      if (fileIds.length === 0) {
        throw new Error("Failed to resolve fax fileIds");
      }

      base.faxOptions = { fileIds };

      return base as unknown as SolapiSendOneMessage;
    }

    // RCS
    const rcsOptions = request.options?.rcsOptions;

    const brandId =
      typeof rcsOptions?.brandId === "string" && rcsOptions.brandId.length > 0
        ? rcsOptions.brandId
        : this.solapiConfig.rcsBrandId;

    if (!brandId || brandId.length === 0) {
      throw new Error(
        "rcs brandId is required (options.rcsOptions.brandId or config.rcsBrandId)",
      );
    }

    const rcsButtons = Array.isArray(rcsOptions?.buttons)
      ? rcsOptions.buttons
      : this.toRcsButtons(request.buttons);

    const rcsVariables = {
      ...this.stringifyVariables(request.variables),
      ...this.stringifyVariables(rcsOptions?.variables),
    };

    const rcsPayload: Record<string, unknown> = {
      brandId,
      buttons: rcsButtons,
      copyAllowed: rcsOptions?.copyAllowed,
      mmsType: rcsOptions?.mmsType,
      commercialType: rcsOptions?.commercialType,
      disableSms: rcsOptions?.disableSms,
      variables: rcsVariables,
    };

    // For template types, templateCode is used as templateId unless caller provided it explicitly.
    if (type === "RCS_TPL" || type === "RCS_ITPL" || type === "RCS_LTPL") {
      rcsPayload.templateId =
        typeof rcsOptions?.templateId === "string" &&
        rcsOptions.templateId.length > 0
          ? rcsOptions.templateId
          : request.templateCode;
    }

    if (
      !messageText &&
      (type === "RCS_SMS" || type === "RCS_LMS" || type === "RCS_MMS")
    ) {
      throw new Error("text or variables.message is required");
    }
    if (messageText) {
      base.text = messageText;
    }
    if (subject) {
      base.subject = subject;
    }

    const additionalBodyRaw = rcsOptions?.additionalBody;
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
          : messageText || "";
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

    if (type === "RCS_MMS" && typeof request.imageUrl === "string") {
      const upload = await this.client.uploadFile(request.imageUrl, "RCS");
      const fileId = upload.fileId;
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
