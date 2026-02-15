import {
  fail,
  KMsgError,
  KMsgErrorCode,
  type Result,
  type Template,
  type TemplateContext,
  type TemplateCreateInput,
  type TemplateProvider,
  type TemplateUpdateInput,
} from "@k-msg/core";

export class TemplateService {
  constructor(private readonly provider: TemplateProvider) {}

  async create(
    input: TemplateCreateInput,
    ctx?: TemplateContext,
  ): Promise<Result<Template, KMsgError>> {
    if (!input.name || input.name.trim().length === 0) {
      return fail(
        new KMsgError(
          KMsgErrorCode.INVALID_REQUEST,
          "Template name is required",
        ),
      );
    }

    if (!input.content || input.content.trim().length === 0) {
      return fail(
        new KMsgError(
          KMsgErrorCode.INVALID_REQUEST,
          "Template content is required",
        ),
      );
    }

    return this.provider.createTemplate(input, ctx);
  }

  async update(
    code: string,
    patch: TemplateUpdateInput,
    ctx?: TemplateContext,
  ): Promise<Result<Template, KMsgError>> {
    if (!code || code.trim().length === 0) {
      return fail(
        new KMsgError(
          KMsgErrorCode.INVALID_REQUEST,
          "Template code is required",
        ),
      );
    }

    return this.provider.updateTemplate(code, patch, ctx);
  }

  async delete(
    code: string,
    ctx?: TemplateContext,
  ): Promise<Result<void, KMsgError>> {
    if (!code || code.trim().length === 0) {
      return fail(
        new KMsgError(
          KMsgErrorCode.INVALID_REQUEST,
          "Template code is required",
        ),
      );
    }

    return this.provider.deleteTemplate(code, ctx);
  }

  async get(
    code: string,
    ctx?: TemplateContext,
  ): Promise<Result<Template, KMsgError>> {
    if (!code || code.trim().length === 0) {
      return fail(
        new KMsgError(
          KMsgErrorCode.INVALID_REQUEST,
          "Template code is required",
        ),
      );
    }

    return this.provider.getTemplate(code, ctx);
  }

  async list(
    params?: { status?: string; page?: number; limit?: number },
    ctx?: TemplateContext,
  ): Promise<Result<Template[], KMsgError>> {
    return this.provider.listTemplates(params, ctx);
  }
}
