import type {
  Job,
  JobDequeueOptions,
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

// Longer leases are as good as none; Infinity turns them off.
const MAX_LEASE_MS = 365 * 24 * 60 * 60_000;

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
   * How long a dequeued job may stay processing before it is due again
   * (default: `Infinity`, no lease). If it is neither completed nor failed
   * by then, for example because the worker stopped mid-job, the next
   * `dequeue()` counts the lost attempt as failed (`error: "LEASE_EXPIRED"`)
   * and makes the job due again, or fails it when no attempts are left.
   * Set it above the longest time a job can take: a lease is not renewed,
   * and a worker that outlives it can still complete or fail the job while
   * another worker has it. `dequeue()` leaves the jobs its caller names as
   * still running alone, which is how `JobProcessor` keeps a job it is
   * still running from being run again or counted as lost.
   */
  leaseMs?: number;
  /**
   * Called by `dequeue()` for each job whose lease had expired, once the job
   * is stored pending again or, with no attempts left, failed. `dequeue()`
   * waits for it before it leases the job it returns, which may be the same
   * one, so it does not shorten that lease. What it throws is logged and
   * does not stop the dequeue.
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

// The value as JSON stores it; throws for a BigInt or a cycle.
function toJsonValue(value: unknown): unknown {
  const text = JSON.stringify(value);
  return text === undefined ? undefined : JSON.parse(text);
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
    const leaseMs = resolved.leaseMs ?? Number.POSITIVE_INFINITY;
    if (
      typeof leaseMs !== "number" ||
      !(leaseMs > 0) ||
      (Number.isFinite(leaseMs) && leaseMs > MAX_LEASE_MS)
    ) {
      throw new RangeError(
        `leaseMs must be Infinity or a positive number of milliseconds up to ${MAX_LEASE_MS}, got ${String(leaseMs)}`,
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
   * Takes the next due job and, with `leaseMs`, leases it. Jobs whose lease
   * expired are due again first, or fail when they have no attempts left.
   * Jobs in `options.running` are left as they are.
   */
  async dequeue(
    options: JobDequeueOptions = {},
  ): Promise<CloudflareObjectJob<T> | undefined> {
    // A second look only follows a first one whose job another dequeue()
    // took while onLeaseExpired ran; KV, which may read its own writes late,
    // could otherwise keep looking.
    for (let look = 0; look < 2; look += 1) {
      const now = Date.now();
      const changed = new Map<string, CloudflareObjectJob<T>>();
      const unleased: CloudflareObjectJob<T>[] = [];
      const released: CloudflareObjectJob<T>[] = [];
      let next: CloudflareObjectJob<T> | undefined;

      for await (const stored of this.readJobs()) {
        // Its caller will still complete or fail it, so its lease stands.
        if (options.running?.has(stored.id)) continue;
        let job = stored;
        if (job.status === JobStatus.PROCESSING && this.leasesEnabled()) {
          if (job.leaseExpiresAt === undefined) {
            // Left processing by an earlier version or a queue without
            // leases, and maybe still being worked on: it gets a lease below.
            unleased.push(job);
            continue;
          }
          const recovered = this.releaseExpiredLease(job, now);
          if (recovered) {
            changed.set(recovered.id, recovered);
            released.push(recovered);
            job = recovered;
          }
        }
        if (!isDue(job, now)) continue;
        if (!next || compareJobs(job, next) < 0) next = job;
      }

      // Leases start when they are stored, not when the scan began, so a
      // long scan does not shorten them.
      const stampedAt = Date.now();
      for (const job of unleased) {
        changed.set(job.id, {
          ...job,
          leaseExpiresAt: this.leaseExpiry(stampedAt),
        });
      }

      if (released.length > 0 && this.onLeaseExpired) {
        // The callbacks run once the released jobs are stored and before the
        // next job is leased, so they cannot shorten its lease. One that
        // waits on anything but storage lets a Durable Object run another
        // dequeue() in between, which may take that job first.
        for (const job of changed.values()) await this.write(job);
        for (const job of released) await this.notifyLeaseExpired(job);
        if (!next) return undefined;
        const current = await this.getJob(next.id);
        if (!current || !isDue(current, Date.now())) continue;
        next = current;
        changed.clear();
      }

      let leased: CloudflareObjectJob<T> | undefined;
      if (next) {
        leased = {
          ...next,
          status: JobStatus.PROCESSING,
          leaseExpiresAt: this.leaseExpiry(Date.now()),
        };
        // One write per job, even for a released job taken again at once.
        changed.set(leased.id, leased);
      }
      for (const job of changed.values()) await this.write(job);
      return leased;
    }
    return undefined;
  }

  /**
   * Marks the job completed and keeps `result` with it when it can be
   * stored as JSON. A result that cannot be stored is logged and dropped,
   * never failing the completion, since callers such as `JobProcessor`
   * would treat that as a failed job and run it again.
   */
  async complete(jobId: string, result?: unknown): Promise<void> {
    const job = await this.getJob(jobId);
    if (!job) return;

    const completed: CloudflareObjectJob<T> = {
      ...job,
      status: JobStatus.COMPLETED,
      completedAt: new Date(),
      leaseExpiresAt: undefined,
    };
    if (result === undefined) {
      await this.write(completed);
      return;
    }
    try {
      await this.write({ ...completed, result: toJsonValue(result) });
    } catch (error) {
      // Not JSON (a BigInt, a cycle), or too large for the storage.
      logFallbackFailure(
        `[k-msg] could not keep the result of job ${jobId}; completing it without the result`,
        error,
      );
      await this.write(completed);
    }
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
    for await (const stored of this.readJobs()) {
      const job = this.releaseIfLeased(stored, now);
      if (!isDue(job, now)) continue;
      if (!next || compareJobs(job, next) < 0) next = job;
    }
    return next;
  }

  /** How many jobs are due now, including those whose lease expired. */
  async size(): Promise<number> {
    const now = Date.now();
    let due = 0;
    for await (const stored of this.readJobs()) {
      const job = this.releaseIfLeased(stored, now);
      if (isDue(job, now)) due += 1;
    }
    return due;
  }

  /**
   * When `dequeue()` next has work: the earliest due time of a pending job
   * or lease expiry of a processing one, and now for a processing job that
   * has no lease yet. A time in the past means `dequeue()` has work now,
   * even when it only settles an expired lease, so call `dequeue()` rather
   * than checking `size()`. `undefined` when no job is pending or leased.
   * Use it to set a Durable Object alarm instead of polling.
   */
  async nextDueAt(): Promise<Date | undefined> {
    const now = Date.now();
    let earliest: number | undefined;
    for await (const job of this.readJobs()) {
      let dueAt: number | undefined;
      if (job.status === JobStatus.PENDING) {
        dueAt = job.processAt.getTime();
      } else if (job.status === JobStatus.PROCESSING && this.leasesEnabled()) {
        dueAt = job.leaseExpiresAt?.getTime() ?? now;
      }
      if (dueAt === undefined) continue;
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
    for await (const job of this.readJobs()) {
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

  private leasesEnabled(): boolean {
    return Number.isFinite(this.leaseMs);
  }

  private leaseExpiry(now: number): Date | undefined {
    return this.leasesEnabled() ? new Date(now + this.leaseMs) : undefined;
  }

  // What dequeue() would make of the job: with leases off it leaves a lease
  // stored by an earlier configuration alone, so peek() and size() must too.
  private releaseIfLeased(
    job: CloudflareObjectJob<T>,
    now: number,
  ): CloudflareObjectJob<T> {
    if (!this.leasesEnabled()) return job;
    return this.releaseExpiredLease(job, now) ?? job;
  }

  // The job as it is once its expired lease ends: due again from the lease's
  // end with the lost attempt counted, or failed with no attempts left.
  private releaseExpiredLease(
    job: CloudflareObjectJob<T>,
    now: number,
  ): CloudflareObjectJob<T> | undefined {
    if (job.status !== JobStatus.PROCESSING) return undefined;
    const expiresAt = job.leaseExpiresAt?.getTime();
    if (expiresAt === undefined || expiresAt > now) return undefined;

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

  // Every stored job, a listing page at a time.
  private async *readJobs(): AsyncGenerator<CloudflareObjectJob<T>> {
    for await (const [, raw] of readObjectEntries(
      this.storage,
      this.jobsPrefix(),
    )) {
      const parsed = this.deserialize(raw);
      if (parsed) yield parsed;
    }
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
