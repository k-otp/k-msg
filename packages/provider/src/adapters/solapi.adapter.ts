import {
  BaseProviderAdapter,
  StandardErrorCode,
  type StandardRequest,
  type StandardResult,
  StandardStatus,
} from "@k-msg/core";
import type { HistoryQuery, StandardError } from "@k-msg/core";
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

type SolapiMessageType =
  | "SMS"
  | "LMS"
  | "MMS"
  | "ATA"
  | "CTA"
  | "CTI"
  | "RCS_SMS"
  | "RCS_LMS"
  | "RCS_MMS"
  | "RCS_TPL"
  | "RCS_ITPL"
  | "RCS_LTPL";

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

  adaptRequest(request: StandardRequest): any {
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

  adaptResponse(response: any): StandardResult {
    const messageId =
      response && typeof response.messageId === "string"
        ? response.messageId
        : this.generateMessageId();

    const statusCode =
      response && typeof response.statusCode === "string"
        ? response.statusCode
        : undefined;
    const statusMessage =
      response && typeof response.statusMessage === "string"
        ? response.statusMessage
        : undefined;

    return {
      messageId,
      status: StandardStatus.SENT,
      provider: "solapi",
      timestamp: new Date(),
      phoneNumber: response && typeof response.to === "string" ? response.to : "",
      metadata: {
        groupId:
          response && typeof response.groupId === "string"
            ? response.groupId
            : undefined,
        accountId:
          response && typeof response.accountId === "string"
            ? response.accountId
            : undefined,
        type: response && typeof response.type === "string" ? response.type : undefined,
        statusCode,
        statusMessage,
      },
    };
  }

  mapError(error: unknown): StandardError {
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
          validationErrors: (error as any).validationErrors,
        },
      };
    }

    if (error instanceof NetworkError) {
      return {
        code: StandardErrorCode.NETWORK_ERROR,
        message: error.message,
        retryable:
          typeof (error as any).isRetryable === "boolean"
            ? Boolean((error as any).isRetryable)
            : true,
        details: {
          url: (error as any).url,
          method: (error as any).method,
        },
      };
    }

    if (error instanceof ClientError) {
      const httpStatus = typeof (error as any).httpStatus === "number" ? (error as any).httpStatus : undefined;
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
          errorCode: (error as any).errorCode,
          errorMessage: (error as any).errorMessage,
          url: (error as any).url,
        },
      };
    }

    if (error instanceof ServerError) {
      return {
        code: StandardErrorCode.PROVIDER_ERROR,
        message: error.message,
        retryable: true,
        details: {
          httpStatus: (error as any).httpStatus,
        },
      };
    }

    if (error instanceof DefaultError) {
      return {
        code: StandardErrorCode.PROVIDER_ERROR,
        message: error.message,
        retryable: false,
        details: {
          errorCode: (error as any).errorCode,
          errorMessage: (error as any).errorMessage,
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
      const response = await this.client.sendOne(message as any, this.solapiConfig.appId);
      const result = this.adaptResponse(response as any);
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
      const balance = (response as any)?.balance;
      return typeof balance === "number" ? balance : Number(balance) || 0;
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

    let startKey = typeof params.startKey === "string" ? params.startKey : undefined;

    const pageNum = typeof params.pageNum === "number" && params.pageNum > 0 ? Math.floor(params.pageNum) : 1;
    if (!startKey && pageNum > 1) {
      // Cursor pagination: walk forward to reach the requested page.
      for (let i = 1; i < pageNum; i++) {
        const page = await this.client.getMessages({ ...baseQuery, startKey } as any);
        const nextKey = (page as any)?.nextKey;
        if (typeof nextKey !== "string" || nextKey.length === 0) {
          startKey = undefined;
          break;
        }
        startKey = nextKey;
      }
    }

    const response = await this.client.getMessages({ ...baseQuery, startKey } as any);
    const messageList =
      response && typeof response === "object" && (response as any).messageList
        ? (response as any).messageList
        : {};

    const list = messageList && typeof messageList === "object" && !Array.isArray(messageList)
      ? Object.values(messageList as Record<string, unknown>)
      : [];

    const nextKey =
      response && typeof response === "object" && "nextKey" in (response as any)
        ? ((response as any).nextKey as string | null | undefined)
        : undefined;

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
      return await this.client.getMessages(baseQuery as any);
    }

    if (query.channel === "FRIENDTALK") {
      const response = await this.client.getMessages(baseQuery as any);
      const messageList = (response as any)?.messageList;
      const list =
        messageList && typeof messageList === "object" && !Array.isArray(messageList)
          ? Object.values(messageList as Record<string, any>)
          : [];
      const filtered = list.filter((item) => {
        if (!item || typeof item !== "object") return false;
        const type = (item as any).type;
        return type === "CTA" || type === "CTI";
      });
      return {
        ...response,
        list: filtered,
      };
    }

    // Fallback: return raw response without type filter.
    return await this.client.getMessages(baseQuery as any);
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
    variables: Record<string, any> | undefined,
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
    const message = request.variables?.message;
    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
    const fullText = (request.variables as any)?._full_text;
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
    if (templateCode === "RCS_SMS_DIRECT") return "RCS_SMS";
    if (templateCode === "RCS_LMS_DIRECT") return "RCS_LMS";
    if (templateCode === "RCS_MMS_DIRECT") return "RCS_MMS";

    if (SolapiAdapter.directTemplates.has(templateCode)) {
      return "SMS";
    }

    return "ALIMTALK";
  }

  private toSolapiMessageType(
    request: StandardRequest,
  ): SolapiMessageType {
    const channel = this.resolveChannelLike(request);
    switch (channel) {
      case "SMS":
      case "LMS":
      case "MMS":
      case "RCS_SMS":
      case "RCS_LMS":
      case "RCS_MMS":
      case "RCS_TPL":
      case "RCS_ITPL":
      case "RCS_LTPL":
        return channel as SolapiMessageType;
      case "FRIENDTALK":
        return request.imageUrl ? "CTI" : "CTA";
      case "ALIMTALK":
      default:
        return "ATA";
    }
  }

  private toKakaoButtons(buttons: unknown): any[] | undefined {
    if (!Array.isArray(buttons) || buttons.length === 0) return undefined;
    const out: any[] = [];

    for (const raw of buttons) {
      if (!raw || typeof raw !== "object") continue;
      const record = raw as Record<string, unknown>;
      const type = typeof record.type === "string" ? record.type : undefined;
      if (type !== "WL") continue;

      const name = typeof record.name === "string" ? record.name : "";
      const urlMobile =
        typeof record.urlMobile === "string" ? record.urlMobile : undefined;
      const urlPc =
        typeof record.urlPc === "string" ? record.urlPc : undefined;

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

  private toRcsButtons(buttons: unknown): any[] | undefined {
    if (!Array.isArray(buttons) || buttons.length === 0) return undefined;
    const out: any[] = [];

    for (const raw of buttons) {
      if (!raw || typeof raw !== "object") continue;
      const record = raw as Record<string, unknown>;
      const type = typeof record.type === "string" ? record.type : undefined;
      if (type !== "WL") continue;

      const name = typeof record.name === "string" ? record.name : "";
      const urlMobile =
        typeof record.urlMobile === "string" ? record.urlMobile : undefined;
      const urlPc =
        typeof record.urlPc === "string" ? record.urlPc : undefined;

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
  ): Promise<Record<string, unknown>> {
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

    if (typeof this.solapiConfig.defaultCountry === "string") {
      base.country = this.solapiConfig.defaultCountry;
    }

    if (scheduledAt) {
      base.scheduledDate = scheduledAt;
    }

    // SMS/LMS/MMS and all RCS types require a sender number.
    const requiresFrom =
      type === "SMS" ||
      type === "LMS" ||
      type === "MMS" ||
      String(type).startsWith("RCS_");

    if (requiresFrom) {
      if (!senderNumber || senderNumber.length === 0) {
        throw new Error("senderNumber is required (options.senderNumber or config.defaultFrom)");
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
        const upload = await this.client.uploadFile(request.imageUrl, "MMS" as any);
        const fileId = (upload as any)?.fileId;
        if (typeof fileId === "string" && fileId.length > 0) {
          base.imageId = fileId;
        }
      }

      return base;
    }

    if (type === "ATA") {
      const kakaoOptions =
        request.options?.kakaoOptions && typeof request.options.kakaoOptions === "object"
          ? (request.options.kakaoOptions as Record<string, unknown>)
          : {};
      const pfId =
        typeof kakaoOptions.pfId === "string" && kakaoOptions.pfId.length > 0
          ? kakaoOptions.pfId
          : this.solapiConfig.kakaoPfId;

      if (!pfId || pfId.length === 0) {
        throw new Error("kakao pfId is required (options.kakaoOptions.pfId or config.kakaoPfId)");
      }

      const buttons = Array.isArray(kakaoOptions.buttons)
        ? (kakaoOptions.buttons as any[])
        : this.toKakaoButtons(request.buttons);

      base.kakaoOptions = {
        pfId,
        templateId: request.templateCode,
        variables: this.stringifyVariables(request.variables),
        disableSms: kakaoOptions.disableSms,
        adFlag: kakaoOptions.adFlag,
        buttons,
        imageId: kakaoOptions.imageId,
      };

      return base;
    }

    if (type === "CTA" || type === "CTI") {
      if (!messageText) {
        throw new Error("text or variables.message is required");
      }

      const kakaoOptions =
        request.options?.kakaoOptions && typeof request.options.kakaoOptions === "object"
          ? (request.options.kakaoOptions as Record<string, unknown>)
          : {};
      const pfId =
        typeof kakaoOptions.pfId === "string" && kakaoOptions.pfId.length > 0
          ? kakaoOptions.pfId
          : this.solapiConfig.kakaoPfId;

      if (!pfId || pfId.length === 0) {
        throw new Error("kakao pfId is required (options.kakaoOptions.pfId or config.kakaoPfId)");
      }

      const buttons = Array.isArray(kakaoOptions.buttons)
        ? (kakaoOptions.buttons as any[])
        : this.toKakaoButtons(request.buttons);

      const imageLink =
        typeof kakaoOptions.imageLink === "string" && kakaoOptions.imageLink.length > 0
          ? kakaoOptions.imageLink
          : buttons && buttons.length > 0
            ? (buttons[0] as any).linkMo
            : undefined;

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
        const upload = await this.client.uploadFile(request.imageUrl, "KAKAO" as any, undefined, imageLink);
        const fileId = (upload as any)?.fileId;
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
        disableSms: kakaoOptions.disableSms,
        adFlag: kakaoOptions.adFlag,
        buttons,
        imageId,
      };

      return base;
    }

    // RCS
    const rcsOptions =
      request.options?.rcsOptions && typeof request.options.rcsOptions === "object"
        ? (request.options.rcsOptions as Record<string, unknown>)
        : {};

    const brandId =
      typeof rcsOptions.brandId === "string" && rcsOptions.brandId.length > 0
        ? rcsOptions.brandId
        : this.solapiConfig.rcsBrandId;

    if (!brandId || brandId.length === 0) {
      throw new Error("rcs brandId is required (options.rcsOptions.brandId or config.rcsBrandId)");
    }

    const rcsButtons = Array.isArray(rcsOptions.buttons)
      ? (rcsOptions.buttons as any[])
      : this.toRcsButtons(request.buttons);

    const rcsPayload: Record<string, unknown> = {
      brandId,
      buttons: rcsButtons,
      disableSms: rcsOptions.disableSms,
      variables: this.stringifyVariables(request.variables),
    };

    // For template types, templateCode is used as templateId unless caller provided it explicitly.
    if (
      type === "RCS_TPL" ||
      type === "RCS_ITPL" ||
      type === "RCS_LTPL"
    ) {
      rcsPayload.templateId =
        typeof rcsOptions.templateId === "string" && rcsOptions.templateId.length > 0
          ? rcsOptions.templateId
          : request.templateCode;
    }

    if (!messageText && (type === "RCS_SMS" || type === "RCS_LMS" || type === "RCS_MMS")) {
      throw new Error("text or variables.message is required");
    }
    if (messageText) {
      base.text = messageText;
    }
    if (subject) {
      base.subject = subject;
    }

    if (type === "RCS_MMS" && typeof request.imageUrl === "string") {
      const upload = await this.client.uploadFile(request.imageUrl, "RCS" as any);
      const fileId = (upload as any)?.fileId;
      if (typeof fileId === "string" && fileId.length > 0) {
        const additionalBody =
          rcsOptions.additionalBody && typeof rcsOptions.additionalBody === "object"
            ? (rcsOptions.additionalBody as Record<string, unknown>)
            : {};
        const title =
          typeof additionalBody.title === "string" && additionalBody.title.length > 0
            ? additionalBody.title
            : subject || "RCS";
        const description =
          typeof additionalBody.description === "string" && additionalBody.description.length > 0
            ? additionalBody.description
            : messageText || "";

        rcsPayload.additionalBody = {
          ...additionalBody,
          title,
          description,
          imaggeId: fileId,
        };
      }
    } else if (rcsOptions.additionalBody !== undefined) {
      rcsPayload.additionalBody = rcsOptions.additionalBody;
    }

    base.rcsOptions = rcsPayload;
    return base;
  }
}
