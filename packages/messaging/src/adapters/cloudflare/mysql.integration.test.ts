import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
  createAesGcmFieldCryptoProvider,
  createStaticKeyResolver,
} from "@k-msg/core";
import { SQL } from "bun";
import { BunSqlDeliveryTrackingStore } from "../../delivery-tracking/stores/bun-sql.store";
import type { TrackingRecord } from "../../delivery-tracking/types";
import type { DeliveryTrackingTypeStrategy } from "./delivery-tracking-schema";
import { buildCloudflareSqlSchemaSql } from "./sql-schema";

// Runs against a real MySQL or MariaDB when KMSG_TEST_MYSQL_URL names one
// (mysql://user:password@host:port/database), as a user that can create
// databases: the tests create, and then drop, their own.
const url = process.env.KMSG_TEST_MYSQL_URL;
const database = `kmsg_it_${crypto.randomUUID().slice(0, 8)}`;
// MySQL commits each CREATE TABLE and CREATE INDEX on its own, so creating a
// schema takes seconds rather than milliseconds.
const SCHEMA_TEST_TIMEOUT_MS = 30_000;

function record(
  messageId: string,
  patch: Partial<TrackingRecord> = {},
): TrackingRecord {
  const now = new Date();
  return {
    messageId,
    providerId: "mock",
    providerMessageId: `p-${messageId}`,
    type: "SMS",
    to: "01012345678",
    from: "0212345678",
    requestedAt: now,
    status: "SENT",
    statusUpdatedAt: now,
    attemptCount: 0,
    nextCheckAt: now,
    lastError: { code: "E1", message: "first" },
    metadata: { tenant: "t1" },
    ...patch,
  };
}

