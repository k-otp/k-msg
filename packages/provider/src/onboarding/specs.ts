import type { ProviderOnboardingSpec } from "@k-msg/core";
import { iwinvOnboardingSpec } from "./iwinv";

export const providerOnboardingSpecs: Readonly<
  Record<string, ProviderOnboardingSpec>
> = {
  iwinv: iwinvOnboardingSpec,
  aligo: {
    providerId: "aligo",
    providerName: "Aligo Smart SMS",
    channelOnboarding: "api",
    templateLifecycleApi: "available",
    plusIdPolicy: "required_if_no_inference",
    plusIdInference: "supported",
    liveTestSupport: "supported",
    checks: [
      {
        id: "aligo_config_required",
        title: "Aligo config has required keys",
        kind: "config",
        severity: "blocker",
        scopes: ["doctor", "preflight"],
        configKeys: ["apiKey", "userId"],
      },
      {
        id: "channel_api_capability_available",
        title: "Kakao channel APIs are available",
        kind: "capability",
        severity: "warning",
        scopes: ["doctor", "preflight"],
        capabilityMethods: [
          "listKakaoChannels",
          "requestKakaoChannelAuth",
          "addKakaoChannel",
        ],
      },
      {
        id: "channel_list_probe",
        title: "Kakao channel list API probe",
        kind: "api_probe",
        severity: "warning",
        scopes: ["doctor", "preflight"],
        probeOperation: "list_kakao_channels",
      },
      {
        id: "template_list_probe",
        title: "Template list API probe",
        kind: "api_probe",
        severity: "warning",
        scopes: ["doctor", "preflight"],
        probeOperation: "list_templates",
      },
    ],
    notes: [
      "AlimTalk message_1 is the template body with variables filled in by name; the body comes from providerOptions.templateContent or the template list API.",
      'Delivery status lookup is not implemented (no getDeliveryStatus()): Aligo documents its result lookups but not their result codes. DeliveryTrackingService keeps tracked Aligo messages at SENT (PENDING when scheduled) until polling.maxTrackingDurationMs (24 h by default) marks them UNKNOWN; polling.unsupportedProviderStrategy "unknown" settles them at the first poll.',
    ],
  },
  solapi: {
    providerId: "solapi",
    providerName: "SOLAPI Messaging Provider",
    channelOnboarding: "none",
    templateLifecycleApi: "unavailable",
    plusIdPolicy: "optional",
    plusIdInference: "unsupported",
    liveTestSupport: "partial",
    checks: [
      {
        id: "solapi_config_required",
        title: "SOLAPI config has required keys",
        kind: "config",
        severity: "blocker",
        scopes: ["doctor", "preflight"],
        configKeys: ["apiKey", "apiSecret"],
      },
    ],
    notes: [
      "SOLAPI ALIMTALK identifies the Kakao channel by pfId (kakao.profileId or config.kakaoPfId) and does not use a plusId.",
    ],
  },
  mock: {
    providerId: "mock",
    providerName: "Mock Provider",
    channelOnboarding: "api",
    templateLifecycleApi: "available",
    plusIdPolicy: "optional",
    plusIdInference: "supported",
    liveTestSupport: "none",
    checks: [
      {
        id: "mock_template_capability_available",
        title: "Mock template APIs are available",
        kind: "capability",
        severity: "info",
        scopes: ["doctor", "preflight"],
        capabilityMethods: ["listTemplates", "getTemplate", "createTemplate"],
      },
    ],
  },
} as const;

export function getProviderOnboardingSpec(
  providerId: string,
): ProviderOnboardingSpec | undefined {
  return providerOnboardingSpecs[providerId];
}

export function listProviderOnboardingSpecs(): ProviderOnboardingSpec[] {
  return Object.values(providerOnboardingSpecs);
}
