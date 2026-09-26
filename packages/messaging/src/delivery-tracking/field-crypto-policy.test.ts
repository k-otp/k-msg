import { Database } from "bun:sqlite";
import { describe, expect, test } from "bun:test";
import {
  createAesGcmFieldCryptoProvider,
  createStaticKeyResolver,
  type FieldCryptoConfig,
  FieldCryptoError,
  type FieldCryptoProvider,
} from "@k-msg/core";
import { HyperdriveDeliveryTrackingStore } from "../adapters/cloudflare/hyperdrive-delivery-tracking.store";
import { CloudflareObjectDeliveryTrackingStore } from "../adapters/cloudflare/object-delivery-tracking.store";
import type { CloudflareSqlClient } from "../adapters/cloudflare/sql-client";
import {
  applyTrackingCryptoOnWrite,
  normalizeTrackingFilterWithHashes,
} from "./field-crypto";
import type {
  DeliveryTrackingFieldCryptoOptions,
  DeliveryTrackingStore,
} from "./store.interface";
import type { TrackingRecord } from "./types";

function createConfig(
  patch: Partial<FieldCryptoConfig> = {},
): FieldCryptoConfig {
  return {
    enabled: true,
    fields: {
      to: "encrypt+hash",
      from: "encrypt+hash",
    },
    provider: {
      encrypt: async ({ value }) => ({ ciphertext: value }),
      decrypt: async ({ ciphertext }) => ciphertext,
      hash: async ({ value }) => `h:${value}`,
    },
    ...patch,
  };
}

function createRecord(): TrackingRecord {
  const now = new Date();
  return {
    messageId: "m-1",
    providerId: "p-1",
    providerMessageId: "pm-1",
    type: "SMS",
    to: "01012345678",
    from: "01011112222",
    requestedAt: now,
    status: "SENT",
    statusUpdatedAt: now,
    attemptCount: 0,
    nextCheckAt: now,
  };
}

