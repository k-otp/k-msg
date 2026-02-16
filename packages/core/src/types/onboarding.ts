export type ProviderOnboardingCheckKind =
  | "manual"
  | "config"
  | "capability"
  | "api_probe"
  | "inference";

export type ProviderOnboardingSeverity = "blocker" | "warning" | "info";

export type ProviderOnboardingScope = "doctor" | "preflight" | "send";

export type ProviderPlusIdPolicy =
  | "optional"
  | "required"
  | "required_if_no_inference";

export type ProviderPlusIdInferenceSupport = "supported" | "unsupported";

export type ProviderChannelOnboardingMode = "manual" | "api" | "none";

export type ProviderTemplateLifecycleAvailability = "available" | "unavailable";

export type ProviderLiveTestSupport = "supported" | "partial" | "none";

export type ProviderOnboardingProbeOperation =
  | "list_templates"
  | "list_kakao_channels";

export interface ProviderOnboardingCheckSpec {
  id: string;
  title: string;
  description?: string;
  kind: ProviderOnboardingCheckKind;
  severity: ProviderOnboardingSeverity;
  scopes: ProviderOnboardingScope[];
  /**
   * Relative key paths under provider config (e.g. "apiKey", "nested.token").
   * Used when kind === "config".
   */
  configKeys?: string[];
  /**
   * Method names that must exist on provider instances.
   * Used when kind === "capability".
   */
  capabilityMethods?: string[];
  /**
   * Well-known probe operation used when kind === "api_probe".
   */
  probeOperation?: ProviderOnboardingProbeOperation;
}

export interface ProviderOnboardingSpec {
  providerId: string;
  providerName?: string;
  channelOnboarding: ProviderChannelOnboardingMode;
  templateLifecycleApi: ProviderTemplateLifecycleAvailability;
  plusIdPolicy: ProviderPlusIdPolicy;
  plusIdInference: ProviderPlusIdInferenceSupport;
  liveTestSupport?: ProviderLiveTestSupport;
  checks: ProviderOnboardingCheckSpec[];
  notes?: string[];
}
