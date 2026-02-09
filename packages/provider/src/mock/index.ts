import { Provider, Result, ok, fail, SendOptions, SendResult, KMsgError, Template, TemplateProvider, KMsgErrorCode } from '@k-msg/core';

export class MockProvider implements Provider, TemplateProvider {
  readonly id = 'mock';
  readonly name = 'Mock Provider';
  private templates: Map<string, Template> = new Map();

  async send(params: SendOptions): Promise<Result<SendResult, KMsgError>> {
    console.log('[MockProvider] Sending message:', JSON.stringify(params, null, 2));

    const result: SendResult = {
      messageId: `mock-${Date.now()}`,
      status: 'SENT',
      provider: this.id,
    };

    return ok(result);
  }

  async createTemplate(template: Omit<Template, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<Result<Template, KMsgError>> {
    const newTemplate: Template = {
      ...template,
      id: `tpl-${Math.random().toString(36).substr(2, 9)}`,
      status: 'APPROVED',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.templates.set(newTemplate.code, newTemplate);
    return ok(newTemplate);
  }

  async updateTemplate(code: string, template: Partial<Omit<Template, 'id' | 'code' | 'status' | 'createdAt' | 'updatedAt'>>): Promise<Result<Template, KMsgError>> {
    const existing = this.templates.get(code);
    if (!existing) {
      return fail(new KMsgError(KMsgErrorCode.TEMPLATE_NOT_FOUND, `Template not found: ${code}`));
    }
    const updated: Template = {
      ...existing,
      ...template,
      updatedAt: new Date(),
    };
    this.templates.set(code, updated);
    return ok(updated);
  }

  async deleteTemplate(code: string): Promise<Result<void, KMsgError>> {
    if (!this.templates.has(code)) {
      return fail(new KMsgError(KMsgErrorCode.TEMPLATE_NOT_FOUND, `Template not found: ${code}`));
    }
    this.templates.delete(code);
    return ok(undefined);
  }

  async getTemplate(code: string): Promise<Result<Template, KMsgError>> {
    const template = this.templates.get(code);
    if (!template) {
      return fail(new KMsgError(KMsgErrorCode.TEMPLATE_NOT_FOUND, `Template not found: ${code}`));
    }
    return ok(template);
  }

  async listTemplates(params?: { status?: string; page?: number; limit?: number }): Promise<Result<Template[], KMsgError>> {
    let templates = Array.from(this.templates.values());
    if (params?.status) {
      templates = templates.filter(t => t.status === params.status);
    }
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const start = (page - 1) * limit;
    const end = start + limit;
    return ok(templates.slice(start, end));
  }
}
