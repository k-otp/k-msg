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

  test("keeps an endpoint update made after the list and skips a removed endpoint", async () => {
    const persistence = await seedLegacyRecords();
    const listed = await persistence.endpointStore.get("ep-1");
    if (!listed) throw new Error("seeded endpoint missing");
    // Endpoint URLs are unique, so the copy gets its own.
    await persistence.endpointStore.add({
      ...listed,
      id: "ep-2",
      url: "https://example.com/copy",
    });
    const { endpointStore } = persistence;
    // Between the migration's list and its writes, ep-1 is updated and ep-2
    // is removed.
    const racing = {
      ...persistence,
      endpointStore: {
        ...endpointStore,
        get: endpointStore.get.bind(endpointStore),
        update: endpointStore.update.bind(endpointStore),
        list: async () => {
          const endpoints = await endpointStore.list();
          await endpointStore.update("ep-1", {
            ...listed,
            url: "https://example.com/moved",
          });
          await endpointStore.remove("ep-2");
          return endpoints;
        },
      },
    };

    expect(
      await migrateWebhookFieldCryptoToTenant(racing, tenantOptions),
    ).toEqual({ endpoints: 1, deliveries: 1 });
    const endpoints = wrapWebhookEndpointStoreWithFieldCrypto(
      endpointStore,
      tenantOptions,
    );
    expect(await endpoints.get("ep-1")).toMatchObject({
      url: "https://example.com/moved",
      secret: "my-secret",
    });
    expect(await endpointStore.get("ep-2")).toBeNull();
  });

  test("keeps an update another process makes while a secret is re-encrypted", async () => {
    const persistence = await seedLegacyRecords();
    const { endpointStore } = persistence;
    const legacyView = await wrapWebhookEndpointStoreWithFieldCrypto(
      endpointStore,
      { ...tenantOptions, acceptLegacyAad: true },
    ).get("ep-1");
    if (!legacyView) throw new Error("seeded endpoint missing");
    const upgraded = wrapWebhookEndpointStoreWithFieldCrypto(
      endpointStore,
      tenantOptions,
    );
    let reads = 0;
    const racing = {
      ...persistence,
      endpointStore: {
        ...endpointStore,
        list: endpointStore.list.bind(endpointStore),
        update: endpointStore.update.bind(endpointStore),
        get: async (id: string) => {
          const endpoint = await endpointStore.get(id);
          reads += 1;
          // After the migration's first read, an upgraded instance moves the
          // endpoint and rotates its secret.
          if (reads === 1) {
            await upgraded.update("ep-1", {
              ...legacyView,
              url: "https://example.com/moved",
              secret: "rotated",
            });
          }
          return endpoint;
        },
      },
    };

    expect(
      await migrateWebhookFieldCryptoToTenant(racing, tenantOptions),
    ).toEqual({ endpoints: 0, deliveries: 1 });
    expect(await upgraded.get("ep-1")).toMatchObject({
      url: "https://example.com/moved",
      secret: "rotated",
    });
  });

  test("gives up on an endpoint whose secret changes on every attempt", async () => {
    const persistence = await seedLegacyRecords();
    const { endpointStore } = persistence;
    const legacyStore = wrapWebhookEndpointStoreWithFieldCrypto(endpointStore, {
      ...tenantOptions,
      tenantId: undefined,
    });
    const seeded = await legacyStore.get("ep-1");
    if (!seeded) throw new Error("seeded endpoint missing");
    let reads = 0;
    const churning = {
      ...persistence,
      endpointStore: {
        ...endpointStore,
        list: endpointStore.list.bind(endpointStore),
        update: endpointStore.update.bind(endpointStore),
        get: async (id: string) => {
          const endpoint = await endpointStore.get(id);
          // An older instance writes a new tenant-less secret after each read.
          reads += 1;
          await legacyStore.update("ep-1", {
            ...seeded,
            secret: `legacy-${reads}`,
          });
          return endpoint;
        },
      },
    };

    await expect(
      migrateWebhookFieldCryptoToTenant(churning, tenantOptions),
    ).rejects.toThrow(
      "Cannot migrate webhook endpoint ep-1: its secret changed during each of 3 attempts",
    );
  });

  test("holds the runtime's endpoint writes until its migration finishes", async () => {
    const persistence = await seedLegacyRecords();
    const { endpointStore } = persistence;
    let pendingUpdate: Promise<unknown> | undefined;
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
      persistence: {
        ...persistence,
        endpointStore: {
          ...endpointStore,
          list: endpointStore.list.bind(endpointStore),
          get: endpointStore.get.bind(endpointStore),
          update: async (id, endpoint) => {
            // The migration's write: an update through the runtime starts
            // before it lands.
            if (!pendingUpdate) {
              pendingUpdate = runtime.updateEndpoint("ep-1", {
                url: "https://example.com/moved",
              });
              await new Promise((resolve) => setTimeout(resolve, 20));
            }
            await endpointStore.update(id, endpoint);
          },
        },
      },
      fieldCrypto: { ...tenantOptions, acceptLegacyAad: true },
      autoStart: false,
    });

    try {
      expect(await runtime.migrateFieldCryptoToTenant()).toEqual({
        endpoints: 1,
        deliveries: 1,
      });
      await pendingUpdate;
      expect(await runtime.getEndpoint("ep-1")).toMatchObject({
        url: "https://example.com/moved",
        secret: "my-secret",
      });
      const upgraded = wrapWebhookEndpointStoreWithFieldCrypto(
        endpointStore,
        tenantOptions,
      );
      expect((await upgraded.get("ep-1"))?.secret).toBe("my-secret");
    } finally {
      await runtime.shutdown();
    }
  });

  test("shuts down only after endpoint writes queued behind the migration", async () => {
    const persistence = await seedLegacyRecords();
    const { endpointStore } = persistence;
    const events: string[] = [];
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let migrating = true;
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
      persistence: {
        ...persistence,
        endpointStore: {
          ...endpointStore,
          list: endpointStore.list.bind(endpointStore),
          get: endpointStore.get.bind(endpointStore),
          update: async (id, endpoint) => {
            // The migration's write waits until shutdown has been called.
            if (migrating) {
              migrating = false;
              await gate;
            }
            await endpointStore.update(id, endpoint);
            events.push(`update ${endpoint.url}`);
          },
        },
        close: async () => {
          events.push("close");
        },
      },
      fieldCrypto: { ...tenantOptions, acceptLegacyAad: true },
      autoStart: false,
    });

    const migration = runtime.migrateFieldCryptoToTenant();
    const update = runtime.updateEndpoint("ep-1", {
      url: "https://example.com/moved",
    });
    const shutdown = runtime.shutdown();
    await new Promise((resolve) => setTimeout(resolve, 10));
    release();
    await Promise.all([migration, update, shutdown]);

    expect(events).toEqual([
      "update https://example.com/hook",
      "update https://example.com/moved",
      "close",
    ]);
  });

  test("refuses a delivery store without replace() before changing anything", async () => {
    const persistence = await seedLegacyRecords();
    const { deliveryStore } = persistence;
    const appendOnly = {
      ...persistence,
      deliveryStore: {
        add: deliveryStore.add.bind(deliveryStore),
        list: deliveryStore.list.bind(deliveryStore),
      },
    };
    const before = await persistence.endpointStore.get("ep-1");

    await expect(
      migrateWebhookFieldCryptoToTenant(appendOnly, tenantOptions),
    ).rejects.toThrow("needs a delivery store with replace()");
    expect(await persistence.endpointStore.get("ep-1")).toEqual(before);
  });

  function legacyDelivery(index: number) {
    return {
      id: `d-${String(index).padStart(4, "0")}`,
      endpointId: "ep-1",
      eventId: `evt-${index}`,
      eventType: WebhookEventType.MESSAGE_SENT,
      url: "https://example.com/hook",
      httpMethod: "POST" as const,
      headers: {},
      payload: `{"n":${index}}`,
      attempts: [],
      status: "success" as const,
      // Several deliveries share a timestamp, so the cursor must break ties.
      createdAt: new Date(Date.UTC(2026, 0, 1, 0, 0, Math.floor(index / 3))),
    };
  }

  test("migrates a delivery history larger than one page", async () => {
    const persistence = createInMemoryWebhookPersistence();
    const legacyStore = wrapWebhookDeliveryStoreWithFieldCrypto(
      persistence.deliveryStore,
      { ...tenantOptions, tenantId: undefined },
    );
    for (let index = 0; index < 450; index += 1) {
      await legacyStore.add(legacyDelivery(index));
    }

    expect(
      await migrateWebhookFieldCryptoToTenant(persistence, tenantOptions),
    ).toEqual({ endpoints: 0, deliveries: 450 });
    const deliveries = wrapWebhookDeliveryStoreWithFieldCrypto(
      persistence.deliveryStore,
      tenantOptions,
    );
    const read = await deliveries.list({ limit: 1000 });
    expect(read).toHaveLength(450);
    expect(new Set(read.map((delivery) => delivery.payload)).size).toBe(450);
  });

  test("refuses a delivery store that ignores the page cursor", async () => {
    const persistence = createInMemoryWebhookPersistence();
    const legacyStore = wrapWebhookDeliveryStoreWithFieldCrypto(
      persistence.deliveryStore,
      { ...tenantOptions, tenantId: undefined },
    );
    for (let index = 0; index < 250; index += 1) {
      await legacyStore.add(legacyDelivery(index));
    }
    const { deliveryStore } = persistence;
    const replace = deliveryStore.replace?.bind(deliveryStore);
    if (!replace) throw new Error("the in-memory store replaces deliveries");
    const cursorBlind = {
      ...persistence,
      deliveryStore: {
        add: deliveryStore.add.bind(deliveryStore),
        replace,
        list: (options?: { limit?: number }) =>
          deliveryStore.list({ limit: options?.limit }),
      },
    };

    await expect(
      migrateWebhookFieldCryptoToTenant(cursorBlind, tenantOptions),
    ).rejects.toThrow("honors the `before` cursor");
  });

  test("binds the tenant id exactly as configured", async () => {
    const persistence = await seedLegacyRecords();
    const spaced = { ...tenantOptions, tenantId: " tenant-a " };

    await migrateWebhookFieldCryptoToTenant(persistence, spaced);

    const endpoints = wrapWebhookEndpointStoreWithFieldCrypto(
      persistence.endpointStore,
      spaced,
    );
    expect((await endpoints.get("ep-1"))?.secret).toBe("my-secret");
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
