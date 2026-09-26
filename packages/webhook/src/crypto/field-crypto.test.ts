import { describe, expect, test } from "bun:test";
import type { FieldCryptoConfig } from "@k-msg/core";
import { createInMemoryWebhookPersistence } from "../runtime/persistence";
import { WebhookEventType } from "../types/webhook.types";
import {
  protectFieldValue,
  revealFieldValue,
  wrapWebhookEndpointStoreWithFieldCrypto,
} from "./field-crypto";

// Decrypts only with the exact AAD it encrypted with, as AES-GCM would.
function createAadBoundConfig(): FieldCryptoConfig {
  return {
    enabled: true,
    fields: { secret: "encrypt" },
    provider: {
      encrypt: async ({ value, aad }) => ({
        ciphertext: `enc:${JSON.stringify(aad)}:${value}`,
      }),
      decrypt: async ({ ciphertext, aad }) => {
        const prefix = `enc:${JSON.stringify(aad)}:`;
        if (!ciphertext.startsWith(prefix)) throw new Error("AAD mismatch");
        return ciphertext.slice(prefix.length);
      },
      hash: async ({ value }) => `h:${value}`,
    },
  };
}

const aad = { tableName: "webhook_endpoint", messageId: "ep-1" };

describe("webhook field crypto AAD", () => {
  test("binds ciphertext to the tenant when one is set", async () => {
    const config = createAadBoundConfig();
    const stored = await protectFieldValue(config, {
      value: "my-secret",
      path: "secret",
      aad,
      tenantId: "tenant-a",
    });

    expect(stored).toContain('"tenantId":"tenant-a"');
    expect(
      await revealFieldValue(config, {
        value: stored,
        path: "secret",
        aad,
        tenantId: "tenant-a",
      }),
    ).toBe("my-secret");
    await expect(
      revealFieldValue(config, {
        value: stored,
        path: "secret",
        aad,
        tenantId: "tenant-b",
      }),
    ).rejects.toMatchObject({ kind: "decrypt", fieldPath: "secret" });
  });

  test("still reads values written before tenant binding", async () => {
    const config = createAadBoundConfig();
    const legacy = await protectFieldValue(config, {
      value: "my-secret",
      path: "secret",
      aad,
    });

    expect(
      await revealFieldValue(config, {
        value: legacy,
        path: "secret",
        aad,
        tenantId: "tenant-a",
      }),
    ).toBe("my-secret");
  });
});

// Fails every encrypt and decrypt, as during a key service outage.
function createUnavailableConfig(
  openFallback: "null" | "masked",
): FieldCryptoConfig {
  return {
    enabled: true,
    fields: { secret: "encrypt" },
    failMode: "open",
    openFallback,
    provider: {
      encrypt: async () => {
        throw new Error("key service unavailable");
      },
      decrypt: async () => {
        throw new Error("key service unavailable");
      },
      hash: async ({ value }) => `h:${value}`,
    },
  };
}

describe("webhook endpoint store fail-open fallbacks", () => {
  const endpoint = {
    id: "ep-1",
    url: "https://example.com/hook",
    active: true,
    events: [WebhookEventType.MESSAGE_SENT],
    secret: "my-secret",
    createdAt: new Date(),
    updatedAt: new Date(),
    status: "active" as const,
  };

  test("stores no secret when encryption fails with the null fallback", async () => {
    const { endpointStore } = createInMemoryWebhookPersistence();
    const store = wrapWebhookEndpointStoreWithFieldCrypto(endpointStore, {
      endpoint: createUnavailableConfig("null"),
    });

    await store.add(endpoint);
    await store.update(endpoint.id, endpoint);

    const stored = await endpointStore.get(endpoint.id);
    expect(stored?.url).toBe(endpoint.url);
    expect(stored).not.toHaveProperty("secret");
    expect(await store.get(endpoint.id)).not.toHaveProperty("secret");
  });

  test("stores the masked secret when encryption fails with the masked fallback", async () => {
    const { endpointStore } = createInMemoryWebhookPersistence();
    const store = wrapWebhookEndpointStoreWithFieldCrypto(endpointStore, {
      endpoint: createUnavailableConfig("masked"),
    });

    await store.add(endpoint);

    const stored = await endpointStore.get(endpoint.id);
    expect(stored?.secret).toBeDefined();
    expect(stored?.secret).not.toBe(endpoint.secret);
  });

  test("returns no secret for one that cannot be decrypted with the null fallback", async () => {
    const { endpointStore } = createInMemoryWebhookPersistence();
    await endpointStore.add({ ...endpoint, secret: "enc:unreadable" });
    const store = wrapWebhookEndpointStoreWithFieldCrypto(endpointStore, {
      endpoint: createUnavailableConfig("null"),
    });

    expect(await store.get(endpoint.id)).not.toHaveProperty("secret");
  });
});
