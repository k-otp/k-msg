import {
  fail,
  KMsgError,
  KMsgErrorCode,
  type MessageBinaryInput,
  type MessageType,
  ok,
  type Provider,
  type ProviderHealthStatus,
  type Result,
  type SendOptions,
  type SendResult,
} from "@k-msg/core";
import type {
  AligoConfig,
  AligoResponse,
  AligoSMSRequest,
} from "./types/aligo";

type AligoMessageType = "SMS" | "LMS" | "MMS" | "ALIMTALK" | "FRIENDTALK";

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

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
          return await this.sendAlimTalk(
            normalized as Extract<SendOptions, { type: "ALIMTALK" }>,
          );
        case "FRIENDTALK":
          return await this.sendFriendTalk(
            normalized as Extract<SendOptions, { type: "FRIENDTALK" }>,
          );
        case "SMS":
        case "LMS":
        case "MMS":
          return await this.sendSMS(
            normalized as Extract<SendOptions, { type: "SMS" | "LMS" | "MMS" }>,
          );
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

  private resolveImageRef(options: {
    imageUrl?: string;
    media?: { image?: MessageBinaryInput };
  }): string | undefined {
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

    throw new KMsgError(
      KMsgErrorCode.INVALID_REQUEST,
      "Aligo MMS/FriendTalk image requires `options.imageUrl` or `options.media.image.ref` (url/path).",
      { providerId: this.id },
    );
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

  private async request(
    host: string,
    endpoint: string,
    data: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const formData = new FormData();
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
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

    return (await response.json()) as Record<string, unknown>;
  }

  private mapAligoError(error: unknown): KMsgError {
    if (error instanceof KMsgError) return error;

    const record = isObjectRecord(error) ? error : {};
    const resultCodeRaw = record.result_code;
    const resultCode =
      resultCodeRaw !== undefined && resultCodeRaw !== null
        ? String(resultCodeRaw)
        : "UNKNOWN";

    const message =
      typeof record.message === "string" && record.message.length > 0
        ? record.message
        : typeof record.msg === "string" && record.msg.length > 0
          ? record.msg
          : error instanceof Error
            ? error.message
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
    variables: Record<string, unknown> | undefined,
    templateContent?: string,
  ): string {
    if (!variables) return "";
    const fullText = variables._full_text;
    if (fullText !== undefined && fullText !== null) return String(fullText);
    if (!templateContent)
      return Object.values(variables).map(String).join("\n");

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
      msg: options.text,
      msg_type: options.type,
      title: options.subject,
      testmode_yn: this.config.testMode ? "Y" : "N",
    };

    const scheduledAt = options.options?.scheduledAt;
    if (scheduledAt instanceof Date && !Number.isNaN(scheduledAt.getTime())) {
      const { date, time } = this.formatAligoDate(scheduledAt);
      body.rdate = date;
      body.rtime = time;
    }

    if (options.type === "MMS") {
      const imageRef = this.resolveImageRef(options);
      if (!imageRef) {
        return fail(
          new KMsgError(
            KMsgErrorCode.INVALID_REQUEST,
            "image is required for MMS (options.imageUrl or options.media.image.ref)",
            { providerId: this.id },
          ),
        );
      }
      body.image = imageRef;
    }

    const response = (await this.request(
      this.SMS_HOST,
      this.getEndpoint("sendSMS"),
      body as unknown as Record<string, unknown>,
    )) as unknown as AligoResponse;

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
      (typeof options.kakao?.profileId === "string"
        ? options.kakao.profileId
        : this.config.senderKey) || "";
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

    const variables = options.variables as Record<string, unknown>;
    const templateContent =
      typeof options.providerOptions?.templateContent === "string"
        ? options.providerOptions.templateContent
        : undefined;

    const body: Record<string, unknown> = {
      apikey: this.config.apiKey,
      userid: this.config.userId,
      senderkey: senderKey,
      tpl_code: options.templateCode,
      sender,
      receiver_1: options.to,
      subject_1: "알림톡",
      message_1: this.interpolateMessage(variables, templateContent),
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
    )) as unknown as AligoResponse;

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
      (typeof options.kakao?.profileId === "string"
        ? options.kakao.profileId
        : this.config.senderKey) || "";
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
      message_1: options.text,
      testMode: this.config.testMode ? "Y" : "N",
    };

    const imageRef = this.resolveImageRef(options);
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
      const { date, time } = this.formatAligoDate(scheduledAt);
      body.reserve = "Y";
      body.reserve_date = date;
      body.reserve_time = time;
    }

    const response = (await this.request(
      this.ALIMTALK_HOST,
      this.getEndpoint("sendFriendTalk"),
      body,
    )) as unknown as AligoResponse;

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

export const createAligoProvider = (config: AligoConfig) =>
  new AligoProvider(config);

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
