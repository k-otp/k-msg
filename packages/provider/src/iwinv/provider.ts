import {
  type SendOptions,
  StandardErrorCode,
  type StandardRequest,
  type StandardResult,
  StandardStatus,
  UniversalProvider,
} from "@k-msg/core";
import { IWINVAdapter } from "../adapters/iwinv.adapter";
import type { IWINVConfig, IWINVIPRestrictionAlert } from "./types/iwinv";

const DEFAULT_IP_RETRY_COUNT = 2;
const DEFAULT_IP_RETRY_DELAY_MS = 800;

type RequestRouteContext = {
  channel: string;
  endpoint: string;
  phoneNumber: string;
  templateCode?: string;
};

type SmsV2MessageType = "SMS" | "LMS" | "MMS" | "GSMS";

export class IWINVProvider extends UniversalProvider {
  private static readonly directSmsTemplates = new Set([
    "SMS_DIRECT",
    "LMS_DIRECT",
    "MMS_DIRECT",
  ]);

  private readonly iwinvConfig: IWINVConfig;

  constructor(config: IWINVConfig) {
    const normalizedConfig: IWINVConfig = {
      ...config,
      senderNumber: config.senderNumber || config.smsSenderNumber,
      sendEndpoint: config.sendEndpoint || "/api/v2/send/",
    };
    const adapter = new IWINVAdapter(normalizedConfig);
    super(adapter, {
      id: "iwinv",
      name: "IWINV AlimTalk Provider",
      version: "1.0.0",
    });
    this.iwinvConfig = normalizedConfig;
  }

  // Unified send entrypoint: route SMS/LMS/MMS to SMS API, others to AlimTalk adapter.
  async send(params: SendOptions | StandardRequest | any): Promise<any> {
    if (!this.isStandardRequest(params)) {
      return super.send(params);
    }

    if (this.isSmsChannelRequest(params)) {
      const messageText = this.extractMessageText(params);
      const messageType = this.resolveSmsMessageType(params, messageText);
      const routeContext: RequestRouteContext = {
        channel: messageType,
        endpoint: "/api/v2/send/",
        phoneNumber: params.phoneNumber,
        templateCode: params.templateCode,
      };

      return this.sendWithIpRetry(
        () => this.sendSmsRequestOnce(params, messageText, messageType),
        routeContext,
      );
    }

    const channel =
      typeof params.channel === "string"
        ? params.channel.toUpperCase()
        : typeof params.options?.channel === "string"
          ? params.options.channel.toUpperCase()
          : "ALIMTALK";

    return this.sendWithIpRetry(() => super.send(params), {
      channel,
      endpoint: this.iwinvConfig.sendEndpoint || "/api/v2/send/",
      phoneNumber: params.phoneNumber,
      templateCode: params.templateCode,
    });
  }

  private isStandardRequest(value: unknown): value is StandardRequest {
    if (!value || typeof value !== "object") {
      return false;
    }
    const request = value as Record<string, unknown>;
    return (
      typeof request.templateCode === "string" &&
      typeof request.phoneNumber === "string" &&
      typeof request.variables === "object" &&
      request.variables !== null
    );
  }

  private isSmsChannelRequest(request: StandardRequest): boolean {
    const channel = (request.channel || "").toUpperCase();
    if (channel === "SMS" || channel === "LMS" || channel === "MMS") {
      return true;
    }

    const optionChannel =
      typeof request.options?.channel === "string"
        ? request.options.channel.toUpperCase()
        : "";
    if (
      optionChannel === "SMS" ||
      optionChannel === "LMS" ||
      optionChannel === "MMS"
    ) {
      return true;
    }

    return IWINVProvider.directSmsTemplates.has(request.templateCode);
  }

  private resolveSmsBaseUrl(): string {
    const explicitSmsBaseUrl =
      typeof this.iwinvConfig.smsBaseUrl === "string" &&
      this.iwinvConfig.smsBaseUrl.length > 0
        ? this.iwinvConfig.smsBaseUrl
        : this.iwinvConfig.baseUrl;

    let baseUrl = explicitSmsBaseUrl || "https://sms.bizservice.iwinv.kr";
    baseUrl = baseUrl.replace(
      "alimtalk.bizservice.iwinv.kr",
      "sms.bizservice.iwinv.kr",
    );
    baseUrl = baseUrl.replace(/\/api\/?$/, "");
    return baseUrl.replace(/\/+$/, "");
  }

