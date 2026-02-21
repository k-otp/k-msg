import { describe, expect, test } from "bun:test";
import { KakaoChannelBindingResolver } from "./kakao-channel-binding-resolver";

describe("KakaoChannelBindingResolver", () => {
  test("applies senderKey precedence: flag > alias > defaults > provider config", () => {
    const resolver = new KakaoChannelBindingResolver({
      routing: { defaultProviderId: "solapi-main" },
      defaults: {
        kakao: {
          senderKey: "defaults-sender",
        },
      },
      aliases: {
        kakaoChannels: {
          main: {
            providerId: "solapi-main",
            senderKey: "alias-sender",
          },
        },
      },
      providers: [
        {
          id: "solapi-main",
          type: "solapi",
          config: {
            kakaoPfId: "provider-pf-id",
          },
        },
      ],
    });

    const explicit = resolver.resolve({
      providerId: "solapi-main",
      channelAlias: "main",
      senderKey: "flag-sender",
    });
    expect(explicit.senderKey).toBe("flag-sender");
    expect(explicit.senderKeySource).toBe("explicit");

    const alias = resolver.resolve({ channelAlias: "main" });
    expect(alias.senderKey).toBe("alias-sender");
    expect(alias.senderKeySource).toBe("alias");

    const defaults = resolver.resolve({ providerId: "solapi-main" });
    expect(defaults.senderKey).toBe("defaults-sender");
    expect(defaults.senderKeySource).toBe("defaults");

    const providerOnly = new KakaoChannelBindingResolver({
      providers: [
        {
          id: "solapi-main",
          type: "solapi",
          config: {
            kakaoPfId: "provider-pf-id",
          },
        },
      ],
    }).resolve({ providerId: "solapi-main" });
    expect(providerOnly.senderKey).toBe("provider-pf-id");
    expect(providerOnly.senderKeySource).toBe("provider_config");
  });

  test("lists solapi config binding with source=config", () => {
    const resolver = new KakaoChannelBindingResolver({
      providers: [
        {
          id: "solapi-main",
          type: "solapi",
          config: {
            kakaoPfId: "solapi-pf",
          },
        },
      ],
    });

    const list = resolver.list({ providerId: "solapi-main" });

    expect(list).toHaveLength(1);
    expect(list[0]?.providerId).toBe("solapi-main");
    expect(list[0]?.senderKey).toBe("solapi-pf");
    expect(list[0]?.source).toBe("config");
  });

  test("throws for unknown alias when strictAlias=true", () => {
    const resolver = new KakaoChannelBindingResolver({
      aliases: {
        kakaoChannels: {
          main: {
            providerId: "mock",
            senderKey: "seed",
          },
        },
      },
    });

    expect(() =>
      resolver.resolve({ channelAlias: "missing", strictAlias: true }),
    ).toThrow("Unknown kakao channel alias: missing");
  });
});
