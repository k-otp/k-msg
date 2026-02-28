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
import {
  createTemplate,
  deleteTemplate,
  getTemplate,
  listTemplates,
  requestTemplateInspection,
  updateTemplate,
} from "./aligo.template";
import { AligoSendProvider, resolveDefaultAligoConfig } from "./provider.send";
import type { AligoConfig } from "./types/aligo";

export class AligoProvider
  extends AligoSendProvider
  implements TemplateProvider, TemplateInspectionProvider
{
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
  const config = resolveDefaultAligoConfig();
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
