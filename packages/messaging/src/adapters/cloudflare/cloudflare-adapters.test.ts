import { Database } from "bun:sqlite";
import { describe, expect, test } from "bun:test";
import { JobStatus } from "../../queue/job-queue.interface";
import {
  HyperdriveDeliveryTrackingStore,
  type HyperdriveDeliveryTrackingStoreConfig,
} from "./hyperdrive-delivery-tracking.store";
import { HyperdriveJobQueue } from "./hyperdrive-job-queue";
import {
  CloudflareObjectDeliveryTrackingStore,
  CloudflareObjectJobQueue,
  createD1DeliveryTrackingStore,
  createD1JobQueue,
  createDrizzleDeliveryTrackingStore,
  createDrizzleJobQueue,
  createDurableObjectDeliveryTrackingStore,
  createDurableObjectJobQueue,
  createKvDeliveryTrackingStore,
  createKvJobQueue,
  createR2DeliveryTrackingStore,
  createR2JobQueue,
} from "./index";
import { createDurableObjectStorage } from "./object-storage";
import type { CloudflareSqlClient, D1DatabaseLike } from "./sql-client";
import {
  createD1SqlClient,
  createDrizzleSqlClient,
  runCloudflareSqlTransaction,
} from "./sql-client";

type CapturedQuery = { sql: string; params: readonly unknown[] };

// The client interface is generic over row types; these stubs return fixed rows.
function stubSqlClient(
  dialect: CloudflareSqlClient["dialect"],
  query: (
    sql: string,
    params?: readonly unknown[],
  ) => Promise<{ rows: unknown[]; rowCount?: number }>,
): CloudflareSqlClient {
  return { dialect, query: query as CloudflareSqlClient["query"] };
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function readRenderedDrizzleQuery(
  query: unknown,
): { sql: string; params: unknown[] } | undefined {
  if (typeof query !== "object" || query === null) return undefined;
  const getSQL = (query as { getSQL?: () => unknown }).getSQL;
  if (typeof getSQL !== "function") return undefined;

  const sqlQuery = getSQL();
  if (typeof sqlQuery !== "object" || sqlQuery === null) return undefined;
  const toQuery = (sqlQuery as { toQuery?: (config: unknown) => unknown })
    .toQuery;
  if (typeof toQuery !== "function") return undefined;

  const rendered = toQuery({});
  if (typeof rendered !== "object" || rendered === null) return undefined;

  const sql = (rendered as { sql?: unknown }).sql;
  const params = (rendered as { params?: unknown }).params;
  if (typeof sql !== "string" || !Array.isArray(params)) return undefined;

  return { sql, params: [...params] };
}

function createCapturingSqlClient(dialect: CloudflareSqlClient["dialect"]): {
  client: CloudflareSqlClient;
  queries: CapturedQuery[];
} {
  const queries: CapturedQuery[] = [];
  const client = stubSqlClient(dialect, async (sql, params = []) => {
    queries.push({ sql, params });
    if (/SELECT COUNT\(1\)/i.test(sql)) {
      return { rows: [{ count: 0 }] };
    }
    return { rows: [] };
  });
  return { client, queries };
}

type InsertedColumn = { column: string; type: string; value: unknown };

// Each column of the first captured INSERT, with the type the captured
// CREATE TABLE gives it and the value bound to it.
function readInsertedColumns(
  queries: readonly CapturedQuery[],
): InsertedColumn[] {
  const ddl =
    queries.find((query) => query.sql.includes("CREATE TABLE"))?.sql ?? "";
  const insert = queries.find((query) => query.sql.includes("INSERT INTO"));
  const columns = (/\(([^)]*)\) VALUES/.exec(insert?.sql ?? "")?.[1] ?? "")
    .split(", ")
    .map((column) => column.slice(1, -1));
  return columns.map((column, index) => ({
    column,
    type: new RegExp(`[\`"]${column}[\`"] (\\w+)`).exec(ddl)?.[1] ?? "",
    value: insert?.params[index],
  }));
}

// INTEGER is 32-bit on Postgres and MySQL, 64-bit on SQLite.
function fitsColumn(
  dialect: CloudflareSqlClient["dialect"],
  { type, value }: InsertedColumn,
): boolean {
  if (type === "TIMESTAMPTZ") return value instanceof Date;
  if (typeof value !== "number" || !Number.isSafeInteger(value)) return false;
  return (
    type === "BIGINT" ||
    (type === "INTEGER" && (dialect === "sqlite" || Math.abs(value) < 2 ** 31))
  );
}

