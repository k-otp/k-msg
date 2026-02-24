import {
  type BalanceProvider,
  type BalanceQuery,
  type BalanceResult,
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
  readRuntimeEnv,
  type SendOptions,
  type SendResult,
  type Template,
  type TemplateContext,
  type TemplateCreateInput,
  type TemplateProvider,
  type TemplateUpdateInput,
} from "@k-msg/core";
import { getProviderOnboardingSpec } from "../onboarding/specs";
import { safeParseJson, toRecordOrFallback } from "../shared/http-json";
import {
  getAlimTalkHeaders,
  mapIwinvCodeToKMsgErrorCode,
} from "./iwinv.alimtalk.helpers";
import { IWINV_ALIMTALK_BASE_URL } from "./iwinv.constants";
import {
  getAlimTalkDeliveryStatus,
  getSmsV2DeliveryStatus,
} from "./iwinv.delivery";
import type {
  NormalizedIwinvConfig,
  SmsV2MessageType,
} from "./iwinv.internal.types";
import { sendAlimTalk, sendSmsV2 } from "./iwinv.send";
import {
  buildSmsSecretHeader,
  canSendSmsV2,
  resolveSmsBaseUrl,
} from "./iwinv.sms.helpers";
import {
  createTemplate,
  deleteTemplate,
  getTemplate,
  listTemplates,
  updateTemplate,
} from "./iwinv.template";
import type { IWINVConfig } from "./types/iwinv";

