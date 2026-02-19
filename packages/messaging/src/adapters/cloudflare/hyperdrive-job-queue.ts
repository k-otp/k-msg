import type { Job, JobQueue } from "../../queue/job-queue.interface";
import { JobStatus } from "../../queue/job-queue.interface";
import type { CloudflareSqlClient } from "./sql-client";
import { runCloudflareSqlTransaction } from "./sql-client";
import { initializeCloudflareSqlSchema } from "./sql-schema";

type JobRow = Record<string, unknown>;

function safeJsonParse<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string" || value.length === 0) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function toDate(value: unknown, fallback = new Date()): Date {
  if (typeof value === "number" && Number.isFinite(value))
    return new Date(value);
  if (typeof value === "string" && value.trim().length > 0) {
    const asNumber = Number(value);
    if (Number.isFinite(asNumber)) return new Date(asNumber);
    const asDate = new Date(value);
    if (!Number.isNaN(asDate.getTime())) return asDate;
  }
  return fallback;
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

export class HyperdriveJobQueue<T> implements JobQueue<T> {
  private initPromise: Promise<void> | undefined;

  constructor(
    private readonly client: CloudflareSqlClient,
    private readonly tableName = "kmsg_jobs",
  ) {}

  async init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = initializeCloudflareSqlSchema(this.client, {
      target: "queue",
      queueTableName: this.tableName,
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

    const columns = [
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

    const values = [
      job.id,
      job.type,
      JSON.stringify(job.data),
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
      JSON.stringify(job.metadata),
    ];

    const colSql = columns
      .map((column) => this.quoteIdentifier(column))
      .join(", ");
    const valueSql = this.placeholders(columns.length).join(", ");

    await this.client.query(
      `INSERT INTO ${this.tableRef()} (${colSql}) VALUES (${valueSql})`,
      values,
    );

    return { ...job };
  }

  async dequeue(): Promise<Job<T> | undefined> {
    await this.init();

    if (this.client.dialect === "postgres") {
      const now = Date.now();
      const nowPlaceholder = this.placeholder(1);
      const { rows } = await this.client.query<JobRow>(
        `WITH next_job AS (
          SELECT ${this.quoteIdentifier("id")}
          FROM ${this.tableRef()}
          WHERE ${this.quoteIdentifier("status")} = 'pending'
            AND ${this.quoteIdentifier("process_at")} <= ${nowPlaceholder}
          ORDER BY ${this.quoteIdentifier("priority")} DESC, ${this.quoteIdentifier("process_at")} ASC, ${this.quoteIdentifier("created_at")} ASC
          LIMIT 1
          FOR UPDATE SKIP LOCKED
        )
        UPDATE ${this.tableRef()}
        SET ${this.quoteIdentifier("status")} = 'processing'
        WHERE ${this.quoteIdentifier("id")} = (SELECT ${this.quoteIdentifier("id")} FROM next_job)
        RETURNING *`,
        [now],
      );

      const row = rows[0];
      return row ? this.rowToJob(row) : undefined;
    }

    return runCloudflareSqlTransaction(this.client, async (tx) => {
      const now = Date.now();
      const nowPlaceholder = this.placeholder(1);
      const { rows: candidates } = await tx.query<JobRow>(
        `SELECT * FROM ${this.tableRef()}
         WHERE ${this.quoteIdentifier("status")} = 'pending'
           AND ${this.quoteIdentifier("process_at")} <= ${nowPlaceholder}
         ORDER BY ${this.quoteIdentifier("priority")} DESC, ${this.quoteIdentifier("process_at")} ASC, ${this.quoteIdentifier("created_at")} ASC
         LIMIT 1`,
        [now],
      );

      const candidate = candidates[0];
      if (!candidate) return undefined;
      const id = String(candidate.id ?? "");
      if (!id) return undefined;

      const statusPlaceholder = this.placeholder(1);
      const idPlaceholder = this.placeholder(2);
      await tx.query(
        `UPDATE ${this.tableRef()}
         SET ${this.quoteIdentifier("status")} = ${statusPlaceholder}
         WHERE ${this.quoteIdentifier("id")} = ${idPlaceholder}`,
        [JobStatus.PROCESSING, id],
      );

      const { rows } = await tx.query<JobRow>(
        `SELECT * FROM ${this.tableRef()} WHERE ${this.quoteIdentifier("id")} = ${this.placeholder(1)} LIMIT 1`,
        [id],
      );
      const row = rows[0];
      return row ? this.rowToJob(row) : undefined;
    });
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

  async fail(
    jobId: string,
    error: string | Error,
    shouldRetry?: boolean,
  ): Promise<void> {
    await this.init();

    const job = await this.getJob(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    const errorMessage = error instanceof Error ? error.message : error;
    const attempts = job.attempts + 1;

    if (shouldRetry && attempts < job.maxAttempts) {
      await this.client.query(
        `UPDATE ${this.tableRef()}
         SET ${this.quoteIdentifier("status")} = ${this.placeholder(1)},
             ${this.quoteIdentifier("attempts")} = ${this.placeholder(2)},
             ${this.quoteIdentifier("error")} = ${this.placeholder(3)}
         WHERE ${this.quoteIdentifier("id")} = ${this.placeholder(4)}`,
        [JobStatus.PENDING, attempts, errorMessage, jobId],
      );
      return;
    }

    await this.client.query(
      `UPDATE ${this.tableRef()}
       SET ${this.quoteIdentifier("status")} = ${this.placeholder(1)},
           ${this.quoteIdentifier("attempts")} = ${this.placeholder(2)},
           ${this.quoteIdentifier("failed_at")} = ${this.placeholder(3)},
           ${this.quoteIdentifier("error")} = ${this.placeholder(4)}
       WHERE ${this.quoteIdentifier("id")} = ${this.placeholder(5)}`,
      [JobStatus.FAILED, attempts, Date.now(), errorMessage, jobId],
    );
  }

  async peek(): Promise<Job<T> | undefined> {
    await this.init();

    const nowPlaceholder = this.placeholder(1);
    const { rows } = await this.client.query<JobRow>(
      `SELECT * FROM ${this.tableRef()}
       WHERE ${this.quoteIdentifier("status")} = 'pending'
         AND ${this.quoteIdentifier("process_at")} <= ${nowPlaceholder}
       ORDER BY ${this.quoteIdentifier("priority")} DESC, ${this.quoteIdentifier("process_at")} ASC, ${this.quoteIdentifier("created_at")} ASC
       LIMIT 1`,
      [Date.now()],
    );

    const row = rows[0];
    return row ? this.rowToJob(row) : undefined;
  }

  async size(): Promise<number> {
    await this.init();

    const { rows } = await this.client.query<{ count?: number | string }>(
      `SELECT COUNT(1) as count FROM ${this.tableRef()}
       WHERE ${this.quoteIdentifier("status")} = 'pending'
         AND ${this.quoteIdentifier("process_at")} <= ${this.placeholder(1)}`,
      [Date.now()],
    );

    const count = rows[0]?.count;
    return toNumber(count, 0);
  }

  async getJob(jobId: string): Promise<Job<T> | undefined> {
    await this.init();

    const { rows } = await this.client.query<JobRow>(
      `SELECT * FROM ${this.tableRef()}
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

  async close(): Promise<void> {
    await this.client.close?.();
  }

  private rowToJob(row: JobRow): Job<T> {
    const now = new Date();
    return {
      id: String(row.id ?? ""),
      type: String(row.type ?? ""),
      data: safeJsonParse<T>(row.data, {} as T),
      status: String(row.status ?? JobStatus.PENDING) as JobStatus,
      priority: toNumber(row.priority, 0),
      attempts: toNumber(row.attempts, 0),
      maxAttempts: toNumber(row.max_attempts, 3),
      delay: toNumber(row.delay, 0),
      createdAt: toDate(row.created_at, now),
      processAt: toDate(row.process_at, now),
      completedAt: toDate(row.completed_at),
      failedAt: toDate(row.failed_at),
      error:
        typeof row.error === "string" && row.error.length > 0
          ? row.error
          : undefined,
      metadata: safeJsonParse<Job<T>["metadata"]>(row.metadata, {}),
    };
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

  private placeholders(count: number, startIndex = 1): string[] {
    const result: string[] = [];
    for (let index = 0; index < count; index += 1) {
      result.push(this.placeholder(startIndex + index));
    }
    return result;
  }
}
