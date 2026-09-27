import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
  createAesGcmFieldCryptoProvider,
  createStaticKeyResolver,
} from "@k-msg/core";
import { SQL } from "bun";
import { HyperdriveDeliveryTrackingStore } from "../../adapters/cloudflare/hyperdrive-delivery-tracking.store";
import type { CloudflareSqlClient } from "../../adapters/cloudflare/sql-client";
import { buildFieldCryptoMigrationMetaSchemaSql } from "../../adapters/cloudflare/sql-schema";
import type { DeliveryTrackingFieldCryptoOptions } from "../../delivery-tracking/store.interface";
import {
  applyFieldCryptoMigration,
  retryFieldCryptoMigration,
  statusFieldCryptoMigration,
} from "./executor";
import { planFieldCryptoMigration } from "./planner";

// Runs against a real MySQL or MariaDB when KMSG_TEST_MYSQL_URL names one
// (mysql://user:password@host:port/database), as a user that can create
// databases: the tests create, and then drop, their own.
const url = process.env.KMSG_TEST_MYSQL_URL;
// InnoDB defaults to REPEATABLE READ, and servers often run READ COMMITTED.
const ISOLATION_LEVELS = ["REPEATABLE READ", "READ COMMITTED"] as const;
// MySQL commits each CREATE TABLE and CREATE INDEX on its own, so creating a
// schema takes seconds rather than milliseconds.
const SCHEMA_TEST_TIMEOUT_MS = 30_000;
const TABLE = "kmsg_delivery_tracking";
const ROWS = 5;

const fieldCrypto: DeliveryTrackingFieldCryptoOptions = {
  config: {
    enabled: true,
    fields: { to: "encrypt+hash", from: "encrypt+hash" },
    keyResolver: createStaticKeyResolver({ activeKid: "k1" }),
    provider: createAesGcmFieldCryptoProvider({
      keys: { k1: Buffer.alloc(32, 7).toString("base64url") },
      activeKid: "k1",
    }),
  },
};

// The secure columns an operator adds to an existing plain table before
// migrating. MySQL cannot index TEXT, so the indexed ones are VARCHAR.
const SECURE_COLUMNS = [
  "to_enc TEXT",
  "to_hash VARCHAR(255)",
  "to_masked TEXT",
  "from_enc TEXT",
  "from_hash VARCHAR(255)",
  "from_masked TEXT",
  "metadata_enc TEXT",
  "metadata_hashes JSON",
  "crypto_kid TEXT",
  "crypto_version INTEGER NOT NULL DEFAULT 1",
  "crypto_state VARCHAR(64)",
  "retention_class VARCHAR(64)",
  "retention_bucket_ym INTEGER",
];

// Bun.SQL on MySQL reports affected rows as affectedRows; count stays 0.
function bunSqlClient(sql: SQL): CloudflareSqlClient {
  const query = async (statement: string, params: readonly unknown[] = []) => {
    const result = await sql.unsafe(statement, [...params]);
    return {
      rows: Array.isArray(result) ? [...result] : [],
      rowCount: result.affectedRows ?? result.count,
    };
  };
  return { dialect: "mysql", query: query as CloudflareSqlClient["query"] };
}