describe("delivery tracking field crypto policy", () => {
  test("object store fails fast when secure mode is enabled and lookup fields are plain", () => {
    const badConfig = createConfig({
      fields: {
        to: "plain",
        from: "encrypt+hash",
      },
    });

    expect(
      () =>
        new CloudflareObjectDeliveryTrackingStore({} as never, {
          secureMode: true,
          compatPlainColumns: false,
          fieldCrypto: {
            config: badConfig,
          },
        }),
    ).toThrow("secure mode requires non-plain policy for `to`");
  });

  test("sql store fails fast when secure schema is enabled without fieldCrypto config", () => {
    expect(
      () =>
        new HyperdriveDeliveryTrackingStore(
          {
            dialect: "sqlite",
            query: async () => ({ rows: [] }),
          } as never,
          {
            tableName: "kmsg_delivery_tracking",
            fieldCryptoSchema: {
              enabled: true,
              mode: "secure",
              compatPlainColumns: false,
            },
          },
        ),
    ).toThrow(
      "fieldCrypto config is required when fieldCryptoSchema is enabled",
    );
  });

  test("a misspelled failMode is rejected instead of failing open", async () => {
    const config = createConfig({
      failMode: "close" as never,
      provider: {
        encrypt: async () => {
          throw new Error("encrypt failed");
        },
        decrypt: async ({ ciphertext }) => ciphertext,
        hash: async ({ value }) => `h:${value}`,
      },
    });

    await expect(
      applyTrackingCryptoOnWrite(
        createRecord(),
        { config },
        { tableName: "kmsg_delivery_tracking", store: "memory" },
        { secureMode: true, compatPlainColumns: false },
      ),
    ).rejects.toThrow("unsupported failMode: close");
  });

  test("an envelope from another version is rejected before it is stored", async () => {
    const config = createConfig({
      provider: {
        encrypt: async () => ({
          ciphertext: { v: 2, alg: "X", kid: "k", iv: "i", tag: "t", ct: "c" },
        }),
        decrypt: async ({ ciphertext }) => ciphertext,
        hash: async ({ value }) => `h:${value}`,
      },
    });

    const error = await applyTrackingCryptoOnWrite(
      createRecord(),
      { config },
      { tableName: "kmsg_delivery_tracking", store: "memory" },
      { secureMode: true, compatPlainColumns: false },
    ).then(
      () => undefined,
      (caught: unknown) => caught,
    );

    // Fails closed, citing the envelope check as the cause.
    expect(error).toBeInstanceOf(FieldCryptoError);
    expect((error as FieldCryptoError).details).toMatchObject({
      cause: expect.stringContaining("ciphertext envelope must be v1 A256GCM"),
    });
  });

  test("encrypts metadata with the resolved key, like the recipient and sender", async () => {
    const kids: Record<string, string | undefined> = {};
    const config = createConfig({
      fields: { to: "encrypt+hash", from: "encrypt+hash", metadata: "encrypt" },
      keyResolver: { resolveEncryptKey: () => ({ kid: "tenant-key" }) },
      provider: {
        encrypt: async ({ value, path, kid }) => {
          kids[path] = kid;
          return { ciphertext: value, kid };
        },
        decrypt: async ({ ciphertext }) => ciphertext,
        hash: async ({ value }) => `h:${value}`,
      },
    });

    const secured = await applyTrackingCryptoOnWrite(
      { ...createRecord(), metadata: { campaign: "spring" } },
      { config },
      { tableName: "kmsg_delivery_tracking", store: "memory" },
      { secureMode: true, compatPlainColumns: false },
    );

    expect(kids).toEqual({
      to: "tenant-key",
      from: "tenant-key",
      metadata: "tenant-key",
    });
    expect(secured.metadataEnc).toBeDefined();
    expect(secured.cryptoKid).toBe("tenant-key");
  });

  test("fail-open path emits degraded state and metric tags", async () => {
    const events: Array<Record<string, unknown>> = [];
    const record = createRecord();
    const config = createConfig({
      failMode: "open",
      openFallback: "masked",
      provider: {
        encrypt: async () => {
          throw new Error("encrypt failed");
        },
        decrypt: async ({ ciphertext }) => ciphertext,
        hash: async ({ value }) => `h:${value}`,
      },
    });

    const columns = await applyTrackingCryptoOnWrite(
      record,
      {
        config,
        metrics: async (event) => {
          events.push({ ...event });
        },
      },
      {
        tableName: "kmsg_delivery_tracking",
        store: "memory",
      },
      {
        secureMode: true,
        compatPlainColumns: false,
      },
    );

    expect(columns.cryptoState).toBe("degraded");
    const failEvent = events.find(
      (event) => event.name === "crypto_fail_count",
    );
    expect(failEvent).toBeDefined();
    if (!failEvent) {
      throw new Error("Expected crypto_fail_count event");
    }
    const tags = failEvent.tags as Record<string, unknown>;
    expect(tags.operation).toBe("encrypt");
    expect(tags.failMode).toBe("open");
    expect(tags.fallback).toBe("masked");
  });

  test("to/from filters are normalized consistently before hash lookup", async () => {
    const normalizedFilter = await normalizeTrackingFilterWithHashes(
      {
        to: ["010-1234-5678", "010 1234 5678", "01012345678"],
      },
      {
        config: createConfig(),
      },
      {
        secureMode: true,
        compatPlainColumns: false,
      },
      { tableName: "kmsg_delivery_tracking", store: "memory" },
    );

    // All three spellings hash to one value.
    expect(normalizedFilter?.toHash).toBe("h:01012345678");
    expect(normalizedFilter?.to).toBeUndefined();
  });
});

function testKey(fill: number): string {
  return Buffer.alloc(32, fill).toString("base64url");
}

// Keys for every kid the tests hand out. The provider's own active kid is one
// no resolver returns, as with tenant-specific keys.
function createKeyedProvider(): FieldCryptoProvider {
  const kids = ["k-default", "tenant-a", "k-2026-01", "k-2026-02"];
  return createAesGcmFieldCryptoProvider({
    keys: Object.fromEntries(kids.map((kid, index) => [kid, testKey(index)])),
    hashKeys: Object.fromEntries(
      kids.map((kid, index) => [kid, testKey(index + 100)]),
    ),
    activeKid: "k-default",
  });
}

function createMemoryObjectStorage() {
  const map = new Map<string, string>();
  return {
    async get(key: string): Promise<string | null> {
      return map.get(key) ?? null;
    },
    async put(key: string, value: string): Promise<void> {
      map.set(key, value);
    },
    async delete(key: string): Promise<void> {
      map.delete(key);
    },
    async list(prefix: string): Promise<string[]> {
      return Array.from(map.keys()).filter((key) => key.startsWith(prefix));
    },
  };
}

function createSecureObjectStore(
  config: FieldCryptoConfig,
): CloudflareObjectDeliveryTrackingStore {
  return new CloudflareObjectDeliveryTrackingStore(
    createMemoryObjectStorage(),
    {
      secureMode: true,
      compatPlainColumns: false,
      fieldCrypto: { tenantId: "tenant-a", config },
    },
  );
}

