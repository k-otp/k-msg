import { describe, expect, test } from "bun:test";
import type { ProviderOnboardingSpec } from "@k-msg/core";
import {
  runAlimTalkPreflight,
  runProviderDoctor,
} from "./onboarding";
import type { ProviderWithCapabilities } from "./providers/registry";
import type { Runtime } from "./runtime";

function createRuntime(
  configOverrides?: Record<string, unknown>,
): Runtime {
  return {
    config: {
      version: 1,
      providers: [],
      ...(configOverrides ?? {}),
    } as Runtime["config"],
    configPath: "/tmp/k-msg.config.json",
    kmsg: {} as Runtime["kmsg"],
    providers: [],
    providersById: new Map(),
  };
}

function createProvider(
  input: Partial<ProviderWithCapabilities> & {
    getOnboardingSpec?: () => ProviderOnboardingSpec;
    id: string;
    name: string;
    supportedTypes: ProviderWithCapabilities["supportedTypes"];
  },
): ProviderWithCapabilities {
  return {
    async healthCheck() {
      return { healthy: true };
    },
    async send() {
      throw new Error("not used");
    },
    ...input,
  } as ProviderWithCapabilities;
}

describe("onboarding guidance", () => {
  test("provider doctor annotates manual prerequisites as evidence-driven checks", async () => {
    const provider = createProvider({
      id: "iwinv",
      name: "IWINV Messaging Provider",
      supportedTypes: ["ALIMTALK", "SMS", "LMS", "MMS"],
      getOnboardingSpec() {
        return {
          providerId: "iwinv",
          providerName: "IWINV Messaging Provider",
          channelOnboarding: "manual",
          templateLifecycleApi: "available",
          plusIdPolicy: "optional",
          plusIdInference: "unsupported",
          checks: [
            {
              id: "channel_registered_in_console",
              title: "Kakao channel is registered in IWINV console",
              kind: "manual",
              severity: "blocker",
              scopes: ["doctor"],
            },
          ],
        };
      },
    });

    const result = await runProviderDoctor({
      provider,
      runtime: createRuntime({
        providers: [
          {
            type: "iwinv",
            id: "iwinv",
            config: {
              apiKey: "env:IWINV_API_KEY",
            },
          },
        ],
        onboarding: {
          manualChecks: {
            iwinv: {
              channel_registered_in_console: {
                done: false,
              },
            },
          },
        },
      }),
    });

    const manual = result.checks.find(
      (check) => check.id === "channel_registered_in_console",
    );
    expect(manual?.reason).toContain("vendor console prerequisite");
    expect(manual?.nextAction).toContain(
      "onboarding.manualChecks.iwinv.channel_registered_in_console.done=true",
    );

    const sender = result.checks.find(
      (check) => check.id === "sms_lms_sender_config",
    );
    expect(sender?.reason).toContain("fallback sender config is missing");
    expect(sender?.nextAction).toContain("iwinv.config.senderNumber");
  });

  test("alimtalk preflight annotates ambiguous plusId inference", async () => {
    const provider = createProvider({
      id: "aligo",
      name: "Aligo Smart SMS",
      supportedTypes: ["ALIMTALK", "SMS", "LMS", "MMS"],
      async getTemplate() {
        return {
          isSuccess: true,
          isFailure: false,
          value: {
            id: "TPL_001",
          },
        } as Awaited<ReturnType<NonNullable<ProviderWithCapabilities["getTemplate"]>>>;
      },
      getOnboardingSpec() {
        return {
          providerId: "aligo",
          providerName: "Aligo Smart SMS",
          channelOnboarding: "api",
          templateLifecycleApi: "available",
          plusIdPolicy: "required_if_no_inference",
          plusIdInference: "supported",
          checks: [],
        };
      },
      async listKakaoChannels() {
        return {
          isSuccess: true,
          isFailure: false,
          value: [
            { plusId: "@one" },
            { plusId: "@two" },
          ],
        } as Awaited<
          ReturnType<NonNullable<ProviderWithCapabilities["listKakaoChannels"]>>
        >;
      },
    });

    const result = await runAlimTalkPreflight({
      plusId: undefined,
      provider,
      runtime: createRuntime(),
      senderKey: "ALIGO_PROFILE",
      templateId: "TPL_001",
    });

    const plusIdPolicy = result.checks.find(
      (check) => check.id === "plus_id_policy",
    );
    expect(plusIdPolicy?.status).toBe("fail");
    expect(plusIdPolicy?.details?.reasonCode).toBe("ambiguous_candidates");
    expect(plusIdPolicy?.reason).toContain("multiple plusId candidates");
    expect(plusIdPolicy?.nextAction).toContain(
      "provider-scoped Kakao channel alias",
    );
  });
});
