import { describe, expect, test } from "bun:test";
import type { FieldCryptoConfig } from "@k-msg/core";
import { createInMemoryWebhookPersistence } from "../runtime/persistence";
import type { WebhookRuntimeFieldCryptoOptions } from "../runtime/types";
import { WebhookRuntimeService } from "../runtime/webhook-runtime.service";
import { WebhookEventType } from "../types/webhook.types";
import {
  migrateWebhookFieldCryptoToTenant,
  protectFieldValue,
  revealFieldValue,
  wrapWebhookDeliveryStoreWithFieldCrypto,
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

  test("reads values written before tenant binding only when asked to", async () => {
    const config = createAadBoundConfig();
    const legacy = await protectFieldValue(config, {
      value: "my-secret",
      path: "secret",
      aad,
    });

    await expect(
      revealFieldValue(config, {
        value: legacy,
        path: "secret",
        aad,
        tenantId: "tenant-a",
      }),
    ).rejects.toMatchObject({ kind: "decrypt", fieldPath: "secret" });
    expect(
      await revealFieldValue(config, {
        value: legacy,
        path: "secret",
        aad,
        tenantId: "tenant-a",
        acceptLegacyAad: true,
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

describe("migrateWebhookFieldCryptoToTenant", () => {
  const endpointConfig = createAadBoundConfig();
  const deliveryConfig = {
    ...createAadBoundConfig(),
    fields: { payload: "encrypt" as const },
  };
  const tenantOptions: WebhookRuntimeFieldCryptoOptions = {
    tenantId: "tenant-a",
    endpoint: endpointConfig,
    delivery: deliveryConfig,
  };

  // Stores an endpoint and a delivery as a runtime did before tenant binding.
  async function seedLegacyRecords() {
    const persistence = createInMemoryWebhookPersistence();
    const legacyOptions = { ...tenantOptions, tenantId: undefined };
    await wrapWebhookEndpointStoreWithFieldCrypto(
      persistence.endpointStore,
      legacyOptions,
    ).add({
      id: "ep-1",
      url: "https://example.com/hook",
      active: true,
      events: [WebhookEventType.MESSAGE_SENT],
      secret: "my-secret",
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "active",
    });
    await wrapWebhookDeliveryStoreWithFieldCrypto(
      persistence.deliveryStore,
      legacyOptions,
    ).add({
      id: "d-1",
      endpointId: "ep-1",
      eventId: "evt-1",
      eventType: WebhookEventType.MESSAGE_SENT,
      url: "https://example.com/hook",
      httpMethod: "POST",
      headers: { "content-type": "application/json" },
      payload: '{"message":"ok"}',
      attempts: [],
      status: "success",
      createdAt: new Date(),
    });
    return persistence;
  }

  test("re-encrypts legacy secrets and payloads with the tenant, once", async () => {
    const persistence = await seedLegacyRecords();

    expect(
      await migrateWebhookFieldCryptoToTenant(persistence, tenantOptions),
    ).toEqual({ endpoints: 1, deliveries: 1 });

    const stored = await persistence.endpointStore.get("ep-1");
    expect(stored?.secret).toContain('"tenantId":"tenant-a"');
    const endpoints = wrapWebhookEndpointStoreWithFieldCrypto(
      persistence.endpointStore,
      tenantOptions,
    );
    expect((await endpoints.get("ep-1"))?.secret).toBe("my-secret");
    const deliveries = wrapWebhookDeliveryStoreWithFieldCrypto(
      persistence.deliveryStore,
      tenantOptions,
    );
    expect((await deliveries.list())[0]?.payload).toBe('{"message":"ok"}');

    expect(
      await migrateWebhookFieldCryptoToTenant(persistence, tenantOptions),
    ).toEqual({ endpoints: 0, deliveries: 0 });
  });

  test("stops at a value neither AAD decrypts instead of storing a fallback", async () => {
    const persistence = await seedLegacyRecords();
    const endpoint = await persistence.endpointStore.get("ep-1");
    if (!endpoint) throw new Error("seeded endpoint missing");
    await persistence.endpointStore.update("ep-1", {
      ...endpoint,
      secret: "unreadable",
    });

    await expect(
      migrateWebhookFieldCryptoToTenant(persistence, {
        ...tenantOptions,
        endpoint: {
          ...endpointConfig,
          failMode: "open",
          openFallback: "masked",
        },
      }),
    ).rejects.toThrow("Cannot migrate webhook endpoint ep-1");
    expect((await persistence.endpointStore.get("ep-1"))?.secret).toBe(
      "unreadable",
    );
  });

  test("requires the tenant to bind to", async () => {
    await expect(
      migrateWebhookFieldCryptoToTenant(createInMemoryWebhookPersistence(), {
        endpoint: endpointConfig,
      }),
    ).rejects.toThrow("requires fieldCrypto.tenantId");
  });

  test("runs from the runtime against its own stores", async () => {
    const persistence = await seedLegacyRecords();
    const runtime = new WebhookRuntimeService({
      delivery: {
        maxRetries: 0,
        retryDelayMs: 10,
        timeoutMs: 500,
        enableSecurity: false,
        enabledEvents: [WebhookEventType.MESSAGE_SENT],
        batchSize: 10,
        batchTimeoutMs: 50,
      },
      persistence,
      fieldCrypto: tenantOptions,
      autoStart: false,
    });

    try {
      await expect(runtime.getEndpoint("ep-1")).rejects.toMatchObject({
        kind: "decrypt",
      });
      expect(await runtime.migrateFieldCryptoToTenant()).toEqual({
        endpoints: 1,
        deliveries: 1,
      });
      expect((await runtime.getEndpoint("ep-1"))?.secret).toBe("my-secret");
    } finally {
      await runtime.shutdown();
    }
  });
});
