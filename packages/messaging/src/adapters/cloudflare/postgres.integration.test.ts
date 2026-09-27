import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import postgres from "postgres";
import { BunSqlDeliveryTrackingStore } from "../../delivery-tracking/stores/bun-sql.store";
import type { TrackingRecord } from "../../delivery-tracking/types";
import { HyperdriveDeliveryTrackingStore } from "./hyperdrive-delivery-tracking.store";
import { HyperdriveJobQueue } from "./hyperdrive-job-queue";
import {
  type CloudflareSqlClient,
  createCloudflareSqlClient,
} from "./sql-client";
import { buildCloudflareSqlSchemaSql } from "./sql-schema";

// Runs against a real Postgres when KMSG_TEST_POSTGRES_URL names one, as a
// superuser: the tests create, and then drop, their own schema and role.
const url = process.env.KMSG_TEST_POSTGRES_URL;

const suffix = crypto.randomUUID().slice(0, 8);
const schema = `kmsg_it_${suffix}`;
const role = `kmsg_it_role_${suffix}`;
const rolePassword = crypto.randomUUID();
const trackingTable = "kmsg_delivery_tracking";
const jobsTable = "kmsg_jobs";

// A client whose unqualified table names resolve to the test schema.
function connect(asRole = false): postgres.Sql {
  const target = new URL(url ?? "");
  if (asRole) {
    target.username = role;
    target.password = rolePassword;
  }
  return postgres(target.toString(), {
    max: 1,
    onnotice: () => {},
    connection: { search_path: schema },
  });
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

function record(messageId: string): TrackingRecord {
  const now = new Date();
  return {
    messageId,
    providerId: "mock",
    providerMessageId: `p-${messageId}`,
    type: "SMS",
    to: "01012345678",
    requestedAt: now,
    status: "SENT",
    statusUpdatedAt: now,
    attemptCount: 0,
    nextCheckAt: now,
    lastError: { code: "E1", message: "first" },
    metadata: { tenant: "t1" },
  };
}

describe.skipIf(!url)("SQL adapters on a real Postgres", () => {
  let admin: postgres.Sql;

  beforeAll(async () => {
    const bootstrap = postgres(url ?? "", { max: 1, onnotice: () => {} });
    await bootstrap.unsafe(`CREATE SCHEMA "${schema}"`);
    await bootstrap.end();
    admin = connect();
  });

  afterAll(async () => {
    await admin.unsafe(`DROP SCHEMA "${schema}" CASCADE`);
    await admin.unsafe(`DROP ROLE IF EXISTS "${role}"`);
    await admin.end();
  });

  test("postgres.js: JSONB columns hold documents SQL can query", async () => {
    const store = new HyperdriveDeliveryTrackingStore(postgresJsClient(admin), {
      tableName: trackingTable,
    });
    await store.upsert(record("m1"));
    await store.patch("m1", { lastError: { code: "E2", message: "second" } });

    const [row] = await admin.unsafe(
      `SELECT "last_error"->>'code' AS code, "metadata"->>'tenant' AS tenant FROM "${trackingTable}" WHERE "message_id" = 'm1'`,
    );
    expect({ code: row?.code, tenant: row?.tenant }).toEqual({
      code: "E2",
      tenant: "t1",
    });
    const stored = await store.get("m1");
    expect(stored?.lastError).toEqual({ code: "E2", message: "second" });
    expect(stored?.metadata).toEqual({ tenant: "t1" });
  });

  test("postgres.js: rows stored as JSON strings still read as objects", async () => {
    const store = new HyperdriveDeliveryTrackingStore(postgresJsClient(admin), {
      tableName: trackingTable,
    });
    await store.upsert(record("m-legacy"));
    await admin.unsafe(
      `UPDATE "${trackingTable}" SET "last_error" = to_jsonb("last_error"::text), "metadata" = to_jsonb("metadata"::text) WHERE "message_id" = 'm-legacy'`,
    );
    const [legacy] = await admin.unsafe(
      `SELECT jsonb_typeof("last_error") AS type FROM "${trackingTable}" WHERE "message_id" = 'm-legacy'`,
    );
    expect(legacy?.type).toBe("string");

    const stored = await store.get("m-legacy");
    expect(stored?.lastError).toEqual({ code: "E1", message: "first" });
    expect(stored?.metadata).toEqual({ tenant: "t1" });
  });

  test("postgres.js: a provider status message longer than 64 characters", async () => {
    const store = new HyperdriveDeliveryTrackingStore(postgresJsClient(admin), {
      tableName: trackingTable,
    });
    await store.upsert(record("m-long"));
    const message =
      "카카오톡 미사용자 또는 채널 차단으로 전송에 실패했습니다. ".repeat(4);

    await store.patch("m-long", { providerStatusMessage: message });

    expect((await store.get("m-long"))?.providerStatusMessage).toBe(message);
  });

  test("Bun.SQL: JSONB columns hold documents SQL can query", async () => {
    const sql = new Bun.SQL({ url: url ?? "", max: 1 });
    try {
      await sql.unsafe(`SET search_path TO "${schema}"`);
      const store = new BunSqlDeliveryTrackingStore({
        sql,
        tableName: trackingTable,
      });
      await store.upsert(record("m-bun"));

      const [row] = await admin.unsafe(
        `SELECT "last_error"->>'code' AS code FROM "${trackingTable}" WHERE "message_id" = 'm-bun'`,
      );
      expect(row?.code).toBe("E1");
      expect((await store.get("m-bun"))?.lastError).toEqual({
        code: "E1",
        message: "first",
      });
    } finally {
      await sql.close();
    }
  });

  test("postgres.js: job data is a document and reads back exactly", async () => {
    const queue = new HyperdriveJobQueue<{ to: string } | string>(
      postgresJsClient(admin),
      jobsTable,
    );
    const job = await queue.enqueue("send", { to: "01012345678" });

    const [row] = await admin.unsafe(
      `SELECT "data"->>'to' AS "to" FROM "${jobsTable}" WHERE "id" = $1`,
      [job.id],
    );
    expect(row?.to).toBe("01012345678");
    // The only due job, so the dequeue order of same-millisecond jobs does
    // not matter.
    expect((await queue.dequeue())?.data).toEqual({ to: "01012345678" });

    // Strings, including ones that look like JSON, read back as strings.
    for (const data of ["01012345678", '{"x":1}', "[1,2]", "12345", "true"]) {
      const text = await queue.enqueue("send", data);
      expect((await queue.getJob(text.id))?.data).toBe(data);
    }
  });

  test("postgres.js: NUL and unpaired surrogates are stored as U+FFFD", async () => {
    const store = new HyperdriveDeliveryTrackingStore(postgresJsClient(admin), {
      tableName: trackingTable,
    });
    await store.upsert({
      ...record("m-nul"),
      lastError: { code: "E1", message: "bad\uD800byte" },
      metadata: { note: "a\u0000b" },
    });

    const stored = await store.get("m-nul");
    expect(stored?.lastError).toEqual({ code: "E1", message: "bad\uFFFDbyte" });
    expect(stored?.metadata).toEqual({ note: "a\uFFFDb" });
  });

  test("initializeSchema: false works for a role that cannot create tables", async () => {
    await admin.unsafe(
      buildCloudflareSqlSchemaSql({ dialect: "postgres", target: "both" }),
    );
    await admin.unsafe(
      `CREATE ROLE "${role}" LOGIN PASSWORD '${rolePassword}'`,
    );
    await admin.unsafe(`GRANT USAGE ON SCHEMA "${schema}" TO "${role}"`);
    await admin.unsafe(
      `GRANT SELECT, INSERT, UPDATE, DELETE ON "${trackingTable}", "${jobsTable}" TO "${role}"`,
    );

    const app = connect(true);
    try {
      await expect(
        new HyperdriveDeliveryTrackingStore(postgresJsClient(app)).init(),
      ).rejects.toThrow(`permission denied for schema ${schema}`);

      const store = new HyperdriveDeliveryTrackingStore(postgresJsClient(app), {
        initializeSchema: false,
      });
      await store.upsert(record("m-role"));
      expect((await store.get("m-role"))?.lastError?.code).toBe("E1");
    } finally {
      await app.end();
    }
  });
});
