import Database from "bun:sqlite";
import { type Job, type JobQueue, JobStatus } from "./job-queue.interface";

interface SQLiteJobQueueOptions {
  dbPath?: string;
}

export class SQLiteJobQueue<T> implements JobQueue<T> {
  private db: Database;

  constructor(options: SQLiteJobQueueOptions = {}) {
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
    return {
      id: row.id as string,
      type: row.type as string,
      data: JSON.parse(row.data as string) as T,
      status: row.status as JobStatus,
      priority: row.priority as number,
      attempts: row.attempts as number,
      maxAttempts: row.max_attempts as number,
      delay: row.delay as number,
      createdAt: new Date(row.created_at as number),
      processAt: new Date(row.process_at as number),
      completedAt: row.completed_at
        ? new Date(row.completed_at as number)
        : undefined,
      failedAt: row.failed_at ? new Date(row.failed_at as number) : undefined,
      error: (row.error as string | null) ?? undefined,
      metadata: JSON.parse(row.metadata as string) as Record<string, any>,
    };
  }

  private generateId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
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

  async dequeue(): Promise<Job<T> | undefined> {
    const now = Date.now();

    const stmt = this.db.prepare(`
      UPDATE jobs
      SET status = 'processing'
      WHERE id = (
        SELECT id FROM jobs
        WHERE status = 'pending' 
          AND process_at <= ?
        ORDER BY priority DESC, process_at ASC, created_at ASC
        LIMIT 1
      )
      RETURNING id, type, data, status, priority, attempts, max_attempts,
                delay, created_at, process_at, completed_at, failed_at, error, metadata
    `);

    const result = stmt.get(now) as Record<string, unknown> | undefined;

    if (!result) {
      return undefined;
    }

    return this.rowToJob(result);
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

  async fail(
    jobId: string,
    error: string | Error,
    shouldRetry?: boolean,
  ): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : error;
    const now = Date.now();

    const job = await this.getJob(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    const newAttempts = job.attempts + 1;

    if (shouldRetry && newAttempts < job.maxAttempts) {
      const stmt = this.db.prepare(`
        UPDATE jobs
        SET status = 'pending',
            attempts = ?,
            error = ?
        WHERE id = ?
      `);

      stmt.run(newAttempts, errorMessage, jobId);
    } else {
      const stmt = this.db.prepare(`
        UPDATE jobs
        SET status = 'failed',
            attempts = ?,
            failed_at = ?,
            error = ?
        WHERE id = ?
      `);

      stmt.run(newAttempts, now, errorMessage, jobId);
    }
  }

  async peek(): Promise<Job<T> | undefined> {
    const now = Date.now();
    const stmt = this.db.prepare(`
      SELECT id, type, data, status, priority, attempts, max_attempts,
             delay, created_at, process_at, completed_at, failed_at, error, metadata
      FROM jobs
      WHERE status = 'pending' 
        AND process_at <= ?
      ORDER BY priority DESC, process_at ASC, created_at ASC
      LIMIT 1
    `);

    const result = stmt.get(now) as Record<string, unknown> | undefined;

    if (!result) {
      return undefined;
    }

    return this.rowToJob(result);
  }

  async size(): Promise<number> {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM jobs
      WHERE status = 'pending' 
        AND process_at <= ?
    `);

    const result = stmt.get(Date.now()) as { count: number };
    return result.count;
  }

  async getJob(jobId: string): Promise<Job<T> | undefined> {
    const stmt = this.db.prepare(`
      SELECT id, type, data, status, priority, attempts, max_attempts,
             delay, created_at, process_at, completed_at, failed_at, error, metadata
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

  close(): void {
    this.db.close();
  }
}
