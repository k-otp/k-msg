import { 
  Result, 
  KMsgError, 
  KMsgErrorCode, 
  TemplateProvider, 
  Template, 
  fail 
} from '@k-msg/core';

export class TemplateService {
  constructor(private readonly provider: TemplateProvider) {}

  async create(
    template: Omit<Template, 'id' | 'status' | 'createdAt' | 'updatedAt'>
  ): Promise<Result<Template, KMsgError>> {
    if (!template.name || template.name.trim().length === 0) {
      return fail(new KMsgError(KMsgErrorCode.INVALID_REQUEST, 'Template name is required'));
    }

    if (!template.content || template.content.trim().length === 0) {
      return fail(new KMsgError(KMsgErrorCode.INVALID_REQUEST, 'Template content is required'));
    }

    if (!template.code || template.code.trim().length === 0) {
      return fail(new KMsgError(KMsgErrorCode.INVALID_REQUEST, 'Template code is required'));
    }

    return this.provider.createTemplate(template);
  }

  async update(
    code: string, 
    template: Partial<Omit<Template, 'id' | 'code' | 'status' | 'createdAt' | 'updatedAt'>>
  ): Promise<Result<Template, KMsgError>> {
    if (!code || code.trim().length === 0) {
      return fail(new KMsgError(KMsgErrorCode.INVALID_REQUEST, 'Template code is required'));
    }

    return this.provider.updateTemplate(code, template);
  }

  async delete(code: string): Promise<Result<void, KMsgError>> {
    if (!code || code.trim().length === 0) {
      return fail(new KMsgError(KMsgErrorCode.INVALID_REQUEST, 'Template code is required'));
    }

    return this.provider.deleteTemplate(code);
  }

  async get(code: string): Promise<Result<Template, KMsgError>> {
    if (!code || code.trim().length === 0) {
      return fail(new KMsgError(KMsgErrorCode.INVALID_REQUEST, 'Template code is required'));
    }

    return this.provider.getTemplate(code);
  }

  async list(params?: { 
    status?: string; 
    page?: number; 
    limit?: number 
  }): Promise<Result<Template[], KMsgError>> {
    return this.provider.listTemplates(params);
  }
}
