export enum JobStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
  DELAYED = "delayed",
}

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

  complete(jobId: string, result?: any): Promise<void>;

  fail(
    jobId: string,
    error: string | Error,
    retry?: JobRetryDirective,
  ): Promise<void>;

  peek(): Promise<Job<T> | undefined>;

  size(): Promise<number>;

  getJob(jobId: string): Promise<Job<T> | undefined>;

  remove(jobId: string): Promise<boolean>;

  clear(): Promise<void>;

  cleanupTerminal?(statuses?: JobStatus[]): Promise<number>;
}
