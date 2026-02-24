import type { KMsgError } from "./errors";
import type { Result } from "./result";
import type {
  BalanceQuery,
  BalanceResult,
  DeliveryStatusQuery,
  DeliveryStatusResult,
  KakaoChannel,
  KakaoChannelCategories,
  MessageType,
  ProviderOnboardingSpec,
  SendOptions,
  SendResult,
} from "./types/index";

/**
 * Represents an AlimTalk template registered with a provider.
 * Templates must be approved by Kakao before use.
 */
export interface Template {
  /** Unique template identifier. */
  id: string;
  /** Template code used in send requests. */
  code: string;
  /** Human-readable template name. */
  name: string;
  /** Template body with #{variable} placeholders. */
  content: string;
  /** Template category (e.g., "authentication", "promotion"). */
  category?: string;
  /** Approval status of the template. */
  status: "APPROVED" | "REJECTED" | "PENDING" | "INSPECTION";
  /** Button configurations attached to the template. */
  buttons?: unknown[];
  /** Names of variables expected in the template content. */
  variables?: string[];
  /** When the template was created. */
  createdAt: Date;
  /** When the template was last updated. */
  updatedAt: Date;
}

/**
 * Input for creating a new AlimTalk template.
 */
export type TemplateCreateInput = {
  /** Human-readable template name. */
  name: string;
  /** Template body with #{variable} placeholders. */
  content: string;
  /** Template category. */
  category?: string;
  /** Button configurations. */
  buttons?: unknown[];
  /** Expected variable names in the template. */
  variables?: string[];
};

/**
 * Partial input for updating an existing template.
 */
export type TemplateUpdateInput = Partial<TemplateCreateInput>;

/**
 * Context passed to template operations.
 */
export type TemplateContext = {
  /**
   * Provider-specific Kakao channel key (e.g. Aligo senderKey).
   */
  kakaoChannelSenderKey?: string;
};

/**
 * Interface for providers that support AlimTalk template management.
 */
export interface TemplateProvider {
  /**
   * Create a new template.
   */
  createTemplate(
    input: TemplateCreateInput,
    ctx?: TemplateContext,
  ): Promise<Result<Template, KMsgError>>;
  /**
   * Update an existing template by code.
   */
  updateTemplate(
    code: string,
    patch: TemplateUpdateInput,
    ctx?: TemplateContext,
  ): Promise<Result<Template, KMsgError>>;
  /**
   * Delete a template by code.
   */
  deleteTemplate(
    code: string,
    ctx?: TemplateContext,
  ): Promise<Result<void, KMsgError>>;
  /**
   * Get a template by code.
   */
  getTemplate(
    code: string,
    ctx?: TemplateContext,
  ): Promise<Result<Template, KMsgError>>;
  /**
   * List templates with optional filtering and pagination.
   */
  listTemplates(
    params?: { status?: string; page?: number; limit?: number },
    ctx?: TemplateContext,
  ): Promise<Result<Template[], KMsgError>>;
}

/**
 * Interface for providers that support requesting template inspection.
 */
export interface TemplateInspectionProvider {
  /**
   * Request inspection for a template (submits for approval review).
   */
  requestTemplateInspection(
    code: string,
    ctx?: TemplateContext,
  ): Promise<Result<void, KMsgError>>;
}

/**
 * Interface for providers that support Kakao channel management.
 */
export interface KakaoChannelProvider {
  /**
   * List registered Kakao channels.
   */
  listKakaoChannels(params?: {
    plusId?: string;
    senderKey?: string;
  }): Promise<Result<KakaoChannel[], KMsgError>>;
  /**
   * List available channel categories for registration.
   */
  listKakaoChannelCategories?(): Promise<
    Result<KakaoChannelCategories, KMsgError>
  >;
  /**
   * Request authentication SMS for channel registration.
   */
  requestKakaoChannelAuth?(params: {
    plusId: string;
    phoneNumber: string;
  }): Promise<Result<void, KMsgError>>;
  /**
   * Add a Kakao channel after authentication.
   */
  addKakaoChannel?(params: {
    plusId: string;
    authNum: string;
    phoneNumber: string;
    categoryCode: string;
  }): Promise<Result<KakaoChannel, KMsgError>>;
}

/**
 * Health check result from a provider.
 */
export interface ProviderHealthStatus {
  /** Whether the provider is operational. */
  healthy: boolean;
  /** List of issues if not healthy. */
  issues: string[];
  /** Response latency in milliseconds. */
  latencyMs?: number;
  /** Provider-specific health details. */
  data?: Record<string, unknown>;
}

/**
 * Interface for providers that support balance queries.
 */
export interface BalanceProvider {
  /**
   * Query the remaining balance/points for the provider account.
   */
  getBalance(query?: BalanceQuery): Promise<Result<BalanceResult, KMsgError>>;
}

/**
 * Core provider interface for sending messages.
 *
 * All providers must implement this interface. Optional capabilities
 * (balance, templates, delivery status) are exposed via separate interfaces.
 *
 * @example
 * ```ts
 * class MyProvider implements Provider {
 *   readonly id = "my-provider";
 *   readonly name = "My Provider";
 *   readonly supportedTypes = ["SMS", "LMS"] as const;
 *
 *   async healthCheck() { return { healthy: true, issues: [] }; }
 *   async send(params) { ... }
 * }
 * ```
 */
export interface Provider {
  /**
   * Unique identifier for this provider instance.
   * Used for routing and logging.
   * @example "solapi"
   */
  readonly id: string;
  /**
   * Human-readable name for display purposes.
   * @example "SOLAPI"
   */
  readonly name: string;
  /**
   * Message types this provider supports.
   * Messages of unsupported types will be rejected.
   */
  readonly supportedTypes: readonly MessageType[];

  /**
   * Check if the provider is operational.
   * Used for health monitoring and circuit breaker decisions.
   */
  healthCheck(): Promise<ProviderHealthStatus>;
  /**
   * Send a message through this provider.
   * @returns Result with SendResult on success, KMsgError on failure.
   */
  send(params: SendOptions): Promise<Result<SendResult, KMsgError>>;
  /**
   * Query delivery status for a previously sent message.
   * Optional capability - not all providers support this.
   */
  getDeliveryStatus?(
    query: DeliveryStatusQuery,
  ): Promise<Result<DeliveryStatusResult | null, KMsgError>>;
  /**
   * Get the onboarding specification for this provider.
   * Used by tooling to guide provider configuration.
   */
  getOnboardingSpec?(): ProviderOnboardingSpec;
}
