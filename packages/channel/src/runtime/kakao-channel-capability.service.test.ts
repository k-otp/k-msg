import { describe, expect, test } from "bun:test";
import type { ProviderOnboardingSpec } from "@k-msg/core";
import { KakaoChannelCapabilityService } from "./kakao-channel-capability.service";
import type { KakaoChannelRuntimeProvider } from "./types";

function createSpec(input: {
  providerId: string;
  channelOnboarding: "api" | "manual" | "none";
}): ProviderOnboardingSpec {
  return {
    providerId: input.providerId,
    channelOnboarding: input.channelOnboarding,
    templateLifecycleApi: "available",
    plusIdPolicy: "optional",
    plusIdInference: "unsupported",
    checks: [],
  };
}

function withSpec(
  provider: KakaoChannelRuntimeProvider,
  spec: ProviderOnboardingSpec,
): KakaoChannelRuntimeProvider {
  return {
    ...provider,
    getOnboardingSpec: () => spec,
  };
}

describe("KakaoChannelCapabilityService", () => {
  test("resolves aligo as api mode", () => {
    const service = new KakaoChannelCapabilityService();
    const provider = withSpec(
      {
        id: "aligo-main",
        listKakaoChannels: async () =>
          ({
            isSuccess: true,
            isFailure: false,
            value: [],
          }) as const,
      },
      createSpec({ providerId: "aligo", channelOnboarding: "api" }),
    );

    const capability = service.resolve(provider);

    expect(capability.mode).toBe("api");
    expect(capability.providerType).toBe("aligo");
    expect(capability.supports.list).toBe(true);
  });

  test("resolves iwinv as manual mode", () => {
    const service = new KakaoChannelCapabilityService();
    const provider = withSpec(
      { id: "iwinv-main" },
      createSpec({ providerId: "iwinv", channelOnboarding: "manual" }),
    );

    const capability = service.resolve(provider);

    expect(capability.mode).toBe("manual");
    expect(capability.providerType).toBe("iwinv");
    expect(capability.supports.list).toBe(false);
  });

  test("resolves solapi as none mode", () => {
    const service = new KakaoChannelCapabilityService();
    const provider = withSpec(
      { id: "solapi-main" },
      createSpec({ providerId: "solapi", channelOnboarding: "none" }),
    );

    const capability = service.resolve(provider);

    expect(capability.mode).toBe("none");
    expect(capability.providerType).toBe("solapi");
  });

  test("falls back to api mode when spec is absent but list exists", () => {
    const service = new KakaoChannelCapabilityService();
    const provider: KakaoChannelRuntimeProvider = {
      id: "custom",
      listKakaoChannels: async () =>
        ({
          isSuccess: true,
          isFailure: false,
          value: [],
        }) as const,
    };

    const capability = service.resolve(provider);

    expect(capability.mode).toBe("api");
    expect(capability.providerType).toBeUndefined();
  });
});