  private isLongMessage(request: StandardRequest, message: string): boolean {
    const channel = (request.channel || "").toUpperCase();
    if (channel === "LMS" || channel === "MMS") {
      return true;
    }
    if (
      request.templateCode === "LMS_DIRECT" ||
      request.templateCode === "MMS_DIRECT"
    ) {
      return true;
    }
    return message.length > 90;
  }

  private resolveSmsMessageType(
    request: StandardRequest,
    message: string,
  ): SmsV2MessageType {
    const optionType =
      typeof request.options?.msgType === "string"
        ? request.options.msgType.toUpperCase()
        : "";
    if (optionType === "GSMS") {
      return "GSMS";
    }
    if (optionType === "MMS") {
      return "MMS";
    }
    if (optionType === "LMS") {
      return "LMS";
    }
    if (optionType === "SMS") {
      return "SMS";
    }

    const channel = (request.channel || "").toUpperCase();
    if (channel === "MMS" || request.templateCode === "MMS_DIRECT") {
      return "MMS";
    }
    if (channel === "LMS" || request.templateCode === "LMS_DIRECT") {
      return "LMS";
    }
    if (channel === "SMS" || request.templateCode === "SMS_DIRECT") {
      return "SMS";
    }

    return message.length > 90 ? "LMS" : "SMS";
  }

  private extractMessageText(request: StandardRequest): string {
    if (typeof request.text === "string" && request.text.trim().length > 0) {
      return request.text;
    }
    if (
      typeof request.variables.message === "string" &&
      request.variables.message.trim().length > 0
    ) {
      return request.variables.message;
    }
    if (
      typeof request.variables._full_text === "string" &&
      request.variables._full_text.trim().length > 0
    ) {
      return request.variables._full_text;
    }
    return "";
  }

  private formatSmsReserveDate(date: Date): string {
    const pad = (value: number) => value.toString().padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }

  private normalizePhoneNumber(value: string): string {
    return value.replace(/[^0-9]/g, "");
  }

  private buildSmsSecretHeader(): string {
    // Preferred v2 mode: SMS API key + SMS auth key
    if (this.iwinvConfig.smsApiKey && this.iwinvConfig.smsAuthKey) {
      return Buffer.from(
        `${this.iwinvConfig.smsApiKey}&${this.iwinvConfig.smsAuthKey}`,
        "utf8",
      ).toString("base64");
    }

    // Legacy-compatible mode: existing IWINV_API_KEY + one extra SMS key.
    const legacyAuthKey =
      this.iwinvConfig.smsAuthKey || this.iwinvConfig.smsApiKey;
    if (!legacyAuthKey) {
      return "";
    }
    const secretBase = `${this.iwinvConfig.apiKey}&${legacyAuthKey}`;
    return Buffer.from(secretBase, "utf8").toString("base64");
  }

