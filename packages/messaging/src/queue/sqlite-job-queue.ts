import Database from "bun:sqlite";
import {
  notifyLeaseExpired,
  releaseExpiredLease,
  resolveCleanupOptions,
  resolveLeaseMs,
} from "./job-lease";
import {
  JOB_LEASE_EXPIRED,
  type Job,
  type JobDequeueOptions,
  type JobLeaseOptions,
  type JobQueue,
  type JobQueueCleanupOptions,
  type JobRetryDirective,
  JobStatus,
} from "./job-queue.interface";

export interface SQLiteJobQueueOptions<T = unknown>
  extends JobLeaseOptions<Job<T>> {
  /** Default: `:memory:`. */
  dbPath?: string;
}

const JOB_COLUMNS = `id, type, data, status, priority, attempts, max_attempts,
  delay, created_at, process_at, completed_at, failed_at, error, metadata`;

// The order dequeue() takes due jobs in: priority, then due time, then age.
const DUE_ORDER = "priority DESC, process_at ASC, created_at ASC";

// Leaves out the jobs the caller is still running, whose ids go in one JSON
// parameter.
function notRunningSql(running: readonly string[]): string {
  return running.length > 0
    ? " AND id NOT IN (SELECT value FROM json_each(?))"
    : "";
}

function notRunningParams(running: readonly string[]): string[] {
  return running.length > 0 ? [JSON.stringify(running)] : [];
}

/**
 * A job queue in a SQLite database.
 *
 * With `leaseMs`, a processing job's `process_at` holds its lease's end, so
 * the table needs no new column. A job already processing without a lease,
 * taken by an earlier version or by a queue without `leaseMs`, cannot be
 * told from one whose lease has expired, so it is due at once.
 */
export class SQLiteJobQueue<T> implements JobQueue<T> {
  private db: Database;
  private readonly leaseMs: number;
  private readonly onLeaseExpired?: SQLiteJobQueueOptions<T>["onLeaseExpired"];

  constructor(options: SQLiteJobQueueOptions<T> = {}) {
    this.leaseMs = resolveLeaseMs(options.leaseMs);
    this.onLeaseExpired = options.onLeaseExpired;
    this.db = new Database(options.dbPath ?? ":memory:");
    this.initializeSchema();
  }

  private initializeSchema(): void {
    this.db.exec("PRAGMA journal_mode = WAL;");

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        data TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        priority INTEGER NOT NULL DEFAULT 0,
        attempts INTEGER NOT NULL DEFAULT 0,
        max_attempts INTEGER NOT NULL DEFAULT 3,
        delay INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        process_at INTEGER NOT NULL,
        completed_at INTEGER,
        failed_at INTEGER,
        error TEXT,
        metadata TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_jobs_dequeue
        ON jobs(status, priority DESC, process_at ASC, created_at ASC);

      CREATE INDEX IF NOT EXISTS idx_jobs_id ON jobs(id);
    `);
  }

  private jobToRow(job: Job<T>): Record<string, unknown> {
    return {
      id: job.id,
      type: job.type,
      data: JSON.stringify(job.data),
      status: job.status,
      priority: job.priority,
      attempts: job.attempts,
      max_attempts: job.maxAttempts,
      delay: job.delay,
      created_at: job.createdAt.getTime(),
      process_at: job.processAt.getTime(),
      completed_at: job.completedAt?.getTime() ?? null,
      failed_at: job.failedAt?.getTime() ?? null,
      error: job.error ?? null,
      metadata: JSON.stringify(job.metadata),
    };
  }

  private rowToJob(row: Record<string, unknown>): Job<T> {
    const status = row.status as JobStatus;
    const processAt = new Date(row.process_at as number);
    return {
      id: row.id as string,
      type: row.type as string,
      data: JSON.parse(row.data as string) as T,
      status,
      priority: row.priority as number,
      attempts: row.attempts as number,
      maxAttempts: row.max_attempts as number,
      delay: row.delay as number,
      createdAt: new Date(row.created_at as number),
      processAt,
      completedAt: row.completed_at
        ? new Date(row.completed_at as number)
        : undefined,
      failedAt: row.failed_at ? new Date(row.failed_at as number) : undefined,
      error: (row.error as string | null) ?? undefined,
      metadata: JSON.parse(row.metadata as string) as Record<string, any>,
      // A processing job's process_at is when its lease ends.
      leaseExpiresAt:
        status === JobStatus.PROCESSING && this.leasesEnabled()
          ? processAt
          : undefined,
    };
  }

  private generateId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private leasesEnabled(): boolean {
    return Number.isFinite(this.leaseMs);
  }

  // The jobs dequeue() can take now: pending ones that are due and, with
  // leases, processing ones whose lease expired with attempts left.
  private dueSql(): string {
    return this.leasesEnabled()
      ? `process_at <= ? AND (status = 'pending'
          OR (status = 'processing' AND attempts + 1 < max_attempts))`
      : "status = 'pending' AND process_at <= ?";
  }

  async enqueue(
    type: string,
    data: T,
    options?: {
      priority?: number;
      delay?: number;
      maxAttempts?: number;
      metadata?: Record<string, any>;
    },
  ): Promise<Job<T>> {
    const now = Date.now();
    const job: Job<T> = {
      id: this.generateId(),
      type,
      data,
      status: JobStatus.PENDING,
      priority: options?.priority ?? 0,
      attempts: 0,
      maxAttempts: options?.maxAttempts ?? 3,
      delay: options?.delay ?? 0,
      createdAt: new Date(now),
      processAt: new Date(now + (options?.delay ?? 0)),
      metadata: options?.metadata ?? {},
    };

    const row = this.jobToRow(job);
    const stmt = this.db.prepare(`
      INSERT INTO jobs (
        id, type, data, status, priority, attempts, max_attempts,
        delay, created_at, process_at, completed_at, failed_at, error, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      row.id as string,
      row.type as string,
      row.data as string,
      row.status as string,
      row.priority as number,
      row.attempts as number,
      row.max_attempts as number,
      row.delay as number,
      row.created_at as number,
      row.process_at as number,
      row.completed_at as number | null,
      row.failed_at as number | null,
      row.error as string | null,
      row.metadata as string,
    );

    return job;
  }

