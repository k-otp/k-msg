import type { Job, JobQueue } from "../../queue/job-queue.interface";
import { JobStatus } from "../../queue/job-queue.interface";
import type { CloudflareObjectStorage } from "./object-storage";

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
  error?: string;
  metadata: Record<string, any>;
}

export class CloudflareObjectJobQueue<T> implements JobQueue<T> {
  constructor(
    private readonly storage: CloudflareObjectStorage,
    private readonly keyPrefix = "kmsg/jobs",
  ) {}

  async enqueue(
    type: string,
    data: T,
    options: {
      priority?: number;
      delay?: number;
      maxAttempts?: number;
      metadata?: Record<string, any>;
    } = {},
  ): Promise<Job<T>> {
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

    await this.storage.put(
      this.jobKey(job.id),
      JSON.stringify(this.serialize(job)),
    );
    return { ...job };
  }

  async dequeue(): Promise<Job<T> | undefined> {
    const candidates = await this.readAllJobs();
    const now = Date.now();

    const pending = candidates
      .filter((job) => job.status === JobStatus.PENDING)
      .filter((job) => job.processAt.getTime() <= now)
      .sort((a, b) => {
        if (a.priority !== b.priority) return b.priority - a.priority;
        if (a.processAt.getTime() !== b.processAt.getTime()) {
          return a.processAt.getTime() - b.processAt.getTime();
        }
        return a.createdAt.getTime() - b.createdAt.getTime();
      });

    const job = pending[0];
    if (!job) return undefined;

    const processing: Job<T> = { ...job, status: JobStatus.PROCESSING };
    await this.storage.put(
      this.jobKey(job.id),
      JSON.stringify(this.serialize(processing)),
    );

    return processing;
  }

  async complete(jobId: string, _result?: any): Promise<void> {
    const job = await this.getJob(jobId);
    if (!job) return;

    const completed: Job<T> = {
      ...job,
      status: JobStatus.COMPLETED,
      completedAt: new Date(),
    };

    await this.storage.put(
      this.jobKey(jobId),
      JSON.stringify(this.serialize(completed)),
    );
  }

  async fail(
    jobId: string,
    error: string | Error,
    shouldRetry = false,
  ): Promise<void> {
    const job = await this.getJob(jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);

    const attempts = job.attempts + 1;
    const message = error instanceof Error ? error.message : error;

    if (shouldRetry && attempts < job.maxAttempts) {
      const retryJob: Job<T> = {
        ...job,
        attempts,
        status: JobStatus.PENDING,
        error: message,
      };
      await this.storage.put(
        this.jobKey(jobId),
        JSON.stringify(this.serialize(retryJob)),
      );
      return;
    }

    const failedJob: Job<T> = {
      ...job,
      attempts,
      status: JobStatus.FAILED,
      failedAt: new Date(),
      error: message,
    };

    await this.storage.put(
      this.jobKey(jobId),
      JSON.stringify(this.serialize(failedJob)),
    );
  }

  async peek(): Promise<Job<T> | undefined> {
    const candidates = await this.readAllJobs();
    const now = Date.now();

    const pending = candidates
      .filter((job) => job.status === JobStatus.PENDING)
      .filter((job) => job.processAt.getTime() <= now)
      .sort((a, b) => {
        if (a.priority !== b.priority) return b.priority - a.priority;
        return a.processAt.getTime() - b.processAt.getTime();
      });

    return pending[0];
  }

  async size(): Promise<number> {
    const candidates = await this.readAllJobs();
    const now = Date.now();

    return candidates.filter(
      (job) =>
        job.status === JobStatus.PENDING && job.processAt.getTime() <= now,
    ).length;
  }

  async getJob(jobId: string): Promise<Job<T> | undefined> {
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

  private async readAllJobs(): Promise<Job<T>[]> {
    const keys = await this.storage.list(this.jobsPrefix());
    const jobs: Job<T>[] = [];

    for (const key of keys) {
      const raw = await this.storage.get(key);
      if (!raw) continue;
      const parsed = this.deserialize(raw);
      if (!parsed) continue;
      jobs.push(parsed);
    }

    return jobs;
  }

  private serialize(job: Job<T>): StoredJob<T> {
    return {
      ...job,
      createdAt: job.createdAt.getTime(),
      processAt: job.processAt.getTime(),
      completedAt: job.completedAt?.getTime(),
      failedAt: job.failedAt?.getTime(),
    };
  }

  private deserialize(raw: string): Job<T> | undefined {
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
