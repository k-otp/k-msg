import { describe, expect, test } from "bun:test";
import { HyperdriveDeliveryTrackingStore } from "./hyperdrive-delivery-tracking.store";
import { HyperdriveJobQueue } from "./hyperdrive-job-queue";
import {
  CloudflareObjectDeliveryTrackingStore,
  CloudflareObjectJobQueue,
  createDurableObjectDeliveryTrackingStore,
  createDurableObjectJobQueue,
  createKvDeliveryTrackingStore,
  createKvJobQueue,
  createR2DeliveryTrackingStore,
  createR2JobQueue,
} from "./index";
import type { CloudflareSqlClient } from "./sql-client";
import { createD1SqlClient, runCloudflareSqlTransaction } from "./sql-client";

type CapturedQuery = { sql: string; params: readonly unknown[] };

function createCapturingSqlClient(dialect: CloudflareSqlClient["dialect"]): {
  client: CloudflareSqlClient;
  queries: CapturedQuery[];
} {
  const queries: CapturedQuery[] = [];
  const client: CloudflareSqlClient = {
    dialect,
    async query(sql, params = []) {
      queries.push({ sql, params });
      if (/SELECT COUNT\(1\)/i.test(sql)) {
        return { rows: [{ count: 0 }] };
      }
      return { rows: [] };
    },
  };
  return { client, queries };
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

    const client = createD1SqlClient(db);
    const result = await client.query<{ ok: boolean }>(
      "SELECT * FROM t WHERE id = ?",
      [1],
    );

    expect(result.rows[0]?.ok).toBe(true);
    expect(calls[0]?.sql).toContain("SELECT * FROM t");
    expect(calls[0]?.params).toEqual([1]);
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

    const pgSql = postgres.queries[0]?.sql ?? "";
    const mySql = mysql.queries[0]?.sql ?? "";

    expect(pgSql).toContain("ON CONFLICT");
    expect(pgSql).toContain("$1");
    expect(mySql).toContain("ON DUPLICATE KEY UPDATE");
    expect(mySql).toContain("?");
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
        data.delete(key);
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
