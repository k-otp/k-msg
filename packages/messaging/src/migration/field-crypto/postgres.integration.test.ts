import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
  createAesGcmFieldCryptoProvider,
  createStaticKeyResolver,
} from "@k-msg/core";
import { SQL } from "bun";
import postgres from "postgres";
import { HyperdriveDeliveryTrackingStore } from "../../adapters/cloudflare/hyperdrive-delivery-tracking.store";
import {
  type CloudflareSqlClient,
  createCloudflareSqlClient,
} from "../../adapters/cloudflare/sql-client";
import type { DeliveryTrackingFieldCryptoOptions } from "../../delivery-tracking/store.interface";
import { applyFieldCryptoMigration } from "./executor";
import { planFieldCryptoMigration } from "./planner";

// Runs against a real Postgres when KMSG_TEST_POSTGRES_URL names one, as a
// user that can create schemas: the tests create, and then drop, their own.
const url = process.env.KMSG_TEST_POSTGRES_URL;
const TABLE = "kmsg_delivery_tracking";
const ROWS = 3;

const fieldCrypto: DeliveryTrackingFieldCryptoOptions = {
  config: {
    enabled: true,
    fields: {
      to: "encrypt+hash",
      from: "encrypt+hash",
      metadata: "encrypt",
      "metadata.orderId": "encrypt+hash",
    },
    keyResolver: createStaticKeyResolver({ activeKid: "k1" }),
    provider: createAesGcmFieldCryptoProvider({
      keys: { k1: Buffer.alloc(32, 7).toString("base64url") },
      activeKid: "k1",
    }),
  },
};

const secureSchema = {
  enabled: true,
  mode: "secure",
  compatPlainColumns: true,
} as const;

// The secure columns an operator adds to an existing plain table before
// migrating, typed as the secure schema types them.
const SECURE_COLUMNS = [
  '"to_enc" TEXT',
  '"to_hash" TEXT',
  '"to_masked" TEXT',
  '"from_enc" TEXT',
  '"from_hash" TEXT',
  '"from_masked" TEXT',
  '"metadata_enc" TEXT',
  '"metadata_hashes" JSONB',
  '"crypto_kid" TEXT',
  '"crypto_version" INTEGER NOT NULL DEFAULT 1',
  '"crypto_state" VARCHAR(64)',
  '"retention_class" VARCHAR(64)',
  '"retention_bucket_ym" INTEGER',
];

// postgres.js and Bun.SQL both learn parameter types from the server and
// encode a JSONB parameter with JSON.stringify.
const CLIENTS = {
  "postgres.js": (target: string) => {
    const sql = postgres(target, { max: 1, onnotice: () => {} });
    const client = createCloudflareSqlClient({
      dialect: "postgres",
      query: async <T>(statement: string, params: readonly unknown[] = []) => {
        const rows = await sql.unsafe<T[]>(
          statement,
          params as postgres.ParameterOrJSON<never>[],
        );
        return { rows, rowCount: rows.count };
      },
    });
    return { client, close: () => sql.end() };
  },
  "Bun.SQL": (target: string) => {
    const sql = new SQL({ url: target, max: 1 });
    const client = createCloudflareSqlClient({
      dialect: "postgres",
      query: async <T>(statement: string, params: readonly unknown[] = []) => {
        const result = await sql.unsafe(statement, [...params]);
        return { rows: [...result] as T[], rowCount: result.count };
      },
    });
    return { client, close: () => sql.close() };
  },
} satisfies Record<
  string,
  (target: string) => {
    client: CloudflareSqlClient;
    close: () => Promise<unknown>;
  }
>;

for (const [name, connect] of Object.entries(CLIENTS)) {
  describe.skipIf(!url)(
    `field crypto migration on a real Postgres (${name})`,
    () => {
      const schema = `kmsg_it_fc_${crypto.randomUUID().slice(0, 8)}`;
      let admin: postgres.Sql;
      let client: CloudflareSqlClient;
      let close: () => Promise<unknown>;

      beforeAll(async () => {
        admin = postgres(url ?? "", { max: 1, onnotice: () => {} });
        await admin.unsafe(`CREATE SCHEMA "${schema}"`);
        ({ client, close } = connect(url ?? ""));
        // One connection, so unqualified table names resolve to the test
        // schema in every query.
        await client.query(`SET search_path TO "${schema}"`);
      });

      afterAll(async () => {
        await close();
        await admin.unsafe(`DROP SCHEMA "${schema}" CASCADE`);
        await admin.end();
      });

      test("encrypts plain rows and stores metadata hashes as documents", async () => {
        // Rows written before field crypto was turned on.
        const plain = new HyperdriveDeliveryTrackingStore(client, {
          tableName: TABLE,
        });
        for (let index = 0; index < ROWS; index += 1) {
          const at = new Date(Date.UTC(2026, 0, 1, 0, 0, index));
          await plain.upsert({
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
            metadata: { orderId: `order-${index}` },
          });
        }
        // As postgres.js and Bun.SQL stored JSONB before JSON parameters were
        // cast: the metadata's JSON text as a JSON string.
        await admin.unsafe(
          `UPDATE "${schema}"."${TABLE}" SET "metadata" = to_jsonb("metadata"::text) WHERE "message_id" = 'msg-0'`,
        );
        for (const column of SECURE_COLUMNS) {
          await client.query(`ALTER TABLE "${TABLE}" ADD COLUMN ${column}`);
        }
        await new HyperdriveDeliveryTrackingStore(client, {
          tableName: TABLE,
          fieldCrypto,
          fieldCryptoSchema: secureSchema,
        }).init();

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

        const rows = await admin.unsafe(
          `SELECT "crypto_state", jsonb_typeof("metadata_hashes") AS hashes_type, "metadata_hashes"->>'metadata.orderId' AS order_hash FROM "${schema}"."${TABLE}" ORDER BY "message_id"`,
        );
        expect(rows.map((row) => row.crypto_state)).toEqual(
          Array(ROWS).fill("encrypted"),
        );
        expect(rows.map((row) => row.hashes_type)).toEqual(
          Array(ROWS).fill("object"),
        );
        expect(rows.every((row) => typeof row.order_hash === "string")).toBe(
          true,
        );

        // Only the secure columns are read, so the values have to come from
        // decrypting them.
        const secureOnly = new HyperdriveDeliveryTrackingStore(client, {
          tableName: TABLE,
          fieldCrypto,
          fieldCryptoSchema: { ...secureSchema, compatPlainColumns: false },
          initializeSchema: false,
        });
        expect(await secureOnly.get("msg-2")).toMatchObject({
          to: "01012340002",
          metadata: { orderId: "order-2" },
          cryptoState: "encrypted",
        });
        expect(await secureOnly.get("msg-0")).toMatchObject({
          to: "01012340000",
          metadata: { orderId: "order-0" },
          cryptoState: "encrypted",
        });
      });
    },
  );
}
