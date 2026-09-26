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

  test("skips aliases bound to another provider", () => {
    // Shaped like `k-msg config init --template full`: the default channel
    // alias belongs to aligo.
    const aligo = {
      id: "aligo",
      type: "aligo",
      config: { senderKey: "aligo-config-sender" },
    };
    const config = {
      defaults: { kakao: { channel: "main" } },
      aliases: {
        kakaoChannels: {
          main: {
            providerId: "aligo",
            senderKey: "aligo-sender",
            plusId: "@aligo",
            name: "Main Channel",
          },
        },
      },
      providers: [
        aligo,
        { id: "solapi", type: "solapi", config: { kakaoPfId: "solapi-pf-id" } },
      ],
    };
    const resolver = new KakaoChannelBindingResolver(config);

    const solapi = resolver.resolve({ providerId: "solapi" });
    expect(solapi.senderKey).toBe("solapi-pf-id");
    expect(solapi.senderKeySource).toBe("provider_config");
    expect(solapi.plusId).toBeUndefined();
    expect(solapi.name).toBeUndefined();

    const namedAlias = resolver.resolve({
      providerId: "solapi",
      channelAlias: "main",
      strictAlias: true,
    });
    expect(namedAlias.senderKey).toBe("solapi-pf-id");
    expect(namedAlias.senderKeySource).toBe("provider_config");
    expect(namedAlias.plusId).toBeUndefined();

    // Without a pfId of its own, SOLAPI gets no sender key rather than
    // aligo's.
    const withoutPfId = new KakaoChannelBindingResolver({
      ...config,
      providers: [aligo, { id: "solapi", type: "solapi", config: {} }],
    }).resolve({ providerId: "solapi" });
    expect(withoutPfId.senderKey).toBeUndefined();
    expect(withoutPfId.senderKeySource).toBeUndefined();

    const ownProvider = resolver.resolve({ providerId: "aligo" });
    expect(ownProvider.senderKey).toBe("aligo-sender");
    expect(ownProvider.senderKeySource).toBe("defaults");
    expect(ownProvider.plusId).toBe("@aligo");
    expect(ownProvider.name).toBe("Main Channel");
  });

  test("does not fill a named alias from another provider's default alias", () => {
    const resolver = new KakaoChannelBindingResolver({
      defaults: { kakao: { channel: "main" } },
      aliases: {
        kakaoChannels: {
          main: {
            providerId: "aligo",
            senderKey: "aligo-sender",
            plusId: "@aligo",
          },
          promo: { providerId: "solapi", plusId: "@promo" },
        },
      },
      providers: [
        { id: "aligo", type: "aligo", config: {} },
        { id: "solapi", type: "solapi", config: { kakaoPfId: "solapi-pf-id" } },
      ],
    });

    const promo = resolver.resolve({ channelAlias: "promo" });

    expect(promo.providerId).toBe("solapi");
    expect(promo.providerIdSource).toBe("alias");
    expect(promo.senderKey).toBe("solapi-pf-id");
    expect(promo.senderKeySource).toBe("provider_config");
    expect(promo.plusId).toBe("@promo");
    expect(promo.plusIdSource).toBe("alias");
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