function createMemoryHyperdriveJobSqlClient(): {
  client: CloudflareSqlClient;
  rows: Map<string, Record<string, unknown>>;
} {
  const rows = new Map<string, Record<string, unknown>>();

  const client = stubSqlClient("sqlite", async (sql, params = []) => {
    if (/CREATE TABLE|CREATE INDEX/i.test(sql)) {
      return { rows: [] };
    }

    if (/INSERT INTO/i.test(sql)) {
      const [
        id,
        type,
        data,
        status,
        priority,
        attempts,
        maxAttempts,
        delay,
        createdAt,
        processAt,
        completedAt,
        failedAt,
        error,
        metadata,
      ] = params;
      rows.set(String(id), {
        id,
        type,
        data,
        status,
        priority,
        attempts,
        max_attempts: maxAttempts,
        delay,
        created_at: createdAt,
        process_at: processAt,
        completed_at: completedAt,
        failed_at: failedAt,
        error,
        metadata,
      });
      return { rows: [], rowCount: 1 };
    }

    if (/SELECT .* FROM .*WHERE .*"id" = .*LIMIT 1/is.test(sql)) {
      const row = rows.get(String(params[0]));
      return { rows: row ? [row] : [] };
    }

    if (/SELECT .*"id".*WHERE .*"status" IN/is.test(sql)) {
      const statusSet = new Set(params.map((value) => String(value)));
      const matchingRows = Array.from(rows.values())
        .filter((row) => statusSet.has(String(row.status ?? "")))
        .map((row) => ({ id: row.id }));
      return { rows: matchingRows };
    }

    if (/UPDATE .*SET .*"process_at".*WHERE .*"id" =/is.test(sql)) {
      const [status, attempts, processAt, error, jobId] = params;
      const row = rows.get(String(jobId));
      if (!row) {
        return { rows: [], rowCount: 0 };
      }

      rows.set(String(jobId), {
        ...row,
        status,
        attempts,
        process_at: processAt,
        error,
      });
      return { rows: [], rowCount: 1 };
    }

    if (/DELETE FROM .*WHERE .*"status" IN/is.test(sql)) {
      const statusSet = new Set(params.map((value) => String(value)));
      let removed = 0;
      for (const [jobId, row] of rows) {
        if (!statusSet.has(String(row.status ?? ""))) {
          continue;
        }
        rows.delete(jobId);
        removed++;
      }
      return { rows: [], rowCount: removed };
    }

    return { rows: [] };
  });

  return { client, rows };
}

