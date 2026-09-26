import type {
  Job,
  JobQueue,
  JobRetryDirective,
} from "../../queue/job-queue.interface";
import { JobStatus } from "../../queue/job-queue.interface";
import { logFallbackFailure } from "../../shared/log-fallback";
import {
  type CloudflareObjectStorage,
  readObjectEntries,
} from "./object-storage";

/** The `error` of a job whose lease expired before it was completed or failed. */
export const JOB_LEASE_EXPIRED = "LEASE_EXPIRED";

const DEFAULT_LEASE_MS = 5 * 60_000;

/** A job in a KV, R2 or Durable Object queue. */
export interface CloudflareObjectJob<T> extends Job<T> {
  /**
   * While the job is processing: when it becomes due again unless it is
   * completed or failed first.
   */
  leaseExpiresAt?: Date;
  /** What `complete()` was given. */
  result?: unknown;
}

export interface CloudflareObjectJobQueueOptions<T> {
  /** Default: `kmsg/jobs`. */
  keyPrefix?: string;
  /**
   * How long a dequeued job may stay processing (default: 5 minutes). If it
   * is neither completed nor failed by then, for example because the worker
   * stopped mid-job, it is due again, and the lost attempt counts as a
   * failed one (`error: "LEASE_EXPIRED"`); a job with no attempts left
   * fails. Set it above the longest time a job can take. `Infinity` keeps
   * dequeued jobs processing until they are completed or failed.
   */
  leaseMs?: number;
  /**
   * Called by `dequeue()` for each job whose lease it found expired, with
   * the job as stored after: pending again, or failed if it had no attempts
   * left. What it throws is logged and does not stop the dequeue.
   */
  onLeaseExpired?: (job: CloudflareObjectJob<T>) => void | Promise<void>;
}

export interface CloudflareObjectCleanupOptions {
  /** Default: completed and failed jobs. */
  statuses?: JobStatus[];
  /**
   * Only remove jobs that finished (were completed or failed) before this
   * time, so a finished job stays readable for a while.
   */
  olderThan?: Date;
}

interface StoredJob<T> {
  id: string;
  type: string;
  data: T;
  status: JobStatus;
  priority: number;
  attempts: number;
  maxAttempts: number;
  delay: number;
  createdAt: number;
  processAt: number;
  completedAt?: number;
  failedAt?: number;
  leaseExpiresAt?: number;
  error?: string;
  result?: unknown;
  metadata: Record<string, any>;
}

// The order dequeue() takes due jobs in: priority, then due time, then age.
function compareJobs<T>(a: Job<T>, b: Job<T>): number {
  if (a.priority !== b.priority) return b.priority - a.priority;
  if (a.processAt.getTime() !== b.processAt.getTime()) {
    return a.processAt.getTime() - b.processAt.getTime();
  }
  return a.createdAt.getTime() - b.createdAt.getTime();
}

function isDue<T>(job: Job<T>, now: number): boolean {
  return job.status === JobStatus.PENDING && job.processAt.getTime() <= now;
}

export class CloudflareObjectJobQueue<T> implements JobQueue<T> {
  private readonly keyPrefix: string;
  private readonly leaseMs: number;
  private readonly onLeaseExpired?: CloudflareObjectJobQueueOptions<T>["onLeaseExpired"];

  /** `options` may also be the key prefix. */
  constructor(
    private readonly storage: CloudflareObjectStorage,
    options: string | CloudflareObjectJobQueueOptions<T> = {},
  ) {
    const resolved =
      typeof options === "string" ? { keyPrefix: options } : options;
    const leaseMs = resolved.leaseMs ?? DEFAULT_LEASE_MS;
    if (!(leaseMs > 0)) {
      throw new RangeError(
        `leaseMs must be a positive number of milliseconds, got ${leaseMs}`,
      );
    }
    this.keyPrefix = resolved.keyPrefix ?? "kmsg/jobs";
    this.leaseMs = leaseMs;
    this.onLeaseExpired = resolved.onLeaseExpired;
  }

