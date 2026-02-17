import {
  type DeliveryStatus,
  type DeliveryStatusQuery,
  type DeliveryStatusResult,
  fail,
  KMsgError,
  KMsgErrorCode,
  type MessageType,
  ok,
  type Provider,
  type ProviderHealthStatus,
  type Result,
  type SendOptions,
  type SendResult,
  type Template,
  type TemplateContext,
  type TemplateCreateInput,
  type TemplateProvider,
  type TemplateUpdateInput,
} from "@k-msg/core";
import { getProviderOnboardingSpec } from "../onboarding/specs";
import { isObjectRecord } from "../shared/type-guards";
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
const IWINV_ALIMTALK_BASE_URL = "https://alimtalk.bizservice.iwinv.kr";
const IWINV_SMS_BASE_URL = "https://sms.bizservice.iwinv.kr";
const BASE64_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

type IWINVImageInput =
  | {
      bytes: Uint8Array;
      filename?: string;
      contentType?: string;
    }
  | {
      blob: Blob;
      filename?: string;
      contentType?: string;
    };

function toBase64(bytes: Uint8Array): string {
  let output = "";
  let i = 0;

  while (i < bytes.length) {
    const a = bytes[i++] ?? 0;
    const b = bytes[i++] ?? 0;
    const c = bytes[i++] ?? 0;

    const chunk = (a << 16) | (b << 8) | c;
    output += BASE64_ALPHABET[(chunk >> 18) & 63];
    output += BASE64_ALPHABET[(chunk >> 12) & 63];
    output += i - 2 < bytes.length ? BASE64_ALPHABET[(chunk >> 6) & 63] : "=";
    output += i - 1 < bytes.length ? BASE64_ALPHABET[chunk & 63] : "=";
  }

  return output;
}

function utf8ToBase64(value: string): string {
  return toBase64(new TextEncoder().encode(value));
}

export class IWINVProvider implements Provider, TemplateProvider {
  readonly id = "iwinv";
  readonly name = "IWINV Messaging Provider";
  readonly supportedTypes: readonly MessageType[];

  private readonly config: IWINVConfig & {
    baseUrl: string;
    sendEndpoint: string;
  };

  getOnboardingSpec() {
    const spec = getProviderOnboardingSpec(this.id);
    if (!spec) {
      throw new Error(`Onboarding spec missing for provider: ${this.id}`);
    }
    return spec;
  }