for (const isolationLevel of ISOLATION_LEVELS) {
  describe.skipIf(!url)(
    `field crypto migration on a real MySQL (${isolationLevel})`,
    () => {
      const database = `kmsg_it_${crypto.randomUUID().slice(0, 8)}`;
      let sql: SQL;
      let client: CloudflareSqlClient;

      beforeAll(async () => {
        const bootstrap = new SQL(url ?? "");
        await bootstrap.unsafe(`CREATE DATABASE \`${database}\``);
        await bootstrap.close();
        const target = new URL(url ?? "");
        target.pathname = `/${database}`;
        // One connection, so the session's isolation level covers every query.
        sql = new SQL({ url: target.toString(), max: 1 });
        await sql.unsafe(
          `SET SESSION TRANSACTION ISOLATION LEVEL ${isolationLevel}`,
        );
        client = bunSqlClient(sql);
      });

      afterAll(async () => {
        await sql.unsafe(`DROP DATABASE \`${database}\``);
        await sql.close();
      });

      test(
        "plan, apply, retry and status encrypt a plain table",
        async () => {
          // VARCHAR ids, as MySQL tracking tables had to be created with.
          const typeStrategy = { messageId: "varchar", id: "varchar" } as const;
          const legacy = new HyperdriveDeliveryTrackingStore(client, {
            tableName: TABLE,
            typeStrategy,
          });
          for (let index = 0; index < ROWS; index += 1) {
            const at = new Date(Date.UTC(2026, 0, 1, 0, 0, index));
            await legacy.upsert({
              messageId: `msg-${index}`,
              providerId: "iwinv",
              providerMessageId: `p-${index}`,
              type: "SMS",
              to: `0101234000${index}`,
              from: "0212345678",
              requestedAt: at,
              status: "SENT",
              statusUpdatedAt: at,
              attemptCount: 0,
              nextCheckAt: at,
            });
          }
          for (const column of SECURE_COLUMNS) {
            await client.query(`ALTER TABLE ${TABLE} ADD COLUMN ${column}`);
          }
          await new HyperdriveDeliveryTrackingStore(client, {
            tableName: TABLE,
            typeStrategy,
            fieldCrypto,
            fieldCryptoSchema: {
              enabled: true,
              mode: "secure",
              compatPlainColumns: true,
            },
          }).init();

          // Each call below creates the state tables if they are missing,
          // and finds them and their index after the first.
          const plan = await planFieldCryptoMigration({
            client,
            trackingTableName: TABLE,
          });
          expect(plan.totalRows).toBe(ROWS);

          const applied = await applyFieldCryptoMigration(client, {
            planId: plan.planId,
            trackingTableName: TABLE,
            fieldCrypto,
          });
          expect(applied).toMatchObject({
            status: "completed",
            processedRows: ROWS,
            failedChunks: 0,
          });

          const retried = await retryFieldCryptoMigration(client, {
            planId: plan.planId,
            trackingTableName: TABLE,
            fieldCrypto,
          });
          expect(retried.status).toBe("completed");

          const status = await statusFieldCryptoMigration(
            client,
            plan.planId,
            {},
          );
          expect(status.run?.status).toBe("completed");
          expect(status.chunks.failed).toBe(0);

          // Only the secure columns are read, so the recipient has to come
          // from decrypting them.
          const secureOnly = new HyperdriveDeliveryTrackingStore(client, {
            tableName: TABLE,
            typeStrategy,
            fieldCrypto,
            fieldCryptoSchema: {
              enabled: true,
              mode: "secure",
              compatPlainColumns: false,
            },
            initializeSchema: false,
          });
          expect(await secureOnly.get("msg-3")).toMatchObject({
            to: "01012340003",
            cryptoState: "encrypted",
          });
        },
        SCHEMA_TEST_TIMEOUT_MS,
      );

      test(
        "buildFieldCryptoMigrationMetaSchemaSql() statements run",
        async () => {
          const ddl = buildFieldCryptoMigrationMetaSchemaSql({
            dialect: "mysql",
            runsTableName: "built_migration_runs",
            chunksTableName: "built_migration_chunks",
          });
          for (const statement of ddl.split(";\n\n")) {
            await sql.unsafe(statement.replace(/;$/, ""));
          }

          const rows: { name: string }[] = await sql.unsafe(
            "SELECT DISTINCT INDEX_NAME AS name FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?",
            [database, "built_migration_chunks"],
          );
          expect(rows.map((row) => row.name).sort()).toEqual([
            "PRIMARY",
            "built_migration_chunks_status_idx",
          ]);
        },
        SCHEMA_TEST_TIMEOUT_MS,
      );
    },
  );
}
