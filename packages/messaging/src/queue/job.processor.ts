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
  /**
   * Most recipients one message job may hold (default 1000). A message job
   * saves its progress with the whole job payload before every send, so the
   * work and the size of the stored row both grow with the recipient count.
   * Larger lists belong in several jobs.
   */
  maxRecipientsPerJob?: number;
  /**
   * Most bytes a message job may take once its progress is saved (default
   * 1,000,000, half of D1's 2 MB row limit). The estimate is the JSON size of
   * the request plus the progress kept for every recipient.
   */
  maxJobBytes?: number;
}

// Reserved key in a message request: the job's own delivery receipts.
const DELIVERY_KEY = "__kmsgDelivery";
const DEFAULT_MAX_RECIPIENTS_PER_JOB = 1000;
const DEFAULT_MAX_JOB_BYTES = 1_000_000;
// What the progress kept for one recipient adds to the stored job at most.
const PROGRESS_BYTES_PER_RECIPIENT = 160;

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

/** A message job holds more recipients, or more bytes, than a queue row should. */
export class MessageJobTooLargeError extends RangeError {
  constructor(message: string) {
    super(message);
    this.name = "MessageJobTooLargeError";
  }
}

interface DeliveryFailure {
  /** Position of the request in a bulk job. */
  request?: number;
  recipient: number;
  code: string;
}

class MessageDeliveryError extends Error {
  constructor(
    readonly retryable: boolean,
    readonly result: MessageResult | undefined,
    readonly failures: readonly DeliveryFailure[],
  ) {
    super(describeDeliveryFailures(retryable, failures));
  }
}

// Counts and the first failure's position and error code: never a phone
// number, provider message or variable.
function describeDeliveryFailures(
  retryable: boolean,
  failures: readonly DeliveryFailure[],
): string {
  const first = failures[0];
  const where = first
    ? ` (first: ${first.request === undefined ? "" : `request ${first.request} `}recipient ${first.recipient}, ${first.code})`
    : "";
  return retryable
    ? `${failures.length} recipient(s) were rate limited${where}; only those recipients will retry`
    : `${failures.length} recipient(s) failed or have an unknown outcome${where}; inspect saved delivery progress before retrying`;
}

/**
 * What a message job remembers about one recipient. It is not a copy of the
 * result: the recipient and request already hold the rest.
 */
interface Receipt {
  /** The `messageId` the provider was given; reused if the send is retried. */
  id: string;
  /** Missing until the send ended: such a receipt means an unknown outcome. */
  status?: MessageStatus;
  /** The provider's message id, when it differs from `id`. */
  pid?: string;
  code?: string;
  msg?: string;
  /** Only an explicit rate-limit denial may be sent again. */
  retry?: true;
}
interface Progress {
  /** The job that wrote these receipts: those of any other are ignored. */
  job: string;
  receipts: Record<string, unknown>;
}
type CheckpointedMessage = MessageRequest & {
  [DELIVERY_KEY]?: unknown;
};

const MAX_RECEIPT_TEXT = 200;
const RECEIPT_STATUSES: ReadonlySet<unknown> = new Set(
  Object.values(MessageStatus),
);
// A receipt that is not the shape the processor writes.
const UNREADABLE = Symbol("unreadable receipt");

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalText(value: unknown): boolean {
  return (
    value === undefined ||
    (typeof value === "string" && value.length <= MAX_RECEIPT_TEXT)
  );
}

function readReceipt(value: unknown): Receipt | typeof UNREADABLE | undefined {
  if (value === undefined) return undefined;
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    value.id.length === 0 ||
    value.id.length > MAX_RECEIPT_TEXT ||
    !(value.status === undefined || RECEIPT_STATUSES.has(value.status)) ||
    !optionalText(value.pid) ||
    !optionalText(value.code) ||
    !optionalText(value.msg) ||
    !(value.retry === undefined || value.retry === true)
  ) {
    return UNREADABLE;
  }
  return value as unknown as Receipt;
}

// The receipts of this job in the request, started afresh when the request
// carries none or ones another job wrote.
function progressOf(request: CheckpointedMessage, jobId: string): Progress {
  const stored = request[DELIVERY_KEY];
  if (isRecord(stored) && stored.job === jobId && isRecord(stored.receipts)) {
    return stored as unknown as Progress;
  }
  const progress: Progress = { job: jobId, receipts: {} };
  request[DELIVERY_KEY] = progress;
  return progress;
}

