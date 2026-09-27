import { Database, type SQLQueryBindings } from "bun:sqlite";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  setSystemTime,
  spyOn,
  test,
} from "bun:test";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { SQL } from "bun";
import postgres from "postgres";
import {
  CloudflareObjectJobQueue,
  type CloudflareObjectStorage,
  type CloudflareSqlClient,
  createCloudflareSqlClient,
  createD1JobQueue,
  createD1SqlClient,
  type D1DatabaseLike,
  type D1PreparedStatementLike,
  HyperdriveJobQueue,
} from "../adapters/cloudflare";
import { JobProcessor } from "./job.processor";
import {
  JOB_LEASE_EXPIRED,
  type Job,
  type JobQueue,
  type JobQueueCleanupOptions,
  JobStatus,
} from "./job-queue.interface";
import { SQLiteJobQueue } from "./sqlite-job-queue";

// Every queue follows the same lease, schedule and cleanup rules: the KV, R2
// and Durable Object queue, SQLiteJobQueue, and HyperdriveJobQueue on D1,
// Postgres and MySQL. Postgres and MySQL run when KMSG_TEST_POSTGRES_URL or
// KMSG_TEST_MYSQL_URL names a server, as a user that can create a schema
// (Postgres) or database (MySQL): the tests create, and then drop, their own.
const postgresUrl = process.env.KMSG_TEST_POSTGRES_URL;
const mysqlUrl = process.env.KMSG_TEST_MYSQL_URL;

const START = new Date("2026-09-26T00:00:00.000Z").getTime();

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
const YEAR_MS = 365 * 24 * 60 * 60_000;

function at(offsetMs: number): Date {
  return new Date(START + offsetMs);
}

type Payload = { to: string };
const payload: Payload = { to: "01012345678" };

interface LeaseOptions<T> {
  leaseMs?: number;
  onLeaseExpired?: (job: Job<T>) => void | Promise<void>;
}

type LeasingJobQueue<T> = JobQueue<T> & {
  nextDueAt(): Promise<Date | undefined>;
  cleanupTerminal(
    options?: JobStatus[] | JobQueueCleanupOptions,
  ): Promise<number>;
};

// Queues sharing one store: a database file, a table, or object storage.
interface QueueStore {
  queue<T>(options?: LeaseOptions<T>): Promise<LeasingJobQueue<T>>;
  close(): Promise<void>;
}

interface Backend {
  name: string;
  open(): Promise<QueueStore>;
}

function memoryObjectStorage(): CloudflareObjectStorage {
  const values = new Map<string, string>();
  return {
    async get(key) {
      return values.get(key) ?? null;
    },
    async put(key, value) {
      values.set(key, value);
    },
    async delete(key) {
      values.delete(key);
    },
    async list(prefix) {
      return [...values.keys()].filter((key) => key.startsWith(prefix)).sort();
    },
  };
}