export class IWINVProvider
  implements Provider, BalanceProvider, TemplateProvider
{
  readonly id = "iwinv";
  readonly name = "IWINV Messaging Provider";
  readonly supportedTypes: readonly MessageType[];

  private readonly config: NormalizedIwinvConfig;

  getOnboardingSpec() {
    const spec = getProviderOnboardingSpec(this.id);
    if (!spec) {
      throw new KMsgError(
        KMsgErrorCode.INVALID_REQUEST,
        `Onboarding spec missing for provider: ${this.id}`,
        { providerId: this.id }
      );
    }
    return spec;
  }

  constructor(config: IWINVConfig) {
    if (!config || typeof config !== "object") {
      throw new KMsgError(
        KMsgErrorCode.INVALID_REQUEST,
        "IWINVProvider requires a config object",
        { providerId: this.id }
      );
    }
    if (!config.apiKey || config.apiKey.length === 0) {
      throw new KMsgError(
        KMsgErrorCode.INVALID_REQUEST,
        "IWINVProvider requires `apiKey` configuration",
        { providerId: this.id }
      );
    }

    this.config = {
      ...config,
      baseUrl: IWINV_ALIMTALK_BASE_URL,
      sendEndpoint: config.sendEndpoint || "/api/v2/send/",
    };

    const types: MessageType[] = ["ALIMTALK"];
    if (canSendSmsV2(this.config)) {
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

      if (canSendSmsV2(this.config)) {
        try {
          new URL(resolveSmsBaseUrl());
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
          smsBaseUrl: resolveSmsBaseUrl(),
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
        return sendAlimTalk({
          providerId: this.id,
          config: this.config,
          options: normalized,
        });
      case "SMS":
      case "LMS":
      case "MMS":
        return sendSmsV2({
          providerId: this.id,
          config: this.config,
          options: normalized as Extract<
            SendOptions,
            { type: SmsV2MessageType }
          >,
        });
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
        return getAlimTalkDeliveryStatus({
          providerId: this.id,
          config: this.config,
          query,
        });
      case "SMS":
      case "LMS":
      case "MMS":
        return getSmsV2DeliveryStatus({
          providerId: this.id,
          config: this.config,
          query,
        });
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

  async getBalance(
    query?: BalanceQuery,
  ): Promise<Result<BalanceResult, KMsgError>> {
    const channel = query?.channel ?? "ALIMTALK";

    switch (channel) {
      case "ALIMTALK":
        return this.getAlimTalkBalance(channel);
      case "SMS":
      case "LMS":
      case "MMS":
        return this.getSmsBalance(channel);
      default:
        return fail(
          new KMsgError(
            KMsgErrorCode.INVALID_REQUEST,
            `IWINVProvider does not support balance query for type ${channel}`,
            { providerId: this.id, type: channel },
          ),
        );
    }
  }

  private async getAlimTalkBalance(
    channel: BalanceResult["channel"],
  ): Promise<Result<BalanceResult, KMsgError>> {
    const url = `${this.config.baseUrl}/api/charge/`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: getAlimTalkHeaders(this.config),
        body: JSON.stringify({}),
      });

      const responseText = await response.text();
      const parsed = safeParseJson(responseText);
      const data = toRecordOrFallback(parsed, {});

      const codeRaw = data.code;
      const parsedCode =
        typeof codeRaw === "string" ? Number(codeRaw) : undefined;
      const code =
        typeof codeRaw === "number"
          ? codeRaw
          : typeof parsedCode === "number" && Number.isFinite(parsedCode)
            ? parsedCode
            : undefined;
      const message =
        typeof data.message === "string" && data.message.length > 0
          ? data.message
          : "IWINV AlimTalk charge query failed";

      if (!response.ok || code !== 200) {
        return fail(
          new KMsgError(
            mapIwinvCodeToKMsgErrorCode(code ?? response.status),
            message,
            { providerId: this.id, originalCode: codeRaw ?? response.status },
          ),
        );
      }

      const chargeRaw = data.charge;
      const amount =
        typeof chargeRaw === "number"
          ? chargeRaw
          : typeof chargeRaw === "string"
            ? Number(chargeRaw)
            : NaN;

      if (!Number.isFinite(amount)) {
        return fail(
          new KMsgError(
            KMsgErrorCode.PROVIDER_ERROR,
            "Invalid charge value from IWINV AlimTalk charge API",
            { providerId: this.id, raw: data },
          ),
        );
      }

      return ok({
        providerId: this.id,
        channel,
        amount,
        currency: "KRW",
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

  private async getSmsBalance(
    channel: BalanceResult["channel"],
  ): Promise<Result<BalanceResult, KMsgError>> {
    if (!this.config.smsApiKey || !this.config.smsAuthKey) {
      return fail(
        new KMsgError(
          KMsgErrorCode.INVALID_REQUEST,
          "smsApiKey and smsAuthKey are required for SMS/LMS/MMS balance query",
          { providerId: this.id },
        ),
      );
    }

    const secretHeader = buildSmsSecretHeader(this.config);
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

    const url = `${resolveSmsBaseUrl()}/api/charge/`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: mergedHeaders,
        body: JSON.stringify({ version: "1.0" }),
      });

      const responseText = await response.text();
      const parsed = safeParseJson(responseText);
      const data = toRecordOrFallback(parsed, {});

      const codeRaw = data.code ?? data.resultCode;
      const parsedCode =
        typeof codeRaw === "string" ? Number(codeRaw) : undefined;
      const code =
        typeof codeRaw === "number"
          ? codeRaw
          : typeof parsedCode === "number" && Number.isFinite(parsedCode)
            ? parsedCode
            : NaN;
      const message =
        typeof data.message === "string" && data.message.length > 0
          ? data.message
          : "IWINV SMS charge query failed";

      if (!response.ok || code !== 0) {
        return fail(
          new KMsgError(KMsgErrorCode.PROVIDER_ERROR, message, {
            providerId: this.id,
            originalCode: codeRaw ?? response.status,
          }),
        );
      }

      const chargeRaw = data.charge;
      const amount =
        typeof chargeRaw === "number"
          ? chargeRaw
          : typeof chargeRaw === "string"
            ? Number(chargeRaw)
            : NaN;

      if (!Number.isFinite(amount)) {
        return fail(
          new KMsgError(
            KMsgErrorCode.PROVIDER_ERROR,
            "Invalid charge value from IWINV SMS charge API",
            { providerId: this.id, raw: data },
          ),
        );
      }

      return ok({
        providerId: this.id,
        channel,
        amount,
        currency: "KRW",
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

  async createTemplate(
    input: TemplateCreateInput,
    _ctx?: TemplateContext,
  ): Promise<Result<Template, KMsgError>> {
    return createTemplate({
      providerId: this.id,
      config: this.config,
      input,
    });
  }

  async updateTemplate(
    code: string,
    patch: TemplateUpdateInput,
    ctx?: TemplateContext,
  ): Promise<Result<Template, KMsgError>> {
    return updateTemplate({
      providerId: this.id,
      config: this.config,
      code,
      patch,
      ctx,
    });
  }

  async deleteTemplate(
    code: string,
    _ctx?: TemplateContext,
  ): Promise<Result<void, KMsgError>> {
    return deleteTemplate({
      providerId: this.id,
      config: this.config,
      code,
    });
  }

  async getTemplate(
    code: string,
    ctx?: TemplateContext,
  ): Promise<Result<Template, KMsgError>> {
    return getTemplate({
      providerId: this.id,
      config: this.config,
      code,
      ctx,
    });
  }

  async listTemplates(
    params?: { status?: string; page?: number; limit?: number },
    ctx?: TemplateContext,
  ): Promise<Result<Template[], KMsgError>> {
    return listTemplates({
      providerId: this.id,
      config: this.config,
      query: params,
      ctx,
    });
  }
}

export const createIWINVProvider = (config: IWINVConfig) =>
  new IWINVProvider(config);

export const createDefaultIWINVProvider = () => {
  const config: IWINVConfig = {
    apiKey: readRuntimeEnv("IWINV_API_KEY") || "",
    smsApiKey: readRuntimeEnv("IWINV_SMS_API_KEY"),
    smsAuthKey: readRuntimeEnv("IWINV_SMS_AUTH_KEY"),
    smsCompanyId: readRuntimeEnv("IWINV_SMS_COMPANY_ID"),
    senderNumber:
      readRuntimeEnv("IWINV_SENDER_NUMBER") ||
      readRuntimeEnv("IWINV_SMS_SENDER_NUMBER"),
    smsSenderNumber: readRuntimeEnv("IWINV_SMS_SENDER_NUMBER"),
    sendEndpoint: readRuntimeEnv("IWINV_SEND_ENDPOINT") || "/api/v2/send/",
    xForwardedFor: readRuntimeEnv("IWINV_X_FORWARDED_FOR"),
    debug: readRuntimeEnv("NODE_ENV") === "development",
  };

  if (!config.apiKey) {
    throw new KMsgError(
      KMsgErrorCode.INVALID_REQUEST,
      "IWINV_API_KEY environment variable is required",
      { providerId: "iwinv" }
    );
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
