/**
 * Job processor for message queue system
 */

import { EventEmitter } from 'events';
import {
  MessageRequest,
  MessageResult,
  MessageStatus,
  MessageEventType,
  MessageEvent,
  RecipientResult,
  DeliveryReport
} from '../types/message.types';
import { RetryHandler, CircuitBreaker, RateLimiter } from '@k-msg/core';

export interface Job<T = any> {
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

export interface JobHandler<T = any> {
  (job: Job<T>): Promise<any>;
}

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
  private queue: Job[] = [];
  private processing = new Set<string>();
  private isRunning = false;
  private pollTimer?: NodeJS.Timeout;
  private metrics: JobProcessorMetrics;
  private rateLimiter?: RateLimiter;
  private circuitBreaker?: CircuitBreaker;

  constructor(private options: JobProcessorOptions) {
    super();

    this.metrics = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      retried: 0,
      activeJobs: 0,
      queueSize: 0,
      averageProcessingTime: 0
    };

    if (options.rateLimiter) {
      this.rateLimiter = new RateLimiter(
        options.rateLimiter.maxRequests,
        options.rateLimiter.windowMs
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
    } = {}
  ): Promise<string> {
    const jobId = `${jobType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const job: Job<T> = {
      id: jobId,
      type: jobType,
      data,
      priority: options.priority || 5,
      attempts: 0,
      maxAttempts: options.maxAttempts || this.options.maxRetries,
      delay: options.delay || 0,
      createdAt: now,
      processAt: new Date(now.getTime() + (options.delay || 0)),
      metadata: options.metadata || {}
    };

    // Insert job in priority order (higher priority first)
    const insertIndex = this.queue.findIndex(
      existingJob => existingJob.priority < job.priority
    );

    if (insertIndex === -1) {
      this.queue.push(job);
    } else {
      this.queue.splice(insertIndex, 0, job);
    }

    this.updateMetrics();
    this.emit('job:added', job);

    return jobId;
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
    this.emit('processor:started');
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
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.emit('processor:stopped');
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
  getQueueStatus(): {
    pending: number;
    processing: number;
    failed: number;
    totalProcessed: number;
  } {
    const failed = this.queue.filter(job => job.failedAt).length;

    return {
      pending: this.queue.length - failed,
      processing: this.processing.size,
      failed,
      totalProcessed: this.metrics.processed
    };
  }

  /**
   * Remove completed jobs from queue
   */
  cleanup(): number {
    const initialLength = this.queue.length;

    this.queue = this.queue.filter(job =>
      !job.completedAt && !job.failedAt
    );

    const removed = initialLength - this.queue.length;
    this.updateMetrics();

    return removed;
  }

  /**
   * Get specific job by ID
   */
  getJob(jobId: string): Job | undefined {
    return this.queue.find(job => job.id === jobId);
  }

  /**
   * Remove job from queue
   */
  removeJob(jobId: string): boolean {
    const index = this.queue.findIndex(job => job.id === jobId);
    if (index !== -1) {
      this.queue.splice(index, 1);
      this.processing.delete(jobId);
      this.updateMetrics();
      return true;
    }
    return false;
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

    const now = new Date();
    const readyJobs = this.queue
      .filter(job =>
        !job.completedAt &&
        !job.failedAt &&
        !this.processing.has(job.id) &&
        job.processAt <= now
      )
      .slice(0, availableSlots);

    for (const job of readyJobs) {
      this.processJob(job);
    }
  }

  private async processJob(job: Job): Promise<void> {
    const handler = this.handlers.get(job.type);
    if (!handler) {
      this.failJob(job, `No handler registered for job type: ${job.type}`);
      return;
    }

    this.processing.add(job.id);
    job.attempts++;
    this.metrics.activeJobs++;

    const startTime = Date.now();

    try {
      // Apply rate limiting
      if (this.rateLimiter) {
        await this.rateLimiter.acquire();
      }

      // Execute through circuit breaker if configured
      const executeJob = async () => handler(job);
      const result = this.circuitBreaker
        ? await this.circuitBreaker.execute(executeJob)
        : await executeJob();

      // Job completed successfully
      job.completedAt = new Date();
      this.processing.delete(job.id);
      this.metrics.activeJobs--;
      this.metrics.succeeded++;
      this.metrics.processed++;

      const processingTime = Date.now() - startTime;
      this.updateAverageProcessingTime(processingTime);

      this.emit('job:completed', { job, result, processingTime });

    } catch (error) {
      this.processing.delete(job.id);
      this.metrics.activeJobs--;

      const shouldRetry = job.attempts < job.maxAttempts;

      if (shouldRetry) {
        // Schedule retry
        const retryDelay = this.getRetryDelay(job.attempts);
        job.processAt = new Date(Date.now() + retryDelay);
        job.error = error instanceof Error ? error.message : String(error);

        this.metrics.retried++;
        this.emit('job:retry', { job, error, retryDelay });
      } else {
        // Job failed permanently
        this.failJob(job, error instanceof Error ? error.message : String(error));
      }
    }

    this.updateMetrics();
  }

  private failJob(job: Job, error: string): void {
    job.failedAt = new Date();
    job.error = error;
    this.metrics.failed++;
    this.metrics.processed++;
    this.emit('job:failed', { job, error });
  }

  private getRetryDelay(attempt: number): number {
    const delayIndex = Math.min(attempt - 1, this.options.retryDelays.length - 1);
    return this.options.retryDelays[delayIndex] || this.options.retryDelays[this.options.retryDelays.length - 1];
  }

  private updateMetrics(): void {
    this.metrics.queueSize = this.queue.length;
    this.metrics.lastProcessedAt = new Date();
  }

  private updateAverageProcessingTime(newTime: number): void {
    const totalProcessed = this.metrics.succeeded + this.metrics.failed;
    if (totalProcessed === 1) {
      this.metrics.averageProcessingTime = newTime;
    } else {
      this.metrics.averageProcessingTime =
        (this.metrics.averageProcessingTime * (totalProcessed - 1) + newTime) / totalProcessed;
    }
  }
}

/**
 * Specific processor for message jobs
 */
export class MessageJobProcessor extends JobProcessor {
  constructor(options: Partial<JobProcessorOptions> = {}) {
    super({
      concurrency: 5,
      retryDelays: [1000, 5000, 15000, 60000], // 1s, 5s, 15s, 1m
      maxRetries: 3,
      pollInterval: 1000,
      enableMetrics: true,
      ...options
    });

    this.setupMessageHandlers();
  }

  private setupMessageHandlers(): void {
    // Handle single message sending
    this.handle('send_message', async (job: Job<MessageRequest>) => {
      return this.processSingleMessage(job);
    });

    // Handle bulk message sending
    this.handle('send_bulk_messages', async (job: Job<MessageRequest[]>) => {
      return this.processBulkMessages(job);
    });

    // Handle delivery status updates
    this.handle('update_delivery_status', async (job: Job<DeliveryReport>) => {
      return this.processDeliveryUpdate(job);
    });

    // Handle scheduled message sending
    this.handle('send_scheduled_message', async (job: Job<MessageRequest>) => {
      return this.processScheduledMessage(job);
    });
  }

  private async processSingleMessage(job: Job<MessageRequest>): Promise<MessageResult> {
    const { data: messageRequest } = job;

    // Emit processing event
    this.emit('message:processing', {
      type: MessageEventType.MESSAGE_QUEUED,
      timestamp: new Date(),
      data: { requestId: job.id, messageRequest },
      metadata: job.metadata
    } as MessageEvent);

    // Process message (this would integrate with actual provider)
    const results: RecipientResult[] = messageRequest.recipients.map(recipient => ({
      phoneNumber: recipient.phoneNumber,
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      status: MessageStatus.QUEUED,
      metadata: recipient.metadata
    }));

    const result: MessageResult = {
      requestId: job.id,
      results,
      summary: {
        total: messageRequest.recipients.length,
        queued: messageRequest.recipients.length,
        sent: 0,
        failed: 0
      },
      metadata: {
        createdAt: new Date(),
        provider: 'default',
        templateId: messageRequest.templateId
      }
    };

    // Emit completion event
    this.emit('message:queued', {
      type: MessageEventType.MESSAGE_QUEUED,
      timestamp: new Date(),
      data: result,
      metadata: job.metadata
    } as MessageEvent);

    return result;
  }

  private async processBulkMessages(job: Job<MessageRequest[]>): Promise<MessageResult[]> {
    const { data: messageRequests } = job;
    const results: MessageResult[] = [];

    for (const messageRequest of messageRequests) {
      const singleJob: Job<MessageRequest> = {
        ...job,
        id: `${job.id}_${results.length}`,
        data: messageRequest
      };

      const result = await this.processSingleMessage(singleJob);
      results.push(result);
    }

    return results;
  }

  private async processDeliveryUpdate(job: Job<DeliveryReport>): Promise<void> {
    const { data: deliveryReport } = job;

    // Update delivery status (this would update database)
    this.emit('delivery:updated', {
      type: MessageEventType.MESSAGE_DELIVERED,
      timestamp: new Date(),
      data: deliveryReport,
      metadata: job.metadata
    } as MessageEvent);
  }

  private async processScheduledMessage(job: Job<MessageRequest>): Promise<MessageResult> {
    const { data: messageRequest } = job;

    // Check if it's time to send
    const scheduledAt = messageRequest.scheduling?.scheduledAt;
    if (scheduledAt && scheduledAt > new Date()) {
      // Reschedule for later
      throw new Error(`Message scheduled for ${scheduledAt.toISOString()}, rescheduling`);
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
    } = {}
  ): Promise<string> {
    const priority = options.priority ||
      (messageRequest.options?.priority === 'high' ? 10 :
        messageRequest.options?.priority === 'low' ? 1 : 5);

    const delay = options.delay || 0;

    return this.add('send_message', messageRequest, {
      priority,
      delay,
      metadata: options.metadata
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
    } = {}
  ): Promise<string> {
    return this.add('send_bulk_messages', messageRequests, {
      priority: options.priority || 3,
      delay: options.delay || 0,
      metadata: options.metadata
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
    } = {}
  ): Promise<string> {
    const delay = Math.max(0, scheduledAt.getTime() - Date.now());

    return this.add('send_scheduled_message', messageRequest, {
      priority: 5,
      delay,
      metadata: options.metadata
    });
  }
}