  /**
   * Takes the next due job and, with `leaseMs`, leases it. Jobs whose lease
   * expired are due again first, or fail when they have no attempts left.
   */
  async dequeue(options: JobDequeueOptions = {}): Promise<Job<T> | undefined> {
    // Their caller will still complete or fail them, so their leases stand.
    const running = [...(options.running ?? [])];
    if (this.leasesEnabled()) {
      // The callbacks run once the settled leases are stored and before the
      // job this returns is leased, so they cannot shorten its lease.
      for (const job of this.settleExpiredLeases(running)) {
        await notifyLeaseExpired(this.onLeaseExpired, job);
      }
    }
    return this.takeNext(running);
  }

  // Makes every job whose lease expired due again, or failed when it has no
  // attempts left.
  private settleExpiredLeases(running: readonly string[]): Job<T>[] {
    const now = Date.now();
    const stmt = this.db.prepare(`
      UPDATE jobs
      SET error = ?,
          failed_at = CASE WHEN attempts + 1 < max_attempts
            THEN failed_at ELSE ? END,
          status = CASE WHEN attempts + 1 < max_attempts
            THEN 'pending' ELSE 'failed' END,
          attempts = attempts + 1
      WHERE status = 'processing' AND process_at <= ?${notRunningSql(running)}
      RETURNING ${JOB_COLUMNS}
    `);

    const rows = stmt.all(
      JOB_LEASE_EXPIRED,
      now,
      now,
      ...notRunningParams(running),
    ) as Record<string, unknown>[];
    return rows.map((row) => this.rowToJob(row));
  }

  // Marks the next due pending job processing and, with leases, leases it
  // from now.
  private takeNext(running: readonly string[]): Job<T> | undefined {
    const now = Date.now();
    const lease = this.leasesEnabled() ? "process_at = ?," : "";
    const stmt = this.db.prepare(`
      UPDATE jobs
      SET ${lease} status = 'processing'
      WHERE id = (
        SELECT id FROM jobs
        WHERE status = 'pending'
          AND process_at <= ?${notRunningSql(running)}
        ORDER BY ${DUE_ORDER}
        LIMIT 1
      )
      RETURNING ${JOB_COLUMNS}
    `);

    const result = (
      this.leasesEnabled()
        ? stmt.get(now + this.leaseMs, now, ...notRunningParams(running))
        : stmt.get(now, ...notRunningParams(running))
    ) as Record<string, unknown> | null;

    return result ? this.rowToJob(result) : undefined;
  }

