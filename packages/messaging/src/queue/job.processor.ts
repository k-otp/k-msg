/**
 * Job processor for message queue system
 */

import {
  CircuitBreaker,
  type Provider,
  RateLimiter,
  type SendOptions,
} from "@k-msg/core";
import { EventEmitter } from "../shared/event-emitter";
import {
  type DeliveryReport,
  type MessageEvent,
  MessageEventType,
  type MessageRequest,
  type MessageResult,
  MessageStatus,
  type RecipientResult,
} from "../types/message.types";
import type { Job, JobQueue } from "./job-queue.interface";

export interface JobProcessorOptions {
  concurrency: number;
  retryDelays: number[];
  maxRetries: number;
  pollInterval: number;
  enableMetrics: boolean;
  rateLimiter?: {
    maxRequests: number;
    windowMs: number;
  };
  circuitBreaker?: {
    failureThreshold: number;
    timeout: number;
    resetTimeout: number;
  };
}

export type JobHandler<T = any> = (job: Job<T>) => Promise<any>;

export interface JobProcessorMetrics {
  processed: number;
  succeeded: number;
  failed: number;
  retried: number;
  activeJobs: number;
  queueSize: number;
  averageProcessingTime: number;
  lastProcessedAt?: Date;
}

export class JobProcessor extends EventEmitter {
  private handlers = new Map<string, JobHandler>();
  private queue: JobQueue<any>;
  private processing = new Set<string>();
  private isRunning = false;
  private pollTimer?: ReturnType<typeof setTimeout>;
  private metrics: JobProcessorMetrics;
  private rateLimiter?: RateLimiter;
  private circuitBreaker?: CircuitBreaker;

  constructor(
    private options: JobProcessorOptions,
    jobQueue?: JobQueue<any>,
  ) {
    super();
    if (!jobQueue) {
      throw new Error(
        "JobProcessor requires an explicit jobQueue. Use adapters/* to choose a runtime-specific queue implementation.",
      );
    }
    this.queue = jobQueue;

    this.metrics = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      retried: 0,
      activeJobs: 0,
      queueSize: 0,
      averageProcessingTime: 0,
    };

    if (options.rateLimiter) {
      this.rateLimiter = new RateLimiter(
        options.rateLimiter.maxRequests,
        options.rateLimiter.windowMs,
      );
    }