  async enqueue(
    type: string,
    data: T,
    options: {
      priority?: number;
      delay?: number;
      maxAttempts?: number;
      metadata?: Record<string, any>;
    } = {},
  ): Promise<CloudflareObjectJob<T>> {
    const now = Date.now();
    const job: CloudflareObjectJob<T> = {
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

    await this.write(job);
    return { ...job };
  }

  /**
   * Takes the next due job and leases it for `leaseMs`. Jobs whose lease
   * expired are due again first, or fail when they have no attempts left.
   */
  async dequeue(): Promise<CloudflareObjectJob<T> | undefined> {
    const now = Date.now();
    let next: CloudflareObjectJob<T> | undefined;

    for (const stored of await this.readAllJobs()) {
      let job = stored;
      const recovered = this.recoverExpiredLease(stored, now);
      if (recovered) {
        await this.write(recovered);
        await this.notifyLeaseExpired(recovered);
        job = recovered;
      }
      if (!isDue(job, now)) continue;
      if (!next || compareJobs(job, next) < 0) next = job;
    }

    if (!next) return undefined;
    const leased: CloudflareObjectJob<T> = {
      ...next,
      status: JobStatus.PROCESSING,
      leaseExpiresAt: this.leaseExpiry(now),
    };
    await this.write(leased);
    return leased;
  }

  /** Marks the job completed and keeps `result` with it. */
  async complete(jobId: string, result?: unknown): Promise<void> {
    const job = await this.getJob(jobId);
    if (!job) return;

    const completed: CloudflareObjectJob<T> = {
      ...job,
      status: JobStatus.COMPLETED,
      completedAt: new Date(),
      leaseExpiresAt: undefined,
      ...(result === undefined ? {} : { result }),
    };
    await this.write(completed);
  }

  /** A completed job stays completed, even for a worker whose lease expired. */
  async fail(
    jobId: string,
    error: string | Error,
    retry: JobRetryDirective = { enabled: false },
  ): Promise<void> {
    const job = await this.getJob(jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);
    if (job.status === JobStatus.COMPLETED) return;

    const attempts = job.attempts + 1;
    const message = error instanceof Error ? error.message : error;

    if (retry.enabled && attempts < job.maxAttempts) {
      await this.write({
        ...job,
        attempts,
        status: JobStatus.PENDING,
        processAt: new Date(Date.now() + (retry.delayMs ?? 0)),
        leaseExpiresAt: undefined,
        error: message,
      });
      return;
    }

    await this.write({
      ...job,
      attempts,
      status: JobStatus.FAILED,
      failedAt: new Date(),
      leaseExpiresAt: undefined,
      error: message,
    });
  }

  /**
   * The job `dequeue()` would take next, including one whose lease expired,
   * shown as it will be once it is due again. Changes nothing.
   */
  async peek(): Promise<CloudflareObjectJob<T> | undefined> {
    const now = Date.now();
    let next: CloudflareObjectJob<T> | undefined;
    for (const stored of await this.readAllJobs()) {
      const job = this.recoverExpiredLease(stored, now) ?? stored;
      if (!isDue(job, now)) continue;
      if (!next || compareJobs(job, next) < 0) next = job;
    }
    return next;
  }

  /** How many jobs are due now, including those whose lease expired. */
  async size(): Promise<number> {
    const now = Date.now();
    let due = 0;
    for (const stored of await this.readAllJobs()) {
      const job = this.recoverExpiredLease(stored, now) ?? stored;
      if (isDue(job, now)) due += 1;
    }
    return due;
  }

  /**
   * When a job is next due: the earliest due time of a pending job or lease
   * expiry of a processing one. It may be in the past, meaning a job is due
   * now. `undefined` when no job is pending or processing. Use it to set a
   * Durable Object alarm instead of polling.
   */
  async nextDueAt(): Promise<Date | undefined> {
    let earliest: number | undefined;
    for (const job of await this.readAllJobs()) {
      const dueAt =
        job.status === JobStatus.PENDING
          ? job.processAt.getTime()
          : job.status === JobStatus.PROCESSING
            ? this.leaseExpiresAt(job)
            : undefined;
      if (dueAt === undefined || !Number.isFinite(dueAt)) continue;
      if (earliest === undefined || dueAt < earliest) earliest = dueAt;
    }
    return earliest === undefined ? undefined : new Date(earliest);
  }

  async getJob(jobId: string): Promise<CloudflareObjectJob<T> | undefined> {
    const raw = await this.storage.get(this.jobKey(jobId));
    if (!raw) return undefined;
    return this.deserialize(raw);
  }

  async remove(jobId: string): Promise<boolean> {
    const existing = await this.getJob(jobId);
    if (!existing) return false;
    await this.storage.delete(this.jobKey(jobId));
    return true;
  }

  async clear(): Promise<void> {
    const keys = await this.storage.list(this.jobsPrefix());
    for (const key of keys) {
      await this.storage.delete(key);
    }
  }

  /**
   * Removes finished jobs: completed and failed ones by default, or those
   * with the given statuses, and with `olderThan`, only those that finished
   * before it.
   */
  async cleanupTerminal(
    options: JobStatus[] | CloudflareObjectCleanupOptions = {},
  ): Promise<number> {
    const { statuses = [JobStatus.COMPLETED, JobStatus.FAILED], olderThan } =
      Array.isArray(options) ? { statuses: options } : options;
    if (olderThan !== undefined && Number.isNaN(olderThan.getTime())) {
      throw new TypeError("olderThan must be a valid Date");
    }
    if (statuses.length === 0) {
      return 0;
    }

    const removable = new Set(statuses);
    const cutoff = olderThan?.getTime();
    let removed = 0;
    for (const job of await this.readAllJobs()) {
      if (!removable.has(job.status)) continue;
      if (cutoff !== undefined) {
        const finishedAt = (
          job.completedAt ??
          job.failedAt ??
          job.createdAt
        ).getTime();
        if (finishedAt >= cutoff) continue;
      }
      await this.storage.delete(this.jobKey(job.id));
      removed += 1;
    }
    return removed;
  }

  // When a processing job's lease ends. Jobs that earlier versions left
  // processing have no lease, so theirs ends leaseMs after they were due.
  private leaseExpiresAt(job: CloudflareObjectJob<T>): number {
    return (
      job.leaseExpiresAt?.getTime() ?? job.processAt.getTime() + this.leaseMs
    );
  }

  private leaseExpiry(now: number): Date | undefined {
    return Number.isFinite(this.leaseMs)
      ? new Date(now + this.leaseMs)
      : undefined;
  }

  // The job as it is once its expired lease ends: due again from the lease's
  // end with the lost attempt counted, or failed with no attempts left.
  private recoverExpiredLease(
    job: CloudflareObjectJob<T>,
    now: number,
  ): CloudflareObjectJob<T> | undefined {
    if (job.status !== JobStatus.PROCESSING) return undefined;
    const expiresAt = this.leaseExpiresAt(job);
    if (expiresAt > now) return undefined;

    const attempts = job.attempts + 1;
    const released: CloudflareObjectJob<T> = {
      ...job,
      attempts,
      leaseExpiresAt: undefined,
      error: JOB_LEASE_EXPIRED,
    };
    return attempts < job.maxAttempts
      ? {
          ...released,
          status: JobStatus.PENDING,
          processAt: new Date(expiresAt),
        }
      : { ...released, status: JobStatus.FAILED, failedAt: new Date(now) };
  }

  private async notifyLeaseExpired(job: CloudflareObjectJob<T>): Promise<void> {
    if (!this.onLeaseExpired) return;
    try {
      await this.onLeaseExpired({ ...job });
    } catch (error) {
      logFallbackFailure(
        `[k-msg] onLeaseExpired threw for job ${job.id}; the job is stored as ${job.status}`,
        error,
      );
    }
  }

  private async readAllJobs(): Promise<CloudflareObjectJob<T>[]> {
    const jobs: CloudflareObjectJob<T>[] = [];
    for (const [, raw] of await readObjectEntries(
      this.storage,
      this.jobsPrefix(),
    )) {
      const parsed = this.deserialize(raw);
      if (parsed) jobs.push(parsed);
    }
    return jobs;
  }

  private async write(job: CloudflareObjectJob<T>): Promise<void> {
    await this.storage.put(
      this.jobKey(job.id),
      JSON.stringify(this.serialize(job)),
    );
  }

  private serialize(job: CloudflareObjectJob<T>): StoredJob<T> {
    return {
      ...job,
      createdAt: job.createdAt.getTime(),
      processAt: job.processAt.getTime(),
      completedAt: job.completedAt?.getTime(),
      failedAt: job.failedAt?.getTime(),
      leaseExpiresAt: job.leaseExpiresAt?.getTime(),
    };
  }

  private deserialize(raw: string): CloudflareObjectJob<T> | undefined {
    try {
      const parsed = JSON.parse(raw) as StoredJob<T>;
      return {
        ...parsed,
        createdAt: new Date(parsed.createdAt),
        processAt: new Date(parsed.processAt),
        completedAt:
          typeof parsed.completedAt === "number"
            ? new Date(parsed.completedAt)
            : undefined,
        failedAt:
          typeof parsed.failedAt === "number"
            ? new Date(parsed.failedAt)
            : undefined,
        leaseExpiresAt:
          typeof parsed.leaseExpiresAt === "number"
            ? new Date(parsed.leaseExpiresAt)
            : undefined,
      };
    } catch {
      return undefined;
    }
  }

  private jobsPrefix(): string {
    return `${this.keyPrefix}/jobs/`;
  }

  private jobKey(jobId: string): string {
    return `${this.jobsPrefix()}${jobId}`;
  }

  private generateId(): string {
    return `job_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
  }
}
