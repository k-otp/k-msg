import { Buffer } from "node:buffer";
import { readFile } from "node:fs/promises";
import { basename, extname } from "node:path";
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

  private isHttpUrl(value: string): boolean {
    return /^https?:\/\//i.test(value);
  }

  private guessImageContentType(refOrFilename: string): string | undefined {
    const ext = extname(refOrFilename).toLowerCase();
    switch (ext) {
      case ".jpg":
      case ".jpeg":
        return "image/jpeg";
      case ".png":
        return "image/png";
      case ".gif":
        return "image/gif";
      case ".webp":
        return "image/webp";
      default:
        return undefined;
    }
  }

  private resolveImageInput(options: unknown): MessageBinaryInput | undefined {
    const record = options as Record<string, unknown>;
    const media = record.media as Record<string, unknown> | undefined;
    const image = media?.image as Record<string, unknown> | undefined;

    if (image && typeof image === "object") {
      if (typeof image.ref === "string" && image.ref.trim().length > 0) {
        return {
          ref: image.ref.trim(),
          filename:
            typeof image.filename === "string" ? image.filename : undefined,
          contentType:
            typeof image.contentType === "string"
              ? image.contentType
              : undefined,
        };
      }
      if (image.bytes instanceof Uint8Array) {
        return {
          bytes: image.bytes,
          filename:
            typeof image.filename === "string" ? image.filename : undefined,
          contentType:
            typeof image.contentType === "string"
              ? image.contentType
              : undefined,
        };
      }
      if (image.blob instanceof Blob) {
        return {
          blob: image.blob,
          filename:
            typeof image.filename === "string" ? image.filename : undefined,
          contentType:
            typeof image.contentType === "string"
              ? image.contentType
              : undefined,
        };
      }
    }

    const imageUrlRaw = record.imageUrl;
    if (typeof imageUrlRaw === "string" && imageUrlRaw.trim().length > 0) {
      return { ref: imageUrlRaw.trim() };
    }

    return undefined;
  }

  private async toImageBlob(input: MessageBinaryInput): Promise<{
    blob: Blob;
    filename: string;
    contentType: string;
    size: number;
  }> {
    if ("blob" in input) {
      const contentType =
        input.contentType || input.blob.type || "application/octet-stream";
      const filename = input.filename || "image";
      const blob =
        input.contentType && input.contentType !== input.blob.type
          ? new Blob([await input.blob.arrayBuffer()], { type: contentType })
          : input.blob;

      return { blob, filename, contentType, size: blob.size };
    }

    if ("bytes" in input) {
      const contentType = input.contentType || "application/octet-stream";
      // TS 5.9 models typed arrays as `Uint8Array<ArrayBufferLike>` which doesn't satisfy
      // DOM's `BlobPart` constraint. Copy into a fresh `Uint8Array<ArrayBuffer>` first.
      const copied = new Uint8Array(input.bytes.byteLength);
      copied.set(input.bytes);
      const blob = new Blob([copied], { type: contentType });
      const filename = input.filename || "image";
      return { blob, filename, contentType, size: blob.size };
    }

    const ref = input.ref;
    if (this.isHttpUrl(ref)) {
      const response = await fetch(ref);
      if (!response.ok) {
        throw new KMsgError(
          KMsgErrorCode.NETWORK_ERROR,
          `Failed to fetch image: ${response.status}`,
          { providerId: this.id, url: ref },
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      const header =
        response.headers.get("content-type")?.split(";")[0]?.trim() || "";
      const contentType =
        input.contentType ||
        (header.length > 0 ? header : undefined) ||
        this.guessImageContentType(ref) ||
        "application/octet-stream";
      const filenameFromUrl = (() => {
        try {
          const u = new URL(ref);
          const last = basename(u.pathname);
          return last || undefined;
        } catch {
          return undefined;
        }
      })();
      const filename = input.filename || filenameFromUrl || "image";
      const blob = new Blob([arrayBuffer], { type: contentType });
      return { blob, filename, contentType, size: blob.size };
    }

    const bytes = await readFile(ref);
    const contentType =
      input.contentType ||
      this.guessImageContentType(ref) ||
      "application/octet-stream";
    const filename = input.filename || basename(ref) || "image";
    const blob = new Blob([bytes], { type: contentType });
    return { blob, filename, contentType, size: blob.size };
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

    if (
      this.config.extraHeaders &&
      typeof this.config.extraHeaders === "object"
    ) {
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
    const scheduledAtValid =
      scheduledAt instanceof Date && !Number.isNaN(scheduledAt.getTime());
    const reserve: "Y" | "N" = scheduledAtValid ? "Y" : "N";
    const sendDate = scheduledAtValid
      ? this.formatIWINVDate(scheduledAt as Date)
      : undefined;

    const to = this.normalizePhoneNumber(options.to);
    if (!to) {
      return fail(
        new KMsgError(KMsgErrorCode.INVALID_REQUEST, "to is required", {
          providerId: this.id,
        }),
      );
    }

    const templateParamOverride = options.providerOptions?.templateParam;
    const templateParam = Array.isArray(templateParamOverride)
      ? templateParamOverride.map((v) =>
          v === null || v === undefined ? "" : String(v),
        )
      : Object.values(options.variables || {}).map((v) =>
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

    const reSendOverrideRaw =
      typeof options.providerOptions?.reSend === "string"
        ? options.providerOptions.reSend.trim().toUpperCase()
        : "";
    const reSendOverride =
      reSendOverrideRaw === "Y" || reSendOverrideRaw === "N"
        ? (reSendOverrideRaw as "Y" | "N")
        : undefined;
    const reSend = reSendOverride ?? (normalizedSender ? "Y" : "N");

    const resendCallbackOverride =
      typeof options.providerOptions?.resendCallback === "string"
        ? this.normalizePhoneNumber(options.providerOptions.resendCallback)
        : "";
    const resendCallback = resendCallbackOverride || normalizedSender;

    if (reSend === "Y" && !resendCallback) {
      return fail(
        new KMsgError(
          KMsgErrorCode.INVALID_REQUEST,
          "resendCallback is required when reSend is 'Y' (options.from or providerOptions.resendCallback)",
          { providerId: this.id },
        ),
      );
    }

    const resendTypeRaw =
      typeof options.providerOptions?.resendType === "string"
        ? options.providerOptions.resendType.trim().toUpperCase()
        : "";
    const resendType =
      resendTypeRaw === "Y" || resendTypeRaw === "N"
        ? (resendTypeRaw as "Y" | "N")
        : undefined;
    if (
      typeof options.providerOptions?.resendType === "string" &&
      options.providerOptions.resendType.length > 0 &&
      !resendType
    ) {
      return fail(
        new KMsgError(
          KMsgErrorCode.INVALID_REQUEST,
          "resendType must be 'Y' or 'N'",
          { providerId: this.id },
        ),
      );
    }

    const resendTitle =
      typeof options.providerOptions?.resendTitle === "string" &&
      options.providerOptions.resendTitle.trim().length > 0
        ? options.providerOptions.resendTitle.trim()
        : undefined;
    const resendContent =
      typeof options.providerOptions?.resendContent === "string" &&
      options.providerOptions.resendContent.trim().length > 0
        ? options.providerOptions.resendContent.trim()
        : undefined;

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
      reSend,
      ...(resendCallback ? { resendCallback } : {}),
      ...(resendType ? { resendType } : {}),
      ...(resendTitle ? { resendTitle } : {}),
      ...(resendContent ? { resendContent } : {}),
    };

    const url = `${this.config.baseUrl}${this.getSendEndpoint()}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: this.getAlimTalkHeaders(),
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      let parsed: unknown;
      try {
        parsed = responseText ? JSON.parse(responseText) : {};
      } catch {
        parsed = responseText;
      }

      const data: IWINVSendResponse = isObjectRecord(parsed)
        ? (parsed as IWINVSendResponse)
        : ({
            code: this.normalizeIwinvCode(parsed) ?? response.status,
            message: responseText || String(parsed || ""),
          } as IWINVSendResponse);

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
        status: scheduledAtValid ? "PENDING" : "SENT",
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
    // IWINV AlimTalk returns application codes in the response body (not HTTP status codes).
    // Keep this mapping aligned with the vendor docs under `src/iwinv/_docs/*`.
    switch (code) {
      // Auth / IP restriction
      case 201:
      case 206:
      case 401:
      case 403:
        return KMsgErrorCode.AUTHENTICATION_FAILED;
      case 429:
        return KMsgErrorCode.RATE_LIMIT_EXCEEDED;
      // Balance
      case 519:
        return KMsgErrorCode.INSUFFICIENT_BALANCE;
      // Template
      case 404:
      case 501:
        return KMsgErrorCode.TEMPLATE_NOT_FOUND;
      // Invalid request (documented codes)
      case 502:
      case 503:
      case 504:
      case 505:
      case 506:
      case 507:
      case 508:
      case 509:
      case 510:
      case 511:
      case 512:
      case 513:
      case 514:
      case 515:
      case 516:
      case 517:
      case 540:
        return KMsgErrorCode.INVALID_REQUEST;
      // Provider-side issues
      case 518:
        return KMsgErrorCode.PROVIDER_ERROR;
      default:
        if (code >= 500) return KMsgErrorCode.PROVIDER_ERROR;
        return KMsgErrorCode.INVALID_REQUEST;
    }
  }

  private normalizeIwinvCode(value: unknown): number | undefined {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.length === 0) return undefined;
      const num = Number(trimmed);
      if (Number.isFinite(num)) return num;
    }
    return undefined;
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

    return Buffer.from(
      `${this.config.apiKey}&${legacyAuthKey}`,
      "utf8",
    ).toString("base64");
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

  private async sendSmsV2Mms(params: {
    // `SmsSendOptions` is modeled with `type: "SMS" | "LMS" | "MMS"`, so `Extract<..., {type:"MMS"}>`
    // becomes `never`. We keep this signature wide and validate the type at runtime.
    options: Extract<SendOptions, { type: SmsV2MessageType }>;
    to: string;
    from: string;
    text: string;
    scheduledAtValid: boolean;
    scheduledAt?: Date;
  }): Promise<Result<SendResult, KMsgError>> {
    const { options, to, from, text, scheduledAtValid, scheduledAt } = params;

    if (options.type !== "MMS") {
      return fail(
        new KMsgError(
          KMsgErrorCode.INVALID_REQUEST,
          "IWINVProvider: MMS handler called with non-MMS options",
          { providerId: this.id, type: options.type },
        ),
      );
    }

    const title = this.buildLmsTitle(text, options.subject);

    const imageInput = this.resolveImageInput(options);
    if (!imageInput) {
      return fail(
        new KMsgError(
          KMsgErrorCode.INVALID_REQUEST,
          "image is required for MMS (options.media.image or options.imageUrl)",
          { providerId: this.id },
        ),
      );
    }

    let image: {
      blob: Blob;
      filename: string;
      contentType: string;
      size: number;
    };
    try {
      image = await this.toImageBlob(imageInput);
    } catch (error) {
      return fail(
        error instanceof KMsgError
          ? error
          : new KMsgError(
              KMsgErrorCode.NETWORK_ERROR,
              error instanceof Error ? error.message : String(error),
              { providerId: this.id },
            ),
      );
    }

    // Vendor docs mention 100KB JPG limit; enforce a conservative check early to avoid confusing failures.
    if (image.size > 100 * 1024) {
      return fail(
        new KMsgError(
          KMsgErrorCode.INVALID_REQUEST,
          "MMS image must be <= 100KB",
          { providerId: this.id, bytes: image.size },
        ),
      );
    }

    const form = new FormData();
    form.append("version", "1.0");
    form.append("from", from);
    // Vendor docs are inconsistent about MMS `to` shape; use a single recipient string for now.
    form.append("to", to);
    form.append("title", title);
    form.append("text", text);
    if (scheduledAtValid && scheduledAt) {
      form.append("date", this.formatSmsReserveDate(scheduledAt));
    }

    const filename = (() => {
      const hasExt = extname(image.filename).length > 0;
      if (hasExt) return image.filename;
      const guessedExt =
        this.guessImageContentType(image.filename) === "image/png"
          ? ".png"
          : this.guessImageContentType(image.filename) === "image/gif"
            ? ".gif"
            : this.guessImageContentType(image.filename) === "image/webp"
              ? ".webp"
              : image.contentType === "image/png"
                ? ".png"
                : image.contentType === "image/gif"
                  ? ".gif"
                  : image.contentType === "image/webp"
                    ? ".webp"
                    : ".jpg";
      return `${image.filename}${guessedExt}`;
    })();

    form.append("image", image.blob, filename);

    const secretHeader = this.buildSmsSecretHeader();
    const headers: Record<string, string> = {
      secret: secretHeader,
    };

    if (
      typeof this.config.xForwardedFor === "string" &&
      this.config.xForwardedFor.length > 0
    ) {
      headers["X-Forwarded-For"] = this.config.xForwardedFor;
    }

    const mergedHeaders: Record<string, string> = { ...headers };
    if (
      this.config.extraHeaders &&
      typeof this.config.extraHeaders === "object"
    ) {
      for (const [key, value] of Object.entries(this.config.extraHeaders)) {
        // Never override multipart boundary handling.
        if (key.toLowerCase() === "content-type") continue;
        mergedHeaders[key] = value;
      }
    }

    const url = `${this.resolveSmsBaseUrl()}/api/v2/send/`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: mergedHeaders,
        body: form,
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
          : this.mapSmsResponseMessage(code, "MMS send failed");

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
        status: scheduledAtValid ? "PENDING" : "SENT",
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

    const text = options.text;
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

    const scheduledAt = options.options?.scheduledAt;
    const scheduledAtValid =
      scheduledAt instanceof Date && !Number.isNaN(scheduledAt.getTime());

    if (options.type === "MMS") {
      return await this.sendSmsV2Mms({
        options,
        to,
        from,
        text,
        scheduledAtValid,
        scheduledAt: scheduledAtValid ? (scheduledAt as Date) : undefined,
      });
    }

    const payload: Record<string, unknown> = {
      version: "1.0",
      from,
      to: [to],
      text,
    };

    if (options.type === "LMS") {
      payload.title = this.buildLmsTitle(text, options.subject);
    } else {
      const msgTypeOverride =
        typeof options.providerOptions?.msgType === "string" &&
        options.providerOptions.msgType.trim().length > 0
          ? options.providerOptions.msgType.trim()
          : undefined;
      payload.msgType = msgTypeOverride || options.type;
    }

    if (scheduledAtValid) {
      payload.date = this.formatSmsReserveDate(scheduledAt as Date);
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
        status: scheduledAtValid ? "PENDING" : "SENT",
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

export const createIWINVProvider = (config: IWINVConfig) =>
  new IWINVProvider(config);

export const createDefaultIWINVProvider = () => {
  const config: IWINVConfig = {
    apiKey: process.env.IWINV_API_KEY || "",
    baseUrl:
      process.env.IWINV_BASE_URL || "https://alimtalk.bizservice.iwinv.kr",
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
