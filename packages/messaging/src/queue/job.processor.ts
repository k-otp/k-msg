/**
 * Job processor for message queue system
 */

import {
  CircuitBreaker,
  KMsgErrorCode,
  type Provider,
  RateLimiter,
  type SendOptions,
} from "@k-msg/core";
import { EventEmitter } from "../shared/event-emitter";
import { logBackgroundFailure } from "../shared/log-background-failure";
import {
  type DeliveryReport,
  type MessageEvent,
  MessageEventType,
  type MessageRequest,
  type MessageResult,
  MessageStatus,
  type RecipientResult,
} from "../types/message.types";
import {
  type Job,
  JobCheckpointLostError,
  type JobQueue,
  type JobRetryDirective,
} from "./job-queue.interface";
import { buildSendInputFromJob } from "./send-input.builder";

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

class MessageDeliveryError extends Error {
  constructor(
    readonly retryable: boolean,
    readonly result?: MessageResult,
  ) {
    super(
      retryable
        ? "Some recipients were rate limited; only those recipients will retry"
        : "Some recipients failed or have an unknown outcome; inspect saved delivery progress before retrying",
    );
  }
}
type Receipt = {
  messageId: string;
  result?: RecipientResult;
  retryable?: boolean;
};
type CheckpointedMessage = MessageRequest & {
  __kmsgDelivery?: Record<string, Receipt>;
};

