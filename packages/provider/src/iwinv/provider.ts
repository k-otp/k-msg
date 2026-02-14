import { Buffer } from "node:buffer";
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
import type { IWINVConfig } from "./types/iwinv";

type IWINVSendResponse = {
  code: number;
  message: string;
  success?: number;
  fail?: number;
  seqNo?: number;
};

type SmsV2SendResponse = Record<string, unknown> & {
  resultCode?: number | string;
  code?: number | string;
  message?: string;
  requestNo?: string;
  msgid?: string;
  msgType?: string;
};

type SmsV2MessageType = "SMS" | "LMS" | "MMS";

export class IWINVProvider implements Provider {
  readonly id = "iwinv";
  readonly name = "IWINV Messaging Provider";
  readonly supportedTypes: readonly MessageType[];

  private readonly config: IWINVConfig;

  constructor(config: IWINVConfig) {
    if (!config || typeof config !== "object") {
      throw new Error("IWINVProvider requires a config object");
    }
    if (!config.apiKey || config.apiKey.length === 0) {
      throw new Error("IWINVProvider requires `apiKey`");
    }
    if (!config.baseUrl || config.baseUrl.length === 0) {
      throw new Error("IWINVProvider requires `baseUrl`");
    }

    this.config = {
      ...config,
      baseUrl: config.baseUrl || "https://alimtalk.bizservice.iwinv.kr",
      sendEndpoint: config.sendEndpoint || "/api/v2/send/",
    };

    const types: MessageType[] = ["ALIMTALK"];
    if (this.canSendSmsV2()) {
      types.push("SMS", "LMS", "MMS");
    }
    this.supportedTypes = types;
  }

