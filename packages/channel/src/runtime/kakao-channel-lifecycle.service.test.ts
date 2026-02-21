import { describe, expect, test } from "bun:test";
import { ok } from "@k-msg/core";
import { KakaoChannelLifecycleService } from "./kakao-channel-lifecycle.service";
import type { KakaoChannelRuntimeProvider } from "./types";

function createSpec(input: {
  providerId: string;
  channelOnboarding: "api" | "manual" | "none";
}) {
  return {
    providerId: input.providerId,
    channelOnboarding: input.channelOnboarding,
    templateLifecycleApi: "available",
    plusIdPolicy: "optional",
    plusIdInference: "unsupported",
    checks: [],
  } as const;
}

describe("KakaoChannelLifecycleService", () => {
  test("lists channels through api adapter", async () => {
    const provider: KakaoChannelRuntimeProvider = {
      id: "aligo-main",
      getOnboardingSpec: () =>
        createSpec({ providerId: "aligo", channelOnboarding: "api" }),
      listKakaoChannels: async () =>
        ok([
          {
            providerId: "aligo-main",
            senderKey: "ALIGO_SENDER",
            plusId: "@brand",
          },
        ]),
      listKakaoChannelCategories: async () =>
        ok({
          first: [{ code: "001", name: "Health" }],
          second: [],
          third: [],
        }),
    };

    const service = new KakaoChannelLifecycleService(provider);

    const list = await service.list();
    expect(list.isSuccess).toBe(true);
    if (list.isSuccess) {
      expect(list.value[0]?.source).toBe("api");
      expect(list.value[0]?.senderKey).toBe("ALIGO_SENDER");
    }

    const categories = await service.categories();
    expect(categories.isSuccess).toBe(true);
  });

  test("returns standardized unsupported error for manual providers", async () => {
    const provider: KakaoChannelRuntimeProvider = {
      id: "iwinv-main",
      getOnboardingSpec: () =>
        createSpec({ providerId: "iwinv", channelOnboarding: "manual" }),
    };

    const service = new KakaoChannelLifecycleService(provider);

    const result = await service.list();
    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.code).toBe("INVALID_REQUEST");
      expect(result.error.message).toContain("manual Kakao channel onboarding");
    }
  });

  test("returns standardized unsupported error for none providers", async () => {
    const provider: KakaoChannelRuntimeProvider = {
      id: "solapi-main",
      getOnboardingSpec: () =>
        createSpec({ providerId: "solapi", channelOnboarding: "none" }),
    };

    const service = new KakaoChannelLifecycleService(provider);

    const result = await service.auth({
      plusId: "@brand",
      phoneNumber: "01012345678",
    });
    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.code).toBe("INVALID_REQUEST");
      expect(result.error.message).toContain(
        "does not expose Kakao channel onboarding API",
      );
    }
  });
});
