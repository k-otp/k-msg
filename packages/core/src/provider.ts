import type { KMsgError } from "./errors";
import type { Result } from "./result";
import type {
  DeliveryStatusQuery,
  DeliveryStatusResult,
  KakaoChannel,
  KakaoChannelCategories,
  MessageType,
  ProviderOnboardingSpec,
  SendOptions,
  SendResult,
} from "./types/index";

export interface Template {
  id: string;
  code: string;
  name: string;
  content: string;
  category?: string;
  status: "APPROVED" | "REJECTED" | "PENDING" | "INSPECTION";
  buttons?: unknown[];
  variables?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type TemplateCreateInput = {
  name: string;
  content: string;
  category?: string;
  buttons?: unknown[];
  variables?: string[];
};

export type TemplateUpdateInput = Partial<TemplateCreateInput>;

export type TemplateContext = {
  /**
   * Provider-specific Kakao channel key (e.g. Aligo senderKey).
   */
  kakaoChannelSenderKey?: string;
};

export interface TemplateProvider {
  createTemplate(
    input: TemplateCreateInput,
    ctx?: TemplateContext,
  ): Promise<Result<Template, KMsgError>>;
  updateTemplate(
    code: string,
    patch: TemplateUpdateInput,
    ctx?: TemplateContext,
  ): Promise<Result<Template, KMsgError>>;
  deleteTemplate(
    code: string,
    ctx?: TemplateContext,
  ): Promise<Result<void, KMsgError>>;
  getTemplate(
    code: string,
    ctx?: TemplateContext,
  ): Promise<Result<Template, KMsgError>>;
  listTemplates(
    params?: { status?: string; page?: number; limit?: number },
    ctx?: TemplateContext,
  ): Promise<Result<Template[], KMsgError>>;
}

export interface TemplateInspectionProvider {
  requestTemplateInspection(
    code: string,
    ctx?: TemplateContext,
  ): Promise<Result<void, KMsgError>>;
}

export interface KakaoChannelProvider {
  listKakaoChannels(params?: {
    plusId?: string;
    senderKey?: string;
  }): Promise<Result<KakaoChannel[], KMsgError>>;
  listKakaoChannelCategories?(): Promise<
    Result<KakaoChannelCategories, KMsgError>
  >;
  requestKakaoChannelAuth?(params: {
    plusId: string;
    phoneNumber: string;
  }): Promise<Result<void, KMsgError>>;
  addKakaoChannel?(params: {
    plusId: string;
    authNum: string;
    phoneNumber: string;
    categoryCode: string;
  }): Promise<Result<KakaoChannel, KMsgError>>;
}

export interface ProviderHealthStatus {
  healthy: boolean;
  issues: string[];
  latencyMs?: number;
  data?: Record<string, unknown>;
}

export interface Provider {
  readonly id: string;
  readonly name: string;
  readonly supportedTypes: readonly MessageType[];

  healthCheck(): Promise<ProviderHealthStatus>;
  send(params: SendOptions): Promise<Result<SendResult, KMsgError>>;
  getDeliveryStatus?(
    query: DeliveryStatusQuery,
  ): Promise<Result<DeliveryStatusResult | null, KMsgError>>;
  getOnboardingSpec?(): ProviderOnboardingSpec;
}
