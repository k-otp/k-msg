import type {
  KakaoChannel,
  KakaoChannelCategories,
  KakaoChannelProvider,
  KMsgError,
  MessageType,
  Provider,
  ProviderHealthStatus,
  Result,
  SendOptions,
  SendResult,
  Template,
  TemplateContext,
  TemplateCreateInput,
  TemplateInspectionProvider,
  TemplateProvider,
  TemplateUpdateInput,
} from "@k-msg/core";
import { getProviderOnboardingSpec } from "../onboarding/specs";
import { readRuntimeEnv } from "../shared/runtime-env";
import type { AligoRuntimeContext } from "./aligo.internal.types";
import {
  addKakaoChannel,
  listKakaoChannelCategories,
  listKakaoChannels,
  requestKakaoChannelAuth,
} from "./aligo.kakao";
import { sendWithAligo } from "./aligo.send";
import {
  createTemplate,
  deleteTemplate,
  getTemplate,
  listTemplates,
  requestTemplateInspection,
  updateTemplate,
} from "./aligo.template";
import type { AligoConfig } from "./types/aligo";

export class AligoProvider
  implements
    Provider,
    TemplateProvider,
    TemplateInspectionProvider,
    KakaoChannelProvider
{
  readonly id = "aligo";
  readonly name = "Aligo Smart SMS";
  readonly supportedTypes: readonly MessageType[] = [
    "ALIMTALK",
    "FRIENDTALK",
    "SMS",
    "LMS",
    "MMS",
  ];

  private readonly smsHost: string;
  private readonly alimtalkHost: string;

  getOnboardingSpec() {
    const spec = getProviderOnboardingSpec(this.id);
    if (!spec) {
      throw new Error(`Onboarding spec missing for provider: ${this.id}`);
    }
    return spec;
  }

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

    this.smsHost = config.smsBaseUrl || "https://apis.aligo.in";
    this.alimtalkHost = config.alimtalkBaseUrl || "https://kakaoapi.aligo.in";
  }

  private getRuntimeContext(): AligoRuntimeContext {
    return {
      providerId: this.id,
      config: this.config,
      smsHost: this.smsHost,
      alimtalkHost: this.alimtalkHost,
    };
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
        new URL(this.smsHost);
      } catch {
        issues.push("Invalid smsBaseUrl");
      }

      try {
        new URL(this.alimtalkHost);
      } catch {
        issues.push("Invalid alimtalkBaseUrl");
      }

      return {
        healthy: issues.length === 0,
        issues,
        latencyMs: Date.now() - start,
        data: {
          provider: this.id,
          smsBaseUrl: this.smsHost,
          alimtalkBaseUrl: this.alimtalkHost,
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
    return sendWithAligo(this.getRuntimeContext(), normalized);
  }

  async listKakaoChannels(params?: {
    plusId?: string;
    senderKey?: string;
  }): Promise<Result<KakaoChannel[], KMsgError>> {
    return listKakaoChannels(this.getRuntimeContext(), params);
  }

  async listKakaoChannelCategories(): Promise<
    Result<KakaoChannelCategories, KMsgError>
  > {
    return listKakaoChannelCategories(this.getRuntimeContext());
  }

  async requestKakaoChannelAuth(params: {
    plusId: string;
    phoneNumber: string;
  }): Promise<Result<void, KMsgError>> {
    return requestKakaoChannelAuth(this.getRuntimeContext(), params);
  }

  async addKakaoChannel(params: {
    plusId: string;
    authNum: string;
    phoneNumber: string;
    categoryCode: string;
  }): Promise<Result<KakaoChannel, KMsgError>> {
    return addKakaoChannel(this.getRuntimeContext(), params);
  }

  async createTemplate(
    input: TemplateCreateInput,
    ctx?: TemplateContext,
  ): Promise<Result<Template, KMsgError>> {
    return createTemplate(this.getRuntimeContext(), input, ctx);
  }

  async updateTemplate(
    code: string,
    patch: TemplateUpdateInput,
    ctx?: TemplateContext,
  ): Promise<Result<Template, KMsgError>> {
    return updateTemplate(this.getRuntimeContext(), code, patch, ctx);
  }

  async deleteTemplate(
    code: string,
    ctx?: TemplateContext,
  ): Promise<Result<void, KMsgError>> {
    return deleteTemplate(this.getRuntimeContext(), code, ctx);
  }

  async getTemplate(
    code: string,
    ctx?: TemplateContext,
  ): Promise<Result<Template, KMsgError>> {
    return getTemplate(this.getRuntimeContext(), code, ctx);
  }

  async listTemplates(
    params?: { status?: string; page?: number; limit?: number },
    ctx?: TemplateContext,
  ): Promise<Result<Template[], KMsgError>> {
    return listTemplates(this.getRuntimeContext(), params, ctx);
  }

  async requestTemplateInspection(
    code: string,
    ctx?: TemplateContext,
  ): Promise<Result<void, KMsgError>> {
    return requestTemplateInspection(this.getRuntimeContext(), code, ctx);
  }
}

export const createAligoProvider = (config: AligoConfig) =>
  new AligoProvider(config);

export const createDefaultAligoProvider = () => {
  const config: AligoConfig = {
    apiKey: readRuntimeEnv("ALIGO_API_KEY") || "",
    userId: readRuntimeEnv("ALIGO_USER_ID") || "",
    senderKey: readRuntimeEnv("ALIGO_SENDER_KEY") || "",
    sender: readRuntimeEnv("ALIGO_SENDER") || "",
    friendtalkEndpoint: readRuntimeEnv("ALIGO_FRIENDTALK_ENDPOINT"),
    testMode: readRuntimeEnv("NODE_ENV") !== "production",
    debug: readRuntimeEnv("NODE_ENV") === "development",
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
