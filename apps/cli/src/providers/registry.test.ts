import { describe, expect, test } from "bun:test";
import {
  ok,
  type Provider,
  type ProviderHealthStatus,
  type SendOptions,
} from "@k-msg/core";
import type { KMsgCliConfig } from "../config/schema";
import { createProviders, createProvidersWithLoaders } from "./registry";

class FakeSolapiProvider implements Provider {
  readonly id = "solapi";
  readonly name = "Fake Solapi Provider";
  readonly supportedTypes = ["SMS"] as const;

  async healthCheck(): Promise<ProviderHealthStatus> {
    return { healthy: true, issues: [] };
  }

  async send(_params: SendOptions) {
    return ok({
      messageId: "msg-1",
      providerId: this.id,
      status: "SENT" as const,
      type: "SMS" as const,
      to: "01000000000",
    });
  }
}

function createConfig(providers: KMsgCliConfig["providers"]): KMsgCliConfig {
  return {
    version: 1,
    providers,
  };
}

describe("provider registry", () => {
  test("does not load solapi provider when config excludes solapi", async () => {
    let loadCalls = 0;
    const providers = await createProvidersWithLoaders(
      createConfig([
        {
          type: "iwinv",
          id: "iwinv-main",
          config: { apiKey: "test-key" },
        },
      ]),
      {
        loadSolapiProvider: async () => {
          loadCalls += 1;
          return FakeSolapiProvider;
        },
      },
    );

    expect(loadCalls).toBe(0);
    expect(providers[0]?.id).toBe("iwinv-main");
  });

  test("loads solapi provider lazily when selected", async () => {
    let loadCalls = 0;
    const providers = await createProvidersWithLoaders(
      createConfig([
        {
          type: "solapi",
          id: "solapi-main",
          config: {
            apiKey: "test-api-key",
            apiSecret: "test-api-secret",
          },
        },
      ]),
      {
        loadSolapiProvider: async () => {
          loadCalls += 1;
          return FakeSolapiProvider;
        },
      },
    );

    expect(loadCalls).toBe(1);
    expect(providers[0]?.id).toBe("solapi-main");
    expect(providers[0]?.name).toBe("Fake Solapi Provider");
  });

  test("throws install guidance when solapi loading fails", async () => {
    await expect(
      createProvidersWithLoaders(
        createConfig([
          {
            type: "solapi",
            id: "solapi-main",
            config: {
              apiKey: "test-api-key",
              apiSecret: "test-api-secret",
            },
          },
        ]),
        {
          loadSolapiProvider: async () => {
            throw new Error("Cannot find module 'solapi'");
          },
        },
      ),
    ).rejects.toThrow("bun add solapi");
  });

  test("preserves provider capabilities when wrapping provider id", async () => {
    const [provider] = await createProviders(
      createConfig([
        {
          type: "aligo",
          id: "aligo-main",
          config: { apiKey: "test-api-key", userId: "test-user" },
        },
      ]),
    );

    expect(provider?.id).toBe("aligo-main");
    expect(typeof provider?.createTemplate).toBe("function");
    expect(typeof provider?.requestTemplateInspection).toBe("function");
    expect(typeof provider?.listKakaoChannels).toBe("function");
  });
});
