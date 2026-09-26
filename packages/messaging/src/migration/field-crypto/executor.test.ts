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
import {
  applyFieldCryptoMigration,
  retryFieldCryptoMigration,
  statusFieldCryptoMigration,
} from "./executor";
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

async function countUnencrypted(client: CloudflareSqlClient): Promise<number> {
  const { rows } = await client.query<{ count: number }>(
    `SELECT COUNT(*) AS count FROM ${TABLE} WHERE crypto_state IS NULL OR crypto_state <> 'encrypted'`,
  );
  return Number(rows[0]?.count);
}

// Fails the nth matching query, as a dropped connection would.
function failNthQuery(
  client: CloudflareSqlClient,
  matches: (sql: string, params: readonly unknown[]) => boolean,
  failAt = 1,
): CloudflareSqlClient {
  let seen = 0;
  const query = async (sql: string, params: readonly unknown[] = []) => {
    if (matches(sql, params)) {
      seen += 1;
      if (seen === failAt || failAt === Number.POSITIVE_INFINITY) {
        throw new Error("connection reset");
      }
    }
    return client.query(sql, params);
  };
  return { ...client, query: query as CloudflareSqlClient["query"] };
}

function isStateWrite(sql: string, table: "runs" | "chunks"): boolean {
  return (
    /^\s*(INSERT|UPDATE)\b/i.test(sql) &&
    sql.includes(`kmsg_crypto_migration_${table}`)
  );
}