    if (options.circuitBreaker) {
      this.circuitBreaker = new CircuitBreaker(options.circuitBreaker);
    }
  }

  /**
   * Register a job handler
   */
  handle<T>(jobType: string, handler: JobHandler<T>): void {
    this.handlers.set(jobType, handler);
  }

  /**
   * Add a job to the queue
   */
  async add<T>(
    jobType: string,
    data: T,
    options: {
      priority?: number;
      delay?: number;
      maxAttempts?: number;
      metadata?: Record<string, any>;
    } = {},
  ): Promise<string> {
    const job = await this.queue.enqueue(jobType, data, {
      priority: options.priority || 5,
      delay: options.delay || 0,
      maxAttempts: options.maxAttempts || this.options.maxRetries,
      metadata: options.metadata,
    });

    this.updateMetrics();
    this.emit("job:added", job);

    return job.id;
  }

  /**
   * Start processing jobs
   */
  start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.scheduleNextPoll();
    this.emit("processor:started");
  }

  /**
   * Stop processing jobs
   */
  async stop(): Promise<void> {
    this.isRunning = false;

    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = undefined;
    }

    // Wait for active jobs to complete
    while (this.processing.size > 0) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    this.emit("processor:stopped");
  }

  /**
   * Get current metrics
   */
  getMetrics(): JobProcessorMetrics {
    return { ...this.metrics };
  }

  /**
   * Get queue status
   */
  async getQueueStatus(): Promise<{
    pending: number;
    processing: number;
    failed: number;
    totalProcessed: number;
  }> {
    const queueSize = await this.queue.size();

    return {
      pending: queueSize,
      processing: this.processing.size,
      failed: this.metrics.failed,
      totalProcessed: this.metrics.processed,
    };
  }

  /**
   * Remove completed jobs from queue
   */
  async cleanup(): Promise<number> {
    const initialSize = await this.queue.size();
    await this.queue.clear();
    this.updateMetrics();

    return initialSize;
  }

  /**
   * Get specific job by ID
   */
  async getJob(jobId: string): Promise<Job<any> | undefined> {
    return await this.queue.getJob(jobId);
  }

  /**
   * Remove job from queue
   */
  async removeJob(jobId: string): Promise<boolean> {
    const removed = await this.queue.remove(jobId);
    this.processing.delete(jobId);
    this.updateMetrics();
    return removed;
  }

  private scheduleNextPoll(): void {
    if (!this.isRunning) {
      return;
    }

    this.pollTimer = setTimeout(() => {
      this.processJobs();
      this.scheduleNextPoll();
    }, this.options.pollInterval);
  }

  private async processJobs(): Promise<void> {
    const availableSlots = this.options.concurrency - this.processing.size;
    if (availableSlots <= 0) {
      return;
    }

    for (let i = 0; i < availableSlots; i++) {
      const job = await this.queue.dequeue();
      if (!job) {
        break;
      }
      this.processing.add(job.id);
      this.processJob(job);
    }
  }

  private async processJob(job: Job<any>): Promise<void> {
    const handler = this.handlers.get(job.type);
    if (!handler) {
      await this.failJob(
        job.id,
        `No handler registered for job type: ${job.type}`,
        false,
      );
      return;
    }

    this.metrics.activeJobs++;

    const startTime = Date.now();

    try {
      if (this.rateLimiter) {
        await this.rateLimiter.acquire();
      }

      const executeJob = async () => handler(job);
      const result = this.circuitBreaker
        ? await this.circuitBreaker.execute(executeJob)
        : await executeJob();

      await this.queue.complete(job.id, result);
      this.processing.delete(job.id);
      this.metrics.activeJobs--;
      this.metrics.succeeded++;
      this.metrics.processed++;

      const processingTime = Date.now() - startTime;
      this.updateAverageProcessingTime(processingTime);

      this.emit("job:completed", { job, result, processingTime });
    } catch (error) {
      this.processing.delete(job.id);
      this.metrics.activeJobs--;

      const shouldRetry = job.attempts < job.maxAttempts;

      if (shouldRetry) {
        const retryDelay = this.getRetryDelay(job.attempts);
        await this.failJob(
          job.id,
          error instanceof Error ? error.message : String(error),
          true,
        );

        this.metrics.retried++;
        this.emit("job:retry", { job, error, retryDelay });
      } else {
        await this.failJob(
          job.id,
          error instanceof Error ? error.message : String(error),
          false,
        );
      }
    }

    this.updateMetrics();
  }

  private async failJob(
    jobId: string,
    error: string,
    shouldRetry: boolean,
  ): Promise<void> {
    await this.queue.fail(jobId, error, shouldRetry);

    if (!shouldRetry) {
      this.metrics.failed++;
      this.metrics.processed++;
      this.emit("job:failed", { jobId, error });
    }
  }

  private getRetryDelay(attempt: number): number {
    const delayIndex = Math.min(
      attempt - 1,
      this.options.retryDelays.length - 1,
    );
    return (
      this.options.retryDelays[delayIndex] ||
      this.options.retryDelays[this.options.retryDelays.length - 1]
    );
  }

  private updateMetrics(): void {
    this.metrics.lastProcessedAt = new Date();
  }

  private updateAverageProcessingTime(newTime: number): void {
    const totalProcessed = this.metrics.succeeded + this.metrics.failed;
    if (totalProcessed === 1) {
      this.metrics.averageProcessingTime = newTime;
    } else {
      this.metrics.averageProcessingTime =
        (this.metrics.averageProcessingTime * (totalProcessed - 1) + newTime) /
        totalProcessed;
    }
  }
}

/**
 * Specific processor for message jobs
 */
export class MessageJobProcessor extends JobProcessor {
  constructor(
    private provider: Provider,
    options: Partial<JobProcessorOptions> = {},
    jobQueue?: JobQueue<any>,
  ) {
    if (!jobQueue) {
      throw new Error(
        "MessageJobProcessor requires an explicit jobQueue. Use adapters/* to choose a runtime-specific queue implementation.",
      );
    }

    super(
      {
        concurrency: 5,
        retryDelays: [1000, 5000, 15000, 60000],
        maxRetries: 3,
        pollInterval: 1000,
        enableMetrics: true,
        ...options,
      },
      jobQueue,
    );

    this.setupMessageHandlers();
  }

  private setupMessageHandlers(): void {
    // Handle single message sending
    this.handle("send_message", async (job: Job<MessageRequest>) => {
      return this.processSingleMessage(job);
    });

    // Handle bulk message sending
    this.handle("send_bulk_messages", async (job: Job<MessageRequest[]>) => {
      return this.processBulkMessages(job);
    });

    // Handle delivery status updates
    this.handle("update_delivery_status", async (job: Job<DeliveryReport>) => {
      return this.processDeliveryUpdate(job);
    });

    // Handle scheduled message sending
    this.handle("send_scheduled_message", async (job: Job<MessageRequest>) => {
      return this.processScheduledMessage(job);
    });
  }