function createMemoryObjectStorage() {
  const map = new Map<string, string>();
  return {
    async get(key: string): Promise<string | null> {
      return map.has(key) ? (map.get(key) ?? null) : null;
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

describe("Cloudflare SQL adapters", () => {
  test("createD1SqlClient executes prepared statements with bound params", async () => {
    const calls: Array<{ sql: string; params: unknown[] }> = [];
    const db = {
      prepare(sql: string) {
        let params: unknown[] = [];
        return {
          bind(...values: unknown[]) {
            params = values;
            return this;
          },
          async all() {
            calls.push({ sql, params });
            return { results: [{ ok: true }], meta: { changes: 1 } };
          },
        };
      },
    };

    const client = createD1SqlClient(db as unknown as D1DatabaseLike);
    const result = await client.query<{ ok: boolean }>(
      "SELECT * FROM t WHERE id = ?",
      [1],
    );

    expect(result.rows[0]?.ok).toBe(true);
    expect(calls[0]?.sql).toContain("SELECT * FROM t");
    expect(calls[0]?.params).toEqual([1]);
  });

  test("createD1SqlClient runs a failed statement once and rethrows its error", async () => {
    const failure = new Error(
      "D1_ERROR: UNIQUE constraint failed: kmsg_jobs.id",
    );
    const calls = { all: 0, run: 0 };
    const db = {
      prepare() {
        const statement = {
          bind() {
            return statement;
          },
          async all() {
            calls.all += 1;
            throw failure;
          },
          async run() {
            calls.run += 1;
            return { success: true, meta: { changes: 1 } };
          },
        };
        return statement;
      },
    };

    const client = createD1SqlClient(db as unknown as D1DatabaseLike);

    await expect(
      client.query("INSERT INTO kmsg_jobs (id) VALUES (?)", ["job-1"]),
    ).rejects.toBe(failure);
    // Running it again could apply a write twice, or report success for a
    // statement that failed.
    expect(calls).toEqual({ all: 1, run: 0 });
  });

  test("createD1SqlClient keeps the error of a statement without run()", async () => {
    const failure = new Error("D1_ERROR: no such table: kmsg_jobs");
    const db = {
      prepare() {
        const statement = {
          bind() {
            return statement;
          },
          async all(): Promise<never> {
            throw failure;
          },
        };
        return statement;
      },
    };

    const client = createD1SqlClient(db as unknown as D1DatabaseLike);

    await expect(client.query("SELECT * FROM kmsg_jobs")).rejects.toBe(failure);
  });

  test("SQL tracking stores skip schema setup with initializeSchema: false", async () => {
    const d1Statements: string[] = [];
    const d1 = {
      prepare(sql: string) {
        d1Statements.push(sql);
        const statement = {
          bind() {
            return statement;
          },
          async all() {
            return { results: [] };
          },
        };
        return statement;
      },
    };
    const d1Store = createD1DeliveryTrackingStore(
      d1 as unknown as D1DatabaseLike,
      { initializeSchema: false },
    );
    await d1Store.init();
    expect(await d1Store.get("m1")).toBeUndefined();
    expect(d1Statements).toHaveLength(1);
    expect(d1Statements[0]).toStartWith("SELECT");

    const postgres = createCapturingSqlClient("postgres");
    const hyperdriveStore = new HyperdriveDeliveryTrackingStore(
      postgres.client,
      { initializeSchema: false },
    );
    await hyperdriveStore.listDue(new Date(), 10);
    expect(postgres.queries.map((query) => query.sql)).toEqual([
      expect.stringMatching(/^SELECT/),
    ]);

    const drizzleQueries: unknown[] = [];
    const drizzleStore = createDrizzleDeliveryTrackingStore({
      dialect: "postgres",
      db: {
        execute(query: unknown) {
          drizzleQueries.push(query);
          return [];
        },
      },
      initializeSchema: false,
    });
    await drizzleStore.init();
    expect(drizzleQueries).toHaveLength(0);

    // The default still creates the table and indexes on first use.
    const defaults = createCapturingSqlClient("postgres");
    await new HyperdriveDeliveryTrackingStore(defaults.client).get("m1");
    expect(
      defaults.queries.some((query) => /^\s*CREATE TABLE/.test(query.sql)),
    ).toBe(true);
  });

  test("SQL tracking stores create indexes under the configured names", async () => {
    // Field crypto adds the hash and retention indexes, so the test sets all
    // six names, half through each option.
    const options: HyperdriveDeliveryTrackingStoreConfig = {
      indexNames: {
        due: "otp_due",
        providerMessage: "otp_provider_msg",
        requestedAt: "otp_requested_at",
      },
      trackingIndexNames: {
        toHash: "otp_to_hash",
        fromHash: "otp_from_hash",
        retentionBucket: "otp_retention_bucket",
      },
      fieldCrypto: {
        config: {
          enabled: true,
          fields: { to: "encrypt+hash", from: "encrypt+hash" },
          provider: {
            encrypt: async ({ value }) => ({ ciphertext: value }),
            decrypt: async ({ ciphertext }) => ciphertext,
            hash: async ({ value }) => `h:${value}`,
          },
        },
      },
    };
    const expected = [
      "otp_due",
      "otp_provider_msg",
      "otp_requested_at",
      "otp_to_hash",
      "otp_from_hash",
      "otp_retention_bucket",
    ];
    const indexNamesIn = (statements: readonly string[]) =>
      statements.flatMap((sql) => {
        const match = /^\s*CREATE INDEX (?:IF NOT EXISTS )?"([^"]+)"/.exec(sql);
        return match ? [match[1]] : [];
      });

    const postgres = createCapturingSqlClient("postgres");
    await new HyperdriveDeliveryTrackingStore(postgres.client, options).init();
    expect(indexNamesIn(postgres.queries.map((query) => query.sql))).toEqual(
      expected,
    );

    const d1Statements: string[] = [];
    const d1 = {
      prepare(sql: string) {
        d1Statements.push(sql);
        const statement = {
          bind() {
            return statement;
          },
          async all() {
            return { results: [] };
          },
        };
        return statement;
      },
    };
    await createD1DeliveryTrackingStore(
      d1 as unknown as D1DatabaseLike,
      options,
    ).init();
    expect(indexNamesIn(d1Statements)).toEqual(expected);

    // Statements without parameters reach Drizzle as plain strings.
    const drizzleStatements: string[] = [];
    await createDrizzleDeliveryTrackingStore({
      ...options,
      dialect: "postgres",
      db: {
        execute(query: unknown) {
          drizzleStatements.push(String(query));
          return [];
        },
      },
    }).init();
    expect(indexNamesIn(drizzleStatements)).toEqual(expected);
  });

  test("HyperdriveDeliveryTrackingStore uses dialect-specific upsert SQL", async () => {
    const postgres = createCapturingSqlClient("postgres");
    const mysql = createCapturingSqlClient("mysql");

    const pgStore = new HyperdriveDeliveryTrackingStore(postgres.client);
    const myStore = new HyperdriveDeliveryTrackingStore(mysql.client);

    const record = {
      messageId: "m1",
      providerId: "iwinv",
      providerMessageId: "p1",
      type: "SMS" as const,
      to: "01012345678",
      status: "SENT" as const,
      requestedAt: new Date(),
      statusUpdatedAt: new Date(),
      attemptCount: 0,
      nextCheckAt: new Date(),
    };

    await pgStore.upsert(record);
    await myStore.upsert(record);

    const pgSql =
      postgres.queries.find((query) => query.sql.includes("INSERT INTO"))
        ?.sql ?? "";
    const mySql =
      mysql.queries.find((query) => query.sql.includes("INSERT INTO"))?.sql ??
      "";

    expect(pgSql).toContain("ON CONFLICT");
    expect(pgSql).toContain("$1");
    expect(mySql).toContain("ON DUPLICATE KEY UPDATE");
    expect(mySql).toContain("?");
  });

  test("HyperdriveDeliveryTrackingStore binds Date values for postgres date timestamp strategy", async () => {
    const postgres = createCapturingSqlClient("postgres");
    const store = new HyperdriveDeliveryTrackingStore(postgres.client, {
      typeStrategy: {
        timestamp: "date",
      },
    });

    const now = new Date();
    const record = {
      messageId: "m-date",
      providerId: "iwinv",
      providerMessageId: "p-date",
      type: "SMS" as const,
      to: "01012345678",
      status: "SENT" as const,
      requestedAt: now,
      statusUpdatedAt: now,
      attemptCount: 0,
      nextCheckAt: now,
    };

    await store.upsert(record);
    await store.listDue(now, 10);

    const insertParams =
      postgres.queries.find((query) => query.sql.includes("INSERT INTO"))
        ?.params ?? [];
    const dueParams =
      postgres.queries.find(
        (query) =>
          query.sql.startsWith("SELECT") &&
          query.sql.includes('"next_check_at" <='),
      )?.params ?? [];

    expect(insertParams.some((value) => value instanceof Date)).toBe(true);
    expect(dueParams.some((value) => value instanceof Date)).toBe(true);
  });

  test("HyperdriveDeliveryTrackingStore binds times that fit the columns it creates", async () => {
    const now = new Date();
    const mismatches: string[] = [];
    for (const dialect of ["postgres", "mysql", "sqlite"] as const) {
      for (const timestamp of ["bigint", "integer", "date"] as const) {
        const { client, queries } = createCapturingSqlClient(dialect);
        const store = new HyperdriveDeliveryTrackingStore(client, {
          typeStrategy: { timestamp },
        });
        await store.upsert({
          messageId: "m-time",
          providerId: "iwinv",
          providerMessageId: "p-time",
          type: "SMS",
          to: "01012345678",
          status: "DELIVERED",
          requestedAt: now,
          scheduledAt: now,
          sentAt: now,
          deliveredAt: now,
          failedAt: now,
          lastCheckedAt: now,
          statusUpdatedAt: now,
          attemptCount: 1,
          nextCheckAt: now,
        });

        for (const inserted of readInsertedColumns(queries)) {
          if (
            inserted.column.endsWith("_at") &&
            !fitsColumn(dialect, inserted)
          ) {
            mismatches.push(
              `${dialect}/${timestamp}: ${inserted.column} ${inserted.type}`,
            );
          }
        }
      }
    }

    expect(mismatches).toEqual([]);
  });

  test("HyperdriveJobQueue binds numbers that fit the columns it creates", async () => {
    const mismatches: string[] = [];
    for (const dialect of ["postgres", "mysql", "sqlite"] as const) {
      const { client, queries } = createCapturingSqlClient(dialect);
      // Thirty days, past the 2^31 ms a 32-bit INTEGER holds.
      await new HyperdriveJobQueue(client).enqueue(
        "send",
        { to: "01012345678" },
        { delay: 30 * 86_400_000, priority: 5 },
      );

      for (const inserted of readInsertedColumns(queries)) {
        if (
          typeof inserted.value === "number" &&
          !fitsColumn(dialect, inserted)
        ) {
          mismatches.push(`${dialect}: ${inserted.column} ${inserted.type}`);
        }
      }
    }

    expect(mismatches).toEqual([]);
  });

  test("HyperdriveDeliveryTrackingStore toggles raw column by storeRaw option", async () => {
    const withoutRaw = createCapturingSqlClient("sqlite");
    const withRaw = createCapturingSqlClient("sqlite");

    const withoutRawStore = new HyperdriveDeliveryTrackingStore(
      withoutRaw.client,
    );
    const withRawStore = new HyperdriveDeliveryTrackingStore(withRaw.client, {
      storeRaw: true,
    });

    const record = {
      messageId: "m-raw",
      providerId: "iwinv",
      providerMessageId: "p-raw",
      type: "SMS" as const,
      to: "01012345678",
      status: "SENT" as const,
      requestedAt: new Date(),
      statusUpdatedAt: new Date(),
      attemptCount: 0,
      nextCheckAt: new Date(),
      raw: { sample: true },
    };

    await withoutRawStore.upsert(record);
    await withRawStore.upsert(record);

    const withoutRawSql =
      withoutRaw.queries.find((query) => query.sql.includes("INSERT INTO"))
        ?.sql ?? "";
    const withRawSql =
      withRaw.queries.find((query) => query.sql.includes("INSERT INTO"))?.sql ??
      "";

    expect(withoutRawSql).not.toContain('"raw"');
    expect(withRawSql).toContain('"raw"');
  });

  test("createDrizzleSqlClient normalizes execute results and wraps transactions", async () => {
    const calls: unknown[] = [];
    const txCalls: unknown[] = [];

    const txDb = {
      async execute(query: unknown) {
        txCalls.push(query);
        return [{ id: "tx" }];
      },
    };

    const db = {
      async execute(query: unknown) {
        calls.push(query);
        return { rows: [{ id: "root" }], rowCount: 7 };
      },
      async transaction<T>(fn: (tx: unknown) => Promise<T>): Promise<T> {
        return fn(txDb);
      },
    };

    const client = createDrizzleSqlClient({
      dialect: "postgres",
      db,
    });

    const first = await client.query<{ id: string }>("SELECT 1");
    expect(first.rows[0]?.id).toBe("root");
    expect(first.rowCount).toBe(7);

    const second = await runCloudflareSqlTransaction(client, async (tx) => {
      const result = await tx.query<{ id: string }>("SELECT 2", [2]);
      return result.rows[0]?.id;
    });

    expect(second).toBe("tx");
    expect(calls[0]).toBe("SELECT 1");
    expect(readRenderedDrizzleQuery(txCalls[0])).toEqual({
      sql: "SELECT 2",
      params: [2],
    });
  });

  test("runCloudflareSqlTransaction works with and without transaction function", async () => {
    let called = false;

    const withTransaction: CloudflareSqlClient = {
      dialect: "postgres",
      query: async () => ({ rows: [] }),
      transaction: async (fn) => {
        called = true;
        return fn(withTransaction);
      },
    };

    const withoutTransaction: CloudflareSqlClient = {
      dialect: "postgres",
      query: async () => ({ rows: [] }),
    };

    const first = await runCloudflareSqlTransaction(
      withTransaction,
      async () => 1,
    );
    const second = await runCloudflareSqlTransaction(
      withoutTransaction,
      async () => 2,
    );

    expect(called).toBe(true);
    expect(first).toBe(1);
    expect(second).toBe(2);
  });

  test("HyperdriveJobQueue can enqueue and query size via injected SQL client", async () => {
    const { client } = createCapturingSqlClient("sqlite");
    const queue = new HyperdriveJobQueue<{ hello: string }>(client);

    await queue.init();
    await queue.enqueue("test", { hello: "world" });
    const size = await queue.size();

    expect(typeof size).toBe("number");
  });

  test("HyperdriveJobQueue takes the table name as a string or in options", async () => {
    const fromString = createCapturingSqlClient("postgres");
    const fromOptions = createCapturingSqlClient("postgres");
    await new HyperdriveJobQueue(fromString.client, "custom_jobs").size();
    await new HyperdriveJobQueue(fromOptions.client, {
      tableName: "custom_jobs",
    }).size();

    const statements = fromString.queries.map((query) => query.sql);
    expect(statements[0]).toContain('CREATE TABLE IF NOT EXISTS "custom_jobs"');
    expect(statements.at(-1)).toContain('FROM "custom_jobs"');
    expect(fromOptions.queries.map((query) => query.sql)).toEqual(statements);
  });

  test("SQL job queues skip schema setup with initializeSchema: false", async () => {
    const postgres = createCapturingSqlClient("postgres");
    const hyperdriveQueue = new HyperdriveJobQueue(postgres.client, {
      initializeSchema: false,
    });
    await hyperdriveQueue.init();
    expect(await hyperdriveQueue.size()).toBe(0);
    expect(postgres.queries.map((query) => query.sql)).toEqual([
      expect.stringMatching(/^SELECT COUNT\(1\)/),
    ]);

    const d1Statements: string[] = [];
    const d1 = {
      prepare(sql: string) {
        d1Statements.push(sql);
        const statement = {
          bind() {
            return statement;
          },
          async all() {
            return { results: [] };
          },
        };
        return statement;
      },
    };
    const d1Queue = createD1JobQueue(d1 as unknown as D1DatabaseLike, {
      tableName: "custom_jobs",
      initializeSchema: false,
    });
    expect(await d1Queue.getJob("job-1")).toBeUndefined();
    expect(d1Statements).toEqual([
      expect.stringMatching(/^SELECT .* FROM "custom_jobs"/s),
    ]);

    const drizzleStatements: unknown[] = [];
    const drizzleQueue = createDrizzleJobQueue({
      dialect: "postgres",
      db: {
        execute(query: unknown) {
          drizzleStatements.push(query);
          return [];
        },
      },
      renderQuery: ({ sql }) => sql,
      tableName: "custom_jobs",
      initializeSchema: false,
    });
    expect(await drizzleQueue.size()).toBe(0);
    expect(drizzleStatements).toEqual([
      expect.stringMatching(/^SELECT COUNT\(1\) as count FROM "custom_jobs"/),
    ]);

    // The default still creates the table and indexes on first use.
    const defaults = createCapturingSqlClient("postgres");
    await new HyperdriveJobQueue(defaults.client).size();
    expect(defaults.queries.map((query) => query.sql.trim())).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^CREATE TABLE IF NOT EXISTS "kmsg_jobs"/),
        expect.stringMatching(/^CREATE INDEX IF NOT EXISTS/),
      ]),
    );
  });

  test("SQL job queues create indexes under the configured names", async () => {
    const indexNames = { dequeue: "otp_jobs_dequeue", id: "otp_jobs_id" };

    // Index names are unique per SQLite database, so a second queue table
    // needs its own to get any indexes.
    const db = new Database(":memory:");
    const sqlite = stubSqlClient("sqlite", async (sql) => {
      db.run(sql);
      return { rows: [] };
    });
    await new HyperdriveJobQueue(sqlite).init();
    await new HyperdriveJobQueue(sqlite, {
      tableName: "otp_jobs",
      indexNames,
    }).init();
    expect(
      db
        .query(
          "SELECT tbl_name, name FROM sqlite_master WHERE type = 'index' AND name NOT LIKE 'sqlite_%' ORDER BY tbl_name, name",
        )
        .all(),
    ).toEqual([
      { tbl_name: "kmsg_jobs", name: "idx_kmsg_jobs_dequeue" },
      { tbl_name: "kmsg_jobs", name: "idx_kmsg_jobs_id" },
      { tbl_name: "otp_jobs", name: "otp_jobs_dequeue" },
      { tbl_name: "otp_jobs", name: "otp_jobs_id" },
    ]);
    db.close();

    const indexNamesIn = (statements: readonly string[]) =>
      statements.flatMap((sql) => {
        const match = /^\s*CREATE INDEX (?:IF NOT EXISTS )?"([^"]+)"/.exec(sql);
        return match ? [match[1]] : [];
      });

    const d1Statements: string[] = [];
    const d1 = {
      prepare(sql: string) {
        d1Statements.push(sql);
        const statement = {
          bind() {
            return statement;
          },
          async all() {
            return { results: [] };
          },
        };
        return statement;
      },
    };
    await createD1JobQueue(d1 as unknown as D1DatabaseLike, {
      tableName: "otp_jobs",
      indexNames,
    }).init();
    expect(indexNamesIn(d1Statements)).toEqual([
      "otp_jobs_dequeue",
      "otp_jobs_id",
    ]);

    // Statements without parameters reach Drizzle as plain strings.
    const drizzleStatements: string[] = [];
    await createDrizzleJobQueue({
      dialect: "postgres",
      db: {
        execute(query: unknown) {
          drizzleStatements.push(String(query));
          return [];
        },
      },
      tableName: "otp_jobs",
      indexNames,
    }).init();
    expect(indexNamesIn(drizzleStatements)).toEqual([
      "otp_jobs_dequeue",
      "otp_jobs_id",
    ]);
  });

  test("HyperdriveJobQueue stores retry delay in process_at", async () => {
    const { client } = createMemoryHyperdriveJobSqlClient();
    const queue = new HyperdriveJobQueue<{ hello: string }>(client);

    const job = await queue.enqueue("test", { hello: "world" });
    const beforeRetry = Date.now();

    await queue.fail(job.id, "temporary failure", {
      enabled: true,
      delayMs: 80,
    });

    const retriedJob = await queue.getJob(job.id);
    expect(retriedJob?.status).toBe(JobStatus.PENDING);
    expect(retriedJob?.attempts).toBe(1);
    expect(retriedJob?.processAt.getTime()).toBeGreaterThanOrEqual(
      beforeRetry + 60,
    );
  });

  test("HyperdriveJobQueue cleanupTerminal removes only completed and failed jobs", async () => {
    const { client, rows } = createMemoryHyperdriveJobSqlClient();
    const queue = new HyperdriveJobQueue<{ hello: string }>(client);

    const completed = await queue.enqueue("completed", { hello: "done" });
    const failed = await queue.enqueue("failed", { hello: "boom" });
    const pending = await queue.enqueue(
      "pending",
      { hello: "keep" },
      { delay: 1000 },
    );

    const completedRow = rows.get(completed.id);
    const failedRow = rows.get(failed.id);
    if (!completedRow || !failedRow) {
      throw new Error("Expected test rows to exist");
    }

    rows.set(completed.id, {
      ...completedRow,
      status: "completed",
      completed_at: Date.now(),
    });
    rows.set(failed.id, {
      ...failedRow,
      status: "failed",
      failed_at: Date.now(),
      error: "boom",
    });

    const removed = await queue.cleanupTerminal();

    expect(removed).toBe(2);
    expect(await queue.getJob(completed.id)).toBeUndefined();
    expect(await queue.getJob(failed.id)).toBeUndefined();
    expect((await queue.getJob(pending.id))?.status).toBe(JobStatus.PENDING);
  });

  test("HyperdriveDeliveryTrackingStore retries init after init failure", async () => {
    let shouldFail = true;
    const client = stubSqlClient("sqlite", async (sql) => {
      if (shouldFail && sql.includes("CREATE TABLE")) {
        shouldFail = false;
        throw new Error("failed to create table");
      }
      return { rows: [] };
    });

    const store = new HyperdriveDeliveryTrackingStore(client);

    await expect(store.init()).rejects.toThrow("failed to create table");
    const result = await store.get("m1");
    expect(result).toBeUndefined();
  });

  test("HyperdriveJobQueue retries init after init failure", async () => {
    let shouldFail = true;
    const client = stubSqlClient("sqlite", async (sql) => {
      if (shouldFail && sql.includes("CREATE TABLE")) {
        shouldFail = false;
        throw new Error("failed to create table");
      }
      if (/SELECT COUNT\(1\)/i.test(sql)) {
        return { rows: [{ count: 0 }] };
      }
      return { rows: [] };
    });

    const queue = new HyperdriveJobQueue<{ hello: string }>(client);

    await expect(queue.init()).rejects.toThrow("failed to create table");
    const size = await queue.size();
    expect(size).toBe(0);
  });

  test("HyperdriveDeliveryTrackingStore reads JSON columns a driver already decoded", async () => {
    const now = Date.now();
    for (const dialect of ["postgres", "mysql"] as const) {
      // node-postgres and mysql2 return JSON columns as objects.
      const client = stubSqlClient(dialect, async (sql) => {
        if (!sql.startsWith("SELECT")) return { rows: [] };
        return {
          rows: [
            {
              message_id: "m1",
              provider_id: "mock",
              provider_message_id: "p1",
              type: "SMS",
              to: "01012345678",
              status: "FAILED",
              requested_at: now,
              status_updated_at: now,
              attempt_count: 1,
              next_check_at: now,
              last_error: { code: "E1", message: "first" },
              metadata: { tenant: "t1" },
            },
          ],
        };
      });

      const record = await new HyperdriveDeliveryTrackingStore(client).get(
        "m1",
      );

      expect(record?.lastError).toEqual({ code: "E1", message: "first" });
      expect(record?.metadata).toEqual({ tenant: "t1" });
    }
  });

  test("HyperdriveJobQueue reads job data a driver already decoded", async () => {
    const client = stubSqlClient("postgres", async (sql) => {
      if (!sql.startsWith("SELECT")) return { rows: [] };
      return {
        rows: [
          {
            id: "job_1",
            type: "send",
            data: { to: "01012345678" },
            status: "pending",
            priority: 0,
            attempts: 0,
            max_attempts: 3,
            delay: 0,
            created_at: 1,
            process_at: 1,
            metadata: { tenant: "t1" },
          },
        ],
      };
    });

    const job = await new HyperdriveJobQueue<{ to: string }>(client).getJob(
      "job_1",
    );

    expect(job?.data).toEqual({ to: "01012345678" });
    expect(job?.metadata).toEqual({ tenant: "t1" });
  });
});

