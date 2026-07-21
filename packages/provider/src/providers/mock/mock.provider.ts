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
  type ProviderRequestContext,
  type ProviderTransportCapabilities,
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
import { getProviderOnboardingSpec } from "../../onboarding/specs";
import {
  toProviderAbortError,
  toProviderTransportError,
} from "../../shared/provider-transport";

type MockSendScenarioStep = {
  outcome: "success" | "failure" | "timeout" | "delay";
  code?: KMsgErrorCode | string;
  message?: string;
  providerErrorCode?: string;
  providerErrorText?: string;
  httpStatus?: number;
  retryAfterMs?: number;
  causeChain?: unknown[];
  durationMs?: number;
};

const sleep = (ms: number, signal?: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => {
        signal?.removeEventListener("abort", onAbort);
        resolve();
      },
      Math.max(0, Math.floor(ms)),
    );
    const onAbort = () => {
      clearTimeout(timeout);
      reject(
        signal?.reason ??
          (typeof DOMException !== "undefined"
            ? new DOMException("Aborted", "AbortError")
            : new Error("Aborted")),
      );
    };
    if (signal?.aborted) {
      onAbort();
      return;
    }
    signal?.addEventListener("abort", onAbort, { once: true });
  });

const normalizeMockErrorCode = (
  code: MockSendScenarioStep["code"],
): KMsgErrorCode => {
  if (
    code === KMsgErrorCode.INVALID_REQUEST ||
    code === KMsgErrorCode.AUTHENTICATION_FAILED ||
    code === KMsgErrorCode.INSUFFICIENT_BALANCE ||
    code === KMsgErrorCode.TEMPLATE_NOT_FOUND ||
    code === KMsgErrorCode.RATE_LIMIT_EXCEEDED ||
    code === KMsgErrorCode.NETWORK_ERROR ||
    code === KMsgErrorCode.NETWORK_TIMEOUT ||
    code === KMsgErrorCode.NETWORK_SERVICE_UNAVAILABLE ||
    code === KMsgErrorCode.REQUEST_ABORTED ||
    code === KMsgErrorCode.PROVIDER_ERROR ||
    code === KMsgErrorCode.MESSAGE_SEND_FAILED ||
    code === KMsgErrorCode.UNKNOWN_ERROR
  ) {
    return code;
  }

  return KMsgErrorCode.PROVIDER_ERROR;
};

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
  readonly transportCapabilities = {
    abortSignal: "supported",
    injectableFetch: "unsupported",
  } as const satisfies ProviderTransportCapabilities;

  public calls: SendOptions[] = [];
  private failureCount = 0;
  private scenario: MockSendScenarioStep[] = [];
  private scenarioCursor = 0;
  private templates: Map<string, Template> = new Map();
  private templateSeq = 0;
  private channelSeq = 0;
  private kakaoChannels: Map<string, KakaoChannel> = new Map();

  getOnboardingSpec() {
    const spec = getProviderOnboardingSpec(this.id);
    if (!spec) {
      throw new Error(`Onboarding spec missing for provider: ${this.id}`);
    }
    return spec;
  }

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

  async send(
    params: SendOptions,
    context?: ProviderRequestContext,
  ): Promise<Result<SendResult, KMsgError>> {
    const preflightAbort = toProviderAbortError(
      context?.signal?.reason,
      context?.signal,
      this.id,
    );
    if (preflightAbort) return fail(preflightAbort);

    this.calls.push(params);

    let outcome = this.nextScenarioOutcome();

    while (outcome.outcome === "delay" || outcome.outcome === "timeout") {
      const aborted = await this.waitForDelay(
        outcome.durationMs ?? 0,
        context?.signal,
      );
      if (aborted) return fail(aborted);

      if (outcome.outcome === "timeout") {
        return fail(
          new KMsgError(
            KMsgErrorCode.NETWORK_TIMEOUT,
            outcome.message ?? "Mock provider simulated timeout",
            { providerId: this.id },
            {
              providerErrorCode: outcome.providerErrorCode ?? "TIMEOUT",
              providerErrorText: outcome.providerErrorText,
              httpStatus: outcome.httpStatus,
              retryAfterMs: outcome.retryAfterMs,
            },
          ),
        );
      }

      outcome = this.nextScenarioOutcome();
    }

    if (outcome.outcome === "failure") {
      const code = normalizeMockErrorCode(outcome.code);
      return fail(
        new KMsgError(
          code,
          outcome.message ?? "Mock provider simulated failure",
          { providerId: this.id },
          {
            providerErrorCode: outcome.providerErrorCode,
            providerErrorText: outcome.providerErrorText,
            httpStatus: outcome.httpStatus,
            retryAfterMs: outcome.retryAfterMs,
            causeChain: outcome.causeChain,
          },
        ),
      );
    }

    if (outcome.outcome !== "success") {
      return fail(
        new KMsgError(
          KMsgErrorCode.UNKNOWN_ERROR,
          `Unsupported mock outcome: ${String(outcome.outcome)}`,
          { providerId: this.id },
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
      ...(params.type === "ALIMTALK" && params.failover?.enabled === true
        ? {
            warnings: [
              {
                code: "FAILOVER_UNSUPPORTED_PROVIDER",
                message:
                  "Mock provider does not support native ALIMTALK failover.",
                details: { providerId: this.id },
              },
            ],
          }
        : {}),
    };

    return ok(result);
  }

  mockSuccess(): void {
    this.failureCount = 0;
    this.clearScenario();
  }

  mockFailure(count: number): void {
    this.failureCount = count;
    this.clearScenario();
  }

  mockScenario(steps: MockSendScenarioStep[]): void {
    this.scenario = Array.isArray(steps) ? steps.slice() : [];
    this.scenarioCursor = 0;
  }

  clearScenario(): void {
    this.scenario = [];
    this.scenarioCursor = 0;
  }

  private async waitForDelay(
    durationMs: number,
    signal?: AbortSignal,
  ): Promise<KMsgError | undefined> {
    try {
      await sleep(durationMs, signal);
      return undefined;
    } catch (error) {
      return toProviderTransportError(error, signal, this.id);
    }
  }

  private nextScenarioOutcome(): MockSendScenarioStep {
    if (this.scenarioCursor < this.scenario.length) {
      const next = this.scenario[this.scenarioCursor];
      this.scenarioCursor += 1;
      return next;
    }

    if (this.failureCount > 0) {
      this.failureCount -= 1;
      return {
        outcome: "failure",
        code: KMsgErrorCode.PROVIDER_ERROR,
        message: "Mock provider simulated failure",
      };
    }

    return { outcome: "success" };
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
