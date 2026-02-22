import { describe, expect, test } from "bun:test";
import type { FieldCryptoConfig } from "@k-msg/core";
import { WebhookEventType } from "../types/webhook.types";
import { WebhookRegistry } from "./webhook.registry";

function createConfig(
  patch: Partial<FieldCryptoConfig> = {},
): FieldCryptoConfig {
  return {
    enabled: true,
    fields: {
      secret: "encrypt",
    },
    provider: {
      encrypt: async ({ value }) => ({
        ciphertext: `enc:${value}`,
      }),
      decrypt: async ({ ciphertext }) => ciphertext.replace(/^enc:/, ""),
      hash: async ({ value }) => `h:${value}`,
    },
    ...patch,
  };
}

describe("WebhookRegistry field crypto", () => {
  test("constructor rejects fail-open plaintext without unsafe flag", () => {
    expect(
      () =>
        new WebhookRegistry({
          fieldCrypto: {
            endpoint: createConfig({
              failMode: "open",
              openFallback: "plaintext",
              unsafeAllowPlaintextStorage: false,
            }),
          },
        }),
    ).toThrow("openFallback=plaintext requires unsafeAllowPlaintextStorage=true");
  });

  test("constructor rejects invalid provider methods", () => {
    expect(
      () =>
        new WebhookRegistry({
          fieldCrypto: {
            endpoint: {
              enabled: true,
              fields: { secret: "encrypt" },
              provider: {
                encrypt: async ({ value }) => ({ ciphertext: value }),
                decrypt: async ({ ciphertext }) => ciphertext,
              } as never,
            },
          },
        }),
    ).toThrow("provider.hash must be a function");
  });

  test("endpoint secret and delivery payload are encrypted at rest and revealed on read", async () => {
    const registry = new WebhookRegistry({
      fieldCrypto: {
        endpoint: createConfig({
          fields: {
            secret: "encrypt",
          },
        }),
        delivery: createConfig({
          fields: {
            payload: "encrypt",
          },
        }),
      },
    });

    await registry.addEndpoint({
      id: "ep-1",
      url: "https://example.com/hook",
      active: true,
      events: [WebhookEventType.MESSAGE_SENT],
      secret: "my-secret",
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "active",
    });

    const endpoint = await registry.getEndpoint("ep-1");
    expect(endpoint?.secret).toBe("my-secret");

    await registry.addDelivery({
      id: "d-1",
      endpointId: "ep-1",
      eventId: "evt-1",
      eventType: WebhookEventType.MESSAGE_SENT,
      url: "https://example.com/hook",
      httpMethod: "POST",
      headers: { "content-type": "application/json" },
      payload: '{"message":"ok"}',
      attempts: [],
      status: "pending",
      createdAt: new Date(),
    });

    const deliveries = await registry.getDeliveries("ep-1");
    expect(deliveries).toHaveLength(1);
    expect(deliveries[0]?.payload).toBe('{"message":"ok"}');
  });
});