describe("Cloudflare object-store adapters", () => {
  test("CloudflareObjectDeliveryTrackingStore upsert/get/listDue", async () => {
    const storage = createMemoryObjectStorage();
    const store = new CloudflareObjectDeliveryTrackingStore(storage);

    const now = new Date();
    await store.upsert({
      messageId: "m1",
      providerId: "provider",
      providerMessageId: "p1",
      type: "SMS",
      to: "01012345678",
      requestedAt: now,
      status: "SENT",
      statusUpdatedAt: now,
      attemptCount: 0,
      nextCheckAt: now,
    });

    const found = await store.get("m1");
    expect(found?.messageId).toBe("m1");

    const due = await store.listDue(new Date(now.getTime() + 1), 10);
    expect(due.length).toBe(1);
  });

  test("CloudflareObjectJobQueue enqueues and dequeues", async () => {
    const storage = createMemoryObjectStorage();
    const queue = new CloudflareObjectJobQueue<{ v: number }>(storage);

    const job = await queue.enqueue("test", { v: 1 }, { priority: 5 });
    const dequeued = await queue.dequeue();

    expect(job.id).toBeTruthy();
    expect(dequeued?.id).toBe(job.id);
  });

  test("CloudflareObjectJobQueue reschedules retries using processAt", async () => {
    const storage = createMemoryObjectStorage();
    const queue = new CloudflareObjectJobQueue<{ v: number }>(storage);

    const job = await queue.enqueue("test", { v: 1 });
    const beforeRetry = Date.now();

    await queue.fail(job.id, "temporary failure", {
      enabled: true,
      delayMs: 80,
    });

    const pendingJob = await queue.getJob(job.id);
    expect(pendingJob?.status).toBe(JobStatus.PENDING);
    expect(pendingJob?.attempts).toBe(1);
    expect(pendingJob?.processAt.getTime()).toBeGreaterThanOrEqual(
      beforeRetry + 60,
    );

    const immediatelyReady = await queue.peek();
    expect(immediatelyReady).toBeUndefined();

    await wait(100);

    const readyJob = await queue.peek();
    expect(readyJob?.id).toBe(job.id);
  });

  test("CloudflareObjectJobQueue cleanupTerminal removes only completed and failed jobs", async () => {
    const storage = createMemoryObjectStorage();
    const queue = new CloudflareObjectJobQueue<{ v: number }>(storage);

    const completed = await queue.enqueue("completed", { v: 1 });
    const failed = await queue.enqueue("failed", { v: 2 });
    const pending = await queue.enqueue("pending", { v: 3 }, { delay: 1000 });

    await queue.complete(completed.id);
    await queue.fail(failed.id, "boom");

    const removed = await queue.cleanupTerminal();

    expect(removed).toBe(2);
    expect(await queue.getJob(completed.id)).toBeUndefined();
    expect(await queue.getJob(failed.id)).toBeUndefined();
    expect((await queue.getJob(pending.id))?.status).toBe(JobStatus.PENDING);
  });
});

