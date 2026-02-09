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

  dequeue(): Promise<Job<T> | undefined>;

  complete(jobId: string, result?: any): Promise<void>;

  fail(
    jobId: string,
    error: string | Error,
    shouldRetry?: boolean,
  ): Promise<void>;

  peek(): Promise<Job<T> | undefined>;

  size(): Promise<number>;

  getJob(jobId: string): Promise<Job<T> | undefined>;

  remove(jobId: string): Promise<boolean>;

  clear(): Promise<void>;
}