function resultOfReceipt(
  recipient: MessageRequest["recipients"][number],
  receipt: Receipt,
): RecipientResult {
  const base = {
    phoneNumber: recipient.phoneNumber,
    metadata: recipient.metadata,
  };
  if (receipt.status === undefined) {
    // The send started and nothing durable says how it ended.
    return {
      ...base,
      messageId: receipt.id,
      status: MessageStatus.FAILED,
      error: {
        code: "OUTCOME_UNKNOWN",
        message:
          "A previous send started without a durable result; reconcile before retrying",
      },
    };
  }
  if (receipt.status === MessageStatus.FAILED) {
    return {
      ...base,
      ...(receipt.code === "OUTCOME_UNKNOWN" ? { messageId: receipt.id } : {}),
      status: MessageStatus.FAILED,
      error: { code: receipt.code ?? "UNKNOWN", message: receipt.msg ?? "" },
    };
  }
  return {
    ...base,
    messageId: receipt.pid ?? receipt.id,
    status: receipt.status,
  };
}

function withoutReceipts(data: unknown): unknown {
  if (Array.isArray(data)) return data.map(withoutReceipts);
  if (!data || typeof data !== "object") return data;
  const { [DELIVERY_KEY]: _progress, ...publicData } = data as Record<
    string,
    unknown
  >;
  return publicData;
}
// The jobs MessageJobProcessor sends. Only these carry receipts, are bounded
// in size and settle under an attempt fence.
const MESSAGE_JOB_TYPES: ReadonlySet<string> = new Set([
  "send_message",
  "send_bulk_messages",
  "send_scheduled_message",
]);
function isMessageJobType(jobType: string): boolean {
  return MESSAGE_JOB_TYPES.has(jobType);
}
function publicJob(job: Job<unknown>): Job<unknown> {
  return isMessageJobType(job.type)
    ? { ...job, data: withoutReceipts(job.data) }
    : job;
}
function nonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value
    : undefined;
}
function senderNumber(
  options: Record<string, unknown> | undefined,
): string | undefined {
  return nonEmptyString(options?.from) ?? nonEmptyString(options?.senderNumber);
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
    protected options: JobProcessorOptions,
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

      await this.queue.complete(job.id, result, this.settleOptions(job));
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
        !(error instanceof MessageJobTooLargeError) &&
        (!(error instanceof MessageDeliveryError) || error.retryable);

      // The job stays in `processing` until its failure is stored, so a
      // dequeue() in between still leaves it to this processor.
      try {
        if (shouldRetry) {
          const retryDelay = this.getRetryDelay(job.attempts);
          const stored = await this.failJob(
            job.id,
            error instanceof Error ? error.message : String(error),
            { enabled: true, delayMs: retryDelay },
            this.settleOptions(job),
          );
          if (!stored) return await this.finishLost(job);

          this.metrics.retried++;
          try {
            this.emit("job:retry", { job: publicJob(job), error, retryDelay });
          } catch (observerError) {
            logBackgroundFailure("Job retry observer failed", observerError, {
              jobId: job.id,
            });
          }
        } else {
          const stored = await this.failJob(
            job.id,
            error instanceof Error ? error.message : String(error),
            { enabled: false },
            this.settleOptions(job),
          );
          if (!stored) return await this.finishLost(job);
        }
      } finally {
        this.processing.delete(job.id);
      }
    }

    this.metrics.lastProcessedAt = new Date();
    await this.refreshQueueMetrics();
  }

  // Message jobs settle only the attempt they run: a stale worker must not
  // complete or fail the job of the one that took it over.
  private settleOptions(job: Job<unknown>): { attempt?: number } {
    return isMessageJobType(job.type) ? { attempt: job.attempts } : {};
  }

  private async finishLost(job: Job<unknown>): Promise<void> {
    this.processing.delete(job.id);
    this.metrics.lastProcessedAt = new Date();
    await this.refreshQueueMetrics();
  }

  /** False when the queue refused it because the attempt no longer owns the job. */
  private async failJob(
    jobId: string,
    error: string,
    retry: JobRetryDirective,
    settle: { attempt?: number } = {},
  ): Promise<boolean> {
    try {
      await this.queue.fail(jobId, error, retry, settle);
    } catch (failure) {
      if (failure instanceof JobCheckpointLostError) return false;
      throw failure;
    }

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
    return true;
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
        "MessageJobProcessor requires a queue with checkpoint support: a SQL queue, a SQLite queue or a Durable Object queue (not KV or R2)",
      );
    this.setupMessageHandlers();
  }

  /**
   * Adds a job. A message job is refused when it carries delivery receipts
   * (they are the processor's own, never the caller's) or is too large to
   * save its progress cheaply.
   */
  override async add<T>(
    jobType: string,
    data: T,
    options: {
      priority?: number;
      delay?: number;
      maxAttempts?: number;
      metadata?: Record<string, any>;
    } = {},
  ): Promise<string> {
    if (isMessageJobType(jobType)) {
      this.assertDeliverableSize(data);
      this.assertNoReceipts(data);
    }
    return super.add(jobType, data, options);
  }

  private requestsOf(data: unknown): CheckpointedMessage[] {
    const requests = Array.isArray(data) ? data : [data];
    return requests.filter(isRecord) as unknown as CheckpointedMessage[];
  }

  private assertNoReceipts(data: unknown): void {
    for (const request of this.requestsOf(data)) {
      if (Object.hasOwn(request, DELIVERY_KEY)) {
        throw new TypeError(
          `"${DELIVERY_KEY}" is reserved for the delivery progress of a job and cannot be part of a message request`,
        );
      }
    }
  }

  // Saving progress rewrites the whole job, so the cost of a job grows with
  // its recipients; refuse what could not be stored or finished cheaply.
  private assertDeliverableSize(data: unknown): void {
    const maxRecipients =
      this.options.maxRecipientsPerJob ?? DEFAULT_MAX_RECIPIENTS_PER_JOB;
    const maxBytes = this.options.maxJobBytes ?? DEFAULT_MAX_JOB_BYTES;
    let recipients = 0;
    for (const request of this.requestsOf(data)) {
      if (Array.isArray(request.recipients)) {
        recipients += request.recipients.length;
      }
    }
    if (recipients > maxRecipients) {
      throw new MessageJobTooLargeError(
        `A message job holds at most ${maxRecipients} recipients, got ${recipients}: split the list into several jobs`,
      );
    }
    const bytes =
      (JSON.stringify(data)?.length ?? 0) +
      recipients * PROGRESS_BYTES_PER_RECIPIENT;
    if (bytes > maxBytes) {
      throw new MessageJobTooLargeError(
        `A message job takes about ${bytes} bytes with its delivery progress, over the limit of ${maxBytes}: split the list into several jobs`,
      );
    }
  }

  private setupMessageHandlers(): void {
    // Handle single message sending
    this.handle("send_message", async (job: Job<MessageRequest>) => {
      this.assertFirstAttemptSize(job);
      return this.processSingleMessage(job);
    });

    // Handle bulk message sending
    this.handle("send_bulk_messages", async (job: Job<MessageRequest[]>) => {
      this.assertFirstAttemptSize(job);
      return this.processBulkMessages(job);
    });

    // Handle delivery status updates
    this.handle("update_delivery_status", async (job: Job<DeliveryReport>) => {
      return this.processDeliveryUpdate(job);
    });

    // Handle scheduled message sending
    this.handle("send_scheduled_message", async (job: Job<MessageRequest>) => {
      this.assertFirstAttemptSize(job);
      return this.processScheduledMessage(job);
    });
  }

  // A job put straight into the queue skipped add(): refuse it before it
  // sends anything rather than fail its first checkpoint.
  private assertFirstAttemptSize(job: Job<unknown>): void {
    if (job.attempts === 0) this.assertDeliverableSize(job.data);
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
    const receipts = progressOf(request, job.id).receipts;
    const requestOptions = request.options as
      | Record<string, unknown>
      | undefined;
    const results: RecipientResult[] = [];
    const failures: DeliveryFailure[] = [];
    let retryable = false;
    // The result of the last send is saved with the next recipient's receipt,
    // or after the loop, so each recipient costs one write, not two.
    let unsaved = false;
    // Sequential checkpoints make progress durable before any later recipient starts.
    for (const [index, recipient] of request.recipients.entries()) {
      const key = String(index);
      const previous = readReceipt(receipts[key]);
      if (previous === UNREADABLE) {
        // Not a receipt this processor wrote: never send into the unknown.
        const { messageId: _unknown, ...unknown } = resultOfReceipt(recipient, {
          id: "unreadable",
        });
        results.push(unknown);
        failures.push({ recipient: index, code: "OUTCOME_UNKNOWN" });
        continue;
      }
      if (previous && !previous.retry) {
        const done = resultOfReceipt(recipient, previous);
        results.push(done);
        if (done.status === MessageStatus.FAILED) {
          failures.push({
            recipient: index,
            code: done.error?.code ?? "UNKNOWN",
          });
        }
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
            typeof job.metadata?.correlationId === "string"
              ? job.metadata.correlationId
              : job.id,
          providerOptions: requestOptions?.providerOptions as
            | Record<string, unknown>
            | undefined,
        },
        job.attempts + 1,
      );
      const receipt: Receipt = { id: previous?.id ?? crypto.randomUUID() };
      receipts[key] = receipt;
      // If persistence fails, do not send. A persisted unfinished receipt is
      // treated as unknown after a crash, never blindly sent a second time.
      // Nothing is sent for a request that cannot be built.
      if (!built.isFailure) await save();
      let result: RecipientResult;
      if (built.isFailure) {
        result = this.failedResult(
          receipt,
          recipient,
          built.error.code,
          built.error.message,
        );
      } else {
        try {
          const response = await this.provider.send({
            ...built.value,
            messageId: receipt.id,
          } as SendOptions);
          if (response.isSuccess) {
            const status =
              response.value.status === "SENT"
                ? MessageStatus.SENT
                : MessageStatus.QUEUED;
            receipt.status = status;
            if (response.value.messageId !== receipt.id) {
              receipt.pid = response.value.messageId;
            }
            result = {
              phoneNumber: recipient.phoneNumber,
              messageId: response.value.messageId,
              status,
              metadata: recipient.metadata,
            };
          } else {
            result = this.failedResult(
              receipt,
              recipient,
              response.error.code,
              response.error.message,
            );
            // Only an explicit admission denial is safe to retry. Network/timeout
            // failures may have sent a message and require reconciliation.
            if (response.error.code === KMsgErrorCode.RATE_LIMIT_EXCEEDED) {
              receipt.retry = true;
            }
          }
        } catch {
          // Provider exception text may contain credentials or recipient data.
          logBackgroundFailure(
            "Provider send outcome unknown",
            new Error("Provider send rejected"),
            { jobId: job.id, messageId: receipt.id },
          );
          result = this.failedResult(
            receipt,
            recipient,
            "OUTCOME_UNKNOWN",
            "Provider outcome is unknown; reconcile before retrying",
          );
          result.messageId = receipt.id;
        }
      }
      unsaved = true;
      retryable ||= receipt.retry === true;
      results.push(result);
      if (result.status === MessageStatus.FAILED) {
        failures.push({
          recipient: index,
          code: result.error?.code ?? "UNKNOWN",
        });
      }
    }
    // Rate-limited recipients retry from these receipts, so they must be saved.
    if (unsaved) await save();
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
      throw new MessageDeliveryError(retryable, result, failures);
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

  // Records a failed send on the receipt and returns it as the recipient's result.
  private failedResult(
    receipt: Receipt,
    recipient: MessageRequest["recipients"][number],
    code: string,
    message: string,
  ): RecipientResult {
    receipt.status = MessageStatus.FAILED;
    receipt.code = code;
    receipt.msg = message.slice(0, MAX_RECEIPT_TEXT);
    return {
      phoneNumber: recipient.phoneNumber,
      status: MessageStatus.FAILED,
      error: { code, message },
      metadata: recipient.metadata,
    };
  }

  private async processBulkMessages(
    job: Job<MessageRequest[]>,
  ): Promise<MessageResult[]> {
    const { data: messageRequests } = job;
    const results: MessageResult[] = [];

    const failures: DeliveryFailure[] = [];
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
        retryable ||= error.retryable;
        for (const failure of error.failures) {
          failures.push({ ...failure, request: index });
        }
        if (error.result) results.push(error.result);
      }
    }
    if (failures.length > 0) {
      throw new MessageDeliveryError(retryable, undefined, failures);
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
