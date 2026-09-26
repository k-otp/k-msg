import {
  notifyLeaseExpired,
  releaseExpiredLease,
  resolveCleanupOptions,
  resolveLeaseMs,
} from "../../queue/job-lease";
import type {
  Job,
  JobDequeueOptions,
  JobLeaseOptions,
  JobQueue,
  JobQueueCleanupOptions,
  JobRetryDirective,
} from "../../queue/job-queue.interface";
import { JOB_LEASE_EXPIRED, JobStatus } from "../../queue/job-queue.interface";
import type { CloudflareSqlClient } from "./sql-client";
import { runCloudflareSqlTransaction } from "./sql-client";
import {
  jsonParameterSql,
  readJsonColumn,
  readJsonObjectColumn,
  selectJsonAsTextSql,
  toJsonText,
} from "./sql-json";
import type { JobQueueIndexNames } from "./sql-schema";
import { initializeCloudflareSqlSchema } from "./sql-schema";

type JobRow = Record<string, unknown>;

const JOB_COLUMNS = [
  "id",
  "type",
  "data",
  "status",
  "priority",
  "attempts",
  "max_attempts",
  "delay",
  "created_at",
  "process_at",
  "completed_at",
  "failed_at",
  "error",
  "metadata",
] as const;

const JSON_JOB_COLUMNS: ReadonlySet<string> = new Set(["data", "metadata"]);

// Positional parameters in the order a statement uses them.
interface SqlParameters {
  readonly values: unknown[];
  add(value: unknown): string;
}

// Times are BIGINT milliseconds, which drivers return as numbers, strings or
// bigints.
function toOptionalDate(value: unknown): Date | undefined {
  if (typeof value === "bigint") return new Date(Number(value));
  if (typeof value === "number" && Number.isFinite(value))
    return new Date(value);
  if (typeof value === "string" && value.trim().length > 0) {
    const asNumber = Number(value);
    if (Number.isFinite(asNumber)) return new Date(asNumber);
    const asDate = new Date(value);
    if (!Number.isNaN(asDate.getTime())) return asDate;
  }
  return undefined;
}