function withoutReceipts(data: unknown): unknown {
  if (Array.isArray(data)) return data.map(withoutReceipts);
  if (!data || typeof data !== "object") return data;
  const { __kmsgDelivery: _progress, ...publicData } = data as Record<
    string,
    unknown
  >;
  return publicData;
}
function publicJob(job: Job<unknown>): Job<unknown> {
  return job.type.startsWith("send_")
    ? { ...job, data: withoutReceipts(job.data) }
    : job;
}
function senderNumber(
  options: Record<string, unknown> | undefined,
): string | undefined {
  if (typeof options?.from === "string") return options.from;
  if (typeof options?.senderNumber === "string") return options.senderNumber;
  return undefined;
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

    await this.refreshQueueMetrics();
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
   * Remove terminal jobs from queue without touching pending or processing jobs.
   */
  async cleanup(): Promise<number> {
    if (!this.queue.cleanupTerminal) {
      throw new Error(
        "JobQueue must implement cleanupTerminal() to support JobProcessor.cleanup()",
      );
    }

    const removed = await this.queue.cleanupTerminal();
    await this.refreshQueueMetrics();

    return removed;
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
    await this.refreshQueueMetrics();
    return removed;
  }

  private scheduleNextPoll(): void {
    if (!this.isRunning) {
      return;
    }

    this.pollTimer = setTimeout(() => {
      this.processJobs().catch((error: unknown) => {
        logBackgroundFailure("Job queue poll failed", error);
      });
      this.scheduleNextPoll();
    }, this.options.pollInterval);
  }

  private async processJobs(): Promise<void> {
    const availableSlots = this.options.concurrency - this.processing.size;
    if (availableSlots <= 0) {
      return;
    }

    for (let i = 0; i < availableSlots; i++) {
      // A queue that leases jobs keeps the ones still running here, even
      // once their lease has run out, rather than counting them as lost. A
      // copy, so a job that finishes during the call stays in it.
      const job = await this.queue.dequeue({
        running: new Set(this.processing),
      });
      if (!job) {
        break;
      }
      // A queue that ignores `running` hands such a job out again; running
      // it twice would repeat the work.
      if (this.processing.has(job.id)) {
        continue;
      }
      this.processing.add(job.id);
      // Jobs run concurrently. processJob frees the slot even when a step
      // rejects, so a failure here only needs to be reported.
      this.processJob(job).catch((error: unknown) => {
        logBackgroundFailure("Job processing failed", error, {
          jobId: job.id,
          jobType: job.type,
        });
      });
    }
  }

  protected async checkpoint(job: Job<unknown>): Promise<void> {
    if (!this.queue.checkpoint)
      throw new Error(
        "MessageJobProcessor requires a queue with checkpoint support",
      );
    await this.queue.checkpoint(job.id, job.data, job.attempts);
  }

  private async processJob(job: Job<any>): Promise<void> {
    const handler = this.handlers.get(job.type);
    if (!handler) {
      try {
        await this.failJob(
          job.id,
          `No handler registered for job type: ${job.type}`,
          { enabled: false },
        );
      } finally {
        this.processing.delete(job.id);
      }
      this.metrics.lastProcessedAt = new Date();
      await this.refreshQueueMetrics();
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

      try {
        this.emit("job:completed", {
          job: publicJob(job),
          result,
          processingTime,
        });
      } catch (error) {
        logBackgroundFailure("Completed job observer failed", error, {
          jobId: job.id,
        });
      }
    } catch (error) {
      this.metrics.activeJobs--;
      if (error instanceof JobCheckpointLostError) {
        this.processing.delete(job.id);
        this.metrics.lastProcessedAt = new Date();
        await this.refreshQueueMetrics();
        return;
      }

      const shouldRetry =
        job.attempts + 1 < job.maxAttempts &&
        (!(error instanceof MessageDeliveryError) || error.retryable);

      // The job stays in `processing` until its failure is stored, so a
      // dequeue() in between still leaves it to this processor.
      try {
        if (shouldRetry) {
          const retryDelay = this.getRetryDelay(job.attempts);
          await this.failJob(
            job.id,
            error instanceof Error ? error.message : String(error),
            { enabled: true, delayMs: retryDelay },
          );

          this.metrics.retried++;
          try {
            this.emit("job:retry", { job: publicJob(job), error, retryDelay });
          } catch (observerError) {
            logBackgroundFailure("Job retry observer failed", observerError, {
              jobId: job.id,
            });
          }
        } else {
          await this.failJob(
            job.id,
            error instanceof Error ? error.message : String(error),
            { enabled: false },
          );
        }
      } finally {
        this.processing.delete(job.id);
      }
    }

    this.metrics.lastProcessedAt = new Date();
    await this.refreshQueueMetrics();
  }

  private async failJob(
    jobId: string,
    error: string,
    retry: JobRetryDirective,
  ): Promise<void> {
    await this.queue.fail(jobId, error, retry);

    if (!retry.enabled) {
      this.metrics.failed++;
      this.metrics.processed++;
      try {
        this.emit("job:failed", { jobId, error });
      } catch (observerError) {
        logBackgroundFailure("Job failure observer failed", observerError, {
          jobId,
        });
      }
    }
  }

  private getRetryDelay(attempt: number): number {
    if (this.options.retryDelays.length === 0) {
      return 0;
    }

    const delayIndex = Math.min(attempt, this.options.retryDelays.length - 1);
    return this.options.retryDelays[delayIndex] ?? 0;
  }

  private async refreshQueueMetrics(): Promise<void> {
    this.metrics.queueSize = await this.queue.size();
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

    if (!jobQueue.checkpoint || jobQueue.supportsCheckpoints === false)
      throw new Error(
        "MessageJobProcessor requires a queue with checkpoint support",
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
    save: () => Promise<void> = () => this.checkpoint(job),
  ): Promise<MessageResult> {
    const request = job.data as CheckpointedMessage;
    try {
      this.emit("message:processing", {
        type: MessageEventType.MESSAGE_QUEUED,
        timestamp: new Date(),
        data: { requestId: job.id, messageRequest: withoutReceipts(request) },
        metadata: job.metadata,
      } as MessageEvent);
    } catch (error) {
      logBackgroundFailure("Message processing observer failed", error, {
        jobId: job.id,
      });
    }
    request.__kmsgDelivery ??= {};
    const progress = request.__kmsgDelivery;
    const requestOptions = request.options as
      | Record<string, unknown>
      | undefined;
    const results: RecipientResult[] = [];
    let retryable = false;
    // Sequential checkpoints make progress durable before any later recipient starts.
    for (const [index, recipient] of request.recipients.entries()) {
      const key = String(index);
      const previous = progress[key];
      if (previous && !previous.retryable) {
        results.push(
          previous.result ?? {
            phoneNumber: recipient.phoneNumber,
            messageId: previous.messageId,
            metadata: recipient.metadata,
            status: MessageStatus.FAILED,
            error: {
              code: "OUTCOME_UNKNOWN",
              message:
                "A previous send started without a durable result; reconcile before retrying",
            },
          },
        );
        continue;
      }
      const built = buildSendInputFromJob(
        {
          type:
            (request as MessageRequest & { type?: string }).type ?? "ALIMTALK",
          to: recipient.phoneNumber,
          from: senderNumber(requestOptions),
          templateId: request.templateId,
          text: (request as MessageRequest & { text?: string }).text,
          variables: { ...request.variables, ...recipient.variables },
          providerOptions: requestOptions?.providerOptions as
            | Record<string, unknown>
            | undefined,
        },
        {
          requestId: job.id,
          correlationId:
            typeof job.metadata.correlationId === "string"
              ? job.metadata.correlationId
              : job.id,
          providerOptions: requestOptions?.providerOptions as
            | Record<string, unknown>
            | undefined,
        },
        job.attempts + 1,
      );
      const receipt: Receipt = {
        messageId: previous?.messageId ?? crypto.randomUUID(),
      };
      progress[key] = receipt;
      // If persistence fails, do not send. A persisted unfinished receipt is
      // treated as unknown after a crash, never blindly sent a second time.
      await save();
      let result: RecipientResult;
      if (built.isFailure) {
        result = {
          phoneNumber: recipient.phoneNumber,
          status: MessageStatus.FAILED,
          error: { code: built.error.code, message: built.error.message },
          metadata: recipient.metadata,
        };
      } else {
        try {
          const response = await this.provider.send({
            ...built.value,
            messageId: receipt.messageId,
          } as SendOptions);
          if (response.isSuccess) {
            result = {
              phoneNumber: recipient.phoneNumber,
              messageId: response.value.messageId,
              status:
                response.value.status === "SENT"
                  ? MessageStatus.SENT
                  : MessageStatus.QUEUED,
              metadata: recipient.metadata,
            };
          } else {
            result = {
              phoneNumber: recipient.phoneNumber,
              status: MessageStatus.FAILED,
              error: {
                code: response.error.code,
                message: response.error.message,
              },
              metadata: recipient.metadata,
            };
            // Only an explicit admission denial is safe to retry. Network/timeout
            // failures may have sent a message and require reconciliation.
            receipt.retryable =
              response.error.code === KMsgErrorCode.RATE_LIMIT_EXCEEDED;
          }
        } catch {
          // Provider exception text may contain credentials or recipient data.
          logBackgroundFailure(
            "Provider send outcome unknown",
            new Error("Provider send rejected"),
            { jobId: job.id, messageId: receipt.messageId },
          );
          result = {
            phoneNumber: recipient.phoneNumber,
            status: MessageStatus.FAILED,
            error: {
              code: "OUTCOME_UNKNOWN",
              message: "Provider outcome is unknown; reconcile before retrying",
            },
            messageId: receipt.messageId,
            metadata: recipient.metadata,
          };
        }
      }
      receipt.result = result;
      await save();
      retryable ||= receipt.retryable === true;
      results.push(result);
    }
    const result: MessageResult = {
      requestId: job.id,
      results,
      summary: {
        total: results.length,
        sent: results.filter((item) => item.status === MessageStatus.SENT)
          .length,
        queued: results.filter((item) => item.status === MessageStatus.QUEUED)
          .length,
        failed: results.filter((item) => item.status === MessageStatus.FAILED)
          .length,
      },
      metadata: {
        createdAt: new Date(),
        provider: this.provider.id,
        templateId: request.templateId,
      },
    };
    if (result.summary.failed > 0)
      throw new MessageDeliveryError(retryable, result);
    try {
      this.emit("message:queued", {
        type: MessageEventType.MESSAGE_QUEUED,
        timestamp: new Date(),
        data: result,
        metadata: job.metadata,
      } as MessageEvent);
    } catch (error) {
      logBackgroundFailure("Message completion observer failed", error, {
        jobId: job.id,
      });
    }
    return result;
  }

  private async processBulkMessages(
    job: Job<MessageRequest[]>,
  ): Promise<MessageResult[]> {
    const { data: messageRequests } = job;
    const results: MessageResult[] = [];

    let anyFailed = false;
    let retryable = false;
    for (const [index, messageRequest] of messageRequests.entries()) {
      const singleJob: Job<MessageRequest> = {
        id: `${job.id}_${index}`,
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

      try {
        results.push(
          await this.processSingleMessage(singleJob, () =>
            this.checkpoint(job),
          ),
        );
      } catch (error) {
        if (!(error instanceof MessageDeliveryError)) throw error;
        anyFailed = true;
        retryable ||= error.retryable;
        if (error.result) results.push(error.result);
      }
    }
    if (anyFailed) throw new MessageDeliveryError(retryable);
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
