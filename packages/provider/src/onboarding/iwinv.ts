import type { ProviderOnboardingSpec } from "@k-msg/core";

/**
 * IWINV's onboarding spec. It has a module of its own so the IWINV entry
 * points read it without bundling every provider's spec.
 */
export const iwinvOnboardingSpec: ProviderOnboardingSpec = {
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
      id: "rcs_brand_template_approved",
      title:
        "RCS brand, template and sender are approved for the IWINV RCS account",
      description:
        "IWINV RCS onboarding is manual: register the RCS account (RCS ID and brand key) in the IWINV console after delegating the brand to IWINV's agency in RCS Biz Center, then get the template approved. RCS_TPL sends need `rcsApiKey`, a brand id and an approved template.",
      kind: "manual",
      severity: "blocker",
      scopes: ["doctor", "preflight"],
      messageTypes: ["RCS_TPL"],
    },
    {
      id: "rcs_send_ip_registered",
      title: "Sending IP is registered for the IWINV RCS account",
      description:
        "IWINV refuses RCS sends from IPs not listed under the RCS account's sending IPs (code 206).",
      kind: "manual",
      severity: "blocker",
      scopes: ["doctor", "preflight"],
      messageTypes: ["RCS_TPL"],
    },
    {
      id: "iwinv_config_required",
      title: "IWINV AlimTalk API key is configured",
      description:
        "AlimTalk needs `apiKey`. SMS/LMS/MMS-only configs can omit it and set `smsApiKey` and `smsAuthKey`; RCS needs `rcsApiKey`.",
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
    "RCS is template-only (RCS_TPL) and uses its own rcsApiKey; IWINV's send answer has no message key, so delivery status is looked up by brand, template, recipient and request time.",
  ],
};