function toDate(value: unknown, fallback = new Date()): Date {
  return toOptionalDate(value) ?? fallback;
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

export interface HyperdriveJobQueueConfig<T = unknown>
  extends JobLeaseOptions<Job<T>> {
  /** @default "kmsg_jobs" */
  tableName?: string;
  indexNames?: Partial<JobQueueIndexNames>;
  /**
   * Whether `init()` creates the table and indexes (`IF NOT EXISTS`). Each
   * new queue runs those statements before its first query, which in a
   * Worker means every request. Set it to `false` when migrations create the
   * schema, for example from `buildJobQueueSchemaSql()`.
   * @default true
   */
  initializeSchema?: boolean;
}

export type HyperdriveJobQueueOptions<T = unknown> =
  | string
  | HyperdriveJobQueueConfig<T>;

/**
 * A job queue in a SQL table on D1 or another SQLite, Postgres (Hyperdrive)
 * or MySQL.
 *
 * With `leaseMs`, a processing job's `process_at` holds its lease's end, so
 * the table needs no new column. `dequeue()` settles expired leases and takes
 * the next job with statements that each settle or take a job only once:
 * Postgres skips rows another `dequeue()` has locked, SQLite runs each
 * statement under its write lock, and MySQL locks the rows it changes, which
 * holds only when the client provides `transaction()`. Without
 * `onLeaseExpired`, Postgres does both in one statement; with it, the
 * callbacks run between the two, so they do not shorten the new lease.
 *
 * A job already processing without a lease, taken by an earlier version or
 * by a queue without `leaseMs`, cannot be told from one whose lease has
 * expired, so it is due at once.
 */
export class HyperdriveJobQueue<T> implements JobQueue<T> {
  private initPromise: Promise<void> | undefined;
  private readonly tableName: string;
  private readonly indexNames: Partial<JobQueueIndexNames> | undefined;
  private readonly initializeSchema: boolean;
  private readonly leaseMs: number;
  private readonly onLeaseExpired?: HyperdriveJobQueueConfig<T>["onLeaseExpired"];

  constructor(
    private readonly client: CloudflareSqlClient,
    options: HyperdriveJobQueueOptions<T> = {},
  ) {
    const resolved =
      typeof options === "string" ? { tableName: options } : options;
    this.leaseMs = resolveLeaseMs(resolved.leaseMs);
    this.tableName = resolved.tableName ?? "kmsg_jobs";
    this.indexNames = resolved.indexNames;
    this.initializeSchema = resolved.initializeSchema !== false;
    this.onLeaseExpired = resolved.onLeaseExpired;
  }

  async init(): Promise<void> {
    if (!this.initializeSchema) return;
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = initializeCloudflareSqlSchema(this.client, {
      target: "queue",
      queueTableName: this.tableName,
      queueIndexNames: this.indexNames,
    }).catch((error) => {
      this.initPromise = undefined;
      throw error;
    });

    return this.initPromise;
  }

  async enqueue(
    type: string,
    data: T,
    options: Parameters<JobQueue<T>["enqueue"]>[2] = {},
  ): Promise<Job<T>> {
    await this.init();

    const now = Date.now();
    const job: Job<T> = {
      id: this.generateId(),
      type,
      data,
      status: JobStatus.PENDING,
      priority: options.priority ?? 0,
      attempts: 0,
      maxAttempts: options.maxAttempts ?? 3,
      delay: options.delay ?? 0,
      createdAt: new Date(now),
      processAt: new Date(now + (options.delay ?? 0)),
      metadata: options.metadata ?? {},
    };

    const values = [
      job.id,
      job.type,
      toJsonText(job.data, this.hasNativeJsonColumns()),
      job.status,
      job.priority,
      job.attempts,
      job.maxAttempts,
      job.delay,
      job.createdAt.getTime(),
      job.processAt.getTime(),
      null,
      null,
      null,
      toJsonText(job.metadata, this.hasNativeJsonColumns()),
    ];

    const colSql = JOB_COLUMNS.map((column) =>
      this.quoteIdentifier(column),
    ).join(", ");
    const valueSql = JOB_COLUMNS.map((column, index) => {
      const placeholder = this.placeholder(index + 1);
      return JSON_JOB_COLUMNS.has(column)
        ? jsonParameterSql(
            this.client.dialect,
            placeholder,
            this.hasNativeJsonColumns(),
          )
        : placeholder;
    }).join(", ");

    await this.client.query(
      `INSERT INTO ${this.tableRef()} (${colSql}) VALUES (${valueSql})`,
      values,
    );

    return { ...job };
  }

  /**
   * Takes the next due job and, with `leaseMs`, leases it. Jobs whose lease
   * expired are due again first, or fail when they have no attempts left.
   * Jobs in `options.running` are left as they are.
   */
  async dequeue(options: JobDequeueOptions = {}): Promise<Job<T> | undefined> {
    await this.init();

    // Their caller will still complete or fail them, so their leases stand.
    const running = [...(options.running ?? [])];
    if (this.leasesEnabled() && this.onLeaseExpired) {
      // The callbacks run once the settled leases are stored and before the
      // job this returns is leased, so they cannot shorten its lease.
      for (const job of await this.settleExpiredLeases(running)) {
        await notifyLeaseExpired(this.onLeaseExpired, job);
      }
      return this.takeNext(running);
    }
    if (this.leasesEnabled() && this.client.dialect === "postgres") {
      return this.settleLeasesAndTakeNext(running);
    }
    if (this.leasesEnabled()) await this.settleExpiredLeases(running);
    return this.takeNext(running);
  }

  async complete(
    jobId: string,
    _result?: Parameters<JobQueue<T>["complete"]>[1],
  ): Promise<void> {
    await this.init();
    await this.client.query(
      `UPDATE ${this.tableRef()}
       SET ${this.quoteIdentifier("status")} = ${this.placeholder(1)},
           ${this.quoteIdentifier("completed_at")} = ${this.placeholder(2)}
       WHERE ${this.quoteIdentifier("id")} = ${this.placeholder(3)}`,
      [JobStatus.COMPLETED, Date.now(), jobId],
    );
  }

  /**
   * Counts a failed attempt: the job is due again after `retry.delayMs` when
   * retries are enabled and attempts are left, and fails otherwise. A
   * completed job stays completed, even for a worker whose lease expired.
   */
  async fail(
    jobId: string,
    error: string | Error,
    retry: JobRetryDirective = { enabled: false },
  ): Promise<void> {
    await this.init();

    const job = await this.getJob(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }
    if (job.status === JobStatus.COMPLETED) return;

    const q = (column: string) => this.quoteIdentifier(column);
    const message = error instanceof Error ? error.message : error;
    const now = Date.now();
    const p = this.parameters();
    // Parameters are added in the order the statement uses them. The attempt
    // is counted in SQL, and MySQL applies assignments in order, each seeing
    // the ones before it, so attempts changes last.
    const errorSql = `${q("error")} = ${p.add(message)}`;
    const canRetry = `${q("attempts")} + 1 < ${q("max_attempts")}`;
    const outcomeSql = retry.enabled
      ? `${q("process_at")} = CASE WHEN ${canRetry} THEN ${p.add(now + Math.ceil(retry.delayMs ?? 0))} ELSE ${q("process_at")} END,
         ${q("failed_at")} = CASE WHEN ${canRetry} THEN ${q("failed_at")} ELSE ${p.add(now)} END,
         ${q("status")} = CASE WHEN ${canRetry} THEN 'pending' ELSE 'failed' END`
      : `${q("failed_at")} = ${p.add(now)},
         ${q("status")} = 'failed'`;
    await this.client.query(
      `UPDATE ${this.tableRef()}
       SET ${errorSql},
           ${outcomeSql},
           ${q("attempts")} = ${q("attempts")} + 1
       WHERE ${q("id")} = ${p.add(jobId)} AND ${q("status")} <> 'completed'`,
      p.values,
    );
  }

  /**
   * The job `dequeue()` would take next, including one whose lease expired,
   * shown as it will be once it is due again. Changes nothing.
   */
  async peek(): Promise<Job<T> | undefined> {
    await this.init();

    const now = Date.now();
    const p = this.parameters();
    const { rows } = await this.client.query<JobRow>(
      `SELECT ${this.selectListSql()} FROM ${this.tableRef()}
       WHERE ${this.dueSql(p, now)}
       ORDER BY ${this.dueOrderSql()}
       LIMIT 1`,
      p.values,
    );

    const row = rows[0];
    if (!row) return undefined;
    const job = this.rowToJob(row);
    return releaseExpiredLease(job, now) ?? job;
  }

  /** How many jobs are due now, including those whose lease expired. */
  async size(): Promise<number> {
    await this.init();

    const p = this.parameters();
    const { rows } = await this.client.query<{ count?: unknown }>(
      `SELECT COUNT(1) as count FROM ${this.tableRef()}
       WHERE ${this.dueSql(p, Date.now())}`,
      p.values,
    );

    const count = rows[0]?.count;
    return toNumber(count, 0);
  }

  /**
   * When `dequeue()` next has work: the earliest due time of a pending job
   * or, with `leaseMs`, lease expiry of a processing one. A time in the past
   * means `dequeue()` has work now, even when it only settles an expired
   * lease, so call `dequeue()` rather than checking `size()`. `undefined`
   * when no job is pending or leased.
   */
  async nextDueAt(): Promise<Date | undefined> {
    await this.init();

    const statuses = this.leasesEnabled()
      ? "'pending', 'processing'"
      : "'pending'";
    const { rows } = await this.client.query<{ next_due_at?: unknown }>(
      `SELECT MIN(${this.quoteIdentifier("process_at")}) AS ${this.quoteIdentifier("next_due_at")}
       FROM ${this.tableRef()}
       WHERE ${this.quoteIdentifier("status")} IN (${statuses})`,
    );
    return toOptionalDate(rows[0]?.next_due_at);
  }

  async getJob(jobId: string): Promise<Job<T> | undefined> {
    await this.init();

    const { rows } = await this.client.query<JobRow>(
      `SELECT ${this.selectListSql()} FROM ${this.tableRef()}
       WHERE ${this.quoteIdentifier("id")} = ${this.placeholder(1)}
       LIMIT 1`,
      [jobId],
    );

    const row = rows[0];
    return row ? this.rowToJob(row) : undefined;
  }

  async remove(jobId: string): Promise<boolean> {
    await this.init();

    const result = await this.client.query(
      `DELETE FROM ${this.tableRef()} WHERE ${this.quoteIdentifier("id")} = ${this.placeholder(1)}`,
      [jobId],
    );

    if (typeof result.rowCount === "number") {
      return result.rowCount > 0;
    }

    const exists = await this.getJob(jobId);
    return !exists;
  }

  async clear(): Promise<void> {
    await this.init();
    await this.client.query(`DELETE FROM ${this.tableRef()}`);
  }

  /**
   * Removes finished jobs: completed and failed ones by default, or those
   * with the given statuses, and with `olderThan`, only those that finished
   * before it.
   */
  async cleanupTerminal(
    options: JobStatus[] | JobQueueCleanupOptions = {},
  ): Promise<number> {
    const { statuses, olderThan } = resolveCleanupOptions(options);
    await this.init();

    if (statuses.length === 0) {
      return 0;
    }

    const q = (column: string) => this.quoteIdentifier(column);
    const matching = (p: SqlParameters) => {
      const inList = statuses.map((status) => p.add(status)).join(", ");
      const finished =
        olderThan === undefined
          ? ""
          : ` AND COALESCE(${q("completed_at")}, ${q("failed_at")}, ${q("created_at")}) < ${p.add(olderThan.getTime())}`;
      return `${q("status")} IN (${inList})${finished}`;
    };

    const select = this.parameters();
    const { rows } = await this.client.query<{ id?: string }>(
      `SELECT ${q("id")} FROM ${this.tableRef()}
       WHERE ${matching(select)}`,
      select.values,
    );

    if (rows.length === 0) {
      return 0;
    }

    const remove = this.parameters();
    await this.client.query(
      `DELETE FROM ${this.tableRef()}
       WHERE ${matching(remove)}`,
      remove.values,
    );

    return rows.length;
  }

  async close(): Promise<void> {
    await this.client.close?.();
  }

  private leasesEnabled(): boolean {
    return Number.isFinite(this.leaseMs);
  }

  // Marks the next due pending job processing and, with leases, leases it
  // from now. One statement: Postgres skips rows another dequeue() has
  // locked, and SQLite runs it under its write lock.
  private async takeNext(
    running: readonly string[],
  ): Promise<Job<T> | undefined> {
    if (this.client.dialect === "mysql") {
      return runCloudflareSqlTransaction(this.client, (tx) =>
        this.takeNextByLocking(tx, running),
      );
    }
    const q = (column: string) => this.quoteIdentifier(column);
    const table = this.tableRef();
    const now = Date.now();
    const p = this.parameters();
    const lease = this.leasesEnabled()
      ? `${q("process_at")} = ${p.add(now + this.leaseMs)}, `
      : "";
    const next = `SELECT ${q("id")} FROM ${table}
      WHERE ${q("status")} = 'pending' AND ${q("process_at")} <= ${p.add(now)}${this.notRunningSql(p, running)}
      ORDER BY ${this.dueOrderSql()}
      LIMIT 1`;
    const sql =
      this.client.dialect === "postgres"
        ? `WITH next_job AS (${next} FOR UPDATE SKIP LOCKED)
           UPDATE ${table}
           SET ${lease}${q("status")} = 'processing'
           WHERE ${q("id")} = (SELECT ${q("id")} FROM next_job)
           RETURNING ${this.selectListSql()}`
        : `UPDATE ${table}
           SET ${lease}${q("status")} = 'processing'
           WHERE ${q("id")} = (${next})
           RETURNING ${this.selectListSql()}`;

    const { rows } = await this.client.query<JobRow>(sql, p.values);
    const row = rows[0];
    return row ? this.rowToJob(row) : undefined;
  }

  // Makes every job whose lease expired due again, or failed when it has no
  // attempts left, and returns them. Postgres skips rows another dequeue()
  // has locked; SQLite runs the statement under its write lock.
  private async settleExpiredLeases(
    running: readonly string[],
  ): Promise<Job<T>[]> {
    if (this.client.dialect === "mysql") {
      return runCloudflareSqlTransaction(this.client, (tx) =>
        this.settleExpiredLeasesByLocking(tx, running),
      );
    }
    const q = (column: string) => this.quoteIdentifier(column);
    const table = this.tableRef();
    const now = Date.now();
    const p = this.parameters();
    const settle = this.settleLeaseSql(p, now);
    const expired = `${q("status")} = 'processing' AND ${q("process_at")} <= ${p.add(now)}${this.notRunningSql(p, running)}`;
    const sql =
      this.client.dialect === "postgres"
        ? `WITH expired AS (
             SELECT ${q("id")} FROM ${table} WHERE ${expired}
             FOR UPDATE SKIP LOCKED
           )
           UPDATE ${table}
           SET ${settle}
           WHERE ${q("id")} = ANY (ARRAY(SELECT ${q("id")} FROM expired))
           RETURNING ${this.selectListSql()}`
        : `UPDATE ${table}
           SET ${settle}
           WHERE ${expired}
           RETURNING ${this.selectListSql()}`;

    const { rows } = await this.client.query<JobRow>(sql, p.values);
    return rows.map((row) => this.rowToJob(row));
  }

  // Postgres, when no callback has to run in between: one statement settles
  // every expired lease no other dequeue() has locked and takes the next due
  // job, which may be one of them, writing each row once. The update joins
  // the rows it writes, so each is read before it changes: a CTE read after
  // the update would skip the rows it changed.
  private async settleLeasesAndTakeNext(
    running: readonly string[],
  ): Promise<Job<T> | undefined> {
    const q = (column: string) => this.quoteIdentifier(column);
    const col = (column: string) => `job.${q(column)}`;
    const table = this.tableRef();
    const now = Date.now();
    const p = this.parameters();
    const nowSql = p.add(now);
    const leaseEndSql = p.add(now + this.leaseMs);
    const errorSql = p.add(JOB_LEASE_EXPIRED);
    const notRunning = this.notRunningSql(p, running);
    const taken = `${col("id")} = (SELECT ${q("id")} FROM next_job)`;
    const wasProcessing = `${col("status")} = 'processing'`;
    const canRetry = `${col("attempts")} + 1 < ${col("max_attempts")}`;
    const { rows } = await this.client.query<JobRow>(
      `WITH expired AS (
         SELECT ${q("id")} FROM ${table}
         WHERE ${q("status")} = 'processing' AND ${q("process_at")} <= ${nowSql}${notRunning}
         FOR UPDATE SKIP LOCKED
       ),
       next_job AS (
         SELECT ${q("id")} FROM ${table}
         WHERE ${q("process_at")} <= ${nowSql}${notRunning}
           AND (${q("status")} = 'pending' OR (${q("status")} = 'processing'
             AND ${q("attempts")} + 1 < ${q("max_attempts")}))
         ORDER BY ${this.dueOrderSql()}
         LIMIT 1
         FOR UPDATE SKIP LOCKED
       ),
       targets AS (
         SELECT ${q("id")} AS ${q("target_id")} FROM expired
         UNION
         SELECT ${q("id")} FROM next_job
       )
       UPDATE ${table} AS job
       SET ${q("status")} = CASE
             WHEN ${taken} THEN 'processing'
             WHEN ${canRetry} THEN 'pending'
             ELSE 'failed' END,
           ${q("attempts")} = CASE WHEN ${wasProcessing} THEN ${col("attempts")} + 1 ELSE ${col("attempts")} END,
           ${q("error")} = CASE WHEN ${wasProcessing} THEN ${errorSql} ELSE ${col("error")} END,
           ${q("process_at")} = CASE WHEN ${taken} THEN ${leaseEndSql} ELSE ${col("process_at")} END,
           ${q("failed_at")} = CASE
             WHEN ${taken} OR ${canRetry} THEN ${col("failed_at")}
             ELSE ${nowSql} END
       FROM targets
       WHERE ${col("id")} = targets.${q("target_id")}
       RETURNING ${this.selectListSql()}`,
      p.values,
    );

    const row = rows.find((candidate) => candidate.status === "processing");
    return row ? this.rowToJob(row) : undefined;
  }

  // MySQL has no UPDATE ... RETURNING, and a locking read of a range also
  // locks the gaps between its rows, which deadlocks with another dequeue()
  // moving a job into that range. So rows are found with plain reads and
  // then locked by id: a locking read returns a row's latest version, at
  // any isolation level, and holds the row until the transaction ends, so
  // the rows it returns are the ones this dequeue() changes. Without
  // transaction(), each lock ends with its statement: a lease two workers
  // settle at once can be reported twice, and without leases a job can be
  // taken twice.
  private async settleExpiredLeasesByLocking(
    tx: CloudflareSqlClient,
    running: readonly string[],
  ): Promise<Job<T>[]> {
    const q = (column: string) => this.quoteIdentifier(column);
    const table = this.tableRef();
    const now = Date.now();
    const find = this.parameters();
    const { rows: expired } = await tx.query<JobRow>(
      `SELECT ${q("id")} FROM ${table}
       WHERE ${q("status")} = 'processing' AND ${q("process_at")} <= ${find.add(now)}${this.notRunningSql(find, running)}`,
      find.values,
    );
    if (expired.length === 0) return [];

    const lock = this.parameters();
    const { rows: locked } = await tx.query<JobRow>(
      `SELECT ${this.selectListSql()} FROM ${table}
       WHERE ${q("id")} IN (${this.inListSql(
         lock,
         expired.map((row) => row.id),
       )})
         AND ${q("status")} = 'processing' AND ${q("process_at")} <= ${lock.add(now)}
       FOR UPDATE`,
      lock.values,
    );
    if (locked.length === 0) return [];

    const settle = this.parameters();
    await tx.query(
      `UPDATE ${table}
       SET ${this.settleLeaseSql(settle, now)}
       WHERE ${q("id")} IN (${this.inListSql(
         settle,
         locked.map((row) => row.id),
       )})
         AND ${q("status")} = 'processing'`,
      settle.values,
    );
    const released: Job<T>[] = [];
    for (const row of locked) {
      const settled = releaseExpiredLease(this.rowToJob(row), now);
      if (settled) released.push(settled);
    }
    return released;
  }

  private async takeNextByLocking(
    tx: CloudflareSqlClient,
    running: readonly string[],
  ): Promise<Job<T> | undefined> {
    const q = (column: string) => this.quoteIdentifier(column);
    const table = this.tableRef();
    const now = Date.now();
    // A job another dequeue() has locked or taken since the plain read
    // found it is left out when looking again.
    const tried: unknown[] = [];
    for (;;) {
      const find = this.parameters();
      const due = find.add(now);
      const skip =
        this.notRunningSql(find, running) +
        (tried.length > 0
          ? ` AND ${q("id")} NOT IN (${this.inListSql(find, tried)})`
          : "");
      const { rows: candidates } = await tx.query<JobRow>(
        `SELECT ${q("id")} FROM ${table}
         WHERE ${q("status")} = 'pending' AND ${q("process_at")} <= ${due}${skip}
         ORDER BY ${this.dueOrderSql()}
         LIMIT 1`,
        find.values,
      );
      const id = candidates[0]?.id;
      if (id === undefined || id === null) return undefined;

      const lock = this.parameters();
      const { rows: locked } = await tx.query<JobRow>(
        `SELECT ${q("id")} FROM ${table}
         WHERE ${q("id")} = ${lock.add(id)}
           AND ${q("status")} = 'pending' AND ${q("process_at")} <= ${lock.add(now)}
         FOR UPDATE`,
        lock.values,
      );
      if (locked.length === 0) {
        tried.push(id);
        continue;
      }

      // The lease starts when it is stored: the locking read may have
      // waited for another dequeue().
      const leaseEnd = Date.now() + this.leaseMs;
      const take = this.parameters();
      const lease = this.leasesEnabled()
        ? `${q("process_at")} = ${take.add(leaseEnd)}, `
        : "";
      await tx.query(
        `UPDATE ${table}
         SET ${lease}${q("status")} = 'processing'
         WHERE ${q("id")} = ${take.add(id)} AND ${q("status")} = 'pending'`,
        take.values,
      );
      const { rows } = await tx.query<JobRow>(
        `SELECT ${this.selectListSql()} FROM ${table} WHERE ${q("id")} = ? LIMIT 1`,
        [id],
      );
      const row = rows[0];
      const job = row ? this.rowToJob(row) : undefined;
      // Without a transaction the lock has ended, and another dequeue()
      // may have taken the job since; its lease ends at another time.
      if (
        job?.status === JobStatus.PROCESSING &&
        (!this.leasesEnabled() || job.processAt.getTime() === leaseEnd)
      ) {
        return job;
      }
      tried.push(id);
    }
  }

  // Leaves out the jobs the caller is still running. Their ids go in one JSON
  // parameter, since D1 binds at most 100 parameters to a statement.
  private notRunningSql(p: SqlParameters, running: readonly string[]): string {
    if (running.length === 0) return "";
    const id = this.quoteIdentifier("id");
    const ids = p.add(JSON.stringify(running));
    if (this.client.dialect === "postgres") {
      return ` AND ${id} NOT IN (SELECT jsonb_array_elements_text(${ids}::text::jsonb))`;
    }
    if (this.client.dialect === "mysql") {
      return ` AND NOT JSON_CONTAINS(${ids}, JSON_QUOTE(${id}))`;
    }
    return ` AND ${id} NOT IN (SELECT value FROM json_each(${ids}))`;
  }

  private inListSql(p: SqlParameters, values: readonly unknown[]): string {
    return values.map((value) => p.add(value)).join(", ");
  }

  // The assignments that settle an expired lease. MySQL applies them in
  // order, each seeing the ones before it, so attempts changes last.
  private settleLeaseSql(p: SqlParameters, now: number): string {
    const q = (column: string) => this.quoteIdentifier(column);
    const canRetry = `${q("attempts")} + 1 < ${q("max_attempts")}`;
    return `${q("error")} = ${p.add(JOB_LEASE_EXPIRED)},
      ${q("failed_at")} = CASE WHEN ${canRetry} THEN ${q("failed_at")} ELSE ${p.add(now)} END,
      ${q("status")} = CASE WHEN ${canRetry} THEN 'pending' ELSE 'failed' END,
      ${q("attempts")} = ${q("attempts")} + 1`;
  }

  // The jobs dequeue() can take now: pending ones that are due and, with
  // leases, processing ones whose lease expired with attempts left.
  private dueSql(p: SqlParameters, now: number): string {
    const q = (column: string) => this.quoteIdentifier(column);
    const due = `${q("process_at")} <= ${p.add(now)}`;
    if (!this.leasesEnabled()) {
      return `${q("status")} = 'pending' AND ${due}`;
    }
    return `${due} AND (${q("status")} = 'pending' OR (${q("status")} = 'processing' AND ${q("attempts")} + 1 < ${q("max_attempts")}))`;
  }

  // The order dequeue() takes due jobs in: priority, then due time, then age.
  private dueOrderSql(): string {
    const q = (column: string) => this.quoteIdentifier(column);
    return `${q("priority")} DESC, ${q("process_at")} ASC, ${q("created_at")} ASC`;
  }

  private rowToJob(row: JobRow): Job<T> {
    const now = new Date();
    const data = readJsonColumn(row.data);
    const metadata = readJsonObjectColumn(row.metadata);
    const status = String(row.status ?? JobStatus.PENDING) as JobStatus;
    const processAt = toDate(row.process_at, now);
    return {
      id: String(row.id ?? ""),
      type: String(row.type ?? ""),
      data: (data === undefined ? {} : data) as T,
      status,
      priority: toNumber(row.priority, 0),
      attempts: toNumber(row.attempts, 0),
      maxAttempts: toNumber(row.max_attempts, 3),
      delay: toNumber(row.delay, 0),
      createdAt: toDate(row.created_at, now),
      processAt,
      completedAt: toOptionalDate(row.completed_at),
      failedAt: toOptionalDate(row.failed_at),
      error:
        typeof row.error === "string" && row.error.length > 0
          ? row.error
          : undefined,
      metadata: metadata ?? {},
      // A processing job's process_at is when its lease ends.
      leaseExpiresAt:
        status === JobStatus.PROCESSING && this.leasesEnabled()
          ? processAt
          : undefined,
    };
  }

  // The queue table's JSON columns are JSONB on Postgres and TEXT elsewhere.
  private hasNativeJsonColumns(): boolean {
    return this.client.dialect === "postgres";
  }

  // The table's columns, with JSON columns read as JSON text.
  private selectListSql(): string {
    return JOB_COLUMNS.map((column) => {
      const quoted = this.quoteIdentifier(column);
      return JSON_JOB_COLUMNS.has(column)
        ? selectJsonAsTextSql(this.client.dialect, quoted)
        : quoted;
    }).join(", ");
  }

  private generateId(): string {
    return `job_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
  }

  private tableRef(): string {
    return this.quoteIdentifier(this.tableName);
  }

  private quoteIdentifier(identifier: string): string {
    if (this.client.dialect === "mysql") {
      return `\`${identifier.replace(/`/g, "``")}\``;
    }
    return `"${identifier.replace(/"/g, '""')}"`;
  }

  private placeholder(index: number): string {
    return this.client.dialect === "postgres" ? `$${index}` : "?";
  }

  // $1, $2 … on Postgres and ? elsewhere, numbered in the order they are
  // added, which must be the order the statement uses them.
  private parameters(): SqlParameters {
    const values: unknown[] = [];
    return {
      values,
      add: (value) => {
        values.push(value);
        return this.placeholder(values.length);
      },
    };
  }
}
