import type {
  KMsgError,
  Result,
  Template,
  TemplateContext,
  TemplateCreateInput,
  TemplateInspectionProvider,
  TemplateProvider,
  TemplateUpdateInput,
} from "@k-msg/core";
import type { AligoRuntimeContext } from "./aligo.internal.types";
import {
  createTemplate,
  deleteTemplate,
  getTemplate,
  listTemplates,
  requestTemplateInspection,
  updateTemplate,
} from "./aligo.template";
import { resolveDefaultAligoConfig } from "./provider.send";
import type { AligoConfig } from "./types/aligo";

export class AligoTemplateProvider
  implements TemplateProvider, TemplateInspectionProvider
{
  readonly id = "aligo";

  private readonly config: AligoConfig;
  private readonly smsHost: string;
  private readonly alimtalkHost: string;

  constructor(config: AligoConfig) {
    if (!config || typeof config !== "object") {
      throw new Error("AligoTemplateProvider requires a config object");
    }
    if (!config.apiKey || config.apiKey.length === 0) {
      throw new Error("AligoTemplateProvider requires `apiKey`");
    }
    if (!config.userId || config.userId.length === 0) {
      throw new Error("AligoTemplateProvider requires `userId`");
    }

    this.config = config;
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

export const createAligoTemplateProvider = (config: AligoConfig) =>
  new AligoTemplateProvider(config);

export const createDefaultAligoTemplateProvider = () => {
  const config = resolveDefaultAligoConfig();

  if (!config.apiKey || !config.userId) {
    throw new Error("ALIGO_API_KEY and ALIGO_USER_ID are required");
  }

  return new AligoTemplateProvider(config);
};

// biome-ignore lint/complexity/noStaticOnlyClass: kept as a factory for convenience
export class AligoTemplateProviderFactory {
  static create(config: AligoConfig): AligoTemplateProvider {
    return new AligoTemplateProvider(config);
  }

  static createDefault(): AligoTemplateProvider {
    return createDefaultAligoTemplateProvider();
  }
}