describe("Cloudflare backend helpers", () => {
  test("creates KV-backed store/queue", async () => {
    const data = new Map<string, string>();
    const kv = {
      async get(key: string) {
        return data.get(key) ?? null;
      },
      async put(key: string, value: string) {
        data.set(key, value);
      },
      async delete(key: string) {
        data.delete(key);
      },
      async list(options?: { prefix?: string }) {
        const prefix = options?.prefix ?? "";
        const keys = Array.from(data.keys())
          .filter((key) => key.startsWith(prefix))
          .map((name) => ({ name }));
        return { keys, list_complete: true, cursor: undefined };
      },
    };

    const store = createKvDeliveryTrackingStore(kv);
    const queue = createKvJobQueue<{ ok: boolean }>(kv);

    await store.init();
    await queue.enqueue("sample", { ok: true });
    expect(await queue.size()).toBe(1);
  });

  test("creates R2-backed store/queue", async () => {
    const data = new Map<string, string>();
    const bucket = {
      async get(key: string) {
        const value = data.get(key);
        if (value === undefined) return null;
        return {
          async text() {
            return value;
          },
        };
      },
      async put(key: string, value: string) {
        data.set(key, value);
      },
      async delete(key: string) {
        data.delete(key);
      },
      async list(options?: { prefix?: string }) {
        const prefix = options?.prefix ?? "";
        return {
          objects: Array.from(data.keys())
            .filter((key) => key.startsWith(prefix))
            .map((key) => ({ key })),
          truncated: false,
          cursor: undefined,
        };
      },
    };

    const store = createR2DeliveryTrackingStore(bucket);
    const queue = createR2JobQueue<{ ok: boolean }>(bucket);

    await store.init();
    await queue.enqueue("sample", { ok: true });
    expect(await queue.size()).toBe(1);
  });

  test("lists every DurableObject key past the storage page limit", async () => {
    const data = new Map<string, string>();
    for (let index = 0; index < 2500; index += 1) {
      data.set(`job:${String(index).padStart(5, "0")}`, "{}");
    }
    data.set("other:1", "{}");
    // Behaves like Durable Object storage: sorted keys, `limit` per call.
    const doStorage = {
      async get<T>(key: string) {
        return data.get(key) as T | undefined;
      },
      async put<T>(key: string, value: T) {
        data.set(key, String(value));
      },
      async delete(key: string) {
        return data.delete(key);
      },
      async list<T>(options?: {
        prefix?: string;
        startAfter?: string;
        limit?: number;
      }) {
        const prefix = options?.prefix ?? "";
        const entries = Array.from(data.entries())
          .filter(([key]) => key.startsWith(prefix))
          .filter(([key]) => !options?.startAfter || key > options.startAfter)
          .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
          .slice(0, options?.limit ?? Number.POSITIVE_INFINITY);
        return new Map(entries) as Map<string, T>;
      },
    };

    const keys = await createDurableObjectStorage(doStorage).list("job:");

    expect(keys).toHaveLength(2500);
    expect(new Set(keys).size).toBe(2500);
  });

  test("stops listing when DurableObject storage ignores startAfter", async () => {
    const data = new Map<string, string>();
    for (let index = 0; index < 1500; index += 1) {
      data.set(`job:${String(index).padStart(5, "0")}`, "{}");
    }
    // Returns the first page for every call, as a storage shim that does not
    // know startAfter would.
    const doStorage = {
      async get<T>(key: string) {
        return data.get(key) as T | undefined;
      },
      async put<T>(key: string, value: T) {
        data.set(key, String(value));
      },
      async delete(key: string) {
        return data.delete(key);
      },
      async list<T>(options?: { limit?: number }) {
        return new Map(
          Array.from(data.entries()).slice(0, options?.limit),
        ) as Map<string, T>;
      },
    };

    const keys = await createDurableObjectStorage(doStorage).list("job:");

    expect(keys).toHaveLength(1000);
  });

  test("DurableObject reads take values from the listing, not one get() each", async () => {
    const data = new Map<string, string>();
    const calls = { get: 0, list: 0 };
    // Behaves like Durable Object storage: sorted keys, `limit` per call.
    const doStorage = {
      async get<T>(key: string) {
        calls.get += 1;
        return data.get(key) as T | undefined;
      },
      async put<T>(key: string, value: T) {
        data.set(key, String(value));
      },
      async delete(key: string) {
        return data.delete(key);
      },
      async list<T>(options?: {
        prefix?: string;
        startAfter?: string;
        limit?: number;
      }) {
        calls.list += 1;
        const prefix = options?.prefix ?? "";
        const entries = Array.from(data.entries())
          .filter(([key]) => key.startsWith(prefix))
          .filter(([key]) => !options?.startAfter || key > options.startAfter)
          .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
          .slice(0, options?.limit ?? Number.POSITIVE_INFINITY);
        return new Map(entries) as Map<string, T>;
      },
    };

    const queue = createDurableObjectJobQueue<{ n: number }>(doStorage);
    for (let index = 0; index < 2500; index += 1) {
      await queue.enqueue("send", { n: index });
    }
    const urgent = await queue.enqueue("send", { n: -1 }, { priority: 10 });

    const store = createDurableObjectDeliveryTrackingStore(doStorage);
    const now = new Date();
    for (const messageId of ["m1", "m2", "m3"]) {
      await store.upsert({
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
      });
    }
    calls.get = 0;
    calls.list = 0;

    expect((await queue.dequeue())?.id).toBe(urgent.id);
    // 2,501 jobs in pages of 1,000, then the empty page that ends the listing.
    expect(calls).toEqual({ get: 0, list: 4 });

    const due = await store.listDue(new Date(now.getTime() + 1), 10);
    expect(due.map((record) => record.messageId).sort()).toEqual([
      "m1",
      "m2",
      "m3",
    ]);
    expect(await store.countRecords({})).toBe(3);
    expect(calls.get).toBe(0);
  });

  test("creates DurableObject-backed store/queue", async () => {
    const data = new Map<string, string>();
    const doStorage = {
      async get<T>(key: string) {
        return data.get(key) as T | undefined;
      },
      async put<T>(key: string, value: T) {
        data.set(key, String(value));
      },
      async delete(key: string) {
        return data.delete(key);
      },
      async list<T>(options?: { prefix?: string }) {
        const prefix = options?.prefix ?? "";
        const entries = Array.from(data.entries()).filter(([key]) =>
          key.startsWith(prefix),
        );
        return new Map(entries) as Map<string, T>;
      },
    };

    const store = createDurableObjectDeliveryTrackingStore(doStorage);
    const queue = createDurableObjectJobQueue<{ ok: boolean }>(doStorage);

    await store.init();
    await queue.enqueue("sample", { ok: true });
    expect(await queue.size()).toBe(1);
  });
});
