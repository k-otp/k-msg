import {
  fail,
  KMsgError,
  KMsgErrorCode,
  ok,
  type MessageType,
  type Provider,
  type ProviderHealthStatus,
  type Result,
  type SendOptions,
  type SendResult,
} from "@k-msg/core";
import type { AligoConfig, AligoResponse, AligoSMSRequest } from "../types/aligo";

type AligoMessageType = "SMS" | "LMS" | "MMS" | "ALIMTALK" | "FRIENDTALK";

export class AligoProvider implements Provider {
  readonly id = "aligo";
  readonly name = "Aligo Smart SMS";
  readonly supportedTypes: readonly MessageType[] = [
    "ALIMTALK",
    "FRIENDTALK",
    "SMS",
    "LMS",
    "MMS",
  ];

  private readonly SMS_HOST: string;
  private readonly ALIMTALK_HOST: string;

  constructor(private readonly config: AligoConfig) {
    if (!config || typeof config !== "object") {
      throw new Error("AligoProvider requires a config object");
    }
    if (!config.apiKey || config.apiKey.length === 0) {
      throw new Error("AligoProvider requires `apiKey`");
    }
    if (!config.userId || config.userId.length === 0) {
      throw new Error("AligoProvider requires `userId`");
    }

    this.SMS_HOST = config.smsBaseUrl || "https://apis.aligo.in";
    this.ALIMTALK_HOST = config.alimtalkBaseUrl || "https://kakaoapi.aligo.in";
  }

  async healthCheck(): Promise<ProviderHealthStatus> {
    const start = Date.now();
    const issues: string[] = [];

    try {
      if (!this.config.apiKey) issues.push("Missing apiKey");
      if (!this.config.userId) issues.push("Missing userId");
      if (!this.config.sender) {
        issues.push("Missing sender (default from)");
      }

      try {
        new URL(this.SMS_HOST);
      } catch {
        issues.push("Invalid smsBaseUrl");
      }

      try {
        new URL(this.ALIMTALK_HOST);
      } catch {
        issues.push("Invalid alimtalkBaseUrl");
      }

      return {
        healthy: issues.length === 0,
        issues,
        latencyMs: Date.now() - start,
        data: {
          provider: this.id,
          smsBaseUrl: this.SMS_HOST,
          alimtalkBaseUrl: this.ALIMTALK_HOST,
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
      switch (normalized.type as AligoMessageType) {
        case "ALIMTALK":
          return await this.sendAlimTalk(normalized as any);
        case "FRIENDTALK":
          return await this.sendFriendTalk(normalized as any);
        case "SMS":
        case "LMS":
        case "MMS":
          return await this.sendSMS(normalized as any);
        default:
          return fail(
            new KMsgError(
              KMsgErrorCode.INVALID_REQUEST,
              `AligoProvider does not support type ${normalized.type}`,
              { providerId: this.id, type: normalized.type },
            ),
          );
      }
    } catch (error) {
      return fail(this.mapAligoError(error));
    }
  }

  private getEndpoint(operation: string): string {
    switch (operation) {
      case "sendSMS":
        return "/send/";
      case "sendAlimTalk":
        return "/akv10/alimtalk/send/";
      case "sendFriendTalk":
        return this.config.friendtalkEndpoint || "/akv10/friendtalk/send/";
      default:
        return "/";
    }
  }

  private formatAligoDate(date: Date): { date: string; time: string } {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return {
      date: `${year}${month}${day}`,
      time: `${hours}${minutes}`,
    };
  }

  private async request(host: string, endpoint: string, data: any): Promise<any> {
    const formData = new FormData();
    for (const key in data) {
      if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, String(data[key]));
      }
    }

    const response = await fetch(`${host}${endpoint}`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new KMsgError(
        KMsgErrorCode.NETWORK_ERROR,
        `HTTP error! status: ${response.status}`,
        { providerId: this.id },
      );
    }

    return response.json();
  }