// Fails every matching query, as an unreachable database would.
function failEveryQuery(
  client: CloudflareSqlClient,
  matches: (sql: string, params: readonly unknown[]) => boolean,
): CloudflareSqlClient {
  return failNthQuery(client, matches, Number.POSITIVE_INFINITY);
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

    const retried = await retryFieldCryptoMigration(client, {
      planId: plan.planId,
      trackingTableName: TABLE,
      fieldCrypto,
    });
    expect(retried.status).toBe("completed");
  });

  test("fails the run on a read error and resumes from its cursor", async () => {
    const client = createSqliteClient();
    const fieldCrypto = createFieldCrypto();
    await seedLegacyRows(client, fieldCrypto, 150);
    const plan = await planFieldCryptoMigration({
      client,
      trackingTableName: TABLE,
      chunkSize: 100,
    });
    const input = {
      planId: plan.planId,
      trackingTableName: TABLE,
      fieldCrypto,
    };

    // The read that checks for more rows after the only chunk allowed fails.
    const flaky = failNthQuery(
      client,
      (sql) => sql.includes("as messageId"),
      2,
    );
    expect(
      await applyFieldCryptoMigration(flaky, { ...input, maxChunks: 1 }),
    ).toMatchObject({
      status: "failed",
      processedChunks: 1,
      processedRows: 100,
      failedChunks: 0,
    });
    expect(
      (await statusFieldCryptoMigration(client, plan.planId, {})).run,
    ).toMatchObject({ status: "failed", lastError: "connection reset" });

    // No chunk failed, so retry has nothing to do and keeps the failure.
    expect(await retryFieldCryptoMigration(client, input)).toMatchObject({
      status: "failed",
      processedChunks: 0,
    });
    expect(
      (await statusFieldCryptoMigration(client, plan.planId, {})).run
        ?.lastError,
    ).toBe("connection reset");

    expect(await applyFieldCryptoMigration(client, input)).toMatchObject({
      status: "completed",
      processedChunks: 1,
      processedRows: 50,
    });
    expect(await countUnencrypted(client)).toBe(0);
  });

  test("fails a chunk it cannot encrypt, and retry finishes it once fixed", async () => {
    const client = createSqliteClient();
    const fieldCrypto = createFieldCrypto();
    await seedLegacyRows(client, fieldCrypto, 150);
    const broken = legacyRecord(120);
    await client.query(`UPDATE ${TABLE} SET "to" = '' WHERE message_id = ?`, [
      broken.messageId,
    ]);
    const plan = await planFieldCryptoMigration({
      client,
      trackingTableName: TABLE,
      chunkSize: 100,
    });
    const input = {
      planId: plan.planId,
      trackingTableName: TABLE,
      fieldCrypto,
    };

    expect(await applyFieldCryptoMigration(client, input)).toMatchObject({
      status: "failed",
      processedChunks: 1,
      failedChunks: 1,
    });
    const status = await statusFieldCryptoMigration(client, plan.planId, {});
    expect(status.chunks.failed).toBe(1);
    expect(status.run?.lastError).toContain(
      `Cannot encrypt message ${broken.messageId}`,
    );
    expect(await countUnencrypted(client)).toBeGreaterThan(0);

    await client.query(`UPDATE ${TABLE} SET "to" = ? WHERE message_id = ?`, [
      broken.to,
      broken.messageId,
    ]);
    expect(await retryFieldCryptoMigration(client, input)).toMatchObject({
      status: "running",
      processedChunks: 1,
      failedChunks: 0,
    });
    expect(await countUnencrypted(client)).toBe(0);
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
  test("reports the backfill error when recording the failed chunk fails too", async () => {
    const client = createSqliteClient();
    const fieldCrypto = createFieldCrypto();
    await seedLegacyRows(client, fieldCrypto, 1);
    await client.query(`UPDATE ${TABLE} SET "to" = ''`);
    const plan = await planFieldCryptoMigration({
      client,
      trackingTableName: TABLE,
    });

    const flaky = failNthQuery(
      client,
      (sql, params) =>
        sql.includes("kmsg_crypto_migration_chunks") &&
        params.includes("failed"),
    );
    expect(
      await applyFieldCryptoMigration(flaky, {
        planId: plan.planId,
        trackingTableName: TABLE,
        fieldCrypto,
      }),
    ).toMatchObject({ status: "failed", failedChunks: 1 });
    expect(
      (await statusFieldCryptoMigration(client, plan.planId, {})).run
        ?.lastError,
    ).toContain("Cannot encrypt message");
  });

  test("marks the run failed when its final state write fails", async () => {
    const client = createSqliteClient();
    const fieldCrypto = createFieldCrypto();
    await seedLegacyRows(client, fieldCrypto, 1);
    const plan = await planFieldCryptoMigration({
      client,
      trackingTableName: TABLE,
    });
    const input = {
      planId: plan.planId,
      trackingTableName: TABLE,
      fieldCrypto,
    };

    const flaky = failNthQuery(
      client,
      (sql, params) =>
        sql.includes("kmsg_crypto_migration_runs") &&
        params.includes("completed"),
    );
    expect(await applyFieldCryptoMigration(flaky, input)).toMatchObject({
      status: "failed",
      processedRows: 1,
    });
    expect(
      (await statusFieldCryptoMigration(client, plan.planId, {})).run,
    ).toMatchObject({ status: "failed", lastError: "connection reset" });

    expect(await applyFieldCryptoMigration(client, input)).toMatchObject({
      status: "completed",
      processedRows: 0,
    });
    expect(await countUnencrypted(client)).toBe(0);
  });
  test("returns a failed result when the failure cannot be recorded", async () => {
    const client = createSqliteClient();
    const fieldCrypto = createFieldCrypto();
    await seedLegacyRows(client, fieldCrypto, 1);
    const plan = await planFieldCryptoMigration({
      client,
      trackingTableName: TABLE,
    });
    const input = {
      planId: plan.planId,
      trackingTableName: TABLE,
      fieldCrypto,
    };

    const unreachable = failEveryQuery(
      client,
      (sql, params) =>
        sql.includes("kmsg_crypto_migration_runs") &&
        (params.includes("completed") || params.includes("failed")),
    );
    expect(await applyFieldCryptoMigration(unreachable, input)).toMatchObject({
      status: "failed",
      processedRows: 1,
    });

    expect(await applyFieldCryptoMigration(client, input)).toMatchObject({
      status: "completed",
    });
    expect(await countUnencrypted(client)).toBe(0);
  });
  test("retry returns a result when its state writes fail", async () => {
    const client = createSqliteClient();
    const fieldCrypto = createFieldCrypto();
    await seedLegacyRows(client, fieldCrypto, 1);
    const record = legacyRecord(0);
    await client.query(`UPDATE ${TABLE} SET "to" = ''`);
    const plan = await planFieldCryptoMigration({
      client,
      trackingTableName: TABLE,
    });
    const input = {
      planId: plan.planId,
      trackingTableName: TABLE,
      fieldCrypto,
    };
    expect(await applyFieldCryptoMigration(client, input)).toMatchObject({
      status: "failed",
      failedChunks: 1,
    });

    // The chunk fails again and neither failure can be recorded.
    const unreachable = failEveryQuery(client, (sql, params) =>
      isStateWrite(sql, "chunks") || isStateWrite(sql, "runs")
        ? params.includes("failed")
        : false,
    );
    expect(await retryFieldCryptoMigration(unreachable, input)).toMatchObject({
      status: "failed",
      failedChunks: 1,
    });

    // The chunk now succeeds, but the run state cannot be recorded.
    await client.query(`UPDATE ${TABLE} SET "to" = ?`, [record.to]);
    const runStateDown = failEveryQuery(client, (sql) =>
      isStateWrite(sql, "runs"),
    );
    expect(await retryFieldCryptoMigration(runStateDown, input)).toMatchObject({
      status: "failed",
      processedChunks: 1,
    });
    expect(await countUnencrypted(client)).toBe(0);

    // The chunk is completed but the run still counts it as failed; the next
    // retry reconciles the run instead of keeping it failed forever.
    expect(
      (await statusFieldCryptoMigration(client, plan.planId, {})).run,
    ).toMatchObject({ status: "failed", failedChunks: 1 });
    expect(await retryFieldCryptoMigration(client, input)).toMatchObject({
      status: "running",
      failedChunks: 0,
    });
    expect(
      (await statusFieldCryptoMigration(client, plan.planId, {})).run,
    ).toMatchObject({ status: "running", failedChunks: 0 });
  });
  test("encrypts the stored recipient exactly, whitespace included", async () => {
    const client = createSqliteClient();
    const fieldCrypto = createFieldCrypto();
    await seedLegacyRows(client, fieldCrypto, 1);
    const record = legacyRecord(0);
    const padded = ` ${record.to} `;
    await client.query(`UPDATE ${TABLE} SET "to" = ?`, [padded]);
    const plan = await planFieldCryptoMigration({
      client,
      trackingTableName: TABLE,
    });

    expect(
      await applyFieldCryptoMigration(client, {
        planId: plan.planId,
        trackingTableName: TABLE,
        fieldCrypto,
      }),
    ).toMatchObject({ status: "completed" });

    // A store without plain columns has to decrypt to_enc to answer.
    const secureOnly = new HyperdriveDeliveryTrackingStore(client, {
      tableName: TABLE,
      fieldCrypto,
      fieldCryptoSchema: {
        enabled: true,
        mode: "secure",
        compatPlainColumns: false,
      },
    });
    expect((await secureOnly.get(record.messageId))?.to).toBe(padded);
  });

  test("leaves a row that a live writer encrypted after it was read", async () => {
    const client = createSqliteClient();
    const fieldCrypto = createFieldCrypto();
    await seedLegacyRows(client, fieldCrypto, 1);
    const plan = await planFieldCryptoMigration({
      client,
      trackingTableName: TABLE,
    });

    // The live write lands between the backfill's read and its update.
    let raced = false;
    const racing: CloudflareSqlClient = {
      ...client,
      query: (async (sql: string, params: readonly unknown[] = []) => {
        if (!raced && /^\s*UPDATE\b/i.test(sql) && sql.includes("to_enc")) {
          raced = true;
          await client.query(
            `UPDATE ${TABLE} SET to_enc = 'live-writer', crypto_state = 'encrypted' WHERE message_id = ?`,
            [legacyRecord(0).messageId],
          );
        }
        return client.query(sql, params);
      }) as CloudflareSqlClient["query"],
    };

    expect(
      await applyFieldCryptoMigration(racing, {
        planId: plan.planId,
        trackingTableName: TABLE,
        fieldCrypto,
      }),
    ).toMatchObject({ status: "completed" });
    expect(raced).toBe(true);
    const { rows } = await client.query<{ to_enc: string }>(
      `SELECT to_enc FROM ${TABLE}`,
    );
    expect(rows[0]?.to_enc).toBe("live-writer");
  });
  test("re-encrypts a row a live fail-open writer changed after it was read", async () => {
    const client = createSqliteClient();
    const fieldCrypto = createFieldCrypto();
    await seedLegacyRows(client, fieldCrypto, 1);
    const record = legacyRecord(0);
    const plan = await planFieldCryptoMigration({
      client,
      trackingTableName: TABLE,
    });

    // A degraded live write changes the recipient before the update lands.
    let raced = false;
    const racing: CloudflareSqlClient = {
      ...client,
      query: (async (sql: string, params: readonly unknown[] = []) => {
        if (!raced && /^\s*UPDATE\b/i.test(sql) && sql.includes("to_enc")) {
          raced = true;
          await client.query(
            `UPDATE ${TABLE} SET "to" = '01099998888', to_enc = 'masked', crypto_state = 'degraded' WHERE message_id = ?`,
            [record.messageId],
          );
        }
        return client.query(sql, params);
      }) as CloudflareSqlClient["query"],
    };

    expect(
      await applyFieldCryptoMigration(racing, {
        planId: plan.planId,
        trackingTableName: TABLE,
        fieldCrypto,
      }),
    ).toMatchObject({ status: "completed" });
    expect(raced).toBe(true);

    const secureOnly = new HyperdriveDeliveryTrackingStore(client, {
      tableName: TABLE,
      fieldCrypto,
      fieldCryptoSchema: {
        enabled: true,
        mode: "secure",
        compatPlainColumns: false,
      },
    });
    expect((await secureOnly.get(record.messageId))?.to).toBe("01099998888");
  });

  test("encrypts a whitespace-only sender as the store would", async () => {
    const client = createSqliteClient();
    const fieldCrypto = createFieldCrypto();
    await seedLegacyRows(client, fieldCrypto, 1);
    await client.query(`UPDATE ${TABLE} SET "from" = '   '`);
    const plan = await planFieldCryptoMigration({
      client,
      trackingTableName: TABLE,
    });

    expect(
      await applyFieldCryptoMigration(client, {
        planId: plan.planId,
        trackingTableName: TABLE,
        fieldCrypto,
      }),
    ).toMatchObject({ status: "completed" });
    const { rows } = await client.query<{ from_enc: string | null }>(
      `SELECT from_enc FROM ${TABLE}`,
    );
    expect(rows[0]?.from_enc).toEqual(expect.stringContaining("A256GCM"));
  });
});