  async healthCheck(): Promise<ProviderHealthStatus> {
    const start = Date.now();
    const issues: string[] = [];

    try {
      try {
        new URL(this.config.baseUrl);
      } catch {
        issues.push("Invalid baseUrl");
      }

      if (this.canSendSmsV2()) {
        try {
          new URL(this.resolveSmsBaseUrl());
        } catch {
          issues.push("Invalid smsBaseUrl");
        }
      }

      return {
        healthy: issues.length === 0,
        issues,
        latencyMs: Date.now() - start,
        data: {
          provider: this.id,
          baseUrl: this.config.baseUrl,
          smsBaseUrl: this.resolveSmsBaseUrl(),
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

    switch (normalized.type) {
      case "ALIMTALK":
        return this.sendAlimTalk(normalized);
      case "SMS":
      case "LMS":
      case "MMS":
        return this.sendSmsV2(normalized);
      default:
        return fail(
          new KMsgError(
            KMsgErrorCode.INVALID_REQUEST,
            `IWINVProvider does not support type ${normalized.type}`,
            { providerId: this.id, type: normalized.type },
          ),
        );
    }
  }

  private normalizePhoneNumber(value: string): string {
    return value.replace(/[^0-9]/g, "");
  }

  private toBase64(value: string): string {
    return Buffer.from(value, "utf8").toString("base64");
  }

  private getSendEndpoint(): string {
    const raw = this.config.sendEndpoint || "/api/v2/send/";
    return raw.startsWith("/") ? raw : `/${raw}`;
  }

  private getAlimTalkHeaders(): Record<string, string> {
    const auth = this.toBase64(this.config.apiKey);
    const base: Record<string, string> = {
      AUTH: auth,
      "Content-Type": "application/json;charset=UTF-8",
    };

    if (
      typeof this.config.xForwardedFor === "string" &&
      this.config.xForwardedFor.length > 0
    ) {
      base["X-Forwarded-For"] = this.config.xForwardedFor;
    }

    if (this.config.extraHeaders && typeof this.config.extraHeaders === "object") {
      return { ...base, ...this.config.extraHeaders };
    }

    return base;
  }

  private formatIWINVDate(date: Date): string {
    const pad = (v: number) => v.toString().padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }

  private async sendAlimTalk(
    options: Extract<SendOptions, { type: "ALIMTALK" }>,
  ): Promise<Result<SendResult, KMsgError>> {
    if (!options.templateCode || options.templateCode.length === 0) {
      return fail(
        new KMsgError(
          KMsgErrorCode.INVALID_REQUEST,
          "templateCode is required for ALIMTALK",
          { providerId: this.id },
        ),
      );
    }

    const scheduledAt = options.options?.scheduledAt;
    const reserve = scheduledAt ? "Y" : "N";
    const sendDate =
      scheduledAt instanceof Date && !Number.isNaN(scheduledAt.getTime())
        ? this.formatIWINVDate(scheduledAt)
        : undefined;

    const to = this.normalizePhoneNumber(options.to);
    if (!to) {
      return fail(
        new KMsgError(KMsgErrorCode.INVALID_REQUEST, "to is required", {
          providerId: this.id,
        }),
      );
    }

    const templateParam = Object.values(options.variables || {}).map((v) =>
      v === null || v === undefined ? "" : String(v),
    );

    // SMS fallback fields are optional. Enable only if we have a sender number.
    const senderNumber =
      (typeof options.from === "string" && options.from.length > 0
        ? options.from
        : this.config.senderNumber || this.config.smsSenderNumber) || "";
    const normalizedSender = senderNumber
      ? this.normalizePhoneNumber(senderNumber)
      : "";

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
      reSend: normalizedSender ? "Y" : "N",
      ...(normalizedSender ? { resendCallback: normalizedSender } : {}),
    };

    const url = `${this.config.baseUrl}${this.getSendEndpoint()}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: this.getAlimTalkHeaders(),
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      const parsed: unknown = responseText ? JSON.parse(responseText) : {};
      const data: IWINVSendResponse = isObjectRecord(parsed)
        ? (parsed as IWINVSendResponse)
        : ({ code: response.status, message: responseText } as IWINVSendResponse);

      if (!response.ok || data.code !== 200) {
        return fail(
          new KMsgError(
            this.mapIwinvCodeToKMsgErrorCode(data.code),
            data.message || "IWINV send failed",
            { providerId: this.id, originalCode: data.code },
          ),
        );
      }

      return ok({
        messageId: options.messageId || crypto.randomUUID(),
        providerId: this.id,
        providerMessageId:
          typeof data.seqNo === "number" ? String(data.seqNo) : undefined,
        status: "SENT",
        type: options.type,
        to: options.to,
        raw: data,
      });
    } catch (error) {
      return fail(
        new KMsgError(
          KMsgErrorCode.NETWORK_ERROR,
          error instanceof Error ? error.message : String(error),
          { providerId: this.id },
        ),
      );
    }
  }

  private mapIwinvCodeToKMsgErrorCode(code: number): KMsgErrorCode {
    switch (code) {
      case 201:
      case 206:
      case 401:
        return KMsgErrorCode.AUTHENTICATION_FAILED;
      case 403:
      case 519:
        return KMsgErrorCode.INSUFFICIENT_BALANCE;
      case 404:
        return KMsgErrorCode.TEMPLATE_NOT_FOUND;
      case 429:
        return KMsgErrorCode.RATE_LIMIT_EXCEEDED;
      default:
        if (code >= 500) return KMsgErrorCode.PROVIDER_ERROR;
        return KMsgErrorCode.INVALID_REQUEST;
    }
  }

  private resolveSmsBaseUrl(): string {
    return (
      this.config.smsBaseUrl ||
      process.env.IWINV_SMS_BASE_URL ||
      "https://sms.bizservice.iwinv.kr"
    );
  }

  private canSendSmsV2(): boolean {
    const secret = this.buildSmsSecretHeader();
    return secret.length > 0;
  }

  private buildSmsSecretHeader(): string {
    // Preferred mode: SMS API key + SMS auth key
    if (this.config.smsApiKey && this.config.smsAuthKey) {
      return Buffer.from(
        `${this.config.smsApiKey}&${this.config.smsAuthKey}`,
        "utf8",
      ).toString("base64");
    }

    // Legacy-compatible mode: existing IWINV apiKey + one extra SMS key.
    const legacyAuthKey = this.config.smsAuthKey || this.config.smsApiKey;
    if (!legacyAuthKey) return "";

    return Buffer.from(`${this.config.apiKey}&${legacyAuthKey}`, "utf8").toString(
      "base64",
    );
  }

  private formatSmsReserveDate(date: Date): string {
    const pad = (value: number) => value.toString().padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }

  private normalizeCode(value: unknown): string {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value.toString();
    }
    if (typeof value === "string") {
      return value.trim();
    }
    return "";
  }

  private mapSmsResponseMessage(code: string, fallback: string): string {
    const knownMessages: Record<string, string> = {
      "0": "전송 성공",
      "1": "메시지가 전송되지 않았습니다.",
      "11": "운영 중인 서비스가 아닙니다.",
      "12": "요금제 충전 중입니다. 잠시 후 다시 시도해 보시기 바랍니다.",
      "13": "등록되지 않은 발신번호입니다.",
      "14": "인증 요청이 올바르지 않습니다.",
      "15": "등록하지 않은 IP에서는 발송되지 않습니다.",
      "21": "장문 메시지는 2000 Bytes까지만 입력이 가능합니다.",
      "22": "제목 입력 가능 문자가 올바르지 않습니다.",
      "23": "제목은 40 Byte까지만 입력이 가능합니다.",
      "31": "파일 업로드는 100KB까지 가능합니다.",
      "32": "허용되지 않는 파일 확장자입니다.",
      "33": "이미지 업로드에 실패했습니다.",
      "41": "수신 번호를 입력하여 주세요.",
      "42": "예약 전송 가능 시간이 아닙니다.",
      "43": "날짜와 시간 표현 형식에 맞춰 입력하여 주십시오.",
      "44": "최대 1000건 전송 가능합니다.",
      "50": "SMS 자동 충전 한도를 초과하였습니다.",
      "202": "SMS API 인증 실패 또는 SMS 서비스 권한이 없습니다.",
      "206": "등록하지 않은 IP에서는 발송되지 않습니다.",
    };
    return knownMessages[code] || fallback;
  }

  private mapSmsErrorCode(code: string, responseOk: boolean): KMsgErrorCode {
    if (code === "14" || code === "15" || code === "202" || code === "206") {
      return KMsgErrorCode.AUTHENTICATION_FAILED;
    }
    if (code === "50") {
      return KMsgErrorCode.INSUFFICIENT_BALANCE;
    }
    if (
      code === "13" ||
      code === "21" ||
      code === "22" ||
      code === "23" ||
      code === "31" ||
      code === "32" ||
      code === "33" ||
      code === "41" ||
      code === "42" ||
      code === "43" ||
      code === "44"
    ) {
      return KMsgErrorCode.INVALID_REQUEST;
    }
    if (!responseOk) {
      return KMsgErrorCode.NETWORK_ERROR;
    }
    return KMsgErrorCode.PROVIDER_ERROR;
  }

  private buildLmsTitle(text: string, subject?: string): string {
    if (subject && subject.trim().length > 0) return subject.trim();
    return text.slice(0, 20);
  }

  private async sendSmsV2(
    options: Extract<SendOptions, { type: SmsV2MessageType }>,
  ): Promise<Result<SendResult, KMsgError>> {
    if (!this.canSendSmsV2()) {
      return fail(
        new KMsgError(
          KMsgErrorCode.INVALID_REQUEST,
          "SMS v2 configuration missing (smsApiKey/smsAuthKey)",
          { providerId: this.id },
        ),
      );
    }

    const to = this.normalizePhoneNumber(options.to);
    if (!to) {
      return fail(
        new KMsgError(KMsgErrorCode.INVALID_REQUEST, "to is required", {
          providerId: this.id,
        }),
      );
    }

    const text = (options as any).text as string | undefined;
    if (!text || text.trim().length === 0) {
      return fail(
        new KMsgError(
          KMsgErrorCode.INVALID_REQUEST,
          "text is required for SMS/LMS/MMS",
          { providerId: this.id },
        ),
      );
    }

    const senderNumber =
      (typeof options.from === "string" && options.from.length > 0
        ? options.from
        : this.config.smsSenderNumber || this.config.senderNumber) || "";
    const from = senderNumber ? this.normalizePhoneNumber(senderNumber) : "";
    if (!from) {
      return fail(
        new KMsgError(
          KMsgErrorCode.INVALID_REQUEST,
          "from is required for SMS/LMS/MMS (options.from or config.smsSenderNumber)",
          { providerId: this.id },
        ),
      );
    }

    const payload: Record<string, unknown> = {
      version: "1.0",
      from,
      to: [to],
      text,
    };

    if (options.type === "LMS" || options.type === "MMS") {
      payload.title = this.buildLmsTitle(text, (options as any).subject);
    } else {
      payload.msgType = options.type;
    }

    const scheduledAt = options.options?.scheduledAt;
    if (scheduledAt instanceof Date && !Number.isNaN(scheduledAt.getTime())) {
      payload.date = this.formatSmsReserveDate(scheduledAt);
    }

    const secretHeader = this.buildSmsSecretHeader();
    const headers: Record<string, string> = {
      "Content-Type": "application/json;charset=UTF-8",
      secret: secretHeader,
    };

    if (
      typeof this.config.xForwardedFor === "string" &&
      this.config.xForwardedFor.length > 0
    ) {
      headers["X-Forwarded-For"] = this.config.xForwardedFor;
    }

    const mergedHeaders =
      this.config.extraHeaders && typeof this.config.extraHeaders === "object"
        ? { ...headers, ...this.config.extraHeaders }
        : headers;

    const url = `${this.resolveSmsBaseUrl()}/api/v2/send/`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: mergedHeaders,
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      let parsed: unknown;
      try {
        parsed = responseText ? JSON.parse(responseText) : {};
      } catch {
        parsed = responseText;
      }

      const data: SmsV2SendResponse = isObjectRecord(parsed)
        ? (parsed as SmsV2SendResponse)
        : ({ resultCode: parsed } as SmsV2SendResponse);

      const rawCode = data.resultCode ?? data.code;
      const code = this.normalizeCode(rawCode);
      const message =
        typeof data.message === "string" && data.message.length > 0
          ? data.message
          : this.mapSmsResponseMessage(code, "SMS send failed");

      const isSuccess = response.ok && code === "0";

      if (!isSuccess) {
        return fail(
          new KMsgError(this.mapSmsErrorCode(code, response.ok), message, {
            providerId: this.id,
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
        providerId: this.id,
        providerMessageId,
        status: "SENT",
        type: options.type,
        to: options.to,
        raw: data,
      });
    } catch (error) {
      return fail(
        new KMsgError(
          KMsgErrorCode.NETWORK_ERROR,
          error instanceof Error ? error.message : String(error),
          { providerId: this.id },
        ),
      );
    }
  }
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export const createIWINVProvider = (config: IWINVConfig) => new IWINVProvider(config);

export const createDefaultIWINVProvider = () => {
  const config: IWINVConfig = {
    apiKey: process.env.IWINV_API_KEY || "",
    baseUrl: process.env.IWINV_BASE_URL || "https://alimtalk.bizservice.iwinv.kr",
    smsApiKey: process.env.IWINV_SMS_API_KEY,
    smsAuthKey: process.env.IWINV_SMS_AUTH_KEY,
    smsCompanyId: process.env.IWINV_SMS_COMPANY_ID,
    smsBaseUrl: process.env.IWINV_SMS_BASE_URL,
    senderNumber:
      process.env.IWINV_SENDER_NUMBER || process.env.IWINV_SMS_SENDER_NUMBER,
    smsSenderNumber: process.env.IWINV_SMS_SENDER_NUMBER,
    sendEndpoint: process.env.IWINV_SEND_ENDPOINT || "/api/v2/send/",
    xForwardedFor: process.env.IWINV_X_FORWARDED_FOR,
    debug: process.env.NODE_ENV === "development",
  };

  if (!config.apiKey) {
    throw new Error("IWINV_API_KEY environment variable is required");
  }

  return new IWINVProvider(config);
};

// biome-ignore lint/complexity/noStaticOnlyClass: kept as a factory for convenience
export class IWINVProviderFactory {
  static create(config: IWINVConfig): IWINVProvider {
    return new IWINVProvider(config);
  }

  static createDefault(): IWINVProvider {
    return createDefaultIWINVProvider();
  }
}

export function initializeIWINV(): void {}