  private mapAligoError(error: any): KMsgError {
    if (error instanceof KMsgError) return error;

    const resultCode =
      error && error.result_code ? String(error.result_code) : "UNKNOWN";
    const message =
      error && (error.message || error.msg)
        ? error.message || error.msg
        : "Unknown Aligo error";

    let code: KMsgErrorCode = KMsgErrorCode.PROVIDER_ERROR;

    switch (resultCode) {
      case "-100":
      case "-101":
        code = KMsgErrorCode.AUTHENTICATION_FAILED;
        break;
      case "-102":
      case "-201":
        code = KMsgErrorCode.INSUFFICIENT_BALANCE;
        break;
      case "-103":
      case "-105":
        code = KMsgErrorCode.INVALID_REQUEST;
        break;
      case "-501":
        code = KMsgErrorCode.TEMPLATE_NOT_FOUND;
        break;
      default:
        code = KMsgErrorCode.PROVIDER_ERROR;
    }

    return new KMsgError(code, `${message} (code: ${resultCode})`, {
      providerId: this.id,
      resultCode,
    });
  }

  private interpolateMessage(
    variables: Record<string, any> | undefined,
    templateContent?: string,
  ): string {
    if (!variables) return "";
    if (variables._full_text) return String(variables._full_text);
    if (!templateContent) return Object.values(variables).map(String).join("\n");

    let result = templateContent;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`#{${key}}`, "g"), String(value));
    }
    return result;
  }

  private async sendSMS(
    options: Extract<SendOptions, { type: "SMS" | "LMS" | "MMS" }>,
  ): Promise<Result<SendResult, KMsgError>> {
    const sender = options.from || this.config.sender || "";
    if (!sender) {
      return fail(
        new KMsgError(
          KMsgErrorCode.INVALID_REQUEST,
          "from is required for SMS/LMS/MMS (options.from or config.sender)",
          { providerId: this.id },
        ),
      );
    }

    const body: AligoSMSRequest = {
      key: this.config.apiKey,
      user_id: this.config.userId,
      sender,
      receiver: options.to,
      msg: (options as any).text,
      msg_type: options.type,
      title: (options as any).subject,
      testmode_yn: this.config.testMode ? "Y" : "N",
    };

    const scheduledAt = options.options?.scheduledAt;
    if (scheduledAt instanceof Date && !Number.isNaN(scheduledAt.getTime())) {
      const { date, time } = this.formatAligoDate(scheduledAt);
      body.rdate = date;
      body.rtime = time;
    }

    if (options.type === "MMS" && typeof (options as any).imageUrl === "string") {
      body.image = (options as any).imageUrl;
    }

    const response = (await this.request(
      this.SMS_HOST,
      this.getEndpoint("sendSMS"),
      body,
    )) as AligoResponse;

    if (response.result_code !== "1") {
      return fail(this.mapAligoError(response));
    }

    return ok({
      messageId: options.messageId || crypto.randomUUID(),
      providerId: this.id,
      providerMessageId: response.msg_id,
      status: "PENDING",
      type: options.type,
      to: options.to,
      raw: response,
    });
  }

  private async sendAlimTalk(
    options: Extract<SendOptions, { type: "ALIMTALK" }>,
  ): Promise<Result<SendResult, KMsgError>> {
    const senderKey =
      (options as any).kakao?.profileId || this.config.senderKey || "";
    if (!senderKey) {
      return fail(
        new KMsgError(
          KMsgErrorCode.INVALID_REQUEST,
          "kakao profileId is required (options.kakao.profileId or config.senderKey)",
          { providerId: this.id },
        ),
      );
    }

    const sender = options.from || this.config.sender || "";
    if (!sender) {
      return fail(
        new KMsgError(
          KMsgErrorCode.INVALID_REQUEST,
          "from is required for ALIMTALK (options.from or config.sender)",
          { providerId: this.id },
        ),
      );
    }

    const variables =
      (options as any).variables && typeof (options as any).variables === "object"
        ? (options as any).variables
        : {};

    const body: Record<string, unknown> = {
      apikey: this.config.apiKey,
      userid: this.config.userId,
      senderkey: senderKey,
      tpl_code: (options as any).templateCode,
      sender,
      receiver_1: options.to,
      subject_1: "알림톡",
      message_1: this.interpolateMessage(variables, (options as any).providerOptions?.templateContent),
      testMode: this.config.testMode ? "Y" : "N",
    };

    const scheduledAt = options.options?.scheduledAt;
    if (scheduledAt instanceof Date && !Number.isNaN(scheduledAt.getTime())) {
      const { date, time } = this.formatAligoDate(scheduledAt);
      body.reserve = "Y";
      body.reserve_date = date;
      body.reserve_time = time;
    }

    const response = (await this.request(
      this.ALIMTALK_HOST,
      this.getEndpoint("sendAlimTalk"),
      body,
    )) as AligoResponse;

    if (response.result_code !== "0") {
      return fail(this.mapAligoError(response));
    }

    return ok({
      messageId: options.messageId || crypto.randomUUID(),
      providerId: this.id,
      providerMessageId: response.msg_id,
      status: "PENDING",
      type: options.type,
      to: options.to,
      raw: response,
    });
  }

  private async sendFriendTalk(
    options: Extract<SendOptions, { type: "FRIENDTALK" }>,
  ): Promise<Result<SendResult, KMsgError>> {
    const senderKey =
      (options as any).kakao?.profileId || this.config.senderKey || "";
    if (!senderKey) {
      return fail(
        new KMsgError(
          KMsgErrorCode.INVALID_REQUEST,
          "kakao profileId is required (options.kakao.profileId or config.senderKey)",
          { providerId: this.id },
        ),
      );
    }

    const sender = options.from || this.config.sender || "";
    if (!sender) {
      return fail(
        new KMsgError(
          KMsgErrorCode.INVALID_REQUEST,
          "from is required for FRIENDTALK (options.from or config.sender)",
          { providerId: this.id },
        ),
      );
    }

    const body: Record<string, unknown> = {
      apikey: this.config.apiKey,
      userid: this.config.userId,
      senderkey: senderKey,
      sender,
      receiver_1: options.to,
      subject_1: "친구톡",
      message_1: (options as any).text,
      testMode: this.config.testMode ? "Y" : "N",
    };

    if (typeof (options as any).imageUrl === "string") {
      body.image_1 = (options as any).imageUrl;
    }

    const buttons =
      Array.isArray((options as any).kakao?.buttons)
        ? (options as any).kakao.buttons
        : (options as any).buttons;
    if (buttons) {
      body.button_1 = JSON.stringify(buttons);
    }

    const scheduledAt = options.options?.scheduledAt;
    if (scheduledAt instanceof Date && !Number.isNaN(scheduledAt.getTime())) {
      const { date, time } = this.formatAligoDate(scheduledAt);
      body.reserve = "Y";
      body.reserve_date = date;
      body.reserve_time = time;
    }

    const response = (await this.request(
      this.ALIMTALK_HOST,
      this.getEndpoint("sendFriendTalk"),
      body,
    )) as AligoResponse;

    if (response.result_code !== "0") {
      return fail(this.mapAligoError(response));
    }

    return ok({
      messageId: options.messageId || crypto.randomUUID(),
      providerId: this.id,
      providerMessageId: response.msg_id,
      status: "PENDING",
      type: options.type,
      to: options.to,
      raw: response,
    });
  }
}

export const createAligoProvider = (config: AligoConfig) => new AligoProvider(config);

export const createDefaultAligoProvider = () => {
  const config: AligoConfig = {
    apiKey: process.env.ALIGO_API_KEY || "",
    userId: process.env.ALIGO_USER_ID || "",
    senderKey: process.env.ALIGO_SENDER_KEY || "",
    sender: process.env.ALIGO_SENDER || "",
    friendtalkEndpoint: process.env.ALIGO_FRIENDTALK_ENDPOINT,
    testMode: process.env.NODE_ENV !== "production",
    debug: process.env.NODE_ENV === "development",
  };

  if (!config.apiKey || !config.userId) {
    throw new Error("ALIGO_API_KEY and ALIGO_USER_ID are required");
  }

  return new AligoProvider(config);
};

// biome-ignore lint/complexity/noStaticOnlyClass: kept as a factory for convenience
export class AligoProviderFactory {
  static create(config: AligoConfig): AligoProvider {
    return new AligoProvider(config);
  }

  static createDefault(): AligoProvider {
    return createDefaultAligoProvider();
  }
}

export function initializeAligo(): void {}

