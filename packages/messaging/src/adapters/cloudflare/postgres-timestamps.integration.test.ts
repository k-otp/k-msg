import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import postgres from "postgres";
import { BunSqlDeliveryTrackingStore } from "../../delivery-tracking/stores/bun-sql.store";
import type { TrackingRecord } from "../../delivery-tracking/types";
import { HyperdriveDeliveryTrackingStore } from "./hyperdrive-delivery-tracking.store";
import {
  type CloudflareSqlClient,
  createCloudflareSqlClient,
} from "./sql-client";
import { buildDeliveryTrackingSchemaSql } from "./sql-schema";

// Runs against a real Postgres when KMSG_TEST_POSTGRES_URL names one. The
// tests create, and then drop, their own schema.
const url = process.env.KMSG_TEST_POSTGRES_URL;
const schema = `kmsg_ts_${crypto.randomUUID().slice(0, 8)}`;

const TIME_COLUMNS = [
  "requested_at",
  "status_updated_at",
  "next_check_at",
  "sent_at",
  "delivered_at",
  "failed_at",
  "last_checked_at",
  "scheduled_at",
];

// About 1.8e12, far past the 32-bit INTEGER maximum of 2147483647.
const requestedAt = new Date("2026-09-27T01:02:03.456Z");
const later = (ms: number) => new Date(requestedAt.getTime() + ms);

function record(messageId: string): TrackingRecord {
  return {
    messageId,
    providerId: "mock",
    providerMessageId: `p-${messageId}`,
    type: "SMS",
    to: "01012345678",
    status: "SENT",
    requestedAt,
    sentAt: later(1),
    statusUpdatedAt: later(1),
    attemptCount: 0,
    nextCheckAt: later(60_000),
  };
}

function postgresJsClient(sql: postgres.Sql): CloudflareSqlClient {
  return createCloudflareSqlClient({
    dialect: "postgres",
    query: async <T>(statement: string, params: readonly unknown[] = []) => {
      const rows = await sql.unsafe<T[]>(
        statement,
        params as postgres.ParameterOrJSON<never>[],
      );
      return { rows, rowCount: rows.count };
    },
  });
}

describe.skipIf(!url)("timestamp: integer on a real Postgres", () => {
  let admin: postgres.Sql;

  beforeAll(async () => {
    const bootstrap = postgres(url ?? "", { max: 1, onnotice: () => {} });
    await bootstrap.unsafe(`CREATE SCHEMA "${schema}"`);
    await bootstrap.end();
    admin = postgres(url ?? "", {
      max: 1,
      onnotice: () => {},
      connection: { search_path: schema },
    });
  });

  afterAll(async () => {
    await admin.unsafe(`DROP SCHEMA "${schema}" CASCADE`);
    await admin.end();
  });

  async function timeColumnTypes(table: string): Promise<string[]> {
    const rows = await admin.unsafe<{ data_type: string }[]>(
      `SELECT DISTINCT data_type FROM information_schema.columns
       WHERE table_schema = $1 AND table_name = $2 AND column_name = ANY($3)`,
      [schema, table, TIME_COLUMNS],
    );
    return rows.map((row) => row.data_type);
  }

  // Stores, filters on, and reads back every time column to the millisecond.
  async function expectMillisecondRoundTrip(
    store: BunSqlDeliveryTrackingStore | HyperdriveDeliveryTrackingStore,
    messageId: string,
  ): Promise<void> {
    await store.upsert(record(messageId));

    const due = async (now: Date) =>
      (await store.listDue(now, 10)).map((entry) => entry.messageId);
    expect(await due(later(59_999))).toEqual([]);
    expect(await due(later(60_000))).toEqual([messageId]);

    await store.patch(messageId, {
      status: "DELIVERED",
      deliveredAt: later(2_345),
      statusUpdatedAt: later(2_345),
      lastCheckedAt: later(2_000),
    });

    const stored = await store.get(messageId);
    expect(stored?.requestedAt).toEqual(requestedAt);
    expect(stored?.sentAt).toEqual(later(1));
    expect(stored?.deliveredAt).toEqual(later(2_345));
    expect(stored?.statusUpdatedAt).toEqual(later(2_345));
    expect(stored?.lastCheckedAt).toEqual(later(2_000));

    const matching = await store.listRecords({
      requestedAtFrom: requestedAt,
      requestedAtTo: requestedAt,
      statusUpdatedAtFrom: later(2_345),
      limit: 10,
    });
    expect(matching.map((match) => match.messageId)).toEqual([messageId]);
  }

  test("Bun.SQL: BIGINT time columns hold epoch milliseconds", async () => {
    const sql = new Bun.SQL({ url: url ?? "", max: 1 });
    try {
      await sql.unsafe(`SET search_path TO "${schema}"`);
      const store = new BunSqlDeliveryTrackingStore({
        sql,
        tableName: "tracking_bun",
        typeStrategy: { timestamp: "integer" },
      });

      await expectMillisecondRoundTrip(store, "m-bun");
      expect(await timeColumnTypes("tracking_bun")).toEqual(["bigint"]);
    } finally {
      await sql.close();
    }
  });

  test("postgres.js: BIGINT time columns hold epoch milliseconds", async () => {
    const store = new HyperdriveDeliveryTrackingStore(postgresJsClient(admin), {
      tableName: "tracking_pgjs",
      typeStrategy: { timestamp: "integer" },
    });

    await expectMillisecondRoundTrip(store, "m-pgjs");
    expect(await timeColumnTypes("tracking_pgjs")).toEqual(["bigint"]);
  });

  test("a table with 32-bit time columns works once they are widened", async () => {
    // Earlier versions built this table for timestamp: "integer"; it differs
    // from the default schema only in INTEGER time columns. Its indexes need
    // names of their own: index names are per schema, and the tables above
    // already took the defaults.
    await admin.unsafe(
      buildDeliveryTrackingSchemaSql({
        dialect: "postgres",
        tableName: "tracking_int4",
        indexNames: {
          due: "tracking_int4_due",
          providerMessage: "tracking_int4_provider_msg",
          requestedAt: "tracking_int4_requested_at",
        },
      }).replaceAll(" BIGINT", " INTEGER"),
    );
    expect(await timeColumnTypes("tracking_int4")).toEqual(["integer"]);
    const store = new HyperdriveDeliveryTrackingStore(postgresJsClient(admin), {
      tableName: "tracking_int4",
      typeStrategy: { timestamp: "integer" },
    });
    await expect(store.upsert(record("m-int4"))).rejects.toThrow(
      "out of range",
    );

    // The upgrade the README gives for these tables.
    await admin.unsafe(
      `ALTER TABLE "tracking_int4" ${TIME_COLUMNS.map(
        (column) => `ALTER COLUMN "${column}" TYPE BIGINT`,
      ).join(", ")}`,
    );

    await expectMillisecondRoundTrip(store, "m-int4");
    expect(await timeColumnTypes("tracking_int4")).toEqual(["bigint"]);
  });
});
