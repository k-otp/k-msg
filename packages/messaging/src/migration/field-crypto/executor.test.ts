import { Database } from "bun:sqlite";
import { describe, expect, test } from "bun:test";
import {
  createAesGcmFieldCryptoProvider,
  createStaticKeyResolver,
  normalizePhoneForHash,
} from "@k-msg/core";
import { HyperdriveDeliveryTrackingStore } from "../../adapters/cloudflare/hyperdrive-delivery-tracking.store";
import type { CloudflareSqlClient } from "../../adapters/cloudflare/sql-client";
import type { DeliveryTrackingFieldCryptoOptions } from "../../delivery-tracking/store.interface";
import type { TrackingRecord } from "../../delivery-tracking/types";
import { applyFieldCryptoMigration } from "./executor";
import { planFieldCryptoMigration } from "./planner";

const TABLE = "kmsg_delivery_tracking";
const AES_KEY = Buffer.alloc(32, 7).toString("base64url");

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

function createFieldCrypto(): DeliveryTrackingFieldCryptoOptions {
  return {
    config: {
      enabled: true,
      fields: { to: "encrypt+hash", from: "encrypt+hash" },
      keyResolver: createStaticKeyResolver({ activeKid: "k1" }),
      provider: createAesGcmFieldCryptoProvider({
        keys: { k1: AES_KEY },
        activeKid: "k1",
      }),
    },
  };
}

function legacyRecord(index: number): TrackingRecord {
  const requestedAt = new Date(Date.UTC(2026, 0, 1, 0, 0, index));
  return {
    messageId: `msg-${String(index).padStart(4, "0")}`,
    providerId: "iwinv",
    providerMessageId: `provider-${index}`,
    type: "SMS",
    to: `0101234${String(index).padStart(4, "0")}`,
    from: "0212345678",
    requestedAt,
    status: "SENT",
    statusUpdatedAt: requestedAt,
    attemptCount: 0,
    nextCheckAt: requestedAt,
  };
}

// Columns an operator adds to an existing plain table before migrating; the
// tracking store only creates them for new tables.
const SECURE_COLUMNS = [
  "to_enc TEXT",
  "to_hash TEXT",
  "to_masked TEXT",
  "from_enc TEXT",
  "from_hash TEXT",
  "from_masked TEXT",
  "metadata_enc TEXT",
  "metadata_hashes TEXT",
  "crypto_kid TEXT",
  "crypto_version INTEGER NOT NULL DEFAULT 1",
  "crypto_state TEXT",
  "retention_class TEXT",
  "retention_bucket_ym INTEGER",
];

async function seedLegacyRows(
  client: CloudflareSqlClient,
  fieldCrypto: DeliveryTrackingFieldCryptoOptions,
  count: number,
): Promise<HyperdriveDeliveryTrackingStore> {
  const legacyStore = new HyperdriveDeliveryTrackingStore(client, TABLE);
  for (let index = 0; index < count; index += 1) {
    await legacyStore.upsert(legacyRecord(index));
  }
  for (const column of SECURE_COLUMNS) {
    await client.query(`ALTER TABLE ${TABLE} ADD COLUMN ${column}`);
  }

  const secureStore = new HyperdriveDeliveryTrackingStore(client, {
    tableName: TABLE,
    fieldCrypto,
    fieldCryptoSchema: {
      enabled: true,
      mode: "secure",
      compatPlainColumns: true,
    },
  });
  await secureStore.init();
  return secureStore;
}

describe("applyFieldCryptoMigration", () => {
  test("encrypts legacy rows across chunks with the store's field crypto", async () => {
    const client = createSqliteClient();
    const fieldCrypto = createFieldCrypto();
    const secureStore = await seedLegacyRows(client, fieldCrypto, 150);

    const plan = await planFieldCryptoMigration({
      client,
      trackingTableName: TABLE,
      chunkSize: 100,
    });
    const result = await applyFieldCryptoMigration(client, {
      planId: plan.planId,
      trackingTableName: TABLE,
      fieldCrypto,
    });

    expect(result.status).toBe("completed");
    expect(result.processedChunks).toBe(2);
    expect(result.processedRows).toBe(150);

    const { rows } = await client.query<{
      to: string;
      to_enc: string;
      to_hash: string;
      to_masked: string;
      crypto_state: string;
    }>(
      `SELECT "to", to_enc, to_hash, to_masked, crypto_state FROM ${TABLE} ORDER BY message_id`,
    );
    expect(rows).toHaveLength(150);
    const provider = fieldCrypto.config.provider;
    for (const row of rows) {
      expect(row.crypto_state).toBe("encrypted");
      expect(row.to_enc).not.toContain(row.to);
      expect(JSON.parse(row.to_enc)).toMatchObject({ v: 1, alg: "A256GCM" });
      expect(row.to_hash).toBe(
        await provider.hash({
          value: normalizePhoneForHash(row.to),
          path: "to",
          kid: "k1",
        }),
      );
      expect(row.to_masked).not.toBe(row.to);
    }

    const first = legacyRecord(0);
    expect((await secureStore.get(first.messageId))?.to).toBe(first.to);
    const byRecipient = await secureStore.listRecords({
      to: legacyRecord(120).to,
      limit: 10,
    });
    expect(byRecipient.map((record) => record.messageId)).toEqual([
      legacyRecord(120).messageId,
    ]);
  });

  test("refuses to run without field crypto options", async () => {
    const client = createSqliteClient();
    await seedLegacyRows(client, createFieldCrypto(), 1);
    const plan = await planFieldCryptoMigration({
      client,
      trackingTableName: TABLE,
    });

    await expect(
      applyFieldCryptoMigration(client, {
        planId: plan.planId,
        trackingTableName: TABLE,
      } as never),
    ).rejects.toThrow("fieldCrypto is required");

    const { rows } = await client.query<{ to_enc: string | null }>(
      `SELECT to_enc FROM ${TABLE}`,
    );
    expect(rows[0]?.to_enc).toBeNull();
  });
});