  constructor(config: IWINVConfig) {
    if (!config || typeof config !== "object") {
      throw new Error("IWINVProvider requires a config object");
    }
    if (!config.apiKey || config.apiKey.length === 0) {
      throw new Error("IWINVProvider requires `apiKey`");
    }

    this.config = {
      ...config,
      baseUrl: IWINV_ALIMTALK_BASE_URL,
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

  async getDeliveryStatus(
    query: DeliveryStatusQuery,
  ): Promise<Result<DeliveryStatusResult | null, KMsgError>> {
    switch (query.type) {
      case "ALIMTALK":
        return this.getAlimTalkDeliveryStatus(query);
      case "SMS":
      case "LMS":
      case "MMS":
        return this.getSmsV2DeliveryStatus(query);
      default:
        return fail(
          new KMsgError(
            KMsgErrorCode.INVALID_REQUEST,
            `IWINVProvider does not support type ${query.type}`,
            { providerId: this.id, type: query.type },
          ),
        );
    }
  }

  async createTemplate(
    input: TemplateCreateInput,
    _ctx?: TemplateContext,
  ): Promise<Result<Template, KMsgError>> {
    if (!input || typeof input !== "object") {
      return fail(
        new KMsgError(
          KMsgErrorCode.INVALID_REQUEST,
          "Template input is required",
          { providerId: this.id },
        ),
      );
    }
    if (!input.name || input.name.trim().length === 0) {
      return fail(
        new KMsgError(KMsgErrorCode.INVALID_REQUEST, "name is required", {
          providerId: this.id,
        }),
      );
    }
    if (!input.content || input.content.trim().length === 0) {
      return fail(
        new KMsgError(KMsgErrorCode.INVALID_REQUEST, "content is required", {
          providerId: this.id,
        }),
      );
    }

    const url = `${this.config.baseUrl}/api/template/add/`;
    const payload: Record<string, unknown> = {
      templateName: input.name,
      templateContent: input.content,
      ...(input.buttons ? { buttons: input.buttons } : {}),
    };

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

      const data = isObjectRecord(parsed)
        ? parsed
        : {
            code: this.normalizeIwinvCode(parsed) ?? response.status,
            message: responseText || String(parsed || ""),
          };

      const code = this.normalizeIwinvCode(data.code) ?? response.status;
      const message =
        typeof data.message === "string" && data.message.length > 0
          ? data.message
          : "IWINV template create failed";

      if (!response.ok || code !== 200) {
        return fail(
          new KMsgError(this.mapIwinvCodeToKMsgErrorCode(code), message, {
            providerId: this.id,
            originalCode: code,
          }),
        );
      }

      const templateCodeRaw = data.templateCode;
      const templateCode =
        typeof templateCodeRaw === "string" && templateCodeRaw.trim().length > 0
          ? templateCodeRaw.trim()
          : "";
      if (!templateCode) {
        return fail(
          new KMsgError(
            KMsgErrorCode.PROVIDER_ERROR,
            "IWINV template create did not return templateCode",
            { providerId: this.id, raw: data },
          ),
        );
      }

      const now = new Date();
      return ok({
        id: templateCode,
        code: templateCode,
        name: input.name,
        content: input.content,
        category: input.category,
        status: "INSPECTION",
        buttons: input.buttons,
        variables: input.variables,
        createdAt: now,
        updatedAt: now,
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

  async updateTemplate(
    code: string,
    patch: TemplateUpdateInput,
    ctx?: TemplateContext,
  ): Promise<Result<Template, KMsgError>> {
    const templateCode = typeof code === "string" ? code.trim() : "";
    if (!templateCode) {
      return fail(
        new KMsgError(KMsgErrorCode.INVALID_REQUEST, "code is required", {
          providerId: this.id,
        }),
      );
    }

    // IWINV requires templateName/templateContent for modify, so fetch existing to fill missing fields.
    const existingResult = await this.getTemplate(templateCode, ctx);
    if (existingResult.isFailure) return existingResult;
    const existing = existingResult.value;

    const nextName =
      typeof patch.name === "string" && patch.name.trim().length > 0
        ? patch.name.trim()
        : existing.name;
    const nextContent =
      typeof patch.content === "string" && patch.content.trim().length > 0
        ? patch.content
        : existing.content;
    const nextButtons =
      patch.buttons !== undefined ? patch.buttons : existing.buttons;

    const url = `${this.config.baseUrl}/api/template/modify/`;
    const payload: Record<string, unknown> = {
      templateCode,
      templateName: nextName,
      templateContent: nextContent,
      ...(nextButtons ? { buttons: nextButtons } : {}),
    };

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

      const data = isObjectRecord(parsed)
        ? parsed
        : {
            code: this.normalizeIwinvCode(parsed) ?? response.status,
            message: responseText || String(parsed || ""),
          };

      const statusCode = this.normalizeIwinvCode(data.code) ?? response.status;
      const message =
        typeof data.message === "string" && data.message.length > 0
          ? data.message
          : "IWINV template update failed";

      if (!response.ok || statusCode !== 200) {
        return fail(
          new KMsgError(this.mapIwinvCodeToKMsgErrorCode(statusCode), message, {
            providerId: this.id,
            originalCode: statusCode,
          }),
        );
      }

      // Refresh from list to get updated status/comments.
      const refreshed = await this.getTemplate(templateCode, ctx);
      if (refreshed.isSuccess) return refreshed;

      return ok({
        ...existing,
        name: nextName,
        content: nextContent,
        ...(patch.category !== undefined ? { category: patch.category } : {}),
        ...(patch.variables !== undefined
          ? { variables: patch.variables }
          : {}),
        ...(patch.buttons !== undefined ? { buttons: patch.buttons } : {}),
        updatedAt: new Date(),
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

  async deleteTemplate(
    code: string,
    _ctx?: TemplateContext,
  ): Promise<Result<void, KMsgError>> {
    const templateCode = typeof code === "string" ? code.trim() : "";
    if (!templateCode) {
      return fail(
        new KMsgError(KMsgErrorCode.INVALID_REQUEST, "code is required", {
          providerId: this.id,
        }),
      );
    }

    const url = `${this.config.baseUrl}/api/template/delete/`;
    const payload: Record<string, unknown> = { templateCode };

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

      const data = isObjectRecord(parsed)
        ? parsed
        : {
            code: this.normalizeIwinvCode(parsed) ?? response.status,
            message: responseText || String(parsed || ""),
          };

      const statusCode = this.normalizeIwinvCode(data.code) ?? response.status;
      const message =
        typeof data.message === "string" && data.message.length > 0
          ? data.message
          : typeof data.messgae === "string" && data.messgae.length > 0
            ? data.messgae
            : "IWINV template delete failed";

      if (!response.ok || statusCode !== 200) {
        return fail(
          new KMsgError(this.mapIwinvCodeToKMsgErrorCode(statusCode), message, {
            providerId: this.id,
            originalCode: statusCode,
          }),
        );
      }

      return ok(undefined);
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

  async getTemplate(
    code: string,
    _ctx?: TemplateContext,
  ): Promise<Result<Template, KMsgError>> {
    const templateCode = typeof code === "string" ? code.trim() : "";
    if (!templateCode) {
      return fail(
        new KMsgError(KMsgErrorCode.INVALID_REQUEST, "code is required", {
          providerId: this.id,
        }),
      );
    }

    const payload: Record<string, unknown> = {
      pageNum: "1",
      pageSize: "15",
      templateCode,
    };

    const url = `${this.config.baseUrl}/api/template/`;

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

      const data = isObjectRecord(parsed)
        ? parsed
        : {
            code: this.normalizeIwinvCode(parsed) ?? response.status,
            message: responseText || String(parsed || ""),
          };

      const statusCode = this.normalizeIwinvCode(data.code) ?? response.status;
      const message =
        typeof data.message === "string" && data.message.length > 0
          ? data.message
          : "IWINV template get failed";

      if (!response.ok || statusCode !== 200) {
        return fail(
          new KMsgError(this.mapIwinvCodeToKMsgErrorCode(statusCode), message, {
            providerId: this.id,
            originalCode: statusCode,
          }),
        );
      }

      const listRaw = data.list;
      const list = Array.isArray(listRaw) ? listRaw : [];
      const first = list.find(isObjectRecord);
      if (!first) {
        return fail(
          new KMsgError(
            KMsgErrorCode.TEMPLATE_NOT_FOUND,
            "Template not found",
            {
              providerId: this.id,
              templateCode,
            },
          ),
        );
      }

      const templateCodeValue = first.templateCode;
      const resolvedCode =
        typeof templateCodeValue === "string"
          ? templateCodeValue
          : String(templateCodeValue ?? "");
      const name =
        typeof first.templateName === "string" ? first.templateName : "";
      const content =
        typeof first.templateContent === "string" ? first.templateContent : "";
      const status = this.mapIwinvTemplateStatus(first.status);
      const createdAt = this.parseIwinvDateTime(first.createDate) ?? new Date();

      return ok({
        id: resolvedCode,
        code: resolvedCode,
        name,
        content,
        status,
        buttons: Array.isArray(first.buttons) ? first.buttons : undefined,
        createdAt,
        updatedAt: createdAt,
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

  async listTemplates(
    params?: { status?: string; page?: number; limit?: number },
    _ctx?: TemplateContext,
  ): Promise<Result<Template[], KMsgError>> {
    const pageNum =
      typeof params?.page === "number" && params.page > 0
        ? Math.floor(params.page)
        : 1;
    const pageSize =
      typeof params?.limit === "number" && params.limit > 0
        ? Math.floor(params.limit)
        : 15;

    const templateStatus = this.toIwinvTemplateStatus(params?.status);
    const payload: Record<string, unknown> = {
      pageNum: String(pageNum),
      pageSize: String(pageSize),
      ...(templateStatus ? { templateStatus } : {}),
    };

    const url = `${this.config.baseUrl}/api/template/`;

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

      const data = isObjectRecord(parsed)
        ? parsed
        : {
            code: this.normalizeIwinvCode(parsed) ?? response.status,
            message: responseText || String(parsed || ""),
          };

      const statusCode = this.normalizeIwinvCode(data.code) ?? response.status;
      const message =
        typeof data.message === "string" && data.message.length > 0
          ? data.message
          : "IWINV template list failed";

      if (!response.ok || statusCode !== 200) {
        return fail(
          new KMsgError(this.mapIwinvCodeToKMsgErrorCode(statusCode), message, {
            providerId: this.id,
            originalCode: statusCode,
          }),
        );
      }

      const listRaw = data.list;
      const list = Array.isArray(listRaw) ? listRaw : [];

      const templates: Template[] = list
        .filter(isObjectRecord)
        .map((item) => {
          const templateCodeValue = item.templateCode;
          const templateCode =
            typeof templateCodeValue === "string"
              ? templateCodeValue
              : String(templateCodeValue ?? "");
          const name =
            typeof item.templateName === "string" ? item.templateName : "";
          const content =
            typeof item.templateContent === "string"
              ? item.templateContent
              : "";
          const status = this.mapIwinvTemplateStatus(item.status);
          const createdAt =
            this.parseIwinvDateTime(item.createDate) ?? new Date();

          return {
            id: templateCode,
            code: templateCode,
            name,
            content,
            status,
            buttons: Array.isArray(item.buttons) ? item.buttons : undefined,
            createdAt,
            updatedAt: createdAt,
          };
        })
        .filter((tpl) => tpl.code.length > 0);

      return ok(templates);
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

  private normalizePhoneNumber(value: string): string {
    return value.replace(/[^0-9]/g, "");
  }

  private addDays(date: Date, days: number): Date {
    return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
  }

  private formatSmsHistoryDate(date: Date): string {
    const pad = (v: number) => v.toString().padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  private parseIwinvDateTime(value: unknown): Date | undefined {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    if (!trimmed) return undefined;

    const match = /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/.exec(
      trimmed,
    );
    if (!match) return undefined;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const hour = Number(match[4]);
    const minute = Number(match[5]);
    const second = Number(match[6]);

    if (
      !Number.isFinite(year) ||
      !Number.isFinite(month) ||
      !Number.isFinite(day) ||
      !Number.isFinite(hour) ||
      !Number.isFinite(minute) ||
      !Number.isFinite(second)
    ) {
      return undefined;
    }

    const date = new Date(year, month - 1, day, hour, minute, second);
    if (Number.isNaN(date.getTime())) return undefined;
    return date;
  }

  private async getAlimTalkDeliveryStatus(
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

    const to = this.normalizePhoneNumber(query.to);
    if (!to) {
      return fail(
        new KMsgError(KMsgErrorCode.INVALID_REQUEST, "to is required", {
          providerId: this.id,
        }),
      );
    }

    const seqNoValue = Number(providerMessageId);
    const seqNo = Number.isFinite(seqNoValue) ? seqNoValue : undefined;

    const startDate = this.formatIWINVDate(this.addDays(query.requestedAt, -1));
    const endDate = this.formatIWINVDate(new Date());

    const payload: Record<string, unknown> = {
      pageNum: 1,
      pageSize: 15,
      phone: to,
      startDate,
      endDate,
      ...(seqNo !== undefined ? { seqNo } : {}),
      ...(query.scheduledAt instanceof Date &&
      !Number.isNaN(query.scheduledAt.getTime())
        ? { reserve: "Y" }
        : {}),
    };

    const url = `${this.config.baseUrl}/api/history/`;

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

      const data = isObjectRecord(parsed) ? parsed : {};
      const codeRaw = data.code;
      const code = typeof codeRaw === "number" ? codeRaw : undefined;
      const message =
        typeof data.message === "string" && data.message.length > 0
          ? data.message
          : "IWINV history query failed";

      if (!response.ok || code !== 200) {
        return fail(
          new KMsgError(
            this.mapIwinvCodeToKMsgErrorCode(
              code ?? this.normalizeIwinvCode(parsed) ?? response.status,
            ),
            message,
            { providerId: this.id, originalCode: codeRaw ?? response.status },
          ),
        );
      }

      const listRaw = data.list;
      const list = Array.isArray(listRaw) ? (listRaw as Array<unknown>) : [];
      if (list.length === 0) return ok(null);

      const item = (() => {
        if (seqNo === undefined) return list[0];
        return (
          list.find((v) => isObjectRecord(v) && v.seqNo === seqNo) ?? list[0]
        );
      })();

      if (!isObjectRecord(item)) return ok(null);

      const statusCode =
        typeof item.statusCode === "string" ? item.statusCode : undefined;
      const statusMessage =
        typeof item.statusCodeName === "string"
          ? item.statusCodeName
          : undefined;

      const sendDate = this.parseIwinvDateTime(item.sendDate);
      const receiveDate = this.parseIwinvDateTime(item.receiveDate);

      const isDelivered =
        statusCode === "OK" ||
        (typeof statusMessage === "string" && statusMessage.includes("성공"));

      const status: DeliveryStatus = isDelivered
        ? "DELIVERED"
        : sendDate
          ? "FAILED"
          : "PENDING";

      return ok({
        providerId: this.id,
        providerMessageId,
        status,
        statusCode,
        statusMessage,
        sentAt: sendDate,
        deliveredAt: isDelivered ? receiveDate || sendDate : undefined,
        failedAt: !isDelivered && sendDate ? sendDate : undefined,
        raw: item,
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

  private async getSmsV2DeliveryStatus(
    query: DeliveryStatusQuery,
  ): Promise<Result<DeliveryStatusResult | null, KMsgError>> {
    if (!this.canSendSmsV2()) {
      return fail(
        new KMsgError(
          KMsgErrorCode.INVALID_REQUEST,
          "SMS v2 configuration missing (smsApiKey/smsAuthKey)",
          { providerId: this.id },
        ),
      );
    }
    if (!this.config.smsCompanyId || this.config.smsCompanyId.length === 0) {
      return fail(
        new KMsgError(
          KMsgErrorCode.INVALID_REQUEST,
          "smsCompanyId required for history (config.smsCompanyId)",
          { providerId: this.id },
        ),
      );
    }

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

    const to = this.normalizePhoneNumber(query.to);
    if (!to) {
      return fail(
        new KMsgError(KMsgErrorCode.INVALID_REQUEST, "to is required", {
          providerId: this.id,
        }),
      );
    }

    const start = this.addDays(query.requestedAt, -1);
    const end = new Date();
    const rangeMs = end.getTime() - start.getTime();
    const maxRangeMs = 90 * 24 * 60 * 60 * 1000;
    if (rangeMs > maxRangeMs) {
      return fail(
        new KMsgError(
          KMsgErrorCode.INVALID_REQUEST,
          "SMS history date range must be within 90 days",
          { providerId: this.id },
        ),
      );
    }

    const payload: Record<string, unknown> = {
      version: "1.0",
      companyid: this.config.smsCompanyId,
      startDate: this.formatSmsHistoryDate(start),
      endDate: this.formatSmsHistoryDate(end),
      requestNo: providerMessageId,
      pageNum: 1,
      pageSize: 15,
      phone: to,
    };

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

    const url = `${this.resolveSmsBaseUrl()}/api/history/`;

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

      const data = isObjectRecord(parsed) ? parsed : {};
      const codeRaw = data.resultCode;
      const code =
        typeof codeRaw === "number"
          ? codeRaw
          : typeof codeRaw === "string"
            ? Number(codeRaw)
            : NaN;
      const message =
        typeof data.message === "string" && data.message.length > 0
          ? data.message
          : "IWINV SMS history query failed";

      if (!response.ok || code !== 0) {
        return fail(
          new KMsgError(KMsgErrorCode.PROVIDER_ERROR, message, {
            providerId: this.id,
            originalCode: codeRaw ?? response.status,
          }),
        );
      }

      const listRaw = data.list;
      const list = Array.isArray(listRaw) ? (listRaw as Array<unknown>) : [];
      if (list.length === 0) return ok(null);

      const item = (() => {
        const found = list.find((v) => {
          if (!isObjectRecord(v)) return false;
          const req = v.requestNo;
          return req !== undefined && req !== null
            ? String(req) === providerMessageId
            : false;
        });
        return found ?? list[0];
      })();

      if (!isObjectRecord(item)) return ok(null);

      const statusCode =
        typeof item.sendStatusCode === "string"
          ? item.sendStatusCode
          : undefined;
      const statusMessage =
        typeof item.sendStatusMsg === "string"
          ? item.sendStatusMsg
          : typeof item.sendStatus === "string"
            ? item.sendStatus
            : undefined;

      const sendDate = this.parseIwinvDateTime(item.sendDate);

      const status = this.mapSmsV2HistoryStatus(statusCode, statusMessage);

      return ok({
        providerId: this.id,
        providerMessageId,
        status,
        statusCode,
        statusMessage,
        sentAt: sendDate,
        deliveredAt: status === "DELIVERED" ? sendDate : undefined,
        failedAt: status === "FAILED" ? sendDate : undefined,
        raw: item,
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

  private mapSmsV2HistoryStatus(
    statusCode?: string,
    statusMessage?: string,
  ): DeliveryStatus {
    if (statusCode === "06") return "DELIVERED"; // SMS success
    if (statusCode === "1000") return "DELIVERED"; // LMS/MMS success

    if (typeof statusMessage === "string") {
      if (statusMessage.includes("전송 성공")) return "DELIVERED";
      if (statusMessage.includes("대기") || statusMessage.includes("처리중")) {
        return "PENDING";
      }
    }

    if (statusCode === "00" || statusCode === "01") return "PENDING";
    if (!statusCode && !statusMessage) return "UNKNOWN";

    return "FAILED";
  }

  private toBase64(value: string): string {
    return utf8ToBase64(value);
  }

  private getFileExtension(filename: string): string {
    const safe = filename.split(/[?#]/, 1)[0] ?? filename;
    const lastDot = safe.lastIndexOf(".");
    if (lastDot <= 0 || lastDot === safe.length - 1) return "";
    return safe.slice(lastDot).toLowerCase();
  }

  private guessImageContentType(filename: string): string | undefined {
    const ext = this.getFileExtension(filename);
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

  private resolveImageInput(
    options: unknown,
  ): Result<IWINVImageInput | undefined, KMsgError> {
    const record =
      options && typeof options === "object"
        ? (options as Record<string, unknown>)
        : {};
    const media =
      record.media && typeof record.media === "object"
        ? (record.media as Record<string, unknown>)
        : undefined;
    const image = media?.image as Record<string, unknown> | undefined;

    if (image && typeof image === "object") {
      if (image.bytes instanceof Uint8Array) {
        return ok({
          bytes: image.bytes,
          filename:
            typeof image.filename === "string" ? image.filename : undefined,
          contentType:
            typeof image.contentType === "string"
              ? image.contentType
              : undefined,
        });
      }
      if (image.blob instanceof Blob) {
        return ok({
          blob: image.blob,
          filename:
            typeof image.filename === "string" ? image.filename : undefined,
          contentType:
            typeof image.contentType === "string"
              ? image.contentType
              : undefined,
        });
      }
      if (typeof image.ref === "string" && image.ref.trim().length > 0) {
        return fail(
          new KMsgError(
            KMsgErrorCode.INVALID_REQUEST,
            "IWINV MMS caller must provide blob/bytes in options.media.image",
            { providerId: this.id, field: "media.image.ref" },
          ),
        );
      }
    }

    const imageUrlRaw = record.imageUrl;
    if (typeof imageUrlRaw === "string" && imageUrlRaw.trim().length > 0) {
      return fail(
        new KMsgError(
          KMsgErrorCode.INVALID_REQUEST,
          "IWINV MMS caller must provide blob/bytes in options.media.image",
          { providerId: this.id, field: "imageUrl" },
        ),
      );
    }

    return ok(undefined);
  }

  private async toImageBlob(input: IWINVImageInput): Promise<{
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

    const contentType = input.contentType || "application/octet-stream";
    // TS 5.9 models typed arrays as `Uint8Array<ArrayBufferLike>` which doesn't satisfy
    // DOM's `BlobPart` constraint. Copy into a fresh `Uint8Array<ArrayBuffer>` first.
    const copied = new Uint8Array(input.bytes.byteLength);
    copied.set(input.bytes);
    const blob = new Blob([copied], { type: contentType });
    const filename = input.filename || "image";
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
    const failover = options.failover;

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
    const reSendFromFailover =
      failover?.enabled === true
        ? "Y"
        : failover?.enabled === false
          ? "N"
          : undefined;
    const reSend =
      reSendOverride ?? reSendFromFailover ?? (normalizedSender ? "Y" : "N");

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
    const resendTypeFromFailover =
      failover?.fallbackChannel === "lms"
        ? "Y"
        : failover?.fallbackChannel === "sms"
          ? "N"
          : undefined;

    const resendTitle =
      typeof options.providerOptions?.resendTitle === "string" &&
      options.providerOptions.resendTitle.trim().length > 0
        ? options.providerOptions.resendTitle.trim()
        : typeof failover?.fallbackTitle === "string" &&
            failover.fallbackTitle.trim().length > 0
          ? failover.fallbackTitle.trim()
          : undefined;
    const resendContent =
      typeof options.providerOptions?.resendContent === "string" &&
      options.providerOptions.resendContent.trim().length > 0
        ? options.providerOptions.resendContent.trim()
        : typeof failover?.fallbackContent === "string" &&
            failover.fallbackContent.trim().length > 0
          ? failover.fallbackContent.trim()
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
      ...((resendType ?? resendTypeFromFailover)
        ? { resendType: resendType ?? resendTypeFromFailover }
        : {}),
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

  private toIwinvTemplateStatus(
    value: string | undefined,
  ): "Y" | "I" | "R" | undefined {
    if (typeof value !== "string") return undefined;
    const normalized = value.trim().toUpperCase();
    if (!normalized) return undefined;

    switch (normalized) {
      case "Y":
      case "APPROVED":
        return "Y";
      case "I":
      case "INSPECTION":
        return "I";
      case "R":
      case "REJECTED":
        return "R";
      case "PENDING":
        return "I";
      default:
        return undefined;
    }
  }

  private mapIwinvTemplateStatus(value: unknown): Template["status"] {
    const normalized =
      typeof value === "string" ? value.trim().toUpperCase() : "";
    switch (normalized) {
      case "Y":
        return "APPROVED";
      case "I":
        return "INSPECTION";
      case "R":
        return "REJECTED";
      default:
        return "PENDING";
    }
  }

  private resolveSmsBaseUrl(): string {
    return IWINV_SMS_BASE_URL;
  }

  private canSendSmsV2(): boolean {
    const secret = this.buildSmsSecretHeader();
    return secret.length > 0;
  }

  private buildSmsSecretHeader(): string {
    // Preferred mode: SMS API key + SMS auth key
    if (this.config.smsApiKey && this.config.smsAuthKey) {
      return this.toBase64(
        `${this.config.smsApiKey}&${this.config.smsAuthKey}`,
      );
    }

    // Legacy-compatible mode: existing IWINV apiKey + one extra SMS key.
    const legacyAuthKey = this.config.smsAuthKey || this.config.smsApiKey;
    if (!legacyAuthKey) return "";

    return this.toBase64(`${this.config.apiKey}&${legacyAuthKey}`);
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

    const imageInputResult = this.resolveImageInput(options);
    if (imageInputResult.isFailure) return imageInputResult;

    const imageInput = imageInputResult.value;
    if (!imageInput) {
      return fail(
        new KMsgError(
          KMsgErrorCode.INVALID_REQUEST,
          "image is required for MMS; caller must provide options.media.image.blob or bytes",
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
      const hasExt = this.getFileExtension(image.filename).length > 0;
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

export const createIWINVProvider = (config: IWINVConfig) =>
  new IWINVProvider(config);

export const createDefaultIWINVProvider = () => {
  const config: IWINVConfig = {
    apiKey: process.env.IWINV_API_KEY || "",
    smsApiKey: process.env.IWINV_SMS_API_KEY,
    smsAuthKey: process.env.IWINV_SMS_AUTH_KEY,
    smsCompanyId: process.env.IWINV_SMS_COMPANY_ID,
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
