import {
  KMsgError,
  KMsgErrorCode,
  type Result,
  type Template,
  type TemplateContext,
  type TemplateCreateInput,
  type TemplateProvider,
  type TemplateUpdateInput,
} from "@k-msg/core";
import { IWINV_ALIMTALK_BASE_URL } from "./iwinv.constants";
import type { NormalizedIwinvConfig } from "./iwinv.internal.types";
import {
  createTemplate,
  deleteTemplate,
  getTemplate,
  listTemplates,
  updateTemplate,
} from "./iwinv.template";
import { resolveDefaultIWINVConfig } from "./provider.send";
import type { IWINVConfig } from "./types/iwinv";

function normalizeTemplateConfig(config: IWINVConfig): NormalizedIwinvConfig {
  return {
    ...config,
    baseUrl: IWINV_ALIMTALK_BASE_URL,
    sendEndpoint: config.sendEndpoint || "/api/v2/send/",
  };
}

export class IWINVTemplateProvider implements TemplateProvider {
  readonly id = "iwinv";

  private readonly config: NormalizedIwinvConfig;

  constructor(config: IWINVConfig) {
    if (!config || typeof config !== "object") {
      throw new KMsgError(
        KMsgErrorCode.INVALID_REQUEST,
        "IWINVTemplateProvider requires a config object",
        { providerId: this.id },
      );
    }
    if (!config.apiKey || config.apiKey.length === 0) {
      throw new KMsgError(
        KMsgErrorCode.INVALID_REQUEST,
        "IWINVTemplateProvider requires `apiKey` configuration",
        { providerId: this.id },
      );
    }

    this.config = normalizeTemplateConfig(config);
  }

  async createTemplate(
    input: TemplateCreateInput,
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

  async deleteTemplate(code: string): Promise<Result<void, KMsgError>> {
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

export const createIWINVTemplateProvider = (config: IWINVConfig) =>
  new IWINVTemplateProvider(config);

export const createDefaultIWINVTemplateProvider = () => {
  const config = resolveDefaultIWINVConfig();
  return new IWINVTemplateProvider(config);
};

// biome-ignore lint/complexity/noStaticOnlyClass: kept as a factory for convenience
export class IWINVTemplateProviderFactory {
  static create(config: IWINVConfig): IWINVTemplateProvider {
    return new IWINVTemplateProvider(config);
  }

  static createDefault(): IWINVTemplateProvider {
    return createDefaultIWINVTemplateProvider();
  }
}

export {
  createTemplate,
  deleteTemplate,
  getTemplate,
  listTemplates,
  updateTemplate,
} from "./iwinv.template";
export type { IWINVConfig } from "./types/iwinv";
