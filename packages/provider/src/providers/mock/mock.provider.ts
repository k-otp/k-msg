import {
  fail,
  KMsgError,
  KMsgErrorCode,
  ok,
  type Provider,
  type Result,
  type SendOptions,
  type SendResult,
  type Template,
  type TemplateProvider,
} from "@k-msg/core";

export class MockProvider implements Provider, TemplateProvider {
  readonly id = "mock";
  readonly name = "Mock Provider";

  public calls: SendOptions[] = [];
  private failureCount = 0;
  private templates: Map<string, Template> = new Map();

  async send(params: SendOptions): Promise<Result<SendResult, KMsgError>> {
    this.calls.push(params);

    if (this.failureCount > 0) {
      this.failureCount--;
      return fail(
        new KMsgError(
          KMsgErrorCode.PROVIDER_ERROR,
          "Mock provider simulated failure",
          { provider: this.id },
        ),
      );
    }

    const result: SendResult = {
      messageId: `mock-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      status: "SENT",
      provider: this.id,
    };

    return ok(result);
  }

  mockSuccess(): void {
    this.failureCount = 0;
  }

  mockFailure(count: number): void {
    this.failureCount = count;
  }

  getHistory(): SendOptions[] {
    return this.calls;
  }

  clearHistory(): void {
    this.calls = [];
  }

  async createTemplate(
    template: Omit<Template, "id" | "status" | "createdAt" | "updatedAt">,
  ): Promise<Result<Template, KMsgError>> {
    const newTemplate: Template = {
      ...template,
      id: `tpl-${Math.random().toString(36).substr(2, 9)}`,
      status: "APPROVED",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.templates.set(newTemplate.code, newTemplate);
    return ok(newTemplate);
  }

  async updateTemplate(
    code: string,
    template: Partial<
      Omit<Template, "id" | "code" | "status" | "createdAt" | "updatedAt">
    >,
  ): Promise<Result<Template, KMsgError>> {
    const existing = this.templates.get(code);
    if (!existing) {
      return fail(
        new KMsgError(
          KMsgErrorCode.TEMPLATE_NOT_FOUND,
          `Template not found: ${code}`,
        ),
      );
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
      return fail(
        new KMsgError(
          KMsgErrorCode.TEMPLATE_NOT_FOUND,
          `Template not found: ${code}`,
        ),
      );
    }
    this.templates.delete(code);
    return ok(undefined);
  }

  async getTemplate(code: string): Promise<Result<Template, KMsgError>> {
    const template = this.templates.get(code);
    if (!template) {
      return fail(
        new KMsgError(
          KMsgErrorCode.TEMPLATE_NOT_FOUND,
          `Template not found: ${code}`,
        ),
      );
    }
    return ok(template);
  }

  async listTemplates(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<Result<Template[], KMsgError>> {
    let templates = Array.from(this.templates.values());
    if (params?.status) {
      templates = templates.filter((t) => t.status === params.status);
    }
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const start = (page - 1) * limit;
    const end = start + limit;
    return ok(templates.slice(start, end));
  }
}
