import type { ProviderOnboardingSpec } from "@k-msg/core";

export const providerOnboardingSpecs: Readonly<
  Record<string, ProviderOnboardingSpec>
> = {
  iwinv: {
    providerId: "iwinv",
    providerName: "IWINV Messaging Provider",
    channelOnboarding: "manual",
    templateLifecycleApi: "available",
    plusIdPolicy: "optional",
    plusIdInference: "unsupported",
    liveTestSupport: "supported",
    checks: [
      {
        id: "channel_registered_in_console",
        title: "Kakao channel is registered in IWINV console",
        description:
          "IWINV channel onboarding is manual. Confirm channel registration and approval in console.",
        kind: "manual",
        severity: "blocker",
        scopes: ["doctor", "preflight"],
        messageTypes: ["ALIMTALK"],
      },
      {
        id: "iwinv_config_required",
        title: "IWINV AlimTalk API key is configured",
        description:
          "AlimTalk needs `apiKey`. SMS/LMS/MMS-only configs can omit it and set `smsApiKey` and `smsAuthKey`.",
        kind: "config",
        severity: "blocker",
        scopes: ["preflight"],
        configKeys: ["apiKey"],
      },
      {
        id: "template_capability_available",
        title: "Template lifecycle APIs are available",
        kind: "capability",
        severity: "warning",
        scopes: ["doctor", "preflight"],
        messageTypes: ["ALIMTALK"],
        capabilityMethods: [
          "listTemplates",
          "getTemplate",
          "createTemplate",
          "updateTemplate",
          "deleteTemplate",
        ],
      },
      {
        id: "template_list_probe",
        title: "Template list API probe",
        kind: "api_probe",
        severity: "warning",
        scopes: ["doctor", "preflight"],
        messageTypes: ["ALIMTALK"],
        probeOperation: "list_templates",
      },
    ],
    notes: [
      "Channel add/auth is not available via IWINV public API in current integration.",
      "Template APIs are available and can be probed.",
      "AlimTalk variables are matched to the template's #{name} placeholders by name; the template body comes from providerOptions.templateContent or the template API.",
      "SMS/LMS/MMS-only use needs only smsApiKey and smsAuthKey; the AlimTalk apiKey is optional.",
    ],
  },
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
    plusIdPolicy: "required_if_no_inference",
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
      "SOLAPI ALIMTALK requires kakao profileId/pfId, but plusId inference is not available in current integration.",
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