describe.skipIf(!url)("SQL adapters on a real MySQL", () => {
  let sql: SQL;

  beforeAll(async () => {
    const bootstrap = new SQL(url ?? "");
    await bootstrap.unsafe(`CREATE DATABASE \`${database}\``);
    await bootstrap.close();
    const target = new URL(url ?? "");
    target.pathname = `/${database}`;
    sql = new SQL(target.toString());
  });

  afterAll(async () => {
    await sql.unsafe(`DROP DATABASE \`${database}\``);
    await sql.close();
  });

  async function columnTypes(table: string): Promise<Record<string, string>> {
    const rows: { name: string; type: string }[] = await sql.unsafe(
      "SELECT COLUMN_NAME AS name, COLUMN_TYPE AS type FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?",
      [database, table],
    );
    return Object.fromEntries(rows.map((row) => [row.name, row.type]));
  }

  // Sorted here: the order of ORDER BY depends on the server's collation.
  async function indexNames(table: string): Promise<string[]> {
    const rows: { name: string }[] = await sql.unsafe(
      "SELECT DISTINCT INDEX_NAME AS name FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?",
      [database, table],
    );
    return rows.map((row) => row.name).sort();
  }

  test(
    "a store with the default types creates its schema and keeps records",
    async () => {
      const store = new BunSqlDeliveryTrackingStore({
        sql,
        tableName: "tracking_default",
      });
      await store.init();
      // Another store runs the statements against the existing table and indexes.
      await new BunSqlDeliveryTrackingStore({
        sql,
        tableName: "tracking_default",
      }).init();

      const past = new Date(Date.now() - 60_000);
      await store.upsert(record("m-1"));
      await store.upsert(record("m-2", { nextCheckAt: past }));
      await store.patch("m-1", {
        status: "DELIVERED",
        providerStatusMessage: "x".repeat(300),
      });

      expect(await store.get("m-1")).toMatchObject({
        status: "DELIVERED",
        providerStatusMessage: "x".repeat(300),
        lastError: { code: "E1", message: "first" },
        metadata: { tenant: "t1" },
      });
      expect(
        (await store.listDue(new Date(), 10)).map((due) => due.messageId),
      ).toEqual(["m-2"]);
      expect(
        await store.countRecords({
          providerMessageId: "p-m-2",
          status: "SENT",
        }),
      ).toBe(1);

      expect(await columnTypes("tracking_default")).toMatchObject({
        message_id: "varchar(255)",
        provider_id: "varchar(255)",
        provider_message_id: "varchar(255)",
        status: "varchar(64)",
      });
      expect(await indexNames("tracking_default")).toEqual([
        "PRIMARY",
        "idx_kmsg_delivery_due",
        "idx_kmsg_delivery_provider_msg",
        "idx_kmsg_delivery_requested_at",
      ]);
    },
    SCHEMA_TEST_TIMEOUT_MS,
  );

  test(
    "short text as TEXT keeps the indexed status column VARCHAR",
    async () => {
      const store = new BunSqlDeliveryTrackingStore({
        sql,
        tableName: "tracking_text",
        typeStrategy: { shortText: "text" },
      });
      await store.init();
      await store.upsert(record("m-1"));

      expect(await store.get("m-1")).toMatchObject({ status: "SENT" });
      expect(await columnTypes("tracking_text")).toMatchObject({
        type: "text",
        status: "varchar(64)",
      });
      expect(await indexNames("tracking_text")).toContain(
        "idx_kmsg_delivery_due",
      );
    },
    SCHEMA_TEST_TIMEOUT_MS,
  );

  test(
    "a store with field encryption indexes the hashes and keeps long encrypted metadata",
    async () => {
      const store = new BunSqlDeliveryTrackingStore({
        sql,
        tableName: "tracking_secure",
        fieldCrypto: {
          config: {
            enabled: true,
            fields: {
              to: "encrypt+hash",
              from: "encrypt+hash",
              metadata: "encrypt",
            },
            keyResolver: createStaticKeyResolver({ activeKid: "k1" }),
            provider: createAesGcmFieldCryptoProvider({
              keys: { k1: Buffer.alloc(32, 7).toString("base64url") },
              activeKid: "k1",
            }),
          },
        },
      });
      await store.init();
      // Encrypted, this metadata is longer than VARCHAR(255) holds.
      const metadata = { note: "n".repeat(300) };
      await store.upsert(record("m-1", { metadata }));

      expect(await store.get("m-1")).toMatchObject({
        to: "01012345678",
        metadata,
      });
      expect(
        (await store.listRecords({ to: "01012345678", limit: 10 })).map(
          (found) => found.messageId,
        ),
      ).toEqual(["m-1"]);
      expect(await columnTypes("tracking_secure")).toMatchObject({
        to_hash: "varchar(255)",
        from_hash: "varchar(255)",
        to_enc: "text",
        metadata_enc: "text",
        retention_class: "varchar(64)",
      });
      expect(await indexNames("tracking_secure")).toEqual([
        "PRIMARY",
        "idx_kmsg_delivery_due",
        "idx_kmsg_delivery_from_hash",
        "idx_kmsg_delivery_provider_msg",
        "idx_kmsg_delivery_requested_at",
        "idx_kmsg_delivery_retention_bucket",
        "idx_kmsg_delivery_to_hash",
      ]);
    },
    SCHEMA_TEST_TIMEOUT_MS,
  );

  test(
    "the SQL schema builder's statements run for several type strategies",
    async () => {
      const strategies: Partial<DeliveryTrackingTypeStrategy>[] = [
        {},
        { messageId: "uuid", id: "varchar" },
        { shortText: "text", json: "text" },
        { timestamp: "integer" },
      ];
      for (const [index, typeStrategy] of strategies.entries()) {
        const ddl = buildCloudflareSqlSchemaSql({
          dialect: "mysql",
          target: "both",
          trackingTableName: `built_tracking_${index}`,
          queueTableName: `built_jobs_${index}`,
          typeStrategy,
          fieldCryptoSchema: { enabled: true, mode: "secure" },
        });
        for (const statement of ddl.split(";\n\n")) {
          await sql.unsafe(statement.replace(/;$/, ""));
        }

        expect(await indexNames(`built_tracking_${index}`)).toHaveLength(7);
      }
    },
    SCHEMA_TEST_TIMEOUT_MS,
  );
});