  private async processSingleMessage(
    job: Job<MessageRequest>,
  ): Promise<MessageResult> {
    const { data: messageRequest } = job;

    // Emit processing event
    this.emit("message:processing", {
      type: MessageEventType.MESSAGE_QUEUED,
      timestamp: new Date(),
      data: { requestId: job.id, messageRequest },
      metadata: job.metadata,
    } as MessageEvent);

    const results: RecipientResult[] = await Promise.all(
      messageRequest.recipients.map(async (recipient) => {
        const sendOptions: SendOptions = {
          type: "ALIMTALK",
          to: recipient.phoneNumber,
          from:
            (messageRequest.options as any)?.from ||
            (messageRequest.options as any)?.senderNumber ||
            "",
          templateCode: messageRequest.templateCode,
          variables: {
            ...messageRequest.variables,
            ...recipient.variables,
          } as Record<string, string>,
        };

        const response = await this.provider.send(sendOptions);

        if (response.isSuccess) {
          return {
            phoneNumber: recipient.phoneNumber,
            messageId: response.value.messageId,
            status:
              response.value.status === "SENT"
                ? MessageStatus.SENT
                : MessageStatus.QUEUED,
            metadata: recipient.metadata,
          };
        } else {
          return {
            phoneNumber: recipient.phoneNumber,
            status: MessageStatus.FAILED,
            error: {
              code: response.error.code,
              message: response.error.message,
            },
            metadata: recipient.metadata,
          };
        }
      }),
    );

    const sent = results.filter((r) => r.status === MessageStatus.SENT).length;
    const failed = results.filter(
      (r) => r.status === MessageStatus.FAILED,
    ).length;
    const queued = results.filter(
      (r) => r.status === MessageStatus.QUEUED,
    ).length;

    const result: MessageResult = {
      requestId: job.id,
      results,
      summary: {
        total: messageRequest.recipients.length,
        queued,
        sent,
        failed,
      },
      metadata: {
        createdAt: new Date(),
        provider: this.provider.id,
        templateCode: messageRequest.templateCode,
      },
    };

    if (failed > 0) {
      const firstError = results.find((r) => r.error)?.error;
      throw new Error(
        firstError?.message ||
          "Failed to send message to one or more recipients",
      );
    }

    // Emit completion event
    this.emit("message:queued", {
      type: MessageEventType.MESSAGE_QUEUED,
      timestamp: new Date(),
      data: result,
      metadata: job.metadata,
    } as MessageEvent);

    return result;
  }

  private async processBulkMessages(
    job: Job<MessageRequest[]>,
  ): Promise<MessageResult[]> {
    const { data: messageRequests } = job;
    const results: MessageResult[] = [];

    for (const messageRequest of messageRequests) {
      const singleJob: Job<MessageRequest> = {
        id: `${job.id}_${results.length}`,
        type: job.type,
        data: messageRequest,
        status: job.status,
        priority: job.priority,
        attempts: job.attempts,
        maxAttempts: job.maxAttempts,
        delay: job.delay,
        createdAt: job.createdAt,
        processAt: job.processAt,
        completedAt: job.completedAt,
        failedAt: job.failedAt,
        error: job.error,
        metadata: job.metadata,
      };

      const result = await this.processSingleMessage(singleJob);
      results.push(result);
    }

    return results;
  }

  private async processDeliveryUpdate(job: Job<DeliveryReport>): Promise<void> {
    const { data: deliveryReport } = job;

    // Update delivery status (this would update database)
    this.emit("delivery:updated", {
      type: MessageEventType.MESSAGE_DELIVERED,
      timestamp: new Date(),
      data: deliveryReport,
      metadata: job.metadata,
    } as MessageEvent);
  }

  private async processScheduledMessage(
    job: Job<MessageRequest>,
  ): Promise<MessageResult> {
    const { data: messageRequest } = job;

    // Check if it's time to send
    const scheduledAt = messageRequest.scheduling?.scheduledAt;
    if (scheduledAt && scheduledAt > new Date()) {
      // Reschedule for later
      throw new Error(
        `Message scheduled for ${scheduledAt.toISOString()}, rescheduling`,
      );
    }

    // Process as normal message
    return this.processSingleMessage(job);
  }

  /**
   * Add a message to the processing queue
   */
  async queueMessage(
    messageRequest: MessageRequest,
    options: {
      priority?: number;
      delay?: number;
      metadata?: Record<string, any>;
    } = {},
  ): Promise<string> {
    const priority =
      options.priority ||
      (messageRequest.options?.priority === "high"
        ? 10
        : messageRequest.options?.priority === "low"
          ? 1
          : 5);

    const delay = options.delay || 0;

    return this.add("send_message", messageRequest, {
      priority,
      delay,
      metadata: options.metadata,
    });
  }

  /**
   * Add bulk messages to the processing queue
   */
  async queueBulkMessages(
    messageRequests: MessageRequest[],
    options: {
      priority?: number;
      delay?: number;
      metadata?: Record<string, any>;
    } = {},
  ): Promise<string> {
    return this.add("send_bulk_messages", messageRequests, {
      priority: options.priority || 3,
      delay: options.delay || 0,
      metadata: options.metadata,
    });
  }

  /**
   * Schedule a message for future delivery
   */
  async scheduleMessage(
    messageRequest: MessageRequest,
    scheduledAt: Date,
    options: {
      metadata?: Record<string, any>;
    } = {},
  ): Promise<string> {
    const delay = Math.max(0, scheduledAt.getTime() - Date.now());

    return this.add("send_scheduled_message", messageRequest, {
      priority: 5,
      delay,
      metadata: options.metadata,
    });
  }
}
