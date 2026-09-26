import { describe, expect, test } from "bun:test";
import { type FieldCryptoConfig, FieldCryptoError } from "@k-msg/core";
import { type WebhookEndpoint, WebhookEventType } from "../types/webhook.types";
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
    ).toThrow(
      "openFallback=plaintext requires unsafeAllowPlaintextStorage=true",
    );
  });

  test("names the field when the provider fails with a plain error", async () => {
    const registry = new WebhookRegistry({
      fieldCrypto: {
        delivery: createConfig({
          fields: { payload: "encrypt" },
          provider: {
            encrypt: async () => {
              throw new Error("kms unavailable");
            },
            decrypt: async ({ ciphertext }) => ciphertext,
            hash: async ({ value }) => `h:${value}`,
          },
        }),
      },
    });

    await expect(
      registry.addDelivery({
        id: "dl-1",
        endpointId: "ep-1",
        eventId: "ev-1",
        eventType: WebhookEventType.MESSAGE_SENT,
        url: "https://example.com/hook",
        httpMethod: "POST",
        headers: {},
        payload: '{"a":1}',
        attempts: [],
        status: "pending",
        createdAt: new Date(),
      }),
    ).rejects.toMatchObject({
      kind: "encrypt",
      fieldPath: "payload",
      details: { cause: "kms unavailable" },
    });
  });

  test("keeps a provider FieldCryptoError's metadata while naming the field", async () => {
    const registry = new WebhookRegistry({
      fieldCrypto: {
        endpoint: createConfig({
          provider: {
            encrypt: async () => {
              throw new FieldCryptoError(
                "encrypt",
                "kms throttled",
                { reason: "throttled" },
                { retryAfterMs: 5000, attempt: 2 },
              );
            },
            decrypt: async ({ ciphertext }) => ciphertext,
            hash: async ({ value }) => `h:${value}`,
          },
        }),
      },
    });

    await expect(
      registry.addEndpoint({
        id: "ep-throttled",
        url: "https://example.com/hook",
        active: true,
        events: [WebhookEventType.MESSAGE_SENT],
        secret: "my-secret",
        createdAt: new Date(),
        updatedAt: new Date(),
        status: "active",
      }),
    ).rejects.toMatchObject({
      kind: "encrypt",
      message: "kms throttled",
      details: { reason: "throttled" },
      retryAfterMs: 5000,
      attempt: 2,
      fieldPath: "secret",
    });
  });

  test("constructor rejects a misspelled failMode", () => {
    expect(
      () =>
        new WebhookRegistry({
          fieldCrypto: {
            endpoint: createConfig({ failMode: "close" as never }),
          },
        }),
    ).toThrow("unsupported failMode: close");
  });

  test("an envelope from another version is rejected before it is stored", async () => {
    const registry = new WebhookRegistry({
      fieldCrypto: {
        endpoint: createConfig({
          provider: {
            encrypt: async () => ({
              ciphertext: {
                v: 2,
                alg: "X",
                kid: "k",
                iv: "i",
                tag: "t",
                ct: "c",
              },
            }),
            decrypt: async ({ ciphertext }) => ciphertext,
            hash: async ({ value }) => `h:${value}`,
          },
        }),
      },
    });

    await expect(
      registry.addEndpoint({
        id: "ep-v2",
        url: "https://example.com/hook",
        active: true,
        events: [WebhookEventType.MESSAGE_SENT],
        secret: "my-secret",
        createdAt: new Date(),
        updatedAt: new Date(),
        status: "active",
      }),
    ).rejects.toMatchObject({
      message: expect.stringContaining(
        "ciphertext envelope must be v1 A256GCM",
      ),
      fieldPath: "secret",
      details: expect.objectContaining({ shapeValid: true, v: 2 }),
    });
  });

  test.each([
    ["endpoint", { secret: "mask" }, 'fields.secret must be "encrypt"'],
    ["endpoint", { secret: "plain" }, 'fields.secret must be "encrypt"'],
    ["delivery", { payload: "plain" }, 'fields.payload must be "encrypt"'],
  ] as const)(
    "constructor rejects %s fields %o that the storage would not honor",
    (target, fields, message) => {
      expect(
        () =>
          new WebhookRegistry({
            fieldCrypto: { [target]: createConfig({ fields }) },
          }),
      ).toThrow(message);
    },
  );

  test("constructor requires the field the store encrypts", () => {
    expect(
      () =>
        new WebhookRegistry({
          fieldCrypto: {
            endpoint: createConfig({ fields: { payload: "encrypt" } }),
          },
        }),
    ).toThrow('set fields.secret to "encrypt" or "encrypt+hash"');
  });

  test("constructor accepts either encrypt mode", () => {
    expect(
      () =>
        new WebhookRegistry({
          fieldCrypto: {
            endpoint: createConfig({ fields: { secret: "encrypt+hash" } }),
            delivery: createConfig({ fields: { payload: "encrypt" } }),
          },
        }),
    ).not.toThrow();
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
                encrypt: async ({ value }: { value: string }) => ({
                  ciphertext: value,
                }),
                decrypt: async ({ ciphertext }: { ciphertext: string }) =>
                  ciphertext,
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
  test("does not keep the plaintext secret when encryption fails with the null fallback", async () => {
    const unavailable = async () => {
      throw new Error("key service unavailable");
    };
    const registry = new WebhookRegistry({
      fieldCrypto: {
        endpoint: createConfig({
          failMode: "open",
          openFallback: "null",
          provider: {
            encrypt: unavailable,
            decrypt: unavailable,
            hash: async ({ value }) => `h:${value}`,
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
    expect(endpoint?.url).toBe("https://example.com/hook");
    expect(endpoint).not.toHaveProperty("secret");
  });

  test("stores and returns a secret exactly as given", async () => {
    const registry = new WebhookRegistry({
      fieldCrypto: { endpoint: createConfig() },
    });

    await registry.addEndpoint(createEndpoint(" my-secret "));

    expect((await registry.getEndpoint("ep-1"))?.secret).toBe(" my-secret ");
  });
});

// Fails encrypt or decrypt while the matching switch is on, as during a key
// service outage.
function createSwitchableConfig(patch: Partial<FieldCryptoConfig> = {}) {
  const outage = { encrypt: false, decrypt: false };
  const config = createConfig({
    failMode: "open",
    openFallback: "masked",
    provider: {
      encrypt: async ({ value }) => {
        if (outage.encrypt) throw new Error("key service unavailable");
        return { ciphertext: `enc:${value}` };
      },
      decrypt: async ({ ciphertext }) => {
        if (outage.decrypt) throw new Error("key service unavailable");
        return ciphertext.replace(/^enc:/, "");
      },
      hash: async ({ value }) => `h:${value}`,
    },
    ...patch,
  });
  return { config, outage };
}

function createEndpoint(secret: string): WebhookEndpoint {
  return {
    id: "ep-1",
    url: "https://example.com/hook",
    active: true,
    events: [WebhookEventType.MESSAGE_SENT],
    secret,
    createdAt: new Date(),
    updatedAt: new Date(),
    status: "active",
  };
}

describe("WebhookRegistry with a secret it cannot decrypt", () => {
  test.each(["masked", "null"] as const)(
    "returns the endpoint without it, not its %s fallback",
    async (openFallback) => {
      const { config, outage } = createSwitchableConfig({ openFallback });
      const registry = new WebhookRegistry({
        fieldCrypto: { endpoint: config },
      });
      await registry.addEndpoint(createEndpoint("my-secret"));
      outage.decrypt = true;

      const endpoint = await registry.getEndpoint("ep-1");
      const [listed] = await registry.listEndpoints();

      expect(endpoint?.url).toBe("https://example.com/hook");
      expect(endpoint).not.toHaveProperty("secret");
      expect(listed).not.toHaveProperty("secret");
    },
  );

  test("keeps the stored secret when the endpoint read without it is updated", async () => {
    const { config, outage } = createSwitchableConfig();
    const registry = new WebhookRegistry({ fieldCrypto: { endpoint: config } });
    await registry.addEndpoint(createEndpoint("my-secret"));
    outage.decrypt = true;
    const read = await registry.getEndpoint("ep-1");
    if (!read) throw new Error("endpoint missing");

    await registry.updateEndpoint("ep-1", { ...read, name: "renamed" });

    outage.decrypt = false;
    expect(await registry.getEndpoint("ep-1")).toMatchObject({
      name: "renamed",
      secret: "my-secret",
    });
  });

  test("keeps the stored secret when an endpoint read before the outage is updated", async () => {
    const { config, outage } = createSwitchableConfig();
    const registry = new WebhookRegistry({ fieldCrypto: { endpoint: config } });
    await registry.addEndpoint(createEndpoint("my-secret"));
    const read = await registry.getEndpoint("ep-1");
    if (!read) throw new Error("endpoint missing");
    outage.encrypt = true;
    outage.decrypt = true;

    await registry.updateEndpoint("ep-1", { ...read, name: "renamed" });

    outage.encrypt = false;
    outage.decrypt = false;
    expect(await registry.getEndpoint("ep-1")).toMatchObject({
      name: "renamed",
      secret: "my-secret",
    });
  });

  test("removes the secret when an update sets it to undefined", async () => {
    const { config, outage } = createSwitchableConfig();
    const registry = new WebhookRegistry({ fieldCrypto: { endpoint: config } });
    await registry.addEndpoint(createEndpoint("my-secret"));
    outage.decrypt = true;
    const read = await registry.getEndpoint("ep-1");
    if (!read) throw new Error("endpoint missing");

    await registry.updateEndpoint("ep-1", { ...read, secret: undefined });

    outage.decrypt = false;
    expect((await registry.getEndpoint("ep-1"))?.secret).toBeUndefined();
  });

  test("keeps the stored secret when an update cannot encrypt it again", async () => {
    const { config, outage } = createSwitchableConfig();
    const registry = new WebhookRegistry({ fieldCrypto: { endpoint: config } });
    await registry.addEndpoint(createEndpoint("my-secret"));
    const read = await registry.getEndpoint("ep-1");
    if (!read) throw new Error("endpoint missing");
    outage.encrypt = true;

    await registry.updateEndpoint("ep-1", { ...read, name: "renamed" });

    outage.encrypt = false;
    expect(await registry.getEndpoint("ep-1")).toMatchObject({
      name: "renamed",
      secret: "my-secret",
    });
  });
});
