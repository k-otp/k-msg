import type {
  KMsgError,
  Result,
  Template,
  TemplateContext,
  TemplateCreateInput,
  TemplateProvider,
  TemplateUpdateInput,
} from "@k-msg/core";
import {
  createTemplate,
  deleteTemplate,
  getTemplate,
  listTemplates,
  updateTemplate,
} from "./iwinv.template";
import { IWINVSendProvider, resolveDefaultIWINVConfig } from "./provider.send";
import type { IWINVConfig } from "./types/iwinv";

export class IWINVProvider
  extends IWINVSendProvider
  implements TemplateProvider
{
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
  const config = resolveDefaultIWINVConfig();
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