  private buildLmsTitle(request: StandardRequest, messageText: string): string {
    const subject =
      request.options?.subject ||
      (typeof request.variables.subject === "string"
        ? request.variables.subject
        : undefined);
    if (subject && subject.trim().length > 0) {
      return subject.trim();
    }

    // Fallback title to satisfy LMS required title without forcing caller changes.
    return messageText.slice(0, 20);
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

  private mapSmsErrorCode(
    code: string,
    responseOk: boolean,
  ): StandardErrorCode {
    if (code === "14" || code === "15" || code === "202" || code === "206") {
      return StandardErrorCode.AUTHENTICATION_FAILED;
    }
    if (code === "50") {
      return StandardErrorCode.INSUFFICIENT_BALANCE;
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
      return StandardErrorCode.INVALID_REQUEST;
    }
    if (code === "12") {
      return StandardErrorCode.PROVIDER_ERROR;
    }
    if (!responseOk) {
      return StandardErrorCode.NETWORK_ERROR;
    }
    return StandardErrorCode.PROVIDER_ERROR;
  }

  private isSmsRetryableCode(code: string, responseOk: boolean): boolean {
    if (!responseOk) {
      return true;
    }
    return code === "12" || code === "429" || code.startsWith("5");
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

  private extractProviderCode(result: StandardResult): string {
    const metadataCode = this.normalizeCode(result.metadata?.originalCode);
    if (metadataCode) {
      return metadataCode;
    }

    const detailCode = this.normalizeCode(result.error?.details?.originalCode);
    if (detailCode) {
      return detailCode;
    }

    const nestedCode = this.normalizeCode(
      (
        result.error?.details?.originalError as
          | Record<string, unknown>
          | undefined
      )?.code,
    );
    if (nestedCode) {
      return nestedCode;
    }

    return "";
  }

  private isIpRestrictionResult(result: StandardResult): boolean {
    const code = this.extractProviderCode(result);
    if (code === "15" || code === "206") {
      return true;
    }

    const message = result.error?.message || "";
    return (
      message.includes("등록하지 않은 IP") ||
      message.toLowerCase().includes("unregistered ip")
    );
  }

  private getIpRetryCount(): number {
    const raw = Number(this.iwinvConfig.ipRetryCount ?? DEFAULT_IP_RETRY_COUNT);
    if (!Number.isFinite(raw) || raw < 0) {
      return DEFAULT_IP_RETRY_COUNT;
    }
    return Math.floor(raw);
  }

  private getIpRetryDelayMs(attempt: number): number {
    const raw = Number(
      this.iwinvConfig.ipRetryDelayMs ?? DEFAULT_IP_RETRY_DELAY_MS,
    );
    if (!Number.isFinite(raw) || raw <= 0) {
      return DEFAULT_IP_RETRY_DELAY_MS;
    }
    // Simple linear backoff to avoid hammering a blocked route.
    return Math.floor(raw * attempt);
  }

  private async wait(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async emitIpRestrictionAlert(
    context: RequestRouteContext,
    result: StandardResult,
    attempt: number,
    maxAttempts: number,
  ): Promise<void> {
    const code = this.extractProviderCode(result) || "206";
    const message =
      result.error?.message || "등록하지 않은 IP에서는 발송되지 않습니다.";
    const alertPayload: IWINVIPRestrictionAlert = {
      provider: "iwinv",
      channel: context.channel,
      endpoint: context.endpoint,
      phoneNumber: context.phoneNumber,
      templateCode: context.templateCode,
      code,
      message,
      attempt,
      maxAttempts,
      timestamp: new Date().toISOString(),
    };

    console.warn(
      `[iwinv] Unregistered IP response detected (${context.channel}, attempt ${attempt}/${maxAttempts}, code=${code}, endpoint=${context.endpoint})`,
    );

    if (typeof this.iwinvConfig.onIpRestrictionAlert === "function") {
      try {
        await Promise.resolve(
          this.iwinvConfig.onIpRestrictionAlert(alertPayload),
        );
      } catch (error) {
        console.warn("[iwinv] onIpRestrictionAlert callback failed:", error);
      }
    }

    if (
      typeof this.iwinvConfig.ipAlertWebhookUrl === "string" &&
      this.iwinvConfig.ipAlertWebhookUrl.length > 0
    ) {
      try {
        await fetch(this.iwinvConfig.ipAlertWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(alertPayload),
        });
      } catch (error) {
        console.warn("[iwinv] IP alert webhook delivery failed:", error);
      }
    }
  }

  private addIpRetryMetadata(
    result: StandardResult,
    maxAttempts: number,
  ): StandardResult {
    if (!result.error) {
      return result;
    }

    const currentMessage =
      result.error.message || "등록하지 않은 IP에서는 발송되지 않습니다.";
    const message = currentMessage.includes("재시도")
      ? currentMessage
      : `${currentMessage} (미등록 IP로 ${maxAttempts}회 재시도 후 중단)`;

    return {
      ...result,
      error: {
        ...result.error,
        message,
        details: {
          ...(result.error.details || {}),
          ipRestriction: true,
          ipRetryAttempts: maxAttempts,
        },
      },
      metadata: {
        ...(result.metadata || {}),
        ipRestriction: true,
        ipRetryAttempts: maxAttempts,
      },
    };
  }

  private async sendWithIpRetry(
    sendOnce: () => Promise<StandardResult>,
    context: RequestRouteContext,
  ): Promise<StandardResult> {
    const retryCount = this.getIpRetryCount();
    const maxAttempts = retryCount + 1;
    let lastResult: StandardResult | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const result = await sendOnce();
      lastResult = result;

      if (!this.isIpRestrictionResult(result)) {
        return result;
      }

      await this.emitIpRestrictionAlert(context, result, attempt, maxAttempts);

      if (attempt < maxAttempts) {
        await this.wait(this.getIpRetryDelayMs(attempt));
      }
    }

    if (!lastResult) {
      return {
        messageId: `ip_retry_error_${Date.now()}`,
        status: StandardStatus.FAILED,
        provider: this.id,
        timestamp: new Date(),
        phoneNumber: context.phoneNumber,
        error: {
          code: StandardErrorCode.NETWORK_ERROR,
          message: "Unknown send failure after retry",
          retryable: false,
        },
      };
    }

    return this.addIpRetryMetadata(lastResult, maxAttempts);
  }

  private async sendSmsRequestOnce(
    request: StandardRequest,
    messageText: string,
    messageType: SmsV2MessageType,
  ): Promise<StandardResult> {
    if (!messageText) {
      return {
        messageId: `sms_error_${Date.now()}`,
        status: StandardStatus.FAILED,
        provider: this.id,
        timestamp: new Date(),
        phoneNumber: request.phoneNumber,
        error: {
          code: StandardErrorCode.INVALID_REQUEST,
          message: "SMS/LMS message text is required",
          retryable: false,
        },
      };
    }

    const senderNumber =
      request.options?.senderNumber ||
      this.iwinvConfig.senderNumber ||
      this.iwinvConfig.smsSenderNumber;
    const normalizedSender = senderNumber
      ? this.normalizePhoneNumber(senderNumber)
      : "";
    if (!normalizedSender) {
      return {
        messageId: `sms_error_${Date.now()}`,
        status: StandardStatus.FAILED,
        provider: this.id,
        timestamp: new Date(),
        phoneNumber: request.phoneNumber,
        error: {
          code: StandardErrorCode.INVALID_REQUEST,
          message: "SMS sender number is required",
          retryable: false,
        },
      };
    }

    const payload: Record<string, unknown> = {
      version: "1.0",
      from: normalizedSender,
      to: [this.normalizePhoneNumber(request.phoneNumber)],
      text: messageText,
    };
    const recipients = payload.to as string[];
    if (!recipients[0]) {
      return {
        messageId: `sms_error_${Date.now()}`,
        status: StandardStatus.FAILED,
        provider: this.id,
        timestamp: new Date(),
        phoneNumber: request.phoneNumber,
        error: {
          code: StandardErrorCode.INVALID_REQUEST,
          message: "SMS recipient number is required",
          retryable: false,
        },
      };
    }

    if (messageType === "LMS" || messageType === "MMS") {
      payload.title = this.buildLmsTitle(request, messageText);
    }
    if (messageType !== "LMS" && messageType !== "MMS") {
      payload.msgType = messageType;
    }
    if (
      request.options?.scheduledAt instanceof Date &&
      !Number.isNaN(request.options.scheduledAt.getTime())
    ) {
      payload.date = this.formatSmsReserveDate(request.options.scheduledAt);
    }

    const endpoint = "/api/v2/send/";
    const url = `${this.resolveSmsBaseUrl()}${endpoint}`;
    const secretHeader = this.buildSmsSecretHeader();
    if (!secretHeader) {
      return {
        messageId: `sms_error_${Date.now()}`,
        status: StandardStatus.FAILED,
        provider: this.id,
        timestamp: new Date(),
        phoneNumber: request.phoneNumber,
        error: {
          code: StandardErrorCode.AUTHENTICATION_FAILED,
          message:
            "SMS 인증키가 없습니다. IWINV_SMS_AUTH_KEY 또는 IWINV_SMS_API_KEY를 설정하세요.",
          retryable: false,
        },
      };
    }

    if (this.iwinvConfig.debug) {
      console.log(`[${this.id}] Making request to:`, url);
      console.log(
        `[${this.id}] Request data:`,
        JSON.stringify(payload).substring(0, 200),
      );
    }

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json;charset=UTF-8",
        secret: secretHeader,
      };

      if (
        typeof this.iwinvConfig.xForwardedFor === "string" &&
        this.iwinvConfig.xForwardedFor.length > 0
      ) {
        headers["X-Forwarded-For"] = this.iwinvConfig.xForwardedFor;
      }

      const extraHeaders = this.iwinvConfig.extraHeaders;
      const mergedHeaders =
        extraHeaders && typeof extraHeaders === "object"
          ? { ...headers, ...extraHeaders }
          : headers;

      const response = await fetch(url, {
        method: "POST",
        headers: mergedHeaders,
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();

      if (this.iwinvConfig.debug) {
        console.log(`[${this.id}] Response status:`, response.status);
        console.log(
          `[${this.id}] Response body:`,
          responseText.substring(0, 500),
        );
      }

      let parsed: unknown;
      try {
        parsed = responseText ? JSON.parse(responseText) : {};
      } catch {
        parsed = responseText;
      }

      const responseData =
        parsed && typeof parsed === "object" && !Array.isArray(parsed)
          ? (parsed as Record<string, unknown>)
          : ({ resultCode: parsed } as Record<string, unknown>);

      const rawCode = responseData.resultCode ?? responseData.code;
      const code = this.normalizeCode(rawCode);
      const message =
        typeof responseData.message === "string" &&
        responseData.message.length > 0
          ? responseData.message
          : this.mapSmsResponseMessage(code, "SMS send failed");
      const isSuccess = response.ok && code === "0";

      return {
        messageId:
          typeof responseData.requestNo === "string" &&
          responseData.requestNo.length > 0
            ? responseData.requestNo
            : typeof responseData.msgid === "string" &&
                responseData.msgid.length > 0
              ? responseData.msgid
              : `sms_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
        status: isSuccess ? StandardStatus.SENT : StandardStatus.FAILED,
        provider: this.id,
        timestamp: new Date(),
        phoneNumber: request.phoneNumber,
        error: isSuccess
          ? undefined
          : {
              code: this.mapSmsErrorCode(code, response.ok),
              message,
              retryable: this.isSmsRetryableCode(code, response.ok),
              details: { originalCode: rawCode },
            },
        metadata: {
          channel: messageType,
          msgType: responseData.msgType,
          originalCode: rawCode,
        },
      };
    } catch (error) {
      return {
        messageId: `sms_error_${Date.now()}`,
        status: StandardStatus.FAILED,
        provider: this.id,
        timestamp: new Date(),
        phoneNumber: request.phoneNumber,
        error: {
          code: StandardErrorCode.NETWORK_ERROR,
          message:
            error instanceof Error ? error.message : "Unknown network error",
          retryable: true,
        },
      };
    }
  }
}

export const createIWINVProvider = (config: IWINVConfig) =>
  new IWINVProvider(config);

export const createDefaultIWINVProvider = () => {
  const config: IWINVConfig = {
    apiKey: process.env.IWINV_API_KEY || "",
    smsApiKey: process.env.IWINV_SMS_API_KEY,
    smsAuthKey: process.env.IWINV_SMS_AUTH_KEY,
    baseUrl:
      process.env.IWINV_BASE_URL || "https://alimtalk.bizservice.iwinv.kr",
    smsBaseUrl: process.env.IWINV_SMS_BASE_URL,
    senderNumber:
      process.env.IWINV_SENDER_NUMBER || process.env.IWINV_SMS_SENDER_NUMBER,
    sendEndpoint: process.env.IWINV_SEND_ENDPOINT || "/api/v2/send/",
    xForwardedFor: process.env.IWINV_X_FORWARDED_FOR,
    ipRetryCount: process.env.IWINV_IP_RETRY_COUNT
      ? Number(process.env.IWINV_IP_RETRY_COUNT)
      : undefined,
    ipRetryDelayMs: process.env.IWINV_IP_RETRY_DELAY_MS
      ? Number(process.env.IWINV_IP_RETRY_DELAY_MS)
      : undefined,
    ipAlertWebhookUrl: process.env.IWINV_IP_ALERT_WEBHOOK_URL,
    debug: process.env.NODE_ENV === "development",
  };

  if (!config.apiKey) {
    throw new Error("IWINV_API_KEY environment variable is required");
  }

  return createIWINVProvider(config);
};

export class IWINVProviderFactory {
  static create(config: IWINVConfig): IWINVProvider {
    return new IWINVProvider(config);
  }

  static createDefault(): IWINVProvider {
    return createDefaultIWINVProvider();
  }

  static getInstance() {
    return {
      createProvider: (config: IWINVConfig) => new IWINVProvider(config),
      initialize: () => {},
    };
  }
}

export function initializeIWINV(): void {}
