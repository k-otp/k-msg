import {
  type DeliveryStatusQuery,
  type DeliveryStatusResult,
  fail,
  KMsgError,
  KMsgErrorCode,
  type MessageType,
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
import { canSendSmsV2, resolveSmsBaseUrl } from "./iwinv.sms.helpers";
import {
  createTemplate,
  deleteTemplate,
  getTemplate,
  listTemplates,
  updateTemplate,
} from "./iwinv.template";
import type { IWINVConfig } from "./types/iwinv";

export class IWINVProvider implements Provider, TemplateProvider {
  readonly id = "iwinv";
  readonly name = "IWINV Messaging Provider";
  readonly supportedTypes: readonly MessageType[];

  private readonly config: NormalizedIwinvConfig;

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