function createSqliteClient(): CloudflareSqlClient {
  const database = new Database(":memory:");
  const query = async (sql: string, params: readonly unknown[] = []) => {
    const statement = database.query(sql);
    const bindings = params.map((value) =>
      value instanceof Date ? value.getTime() : (value ?? null),
    ) as Parameters<typeof statement.all>;
    if (/^\s*SELECT/i.test(sql)) {
      const rows = statement.all(...bindings) as unknown[];
      return { rows, rowCount: rows.length };
    }
    const result = statement.run(...bindings) as { changes?: number };
    return { rows: [], rowCount: result.changes ?? 0 };
  };
  return { dialect: "sqlite", query: query as CloudflareSqlClient["query"] };
}

function trackingRecord(index: number, to: string): TrackingRecord {
  return { ...createRecord(), messageId: `m-${index}`, to };
}

async function messageIdsTo(
  store: DeliveryTrackingStore,
  to: string | string[],
): Promise<string[]> {
  const found = (await store.listRecords?.({ to, limit: 10 })) ?? [];
  return found.map((record) => record.messageId).sort();
}

describe("tracking hash lookups", () => {
  test("finds a record written under a tenant key by its recipient and sender", async () => {
    const store = createSecureObjectStore({
      enabled: true,
      fields: { to: "encrypt+hash", from: "encrypt+hash" },
      keyResolver: {
        resolveEncryptKey: () => ({ kid: "tenant-a" }),
        resolveDecryptKeys: () => ["tenant-a"],
      },
      provider: createKeyedProvider(),
    });

    const record = createRecord();
    await store.upsert(record);
    expect((await store.get(record.messageId))?.cryptoKid).toBe("tenant-a");

    const byRecipient = await store.listRecords({
      to: "010-1234-5678",
      limit: 10,
    });
    expect(byRecipient.map((found) => found.messageId)).toEqual([
      record.messageId,
    ]);
    expect(await store.countRecords({ from: record.from })).toBe(1);
  });

  test("keeps records hashed before a key rotation findable while their kid stays in the decrypt set", async () => {
    const client = createSqliteClient();
    const provider = createKeyedProvider();
    const openStore = (activeKid: string, decryptKids: string[]) =>
      new HyperdriveDeliveryTrackingStore(client, {
        tableName: "kmsg_delivery_tracking",
        fieldCrypto: {
          tenantId: "tenant-a",
          config: {
            enabled: true,
            fields: { to: "encrypt+hash", from: "encrypt+hash" },
            keyResolver: createStaticKeyResolver({ activeKid, decryptKids }),
            provider,
          },
        },
      });

    const before = openStore("k-2026-01", []);
    await before.upsert(trackingRecord(1, "01011110001"));

    // Rotation: new writes use k-2026-02, and k-2026-01 stays readable.
    const after = openStore("k-2026-02", ["k-2026-01"]);
    await after.upsert(trackingRecord(2, "01011110002"));
    expect((await after.get("m-1"))?.cryptoKid).toBe("k-2026-01");
    expect((await after.get("m-2"))?.cryptoKid).toBe("k-2026-02");

    expect(await messageIdsTo(after, "010-1111-0001")).toEqual(["m-1"]);
    expect(await messageIdsTo(after, "01011110002")).toEqual(["m-2"]);
    expect(await messageIdsTo(after, ["01011110001", "01011110002"])).toEqual([
      "m-1",
      "m-2",
    ]);
    expect(await after.countRecords({ from: createRecord().from })).toBe(2);
    expect(await after.countBy({ to: "01011110001" }, ["providerId"])).toEqual([
      { key: { providerId: "p-1" }, count: 1 },
    ]);

    // Once the old kid leaves the decrypt set, its records stop matching.
    const retired = openStore("k-2026-02", []);
    expect(await messageIdsTo(retired, "01011110001")).toEqual([]);
    expect(await messageIdsTo(retired, "01011110002")).toEqual(["m-2"]);
  });

  test("resolves lookup candidates for the store: the encrypt kid first, then the decrypt set", async () => {
    const contexts: Array<Record<string, unknown>> = [];
    const provider: FieldCryptoProvider = {
      encrypt: async ({ value }) => ({ ciphertext: value }),
      decrypt: async ({ ciphertext }) => ciphertext,
      hash: async ({ value, kid }) => `${kid ?? "provider-default"}:${value}`,
    };
    const normalize = (
      keyResolver: FieldCryptoConfig["keyResolver"],
      to: string | string[],
    ) =>
      normalizeTrackingFilterWithHashes(
        { to },
        {
          tenantId: "tenant-a",
          config: createConfig({ keyResolver, provider }),
        },
        { secureMode: true, compatPlainColumns: false },
        { tableName: "kmsg_delivery_tracking", store: "sql" },
      );

    const withDecryptSet = await normalize(
      {
        resolveEncryptKey: (context) => {
          contexts.push({ ...context });
          return { kid: "k-2026-02" };
        },
        // Trimmed, deduplicated, and blank entries dropped.
        resolveDecryptKeys: (context) => {
          contexts.push({ ...context });
          return ["k-2026-01", " k-2026-02 ", "", "k-2025-12"];
        },
      },
      ["010-1234-5678", "01012345678"],
    );
    expect(withDecryptSet?.toHash).toEqual([
      "k-2026-02:01012345678",
      "k-2026-01:01012345678",
      "k-2025-12:01012345678",
    ]);
    expect(withDecryptSet?.to).toBeUndefined();
    // A lookup spans records, so no message or provider id reaches the resolver.
    for (const context of contexts) {
      expect(context).toMatchObject({
        tenantId: "tenant-a",
        tableName: "kmsg_delivery_tracking",
        fieldPath: "to",
      });
      expect(context.messageId).toBeUndefined();
      expect(context.providerId).toBeUndefined();
    }

    const encryptKidOnly = await normalize(
      { resolveEncryptKey: () => ({ kid: "tenant-a" }) },
      "01012345678",
    );
    expect(encryptKidOnly?.toHash).toBe("tenant-a:01012345678");

    // Without a resolver a write hashes with the provider's default key, and
    // so does the lookup.
    const withoutResolver = await normalize(undefined, "01012345678");
    expect(withoutResolver?.toHash).toBe("provider-default:01012345678");
  });

  test("hashes metadata under the key that encrypts it", async () => {
    const hashKids: Record<string, string | undefined> = {};
    const config = createConfig({
      fields: {
        to: "encrypt+hash",
        from: "encrypt+hash",
        metadata: "encrypt",
        "metadata.callback": "encrypt+hash",
      },
      keyResolver: {
        resolveEncryptKey: ({ fieldPath }) => ({
          kid: fieldPath === "metadata" ? "metadata-key" : "tenant-key",
        }),
      },
      provider: {
        encrypt: async ({ value, kid }) => ({ ciphertext: value, kid }),
        decrypt: async ({ ciphertext }) => ciphertext,
        hash: async ({ value, path, kid }) => {
          hashKids[path] = kid;
          return `h:${value}`;
        },
      },
    });

    const secured = await applyTrackingCryptoOnWrite(
      { ...createRecord(), metadata: { callback: "010-9999-0000" } },
      { config },
      { tableName: "kmsg_delivery_tracking", store: "memory" },
      { secureMode: true, compatPlainColumns: false },
    );

    expect(secured.metadataHashes).toEqual({
      "metadata.callback": "h:01099990000",
    });
    expect(hashKids).toEqual({
      to: "tenant-key",
      from: "tenant-key",
      "metadata.callback": "metadata-key",
    });
  });

  test("hashes a degraded write under the resolved kid, so lookups still find it", async () => {
    const keyed = createKeyedProvider();
    const store = createSecureObjectStore({
      enabled: true,
      fields: { to: "encrypt+hash", from: "encrypt+hash" },
      failMode: "open",
      openFallback: "masked",
      keyResolver: {
        resolveEncryptKey: () => ({ kid: "tenant-a" }),
        resolveDecryptKeys: () => ["tenant-a"],
      },
      provider: {
        ...keyed,
        encrypt: async () => {
          throw new Error("encryption service unavailable");
        },
      },
    });

    const record = createRecord();
    await store.upsert(record);
    const stored = await store.get(record.messageId);
    expect(stored?.cryptoState).toBe("degraded");
    expect(stored?.toHash).toBe(
      await keyed.hash({ value: record.to, path: "to", kid: "tenant-a" }),
    );

    expect(await messageIdsTo(store, "010-1234-5678")).toEqual([
      record.messageId,
    ]);
    expect(await store.countRecords({ from: record.from })).toBe(1);
  });

  test("stores a degraded write without the hash it cannot compute", async () => {
    const failures: Array<Partial<FieldCryptoConfig>> = [
      {
        keyResolver: {
          resolveEncryptKey: () => {
            throw new Error("key service unavailable");
          },
        },
      },
      {
        provider: {
          encrypt: async ({ value }) => ({ ciphertext: value }),
          decrypt: async ({ ciphertext }) => ciphertext,
          hash: async () => {
            throw new Error("hash service unavailable");
          },
        },
      },
    ];

    for (const failure of failures) {
      const secured = await applyTrackingCryptoOnWrite(
        createRecord(),
        {
          config: createConfig({
            failMode: "open",
            openFallback: "masked",
            ...failure,
          }),
        },
        { tableName: "kmsg_delivery_tracking", store: "memory" },
        { secureMode: true, compatPlainColumns: false },
      );

      expect(secured.cryptoState).toBe("degraded");
      expect(secured.toMasked).toBe("010******78");
      expect(secured.toHash).toBeUndefined();
      expect(secured.fromHash).toBeUndefined();
    }
  });

  const openSecureStores: Record<
    string,
    (fieldCrypto: DeliveryTrackingFieldCryptoOptions) => DeliveryTrackingStore
  > = {
    object: (fieldCrypto) =>
      new CloudflareObjectDeliveryTrackingStore(createMemoryObjectStorage(), {
        secureMode: true,
        compatPlainColumns: false,
        fieldCrypto,
      }),
    sql: (fieldCrypto) =>
      new HyperdriveDeliveryTrackingStore(createSqliteClient(), {
        tableName: "kmsg_delivery_tracking",
        fieldCrypto,
      }),
  };

  for (const [kind, openStore] of Object.entries(openSecureStores)) {
    test(`an open-mode lookup skips a hash it cannot compute and matches no records without one (${kind} store)`, async () => {
      let decryptKids = (): string[] => ["tenant-a"];
      const hashFailures: unknown[] = [];
      const store = openStore({
        tenantId: "tenant-a",
        config: {
          enabled: true,
          fields: { to: "encrypt+hash", from: "encrypt+hash" },
          failMode: "open",
          keyResolver: {
            resolveEncryptKey: () => ({ kid: "tenant-a" }),
            resolveDecryptKeys: () => decryptKids(),
          },
          provider: createKeyedProvider(),
        },
        metrics: (event) => {
          if (
            event.name === "crypto_fail_count" &&
            event.tags?.operation === "hash"
          ) {
            hashFailures.push(event);
          }
        },
      });
      await store.upsert(trackingRecord(1, "01011110001"));
      await store.upsert(trackingRecord(2, "01011110002"));

      // The provider has no hash key for k-unknown, so the lookup skips it.
      decryptKids = () => ["tenant-a", "k-unknown"];
      expect(await messageIdsTo(store, "01011110001")).toEqual(["m-1"]);

      // With the key service down no hash is left: the lookup matches no
      // record rather than dropping the filter and matching every record.
      decryptKids = () => {
        throw new Error("key service unavailable");
      };
      expect(await messageIdsTo(store, "01011110001")).toEqual([]);
      expect(await store.countRecords?.({ to: "01011110001" })).toBe(0);
      expect(
        await store.countBy?.({ from: createRecord().from }, ["type"]),
      ).toEqual([]);
      expect(hashFailures).toHaveLength(4);
    });

    test(`an open-mode lookup whose hash fails matches no records instead of every record (${kind} store)`, async () => {
      const keyed = createKeyedProvider();
      let hashServiceDown = false;
      const store = openStore({
        config: {
          enabled: true,
          fields: { to: "encrypt+hash", from: "encrypt+hash" },
          failMode: "open",
          provider: {
            ...keyed,
            hash: (input) => {
              if (hashServiceDown) {
                throw new Error("hash service unavailable");
              }
              return keyed.hash(input);
            },
          },
        },
      });
      await store.upsert(trackingRecord(1, "01011110001"));
      await store.upsert(trackingRecord(2, "01011110002"));

      hashServiceDown = true;
      expect(await messageIdsTo(store, "01011110001")).toEqual([]);
      expect(await store.countRecords?.({ from: createRecord().from })).toBe(0);
    });
  }

  test("a closed-mode lookup that cannot hash fails", async () => {
    const store = createSecureObjectStore({
      enabled: true,
      fields: { to: "encrypt+hash", from: "encrypt+hash" },
      keyResolver: {
        resolveEncryptKey: () => ({ kid: "tenant-a" }),
        resolveDecryptKeys: () => ["tenant-a", "k-unknown"],
      },
      provider: createKeyedProvider(),
    });

    await expect(
      store.listRecords({ to: "01012345678", limit: 10 }),
    ).rejects.toThrow("Field crypto hash failed for to");
  });
});
