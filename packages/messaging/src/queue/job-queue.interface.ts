const CHECKPOINT_LOST = Symbol.for("@k-msg/messaging/JobCheckpointLostError");
/** Lost ownership is not a processing failure: a stale worker must not call fail(). */
export class JobCheckpointLostError extends Error {
  readonly [CHECKPOINT_LOST] = true;
  constructor() {
    super("Job checkpoint lost its processing attempt");
    this.name = "JobCheckpointLostError";
  }
  static [Symbol.hasInstance](value: unknown): boolean {
    return (
      typeof value === "object" &&
      value !== null &&
      (value as Record<symbol, unknown>)[CHECKPOINT_LOST] === true
    );
  }
}

export enum JobStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
  DELAYED = "delayed",
}

/** The `error` of a job whose lease expired before it was completed or failed. */
export const JOB_LEASE_EXPIRED = "LEASE_EXPIRED";

export interface Job<T> {
  id: string;
  type: string;
  data: T;
  status: JobStatus;
  priority: number;
  attempts: number;
  maxAttempts: number;
  delay: number;
  createdAt: Date;
  processAt: Date;
  completedAt?: Date;
  failedAt?: Date;
  error?: string;
  metadata: Record<string, any>;
  /**
   * While the job is processing in a queue with `leaseMs`: when it becomes
   * due again unless it is completed or failed first.
   */
  leaseExpiresAt?: Date;
}

export interface JobRetryDirective {
  enabled: boolean;
  delayMs?: number;
}

export interface JobDequeueOptions {
  /**
   * Ids of the jobs the caller is still running. A queue that leases jobs
   * leaves them alone, even once their lease has run out: it does not hand
   * them out again or count the lease as a lost attempt. It reads the set
   * once, when `dequeue()` starts, so a job that finishes during the call
   * is still left alone.
   */
  running?: ReadonlySet<string>;
}

/** Options of the queues that lease the jobs `dequeue()` returns. */
export interface JobLeaseOptions<J> {
  /**
   * How long a dequeued job may stay processing before it is due again
   * (default: `Infinity`, no lease). If it is neither completed nor failed
   * by then, for example because the worker stopped mid-job, the next
   * `dequeue()` counts the lost attempt as failed (`error: "LEASE_EXPIRED"`)
   * and makes the job due again, or fails it when no attempts are left.
   * Set it above the longest time a job can take. Only `checkpoint()` renews
   * a lease, which message jobs do before every recipient, so for them it
   * only has to outlast one send. A worker that outlives its lease can still
   * complete or fail the job while another worker has it, unless the caller
   * fences the call with `JobSettleOptions.attempt` (message jobs do). `dequeue()` leaves the jobs its caller names as
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
  onLeaseExpired?: (job: J) => void | Promise<void>;
}

export interface JobQueueCleanupOptions {
  /** Default: completed and failed jobs. */
  statuses?: JobStatus[];
  /**
   * Only remove jobs that finished (were completed or failed) before this
   * time, so a finished job stays readable for a while.
   */
  olderThan?: Date;
}

/** Optional fence for `complete()` and `fail()`. */
export interface JobSettleOptions {
  /**
   * The attempt (`job.attempts`) that owns the job. A queue that supports the
   * fence rejects with `JobCheckpointLostError` when the job is no longer
   * processing that attempt, so a stale worker cannot settle the job of the
   * worker that took it over. Without it, completing or failing is unfenced.
   */
  attempt?: number;
}

export interface JobQueue<T> {
  enqueue(
    type: string,
    data: T,
    options?: {
      priority?: number;
      delay?: number;
      maxAttempts?: number;
      metadata?: Record<string, any>;
    },
  ): Promise<Job<T>>;

  dequeue(options?: JobDequeueOptions): Promise<Job<T> | undefined>;

  complete(
    jobId: string,
    result?: any,
    options?: JobSettleOptions,
  ): Promise<void>;

  /** False for stores that cannot persist reliable message progress (such as KV). */
  readonly supportsCheckpoints?: boolean;
  /**
   * Persist message progress before a send. Required by MessageJobProcessor.
   * Replaces the job's `data` atomically with the attempt check, so a stale
   * attempt cannot overwrite the progress of the one that took the job over:
   * it must reject with `JobCheckpointLostError` if the processing attempt no
   * longer owns the job. With `leaseMs`, it also renews the lease from now, so
   * a job that checkpoints after every recipient does not outlive its lease.
   */
  checkpoint?(jobId: string, data: T, attempt: number): Promise<void>;

  fail(
    jobId: string,
    error: string | Error,
    retry?: JobRetryDirective,
    options?: JobSettleOptions,
  ): Promise<void>;

  peek(): Promise<Job<T> | undefined>;

  size(): Promise<number>;

  getJob(jobId: string): Promise<Job<T> | undefined>;

  remove(jobId: string): Promise<boolean>;

  clear(): Promise<void>;

  /**
   * When `dequeue()` next has work: the earliest due time of a pending job
   * or, with leases, lease expiry of a processing one. A time in the past
   * means `dequeue()` has work now, even when it only settles an expired
   * lease. `undefined` when no job is pending or leased.
   */
  nextDueAt?(): Promise<Date | undefined>;

  /**
   * Removes finished jobs: completed and failed ones by default, or those
   * with the given statuses, and with `olderThan`, only those that finished
   * before it.
   */
  cleanupTerminal?(
    options?: JobStatus[] | JobQueueCleanupOptions,
  ): Promise<number>;
}