// A D1 binding over bun:sqlite, which runs the same SQLite dialect. Like D1,
// it binds at most 100 parameters to a statement.
function d1Database(db: Database): D1DatabaseLike {
  return {
    prepare(query) {
      let values: unknown[] = [];
      const statement: D1PreparedStatementLike = {
        bind(...next) {
          if (next.length > 100) {
            throw new Error("D1_ERROR: too many SQL variables");
          }
          values = next;
          return statement;
        },
        async all<T>() {
          const results = db
            .query(query)
            .all(...(values as SQLQueryBindings[])) as T[];
          const changes = /^\s*(INSERT|UPDATE|DELETE)\b/i.test(query)
            ? (
                db.query("SELECT changes() AS changes").get() as {
                  changes: number;
                }
              ).changes
            : 0;
          return { results, success: true, meta: { changes } };
        },
      };
      return statement;
    },
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

// `ready` is awaited before the first statement, such as a session setting.
function bunSqlClient(
  sql: SQL,
  dialect: "postgres" | "mysql",
  ready: Promise<unknown> = Promise.resolve(),
): CloudflareSqlClient {
  return createCloudflareSqlClient({
    dialect,
    query: async <T>(statement: string, params: readonly unknown[] = []) => {
      await ready;
      const result = await sql.unsafe(statement, [...params]);
      // Bun.SQL reports MySQL writes in affectedRows; its count stays 0.
      return {
        rows: [...result] as T[],
        rowCount: result.affectedRows ?? result.count,
      };
    },
    transaction: async <T>(fn: (tx: CloudflareSqlClient) => Promise<T>) => {
      await ready;
      return (await sql.begin((tx) => fn(bunSqlClient(tx, dialect)))) as T;
    },
  });
}

const suffix = crypto.randomUUID().slice(0, 8);
const postgresSchema = `kmsg_leases_${suffix}`;
const mysqlDatabase = `kmsg_leases_${suffix}`;
let tableCount = 0;

function nextTableName(): string {
  tableCount += 1;
  return `kmsg_leases_${suffix}_${tableCount}`;
}

interface ServerConnection {
  client: CloudflareSqlClient;
  end(): Promise<void>;
}

// Queues on one table of a database server, each on its own connection so
// that they can dequeue at the same time.
function serverStore(connect: () => ServerConnection): Backend["open"] {
  return async () => {
    const tableName = nextTableName();
    const connections: ServerConnection[] = [];
    const open = () => {
      const connection = connect();
      connections.push(connection);
      return connection.client;
    };
    await new HyperdriveJobQueue(open(), { tableName }).init();
    return {
      async queue<T>(options: LeaseOptions<T> = {}) {
        return new HyperdriveJobQueue<T>(open(), {
          ...options,
          tableName,
          initializeSchema: false,
        });
      },
      async close() {
        await connections[0]?.client.query(`DROP TABLE ${tableName}`);
        for (const connection of connections) await connection.end();
      },
    };
  };
}

function connectPostgresJs(): ServerConnection {
  const sql = postgres(postgresUrl ?? "", {
    max: 1,
    onnotice: () => {},
    connection: { search_path: postgresSchema },
  });
  return { client: postgresJsClient(sql), end: () => sql.end() };
}

function connectBunPostgres(): ServerConnection {
  const sql = new SQL({
    url: postgresUrl ?? "",
    max: 1,
    connection: { search_path: postgresSchema },
  });
  return { client: bunSqlClient(sql, "postgres"), end: () => sql.close() };
}

// InnoDB runs transactions at REPEATABLE READ unless the server or session
// says otherwise, and many servers are set to READ COMMITTED.
function connectBunMysql(isolation = "REPEATABLE READ"): ServerConnection {
  const target = new URL(mysqlUrl ?? "");
  target.pathname = `/${mysqlDatabase}`;
  const sql = new SQL({ url: target.toString(), max: 1 });
  const ready = Promise.resolve().then(() =>
    sql.unsafe(`SET SESSION TRANSACTION ISOLATION LEVEL ${isolation}`),
  );
  ready.catch(() => {});
  return { client: bunSqlClient(sql, "mysql", ready), end: () => sql.close() };
}

const objectBackend: Backend = {
  name: "CloudflareObjectJobQueue",
  async open() {
    const storage = memoryObjectStorage();
    return {
      async queue<T>(options: LeaseOptions<T> = {}) {
        return new CloudflareObjectJobQueue<T>(storage, options);
      },
      async close() {},
    };
  },
};

const sqliteQueueBackend: Backend = {
  name: "SQLiteJobQueue",
  async open() {
    const dbPath = path.join(
      tmpdir(),
      `kmsg-leases-${crypto.randomUUID()}.sqlite`,
    );
    const queues: Array<{ close(): void }> = [];
    return {
      async queue<T>(options: LeaseOptions<T> = {}) {
        const queue = new SQLiteJobQueue<T>({ ...options, dbPath });
        queues.push(queue);
        return queue;
      },
      async close() {
        for (const queue of queues) queue.close();
        for (const file of [dbPath, `${dbPath}-wal`, `${dbPath}-shm`]) {
          await rm(file, { force: true });
        }
      },
    };
  },
};

const d1Backend: Backend = {
  name: "HyperdriveJobQueue on D1",
  async open() {
    const db = new Database(":memory:");
    const database = d1Database(db);
    return {
      async queue<T>(options: LeaseOptions<T> = {}) {
        return createD1JobQueue<T>(database, options);
      },
      async close() {
        db.close();
      },
    };
  },
};

const postgresJsBackend: Backend = {
  name: "HyperdriveJobQueue on Postgres (postgres.js)",
  open: serverStore(connectPostgresJs),
};

const bunPostgresBackend: Backend = {
  name: "HyperdriveJobQueue on Postgres (Bun.SQL)",
  open: serverStore(connectBunPostgres),
};

const mysqlBackend: Backend = {
  name: "HyperdriveJobQueue on MySQL (Bun.SQL)",
  open: serverStore(() => connectBunMysql()),
};

const mysqlReadCommittedBackend: Backend = {
  name: "HyperdriveJobQueue on MySQL at READ COMMITTED (Bun.SQL)",
  open: serverStore(() => connectBunMysql("READ COMMITTED")),
};

beforeAll(async () => {
  if (postgresUrl) {
    const sql = postgres(postgresUrl, { max: 1, onnotice: () => {} });
    await sql.unsafe(`CREATE SCHEMA "${postgresSchema}"`);
    await sql.end();
  }
  if (mysqlUrl) {
    const sql = new SQL(mysqlUrl);
    await sql.unsafe(`CREATE DATABASE \`${mysqlDatabase}\``);
    await sql.close();
  }
});

afterAll(async () => {
  if (postgresUrl) {
    const sql = postgres(postgresUrl, { max: 1, onnotice: () => {} });
    await sql.unsafe(`DROP SCHEMA "${postgresSchema}" CASCADE`);
    await sql.end();
  }
  if (mysqlUrl) {
    const sql = new SQL(mysqlUrl);
    await sql.unsafe(`DROP DATABASE \`${mysqlDatabase}\``);
    await sql.close();
  }
});

afterEach(() => {
  setSystemTime();
});

function describeLeases(backend: Backend, enabled = true): void {
  describe.skipIf(!enabled)(`${backend.name}: leases`, () => {
    let store: QueueStore;

    beforeEach(async () => {
      store = await backend.open();
    });

    afterEach(async () => {
      await store.close();
    });

    test("a dequeued job is due again once its lease expires, as a failed attempt", async () => {
      setSystemTime(at(0));
      const expired: Job<Payload>[] = [];
      const queue = await store.queue<Payload>({
        leaseMs: 60_000,
        onLeaseExpired: (job) => {
          expired.push(job);
        },
      });
      const job = await queue.enqueue("send", payload);

      const first = await queue.dequeue();
      expect(first?.status).toBe(JobStatus.PROCESSING);
      expect(first?.leaseExpiresAt).toEqual(at(60_000));
      expect(first?.completedAt).toBeUndefined();
      expect(first?.failedAt).toBeUndefined();

      setSystemTime(at(59_999));
      expect(await queue.dequeue()).toBeUndefined();
      expect(expired).toHaveLength(0);

      setSystemTime(at(60_000));
      const again = await queue.dequeue();
      expect(again?.id).toBe(job.id);
      expect(again?.status).toBe(JobStatus.PROCESSING);
      expect(again?.attempts).toBe(1);
      expect(again?.error).toBe(JOB_LEASE_EXPIRED);
      expect(again?.leaseExpiresAt).toEqual(at(120_000));
      expect(again?.data).toEqual(payload);
      expect(
        expired.map((item) => [item.id, item.status, item.attempts]),
      ).toEqual([[job.id, JobStatus.PENDING, 1]]);
      expect(expired[0]?.error).toBe(JOB_LEASE_EXPIRED);
    });

    test("a job whose lease expires with no attempts left fails", async () => {
      setSystemTime(at(0));
      const expired: Job<Payload>[] = [];
      const queue = await store.queue<Payload>({
        leaseMs: 1_000,
        onLeaseExpired: (job) => {
          expired.push(job);
        },
      });
      const job = await queue.enqueue("send", payload, { maxAttempts: 1 });
      await queue.dequeue();

      setSystemTime(at(1_000));
      expect(await queue.dequeue()).toBeUndefined();

      const stored = await queue.getJob(job.id);
      expect(stored?.status).toBe(JobStatus.FAILED);
      expect(stored?.attempts).toBe(1);
      expect(stored?.error).toBe(JOB_LEASE_EXPIRED);
      expect(stored?.failedAt).toEqual(at(1_000));
      expect(stored?.leaseExpiresAt).toBeUndefined();
      expect(expired.map((item) => item.status)).toEqual([JobStatus.FAILED]);
      expect(await queue.nextDueAt()).toBeUndefined();
    });

    test("leases are off unless leaseMs is set", async () => {
      setSystemTime(at(0));
      const queue = await store.queue<Payload>();
      const job = await queue.enqueue("send", payload);

      expect((await queue.dequeue())?.leaseExpiresAt).toBeUndefined();
      setSystemTime(at(YEAR_MS));
      expect(await queue.dequeue()).toBeUndefined();
      const stored = await queue.getJob(job.id);
      expect(stored?.status).toBe(JobStatus.PROCESSING);
      expect(stored?.leaseExpiresAt).toBeUndefined();
      expect(await queue.nextDueAt()).toBeUndefined();
    });

    test("leaseMs: Infinity keeps a dequeued job processing", async () => {
      setSystemTime(at(0));
      const queue = await store.queue<Payload>({
        leaseMs: Number.POSITIVE_INFINITY,
      });
      const job = await queue.enqueue("send", payload);
      await queue.dequeue();

      setSystemTime(at(YEAR_MS));
      expect(await queue.dequeue()).toBeUndefined();
      expect((await queue.getJob(job.id))?.status).toBe(JobStatus.PROCESSING);
      expect(await queue.nextDueAt()).toBeUndefined();
    });

    test("a fractional leaseMs or retry delay rounds up to whole milliseconds", async () => {
      setSystemTime(at(0));
      const queue = await store.queue<Payload>({ leaseMs: 1_000.5 });
      const job = await queue.enqueue("send", payload);

      const leased = await queue.dequeue();
      expect(leased?.id).toBe(job.id);
      expect(leased?.leaseExpiresAt).toEqual(at(1_001));

      await queue.fail(job.id, "NETWORK_TIMEOUT", {
        enabled: true,
        delayMs: 1.5,
      });
      expect((await queue.getJob(job.id))?.processAt).toEqual(at(2));
    });

    test("dequeue() takes a large running set", async () => {
      setSystemTime(at(0));
      const queue = await store.queue<Payload>({
        leaseMs: 1_000,
        onLeaseExpired: () => {},
      });
      const job = await queue.enqueue("send", payload);
      const running = new Set(
        Array.from({ length: 150 }, (_, index) => `job_running_${index}`),
      );

      expect((await queue.dequeue({ running }))?.id).toBe(job.id);
    });

    test("rejects a lease that is not a positive number of milliseconds", async () => {
      for (const leaseMs of [0, -1, Number.NaN, 1e20, "60000"]) {
        await expect(
          store.queue<Payload>({ leaseMs: leaseMs as number }),
        ).rejects.toThrow(RangeError);
      }
    });

    test("onLeaseExpired runs once the job is stored pending again, before dequeue() leases one", async () => {
      setSystemTime(at(0));
      const seen: Array<[JobStatus, JobStatus | undefined]> = [];
      const queue: LeasingJobQueue<Payload> = await store.queue<Payload>({
        leaseMs: 1_000,
        onLeaseExpired: async (job) => {
          seen.push([job.status, (await queue.getJob(job.id))?.status]);
        },
      });
      const job = await queue.enqueue("send", payload);
      await queue.dequeue();

      setSystemTime(at(1_000));
      expect((await queue.dequeue())?.id).toBe(job.id);

      expect(seen).toEqual([[JobStatus.PENDING, JobStatus.PENDING]]);
    });

    test("the lease dequeue() returns starts after onLeaseExpired has run", async () => {
      setSystemTime(at(0));
      const queue = await store.queue<Payload>({
        leaseMs: 1_000,
        // A slow callback: time passes while it runs.
        onLeaseExpired: () => {
          setSystemTime(at(5_000));
        },
      });
      const job = await queue.enqueue("send", payload);
      await queue.dequeue();

      setSystemTime(at(1_000));
      const again = await queue.dequeue();

      expect(again?.id).toBe(job.id);
      expect(again?.leaseExpiresAt).toEqual(at(6_000));
    });

    test("dequeue() does not hand out a job another dequeue() took while onLeaseExpired ran", async () => {
      setSystemTime(at(0));
      let other: Job<Payload> | undefined;
      let calls = 0;
      const queue: LeasingJobQueue<Payload> = await store.queue<Payload>({
        leaseMs: 1_000,
        // A callback that waits on other work lets another dequeue() run.
        onLeaseExpired: async () => {
          calls += 1;
          if (calls === 1) other = await queue.dequeue();
        },
      });
      const first = await queue.enqueue(
        "send",
        { to: "01000000001" },
        { priority: 1 },
      );
      await queue.dequeue();
      const second = await queue.enqueue("send", { to: "01000000002" });

      setSystemTime(at(1_000));
      const taken = await queue.dequeue();

      expect([other?.id, taken?.id].sort()).toEqual(
        [first.id, second.id].sort(),
      );
      expect((await queue.getJob(first.id))?.status).toBe(JobStatus.PROCESSING);
      expect((await queue.getJob(second.id))?.status).toBe(
        JobStatus.PROCESSING,
      );
    });

    test("dequeue() leaves the jobs its caller is still running alone, even once their lease expired", async () => {
      setSystemTime(at(0));
      const expired: string[] = [];
      const queue = await store.queue<Payload>({
        leaseMs: 1_000,
        onLeaseExpired: (job) => {
          expired.push(job.id);
        },
      });
      const running = await queue.enqueue(
        "send",
        { to: "01000000001" },
        { priority: 1 },
      );
      await queue.dequeue();
      const waiting = await queue.enqueue("send", { to: "01000000002" });

      setSystemTime(at(5_000));
      const next = await queue.dequeue({ running: new Set([running.id]) });

      expect(next?.id).toBe(waiting.id);
      const stored = await queue.getJob(running.id);
      expect(stored?.status).toBe(JobStatus.PROCESSING);
      expect(stored?.attempts).toBe(0);
      expect(stored?.error).toBeUndefined();
      expect(stored?.leaseExpiresAt).toEqual(at(1_000));
      expect(expired).toEqual([]);
    });

    test("with JobProcessor, a job whose handler outlives its lease is neither run again nor counted as lost", async () => {
      const expired: string[] = [];
      const queue = await store.queue<Payload>({
        leaseMs: 20,
        onLeaseExpired: (job) => {
          expired.push(job.id);
        },
      });
      const processor = new JobProcessor(
        {
          concurrency: 2,
          retryDelays: [0],
          maxRetries: 3,
          pollInterval: 5,
          enableMetrics: false,
        },
        queue,
      );
      let runs = 0;
      processor.handle("send", async () => {
        runs += 1;
        await wait(100);
        return "sent";
      });
      const job = await queue.enqueue("send", payload);

      processor.start();
      // The lease has run out; the handler is still running.
      await wait(60);
      const midway = await queue.getJob(job.id);
      expect(midway?.status).toBe(JobStatus.PROCESSING);
      expect(midway?.attempts).toBe(0);
      await processor.stop();

      const stored = await queue.getJob(job.id);
      expect(runs).toBe(1);
      expect(stored?.status).toBe(JobStatus.COMPLETED);
      expect(stored?.attempts).toBe(0);
      expect(stored?.error).toBeUndefined();
      expect(expired).toEqual([]);
    });

    test("an onLeaseExpired that throws is logged and does not stop the dequeue", async () => {
      const logged = spyOn(console, "error").mockImplementation(() => {});
      try {
        setSystemTime(at(0));
        const queue = await store.queue<Payload>({
          leaseMs: 1_000,
          onLeaseExpired: () => {
            throw new Error("callback failed");
          },
        });
        const job = await queue.enqueue("send", payload);
        await queue.dequeue();

        setSystemTime(at(1_000));
        expect((await queue.dequeue())?.id).toBe(job.id);
        expect(logged).toHaveBeenCalledTimes(1);
      } finally {
        logged.mockRestore();
      }
    });

    test("a job completed after its lease expired stays completed", async () => {
      setSystemTime(at(0));
      const expired: Job<Payload>[] = [];
      const queue = await store.queue<Payload>({
        leaseMs: 1_000,
        onLeaseExpired: (job) => {
          expired.push(job);
        },
      });
      const job = await queue.enqueue("send", payload);
      await queue.dequeue();

      // The worker finishes late, before any dequeue() settled its lease.
      setSystemTime(at(5_000));
      await queue.complete(job.id);

      expect(await queue.dequeue()).toBeUndefined();
      const stored = await queue.getJob(job.id);
      expect(stored?.status).toBe(JobStatus.COMPLETED);
      expect(stored?.attempts).toBe(0);
      expect(stored?.leaseExpiresAt).toBeUndefined();
      expect(expired).toHaveLength(0);
      expect(await queue.nextDueAt()).toBeUndefined();
    });

    test("fail() leaves a completed job completed", async () => {
      const queue = await store.queue<Payload>({ leaseMs: 60_000 });
      const job = await queue.enqueue("send", payload);
      await queue.dequeue();
      await queue.complete(job.id);

      // A worker whose lease expired reports late.
      await queue.fail(job.id, "NETWORK_TIMEOUT", { enabled: true });
      await queue.fail(job.id, "NETWORK_TIMEOUT");

      const stored = await queue.getJob(job.id);
      expect(stored?.status).toBe(JobStatus.COMPLETED);
      expect(stored?.attempts).toBe(0);
      expect(stored?.error).toBeUndefined();
    });

    test("fail() still throws for a job that does not exist", async () => {
      const queue = await store.queue<Payload>({ leaseMs: 60_000 });
      await expect(
        queue.fail("job_missing", "NETWORK_TIMEOUT"),
      ).rejects.toThrow("Job job_missing not found");
    });

    test("fail() retries after the delay while attempts are left, then fails", async () => {
      setSystemTime(at(0));
      const queue = await store.queue<Payload>({ leaseMs: 60_000 });
      const job = await queue.enqueue("send", payload, { maxAttempts: 2 });
      await queue.dequeue();

      await queue.fail(job.id, "NETWORK_TIMEOUT", {
        enabled: true,
        delayMs: 5_000,
      });
      const retried = await queue.getJob(job.id);
      expect(retried?.status).toBe(JobStatus.PENDING);
      expect(retried?.attempts).toBe(1);
      expect(retried?.error).toBe("NETWORK_TIMEOUT");
      expect(retried?.processAt).toEqual(at(5_000));
      expect(retried?.leaseExpiresAt).toBeUndefined();
      expect(await queue.nextDueAt()).toEqual(at(5_000));
      expect(await queue.dequeue()).toBeUndefined();

      setSystemTime(at(5_000));
      expect((await queue.dequeue())?.id).toBe(job.id);
      // No attempts left, so the retry is refused.
      await queue.fail(job.id, new Error("NETWORK_TIMEOUT"), {
        enabled: true,
        delayMs: 5_000,
      });
      const failed = await queue.getJob(job.id);
      expect(failed?.status).toBe(JobStatus.FAILED);
      expect(failed?.attempts).toBe(2);
      expect(failed?.failedAt).toEqual(at(5_000));
      expect(await queue.nextDueAt()).toBeUndefined();
    });

    test("size() and peek() count a job whose lease expired, without changing it", async () => {
      setSystemTime(at(0));
      const queue = await store.queue<Payload>({ leaseMs: 1_000 });
      const job = await queue.enqueue("send", payload);
      await queue.dequeue();
      setSystemTime(at(10));
      // Out of attempts: once its lease expires it fails rather than runs.
      await queue.enqueue("send", payload, { maxAttempts: 1 });
      await queue.dequeue();
      expect(await queue.size()).toBe(0);
      expect(await queue.peek()).toBeUndefined();

      setSystemTime(at(1_010));
      expect(await queue.size()).toBe(1);
      const next = await queue.peek();
      expect(next?.id).toBe(job.id);
      expect(next?.status).toBe(JobStatus.PENDING);
      expect(next?.attempts).toBe(1);
      expect(next?.error).toBe(JOB_LEASE_EXPIRED);
      expect(next?.processAt).toEqual(at(1_000));
      expect(next?.leaseExpiresAt).toBeUndefined();
      expect((await queue.getJob(job.id))?.status).toBe(JobStatus.PROCESSING);
      expect(await queue.size()).toBe(1);
    });

    test("nextDueAt() is the earliest delayed job or lease expiry", async () => {
      setSystemTime(at(0));
      const queue = await store.queue<Payload>({ leaseMs: 60_000 });
      expect(await queue.nextDueAt()).toBeUndefined();

      await queue.enqueue("send", { to: "1" }, { delay: 30_000 });
      await queue.enqueue("send", { to: "2" }, { delay: 90_000 });
      expect(await queue.nextDueAt()).toEqual(at(30_000));

      const due = await queue.enqueue("send", { to: "3" });
      expect(await queue.nextDueAt()).toEqual(at(0));

      // Leased until 60 s, before the 90 s job but after the 30 s one.
      await queue.dequeue();
      expect(await queue.nextDueAt()).toEqual(at(30_000));

      setSystemTime(at(30_000));
      const delayed = await queue.dequeue();
      await queue.complete(due.id);
      await queue.complete(delayed?.id ?? "");
      expect(await queue.nextDueAt()).toEqual(at(90_000));
    });

    test("cleanupTerminal({ olderThan }) keeps jobs that finished since", async () => {
      setSystemTime(at(0));
      const queue = await store.queue<Payload>();
      const completedEarly = await queue.enqueue("send", { to: "1" });
      const failedEarly = await queue.enqueue("send", { to: "2" });
      const completedLate = await queue.enqueue("send", { to: "3" });
      const pending = await queue.enqueue(
        "send",
        { to: "4" },
        { delay: 1_000 },
      );

      await queue.complete(completedEarly.id);
      setSystemTime(at(10_000));
      await queue.fail(failedEarly.id, "INVALID_REQUEST");
      setSystemTime(at(20_000));
      await queue.complete(completedLate.id);

      expect(await queue.cleanupTerminal({ olderThan: at(15_000) })).toBe(2);
      expect(await queue.getJob(completedEarly.id)).toBeUndefined();
      expect(await queue.getJob(failedEarly.id)).toBeUndefined();
      expect((await queue.getJob(completedLate.id))?.status).toBe(
        JobStatus.COMPLETED,
      );
      expect((await queue.getJob(pending.id))?.status).toBe(JobStatus.PENDING);

      // The statuses list still works, alone or with olderThan.
      expect(
        await queue.cleanupTerminal({
          statuses: [JobStatus.FAILED],
          olderThan: at(30_000),
        }),
      ).toBe(0);
      expect(await queue.cleanupTerminal([JobStatus.COMPLETED])).toBe(1);
      expect(await queue.cleanupTerminal()).toBe(0);
      expect((await queue.getJob(pending.id))?.status).toBe(JobStatus.PENDING);
    });

    test("cleanupTerminal() rejects an invalid olderThan instead of removing everything", async () => {
      const queue = await store.queue<Payload>();
      const job = await queue.enqueue("send", payload);
      await queue.complete(job.id);

      await expect(
        queue.cleanupTerminal({ olderThan: new Date(Number.NaN) }),
      ).rejects.toThrow(TypeError);
      expect(await queue.getJob(job.id)).toBeDefined();
    });
  });
}

// The SQL queues keep a lease in process_at, so the tables need no new
// columns. That is also why they cannot tell a job left processing without a
// lease from one whose lease expired.
function describeSqlLeases(backend: Backend, enabled = true): void {
  describe.skipIf(!enabled)(`${backend.name}: SQL tables`, () => {
    let store: QueueStore;

    beforeEach(async () => {
      store = await backend.open();
    });

    afterEach(async () => {
      await store.close();
    });

    test("two dequeues at once take different jobs", async () => {
      // D1 runs each statement on its own, so these interleave between
      // statements; Postgres and MySQL run them on separate connections.
      const first = await store.queue<Payload>();
      const second = await store.queue<Payload>();
      await first.enqueue("send", { to: "1" });
      await first.enqueue("send", { to: "2" });
      // Past schema setup, so that the two dequeues run side by side.
      expect(await second.size()).toBe(2);

      const taken = await Promise.all([first.dequeue(), second.dequeue()]);
      expect(taken.map((job) => job?.data.to).sort()).toEqual(["1", "2"]);
    });

    test("while a job is processing, processAt is when its lease ends", async () => {
      setSystemTime(at(0));
      const queue = await store.queue<Payload>({ leaseMs: 60_000 });
      const job = await queue.enqueue("send", payload, { delay: 5_000 });

      setSystemTime(at(7_000));
      await queue.dequeue();
      const leased = await queue.getJob(job.id);
      expect(leased?.processAt).toEqual(at(67_000));
      expect(leased?.leaseExpiresAt).toEqual(at(67_000));
    });

    test("a job left processing without a lease is due at once when leases are turned on", async () => {
      setSystemTime(at(0));
      const withoutLeases = await store.queue<Payload>();
      const job = await withoutLeases.enqueue("send", payload);
      await withoutLeases.dequeue();

      setSystemTime(at(10_000));
      const leased = await store.queue<Payload>({ leaseMs: 60_000 });
      expect(await leased.nextDueAt()).toEqual(at(0));
      expect(await leased.size()).toBe(1);
      const again = await leased.dequeue();
      expect(again?.id).toBe(job.id);
      expect(again?.attempts).toBe(1);
      expect(again?.error).toBe(JOB_LEASE_EXPIRED);
      expect(again?.leaseExpiresAt).toEqual(at(70_000));
    });
  });
}

// Workers on separate connections dequeue at the same time.
function describeConcurrentLeases(backend: Backend, enabled = true): void {
  describe.skipIf(!enabled)(`${backend.name}: concurrent workers`, () => {
    let store: QueueStore;

    beforeEach(async () => {
      store = await backend.open();
    });

    afterEach(async () => {
      await store.close();
    });

    async function enqueueJobs(
      queue: LeasingJobQueue<Payload>,
      count: number,
    ): Promise<string[]> {
      const ids: string[] = [];
      for (let index = 0; index < count; index += 1) {
        ids.push((await queue.enqueue("send", { to: `${index}` })).id);
      }
      return ids.sort();
    }

    async function drain(
      queues: LeasingJobQueue<Payload>[],
    ): Promise<Job<Payload>[]> {
      const taken: Job<Payload>[] = [];
      await Promise.all(
        queues.map(async (queue) => {
          for (
            let job = await queue.dequeue();
            job;
            job = await queue.dequeue()
          ) {
            taken.push(job);
          }
        }),
      );
      return taken;
    }

    test("each job is taken once", async () => {
      setSystemTime(at(0));
      const workers = await Promise.all(
        Array.from({ length: 4 }, () =>
          store.queue<Payload>({ leaseMs: 60_000 }),
        ),
      );
      const [producer] = workers;
      if (!producer) throw new Error("no worker");
      const ids = await enqueueJobs(producer, 24);

      const taken = await drain(workers);
      expect(taken.map((job) => job.id).sort()).toEqual(ids);
    });

    test("each expired lease is settled once", async () => {
      setSystemTime(at(0));
      const expired: string[] = [];
      const workers = await Promise.all(
        Array.from({ length: 4 }, () =>
          store.queue<Payload>({
            leaseMs: 60_000,
            onLeaseExpired: (job) => {
              expired.push(job.id);
            },
          }),
        ),
      );
      const [producer] = workers;
      if (!producer) throw new Error("no worker");
      const ids = await enqueueJobs(producer, 24);
      expect(await drain([producer])).toHaveLength(24);

      setSystemTime(at(60_000));
      const taken = await drain(workers);
      expect(taken.map((job) => job.id).sort()).toEqual(ids);
      expect(taken.every((job) => job.attempts === 1)).toBe(true);
      expect(expired.sort()).toEqual(ids);
    });
  });
}

describeLeases(objectBackend);
describeLeases(sqliteQueueBackend);
describeLeases(d1Backend);
describeLeases(postgresJsBackend, Boolean(postgresUrl));
describeLeases(bunPostgresBackend, Boolean(postgresUrl));
describeLeases(mysqlBackend, Boolean(mysqlUrl));
describeLeases(mysqlReadCommittedBackend, Boolean(mysqlUrl));

describeSqlLeases(sqliteQueueBackend);
describeSqlLeases(d1Backend);
describeSqlLeases(postgresJsBackend, Boolean(postgresUrl));
describeSqlLeases(mysqlBackend, Boolean(mysqlUrl));
describeSqlLeases(mysqlReadCommittedBackend, Boolean(mysqlUrl));

describeConcurrentLeases(postgresJsBackend, Boolean(postgresUrl));
describeConcurrentLeases(mysqlBackend, Boolean(mysqlUrl));
describeConcurrentLeases(mysqlReadCommittedBackend, Boolean(mysqlUrl));

describe("HyperdriveJobQueue on D1: a take that fails", () => {
  test("still reports the leases dequeue() settled before it", async () => {
    setSystemTime(at(0));
    const db = new Database(":memory:");
    const d1 = createD1SqlClient(d1Database(db));
    // Fails the statement after the one that settles expired leases, as a
    // dropped D1 connection would.
    let failNextTake = false;
    let settling = false;
    const client: CloudflareSqlClient = {
      dialect: "sqlite",
      query: async <T>(sql: string, params?: readonly unknown[]) => {
        if (settling) {
          settling = false;
          throw new Error("D1_ERROR: connection lost");
        }
        const result = await d1.query<T>(sql, params);
        settling = failNextTake && Boolean(params?.includes(JOB_LEASE_EXPIRED));
        return result;
      },
    };
    const expired: Job<Payload>[] = [];
    const queue = new HyperdriveJobQueue<Payload>(client, {
      leaseMs: 1_000,
      onLeaseExpired: (job) => {
        expired.push(job);
      },
    });
    try {
      const job = await queue.enqueue("send", payload);
      await queue.dequeue();

      setSystemTime(at(1_000));
      failNextTake = true;
      await expect(queue.dequeue()).rejects.toThrow("connection lost");
      expect(expired.map((item) => [item.id, item.status])).toEqual([
        [job.id, JobStatus.PENDING],
      ]);

      // The settled job is taken next, and reported only once.
      failNextTake = false;
      expect((await queue.dequeue())?.id).toBe(job.id);
      expect(expired).toHaveLength(1);
    } finally {
      db.close();
    }
  });
});

describe.skipIf(!postgresUrl)(
  "HyperdriveJobQueue on Postgres: one statement per dequeue",
  () => {
    test("settles expired leases and takes the next job in one statement", async () => {
      setSystemTime(at(0));
      const connection = connectPostgresJs();
      const statements: string[] = [];
      const client: CloudflareSqlClient = {
        dialect: "postgres",
        query: <T>(sql: string, params?: readonly unknown[]) => {
          statements.push(sql);
          return connection.client.query<T>(sql, params);
        },
      };
      const tableName = nextTableName();
      try {
        const queue = new HyperdriveJobQueue<Payload>(client, {
          tableName,
          leaseMs: 1_000,
        });
        const expiring = await queue.enqueue("send", { to: "1" });
        expect((await queue.dequeue())?.id).toBe(expiring.id);
        setSystemTime(at(10));
        const waiting = await queue.enqueue("send", { to: "2" });

        setSystemTime(at(1_000));
        statements.length = 0;
        // The waiting job was due before the lease ended, so it goes first.
        expect((await queue.dequeue())?.id).toBe(waiting.id);
        expect(statements).toHaveLength(1);
        const settled = await queue.getJob(expiring.id);
        expect(settled?.status).toBe(JobStatus.PENDING);
        expect(settled?.attempts).toBe(1);
        expect(settled?.error).toBe(JOB_LEASE_EXPIRED);
      } finally {
        await connection.client.query(`DROP TABLE ${tableName}`);
        await connection.end();
      }
    });
  },
);