  async complete(jobId: string, _result?: any): Promise<void> {
    const now = Date.now();
    const stmt = this.db.prepare(`
      UPDATE jobs
      SET status = 'completed',
          completed_at = ?
      WHERE id = ?
    `);

    stmt.run(now, jobId);
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
    const errorMessage = error instanceof Error ? error.message : error;
    const now = Date.now();

    const job = await this.getJob(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }
    if (job.status === JobStatus.COMPLETED) return;

    if (retry.enabled) {
      const stmt = this.db.prepare(`
        UPDATE jobs
        SET error = ?,
            process_at = CASE WHEN attempts + 1 < max_attempts
              THEN ? ELSE process_at END,
            failed_at = CASE WHEN attempts + 1 < max_attempts
              THEN failed_at ELSE ? END,
            status = CASE WHEN attempts + 1 < max_attempts
              THEN 'pending' ELSE 'failed' END,
            attempts = attempts + 1
        WHERE id = ? AND status <> 'completed'
      `);

      stmt.run(errorMessage, now + Math.ceil(retry.delayMs ?? 0), now, jobId);
    } else {
      const stmt = this.db.prepare(`
        UPDATE jobs
        SET error = ?,
            failed_at = ?,
            status = 'failed',
            attempts = attempts + 1
        WHERE id = ? AND status <> 'completed'
      `);

      stmt.run(errorMessage, now, jobId);
    }
  }

  /**
   * The job `dequeue()` would take next, including one whose lease expired,
   * shown as it will be once it is due again. Changes nothing.
   */
  async peek(): Promise<Job<T> | undefined> {
    const now = Date.now();
    const stmt = this.db.prepare(`
      SELECT ${JOB_COLUMNS}
      FROM jobs
      WHERE ${this.dueSql()}
      ORDER BY ${DUE_ORDER}
      LIMIT 1
    `);

    const result = stmt.get(now) as Record<string, unknown> | undefined;

    if (!result) {
      return undefined;
    }

    const job = this.rowToJob(result);
    return releaseExpiredLease(job, now) ?? job;
  }

  /** How many jobs are due now, including those whose lease expired. */
  async size(): Promise<number> {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM jobs
      WHERE ${this.dueSql()}
    `);

    const result = stmt.get(Date.now()) as { count: number };
    return result.count;
  }

  /**
   * When `dequeue()` next has work: the earliest due time of a pending job
   * or, with `leaseMs`, lease expiry of a processing one. A time in the past
   * means `dequeue()` has work now, even when it only settles an expired
   * lease, so call `dequeue()` rather than checking `size()`. `undefined`
   * when no job is pending or leased.
   */
  async nextDueAt(): Promise<Date | undefined> {
    const statuses = this.leasesEnabled()
      ? "'pending', 'processing'"
      : "'pending'";
    const stmt = this.db.prepare(`
      SELECT MIN(process_at) AS next_due_at
      FROM jobs
      WHERE status IN (${statuses})
    `);

    const result = stmt.get() as { next_due_at: number | null };
    return result.next_due_at === null
      ? undefined
      : new Date(result.next_due_at);
  }

  async getJob(jobId: string): Promise<Job<T> | undefined> {
    const stmt = this.db.prepare(`
      SELECT ${JOB_COLUMNS}
      FROM jobs
      WHERE id = ?
    `);

    const result = stmt.get(jobId) as Record<string, unknown> | undefined;

    if (!result) {
      return undefined;
    }

    return this.rowToJob(result);
  }

  async remove(jobId: string): Promise<boolean> {
    const stmt = this.db.prepare(`
      DELETE FROM jobs
      WHERE id = ?
    `);

    stmt.run(jobId);

    const changes = this.db.query("SELECT changes() as changes").get() as {
      changes: number;
    };
    return changes.changes > 0;
  }

  async clear(): Promise<void> {
    this.db.exec("DELETE FROM jobs");
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
    if (statuses.length === 0) {
      return 0;
    }

    const placeholders = statuses.map(() => "?").join(", ");
    const finished =
      olderThan === undefined
        ? ""
        : "AND COALESCE(completed_at, failed_at, created_at) < ?";
    const stmt = this.db.prepare(`
      DELETE FROM jobs
      WHERE status IN (${placeholders})
      ${finished}
    `);

    if (olderThan === undefined) {
      stmt.run(...statuses);
    } else {
      stmt.run(...statuses, olderThan.getTime());
    }

    const changes = this.db.query("SELECT changes() as changes").get() as {
      changes: number;
    };
    return changes.changes;
  }

  close(): void {
    this.db.close();
  }
}
