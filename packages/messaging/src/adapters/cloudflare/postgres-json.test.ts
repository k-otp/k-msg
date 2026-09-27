import { describe, expect, test } from "bun:test";
import type { TrackingRecord } from "../../delivery-tracking/types";
import { HyperdriveDeliveryTrackingStore } from "./hyperdrive-delivery-tracking.store";
import { HyperdriveJobQueue } from "./hyperdrive-job-queue";
import type { CloudflareSqlClient } from "./sql-client";

type Row = Map<string, unknown>;

interface Table {
  columns: Map<string, string>;
  key: string;
  rows: Map<string, Row>;
}

class PostgresError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
  }
}

function splitTopLevel(list: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of list) {
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if (char === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  if (current.trim().length > 0) parts.push(current.trim());
  return parts;
}

// The text between the parenthesis at `open` and the one closing it.
function parenthesized(sql: string, open: number): string {
  let depth = 0;
  for (let index = open; index < sql.length; index += 1) {
    if (sql[index] === "(") depth += 1;
    if (sql[index] === ")") depth -= 1;
    if (depth === 0) return sql.slice(open + 1, index);
  }
  throw new Error(`Unbalanced parentheses in: ${sql}`);
}

const unquote = (identifier: string) => identifier.trim().replace(/^"|"$/g, "");

const UNPAIRED_SURROGATE =
  /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;

// JSONB, unlike JSON text, cannot hold NUL characters or unpaired surrogates.
function assertJsonbText(value: unknown): void {
  const strings =
    typeof value === "string"
      ? [value]
      : typeof value === "object" && value !== null
        ? Object.entries(value).flatMap(([key, item]) => {
            assertJsonbText(item);
            return [key];
          })
        : [];
  for (const text of strings) {
    if (text.includes("\u0000") || UNPAIRED_SURROGATE.test(text)) {
      throw new PostgresError("unsupported Unicode escape sequence", "22P05");
    }
  }
}

/**
 * Postgres behind postgres.js or Bun.SQL, in memory, for the statements the
 * SQL adapters issue. Postgres infers each parameter's type from where the
 * statement uses it, and those clients serialize a parameter it types as
 * JSON or JSONB with JSON.stringify, even when the value is JSON text
 * already. JSONB columns hold the parsed document, which a plain column
 * reference returns decoded, as those clients do.
 */
class PostgresTypingFake {
  readonly tables = new Map<string, Table>();

  readonly client: CloudflareSqlClient = {
    dialect: "postgres",
    query: (async (sql: string, params: readonly unknown[] = []) =>
      this.execute(sql.trim(), params)) as CloudflareSqlClient["query"],
  };

  /** The stored JSON document, as `column->>'field'` would see it. */
  document(table: string, key: string, column: string): unknown {
    return this.table(table).rows.get(key)?.get(column);
  }

  /** Stores a document directly, as rows written by earlier versions hold it. */
  setDocument(table: string, key: string, column: string, value: unknown) {
    const row = this.table(table).rows.get(key);
    if (!row) throw new Error(`No row ${key} in ${table}`);
    row.set(column, value);
  }

  private table(name: string): Table {
    const table = this.tables.get(name);
    if (!table) {
      throw new PostgresError(`relation "${name}" does not exist`, "42P01");
    }
    return table;
  }

  private execute(sql: string, params: readonly unknown[]) {
    if (/^CREATE INDEX/i.test(sql)) return { rows: [] };
    if (/^CREATE TABLE/i.test(sql)) return this.createTable(sql);
    if (/^INSERT INTO/i.test(sql)) return this.insert(sql, params);
    if (/^UPDATE/i.test(sql)) return this.update(sql, params);
    if (/^SELECT/i.test(sql)) return this.select(sql, params);
    throw new Error(`PostgresTypingFake does not support: ${sql}`);
  }

  private createTable(sql: string) {
    const name = unquote(
      /^CREATE TABLE IF NOT EXISTS\s+("[^"]+")/i.exec(sql)?.[1] ?? "",
    );
    if (this.tables.has(name)) return { rows: [] };
    const columns = new Map<string, string>();
    let key = "";
    for (const definition of splitTopLevel(
      parenthesized(sql, sql.indexOf("(")),
    )) {
      const match = /^("[^"]+")\s+(\S+)/.exec(definition);
      if (!match) continue;
      const column = unquote(match[1] ?? "");
      columns.set(column, (match[2] ?? "").toUpperCase());
      if (/PRIMARY KEY/i.test(definition)) key = column;
    }
    this.tables.set(name, { columns, key, rows: new Map() });
    return { rows: [] };
  }

  // A value as Postgres stores it once the client has serialized the
  // parameter for the type Postgres inferred.
  private store(
    table: Table,
    column: string,
    expression: string,
    params: readonly unknown[],
  ): unknown {
    const type = table.columns.get(column);
    if (!type) {
      throw new PostgresError(`column "${column}" does not exist`, "42703");
    }
    const castToJsonb = /^\$(\d+)::text::jsonb$/i.exec(expression);
    const plain = /^\$(\d+)$/.exec(expression);
    const index = Number((castToJsonb ?? plain)?.[1]);
    if (!Number.isInteger(index)) {
      throw new Error(
        `PostgresTypingFake does not support the value ${expression}`,
      );
    }
    const value = params[index - 1];
    if (value === null || value === undefined) return null;

    if (castToJsonb) {
      // Typed text, so sent as is; the cast parses it.
      return this.parseJson(String(value));
    }
    if (type === "JSONB" || type === "JSON") {
      // Typed JSONB, so the client serializes it with JSON.stringify.
      return this.parseJson(JSON.stringify(value));
    }
    const varchar = /^VARCHAR\((\d+)\)$/.exec(type);
    if (varchar && String(value).length > Number(varchar[1])) {
      throw new PostgresError(
        `value too long for type character varying(${varchar[1]})`,
        "22001",
      );
    }
    return value;
  }

  private parseJson(text: string): unknown {
    let document: unknown;
    try {
      document = JSON.parse(text);
    } catch {
      throw new PostgresError("invalid input syntax for type json", "22P02");
    }
    assertJsonbText(document);
    return document;
  }

  private insert(sql: string, params: readonly unknown[]) {
    const name = unquote(/^INSERT INTO\s+("[^"]+")/i.exec(sql)?.[1] ?? "");
    const table = this.table(name);
    const columns = splitTopLevel(parenthesized(sql, sql.indexOf("("))).map(
      unquote,
    );
    const valuesAt = sql.search(/VALUES\s*\(/i);
    const values = splitTopLevel(
      parenthesized(sql, sql.indexOf("(", valuesAt)),
    );

    const row: Row = new Map();
    columns.forEach((column, index) => {
      row.set(column, this.store(table, column, values[index] ?? "", params));
    });
    const key = String(row.get(table.key));
    const existing = table.rows.get(key);
    if (existing && !/ON CONFLICT/i.test(sql)) {
      throw new PostgresError(
        "duplicate key value violates unique constraint",
        "23505",
      );
    }
    table.rows.set(key, existing ? new Map([...existing, ...row]) : row);
    return { rows: [], rowCount: 1 };
  }

  private update(sql: string, params: readonly unknown[]) {
    const match =
      /^UPDATE\s+("[^"]+")\s+SET\s+([\s\S]+?)\s+WHERE\s+("[^"]+")\s*=\s*\$(\d+)\s*$/i.exec(
        sql,
      );
    if (!match) throw new Error(`PostgresTypingFake does not support: ${sql}`);
    const table = this.table(unquote(match[1] ?? ""));
    const row = table.rows.get(String(params[Number(match[4]) - 1]));
    if (!row) return { rows: [], rowCount: 0 };

    const next = new Map(row);
    for (const assignment of splitTopLevel(match[2] ?? "")) {
      const [column, expression] = assignment.split(/\s*=\s*/, 2);
      const name = unquote(column ?? "");
      next.set(name, this.store(table, name, expression ?? "", params));
    }
    row.clear();
    for (const [column, value] of next) row.set(column, value);
    return { rows: [], rowCount: 1 };
  }

  private select(sql: string, params: readonly unknown[]) {
    const match =
      /^SELECT\s+([\s\S]+?)\s+FROM\s+("[^"]+")\s+WHERE\s+("[^"]+")\s*=\s*\$(\d+)\s+LIMIT 1$/i.exec(
        sql,
      );
    if (!match) throw new Error(`PostgresTypingFake does not support: ${sql}`);
    const table = this.table(unquote(match[2] ?? ""));
    const row = table.rows.get(String(params[Number(match[4]) - 1]));
    if (!row) return { rows: [] };

    const items =
      match[1]?.trim() === "*"
        ? [...table.columns.keys()].map((column) => `"${column}"`)
        : splitTopLevel(match[1] ?? "");
    const result: Record<string, unknown> = {};
    for (const item of items) {
      const asText = /^CAST\(("[^"]+") AS TEXT\) AS ("[^"]+")$/i.exec(item);
      const column = unquote(asText?.[1] ?? item);
      const value = row.get(column) ?? null;
      const type = table.columns.get(column);
      if (asText) {
        const isJson = type === "JSONB" || type === "JSON";
        result[unquote(asText[2] ?? "")] =
          value === null
            ? null
            : isJson
              ? JSON.stringify(value)
              : String(value);
        continue;
      }
      // A plain reference: the client decodes JSON documents.
      result[column] = value;
    }
    return { rows: [result] };
  }
}

function trackingRecord(
  overrides: Partial<TrackingRecord> = {},
): TrackingRecord {
  const now = new Date("2026-09-26T00:00:00.000Z");
  return {
    messageId: "m1",
    providerId: "mock",
    providerMessageId: "p1",
    type: "SMS",
    to: "01012345678",
    requestedAt: now,
    status: "SENT",
    statusUpdatedAt: now,
    attemptCount: 0,
    nextCheckAt: now,
    ...overrides,
  };
}

const TRACKING_TABLE = "kmsg_delivery_tracking";

describe("SQL adapters on Postgres with postgres.js parameter typing", () => {
  test("HyperdriveDeliveryTrackingStore stores JSONB columns as documents", async () => {
    const postgres = new PostgresTypingFake();
    const store = new HyperdriveDeliveryTrackingStore(postgres.client, {
      storeRaw: true,
    });

    await store.upsert(
      trackingRecord({
        lastError: { code: "E1", message: "first" },
        metadata: { tenant: "t1" },
        raw: { result: "ok" },
      }),
    );

    expect(postgres.document(TRACKING_TABLE, "m1", "last_error")).toEqual({
      code: "E1",
      message: "first",
    });
    expect(postgres.document(TRACKING_TABLE, "m1", "metadata")).toEqual({
      tenant: "t1",
    });
    expect(postgres.document(TRACKING_TABLE, "m1", "raw")).toEqual({
      result: "ok",
    });

    await store.patch("m1", {
      lastError: { code: "E2", message: "second" },
      metadata: { tenant: "t2" },
    });

    expect(postgres.document(TRACKING_TABLE, "m1", "last_error")).toEqual({
      code: "E2",
      message: "second",
    });
    expect(postgres.document(TRACKING_TABLE, "m1", "metadata")).toEqual({
      tenant: "t2",
    });
  });

  test("HyperdriveDeliveryTrackingStore reads back what it stores, strings included", async () => {
    const postgres = new PostgresTypingFake();
    const store = new HyperdriveDeliveryTrackingStore(postgres.client, {
      storeRaw: true,
    });

    await store.upsert(
      trackingRecord({
        lastError: { code: "E1", message: "first" },
        metadata: { tenant: "t1", tags: ["a"] },
        // A string that also reads as a JSON number must stay a string.
        raw: "01012345678",
      }),
    );

    const record = await store.get("m1");
    expect(record?.lastError).toEqual({ code: "E1", message: "first" });
    expect(record?.metadata).toEqual({ tenant: "t1", tags: ["a"] });
    expect(record?.raw).toBe("01012345678");
  });

  test("HyperdriveDeliveryTrackingStore reads earlier JSON-string rows, objects as objects and raw as stored", async () => {
    const postgres = new PostgresTypingFake();
    const store = new HyperdriveDeliveryTrackingStore(postgres.client, {
      storeRaw: true,
    });
    await store.upsert(trackingRecord());

    // What earlier versions stored through postgres.js.
    postgres.setDocument(
      TRACKING_TABLE,
      "m1",
      "last_error",
      JSON.stringify({ code: "E1", message: "first" }),
    );
    postgres.setDocument(
      TRACKING_TABLE,
      "m1",
      "metadata",
      JSON.stringify({ tenant: "t1" }),
    );
    postgres.setDocument(
      TRACKING_TABLE,
      "m1",
      "raw",
      JSON.stringify({ result: "ok" }),
    );

    const record = await store.get("m1");
    expect(record?.lastError).toEqual({ code: "E1", message: "first" });
    expect(record?.metadata).toEqual({ tenant: "t1" });
    // raw may hold any JSON, strings included, so it reads as stored.
    expect(record?.raw).toBe('{"result":"ok"}');
  });

  test("HyperdriveDeliveryTrackingStore keeps strings that look like JSON", async () => {
    const postgres = new PostgresTypingFake();
    const store = new HyperdriveDeliveryTrackingStore(postgres.client, {
      storeRaw: true,
    });

    for (const raw of ['{"result":"ok"}', "[1,2]", "12345", "true"]) {
      await store.upsert(trackingRecord({ raw }));
      expect((await store.get("m1"))?.raw).toBe(raw);
    }
  });

  test("HyperdriveDeliveryTrackingStore stores NUL and unpaired surrogates as U+FFFD", async () => {
    const postgres = new PostgresTypingFake();
    const store = new HyperdriveDeliveryTrackingStore(postgres.client, {
      storeRaw: true,
    });

    await store.upsert(
      trackingRecord({
        lastError: { code: "E1", message: "bad\uD800byte" },
        metadata: { note: "a\u0000b", "key\u0000": "v" },
        raw: "\uDC00",
      }),
    );

    const record = await store.get("m1");
    expect(record?.lastError).toEqual({ code: "E1", message: "bad\uFFFDbyte" });
    expect(record?.metadata).toEqual({ note: "a\uFFFDb", "key\uFFFD": "v" });
    expect(record?.raw).toBe("\uFFFD");
  });

  test("HyperdriveDeliveryTrackingStore reads objects from a JSONB table set up as json: text", async () => {
    const postgres = new PostgresTypingFake();
    // The table has JSONB columns, but the store is told they are TEXT.
    await new HyperdriveDeliveryTrackingStore(postgres.client).init();
    const store = new HyperdriveDeliveryTrackingStore(postgres.client, {
      typeStrategy: { json: "text" },
    });

    await store.upsert(
      trackingRecord({
        lastError: { code: "E1", message: "first" },
        metadata: { tenant: "t1" },
      }),
    );

    const record = await store.get("m1");
    expect(record?.lastError).toEqual({ code: "E1", message: "first" });
    expect(record?.metadata).toEqual({ tenant: "t1" });
  });

  test("HyperdriveDeliveryTrackingStore stores provider status messages longer than 64 characters", async () => {
    const postgres = new PostgresTypingFake();
    const store = new HyperdriveDeliveryTrackingStore(postgres.client);
    await store.upsert(trackingRecord());

    const message =
      "카카오톡 미사용자 또는 채널 차단으로 전송에 실패했습니다. ".repeat(4);
    await store.patch("m1", {
      status: "FAILED",
      providerStatusMessage: message,
    });

    expect((await store.get("m1"))?.providerStatusMessage).toBe(message);
  });

  test("HyperdriveJobQueue stores job data and metadata as documents", async () => {
    const postgres = new PostgresTypingFake();
    const queue = new HyperdriveJobQueue<{ to: string; text: string }>(
      postgres.client,
    );

    const job = await queue.enqueue(
      "send",
      { to: "01012345678", text: "hello" },
      { metadata: { tenant: "t1" } },
    );

    expect(postgres.document("kmsg_jobs", job.id, "data")).toEqual({
      to: "01012345678",
      text: "hello",
    });
    expect(postgres.document("kmsg_jobs", job.id, "metadata")).toEqual({
      tenant: "t1",
    });
    const stored = await queue.getJob(job.id);
    expect(stored?.data).toEqual({ to: "01012345678", text: "hello" });
    expect(stored?.metadata).toEqual({ tenant: "t1" });
  });

  test("HyperdriveJobQueue reads jobs back exactly, including string data", async () => {
    const postgres = new PostgresTypingFake();
    const queue = new HyperdriveJobQueue<string>(postgres.client);

    for (const data of [
      "01012345678",
      '{"to":"010"}',
      "[1,2]",
      "12345",
      "true",
    ]) {
      const job = await queue.enqueue("send", data);
      expect((await queue.getJob(job.id))?.data).toBe(data);
    }
  });

  test("HyperdriveJobQueue reads earlier JSON-string rows, metadata as an object and data as stored", async () => {
    const postgres = new PostgresTypingFake();
    const queue = new HyperdriveJobQueue<{ to: string }>(postgres.client);
    const job = await queue.enqueue("send", { to: "01012345678" });

    // What earlier versions stored through postgres.js.
    postgres.setDocument(
      "kmsg_jobs",
      job.id,
      "data",
      JSON.stringify({ to: "01012345678" }),
    );
    postgres.setDocument(
      "kmsg_jobs",
      job.id,
      "metadata",
      JSON.stringify({ tenant: "t1" }),
    );

    const stored = await queue.getJob(job.id);
    // data may hold any JSON, strings included, so it reads as stored; the
    // README shows how to convert such rows.
    expect(stored?.data as unknown).toBe('{"to":"01012345678"}');
    expect(stored?.metadata).toEqual({ tenant: "t1" });
  });
});
