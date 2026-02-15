import {
  fail,
  type KakaoChannel,
  type KakaoChannelCategories,
  type KakaoChannelProvider,
  KMsgError,
  KMsgErrorCode,
  type MessageType,
  ok,
  type Provider,
  type Result,
  type SendOptions,
  type SendResult,
  type Template,
  type TemplateContext,
  type TemplateCreateInput,
  type TemplateInspectionProvider,
  type TemplateProvider,
  type TemplateUpdateInput,
} from "@k-msg/core";

export class MockProvider
  implements
    Provider,
    TemplateProvider,
    TemplateInspectionProvider,
    KakaoChannelProvider
{
  readonly id = "mock";
  readonly name = "Mock Provider";
  readonly supportedTypes: readonly MessageType[] = [
    "ALIMTALK",
    "FRIENDTALK",
    "SMS",
    "LMS",
    "MMS",
    "NSA",
    "VOICE",
    "FAX",
    "RCS_SMS",
    "RCS_LMS",
    "RCS_MMS",
    "RCS_TPL",
    "RCS_ITPL",
    "RCS_LTPL",
  ];

  public calls: SendOptions[] = [];
  private failureCount = 0;
  private templates: Map<string, Template> = new Map();
  private templateSeq = 0;
  private channelSeq = 0;
  private kakaoChannels: Map<string, KakaoChannel> = new Map();

  constructor() {
    // Seed with a deterministic channel/template so CLI calls can be tested
    // without relying on cross-process state.
    const now = new Date();

    const seedTemplate: Template = {
      id: "MOCK_TPL_SEED",
      code: "MOCK_TPL_SEED",
      name: "Mock Seed Template",
      content: "Hello #{name}",
      status: "APPROVED",
      createdAt: now,
      updatedAt: now,
    };
    this.templates.set(seedTemplate.code, seedTemplate);

    const seedChannel: KakaoChannel = {
      providerId: this.id,
      senderKey: "mock-sender-seed",
      plusId: "@mock",
      name: "Mock Seed Channel",
      status: "A",
      createdAt: now,
      updatedAt: now,
    };
    this.kakaoChannels.set(seedChannel.senderKey, seedChannel);
  }

  async healthCheck() {
    return { healthy: true, issues: [] };
  }

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
      messageId: params.messageId || crypto.randomUUID(),
      status: "SENT",
      providerId: this.id,
      providerMessageId: `mock-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: params.type,
      to: params.to,
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
    input: TemplateCreateInput,
    _ctx?: TemplateContext,
  ): Promise<Result<Template, KMsgError>> {
    this.templateSeq += 1;
    const code = `MOCK_TPL_${this.templateSeq}`;
    const newTemplate: Template = {
      id: code,
      code,
      name: input.name,
      content: input.content,
      category: input.category,
      buttons: input.buttons,
      variables: input.variables,
      status: "APPROVED",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.templates.set(newTemplate.code, newTemplate);
    return ok(newTemplate);
  }

  async updateTemplate(
    code: string,
    patch: TemplateUpdateInput,
    _ctx?: TemplateContext,
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
      ...(typeof patch.name === "string" ? { name: patch.name } : {}),
      ...(typeof patch.content === "string" ? { content: patch.content } : {}),
      ...(patch.category !== undefined ? { category: patch.category } : {}),
      ...(patch.buttons !== undefined ? { buttons: patch.buttons } : {}),
      ...(patch.variables !== undefined ? { variables: patch.variables } : {}),
      updatedAt: new Date(),
    };
    this.templates.set(code, updated);
    return ok(updated);
  }

  async deleteTemplate(
    code: string,
    _ctx?: TemplateContext,
  ): Promise<Result<void, KMsgError>> {
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

  async getTemplate(
    code: string,
    _ctx?: TemplateContext,
  ): Promise<Result<Template, KMsgError>> {
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

  async listTemplates(
    params?: {
      status?: string;
      page?: number;
      limit?: number;
    },
    _ctx?: TemplateContext,
  ): Promise<Result<Template[], KMsgError>> {
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

  async requestTemplateInspection(
    code: string,
    _ctx?: TemplateContext,
  ): Promise<Result<void, KMsgError>> {
    if (!this.templates.has(code)) {
      return fail(
        new KMsgError(
          KMsgErrorCode.TEMPLATE_NOT_FOUND,
          `Template not found: ${code}`,
        ),
      );
    }
    return ok(undefined);
  }

  async listKakaoChannels(params?: {
    plusId?: string;
    senderKey?: string;
  }): Promise<Result<KakaoChannel[], KMsgError>> {
    let channels = Array.from(this.kakaoChannels.values());
    if (params?.plusId) {
      channels = channels.filter((c) => c.plusId === params.plusId);
    }
    if (params?.senderKey) {
      channels = channels.filter((c) => c.senderKey === params.senderKey);
    }
    return ok(channels);
  }

  async listKakaoChannelCategories(): Promise<
    Result<KakaoChannelCategories, KMsgError>
  > {
    const categories: KakaoChannelCategories = {
      first: [{ code: "001", name: "Mock First" }],
      second: [{ code: "001001", name: "Mock Second", parentCode: "001" }],
      third: [
        {
          code: "001001001",
          name: "Mock Third",
          parentCode: "001001",
        },
      ],
    };
    return ok(categories);
  }

  async requestKakaoChannelAuth(params: {
    plusId: string;
    phoneNumber: string;
  }): Promise<Result<void, KMsgError>> {
    if (!params.plusId || !params.phoneNumber) {
      return fail(
        new KMsgError(
          KMsgErrorCode.INVALID_REQUEST,
          "plusId and phoneNumber are required",
          { providerId: this.id },
        ),
      );
    }
    return ok(undefined);
  }

  async addKakaoChannel(params: {
    plusId: string;
    authNum: string;
    phoneNumber: string;
    categoryCode: string;
  }): Promise<Result<KakaoChannel, KMsgError>> {
    if (
      !params.plusId ||
      !params.authNum ||
      !params.phoneNumber ||
      !params.categoryCode
    ) {
      return fail(
        new KMsgError(
          KMsgErrorCode.INVALID_REQUEST,
          "plusId, authNum, phoneNumber, categoryCode are required",
          { providerId: this.id },
        ),
      );
    }

    this.channelSeq += 1;
    const senderKey = `mock-sender-${this.channelSeq}`;
    const channel: KakaoChannel = {
      providerId: this.id,
      senderKey,
      plusId: params.plusId,
      name: "Mock Channel",
      status: "A",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.kakaoChannels.set(senderKey, channel);
    return ok(channel);
  }
}
