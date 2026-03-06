/**
 * Retry handler for failed message deliveries
 */

import { EventEmitter } from "../shared/event-emitter";
import {
  type DeliveryReport,
  type MessageEvent,
  MessageEventType,
  MessageStatus,
} from "../types/message.types";

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffMultiplier: number;
  initialDelay: number;
  maxDelay: number;
  jitter: boolean;
  retryableStatuses: MessageStatus[];
  retryableErrorCodes: string[];
}

export interface RetryAttempt {
  messageId: string;
  phoneNumber: string;
  attemptNumber: number;
  scheduledAt: Date;
  provider: string;
  templateId: string;
  variables: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

export interface RetryQueueItem {
  id: string;
  messageId: string;
  phoneNumber: string;
  originalDeliveryReport: DeliveryReport;
  attempts: RetryAttempt[];
  nextRetryAt: Date;
  status:
    | "pending"
    | "processing"
    | "succeeded"
    | "exhausted"
    | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

export interface RetryHandlerOptions {
  policy: RetryPolicy;
  checkInterval: number;
  maxQueueSize: number;
  enablePersistence: boolean;
  execute: (attempt: RetryAttempt, item: RetryQueueItem) => Promise<unknown>;
  shouldRetryError?: (
    error: Error,
    item: RetryQueueItem,
    attempt: RetryAttempt,
  ) => boolean;
  onRetryExhausted?: (item: RetryQueueItem) => Promise<void>;
  onRetrySuccess?: (item: RetryQueueItem, result: unknown) => Promise<void>;
  onRetryFailed?: (item: RetryQueueItem, error: Error) => Promise<void>;
}

export interface RetryHandlerMetrics {
  totalRetries: number;
  successfulRetries: number;
  failedRetries: number;
  exhaustedRetries: number;
  queueSize: number;
  averageRetryDelay: number;
  lastRetryAt?: Date;
}

export class MessageRetryHandler extends EventEmitter {
  private retryQueue: RetryQueueItem[] = [];
  private processing = new Set<string>();
  private checkTimer?: ReturnType<typeof setTimeout>;
  private isRunning = false;
  private metrics: RetryHandlerMetrics;

  private defaultPolicy: RetryPolicy = {
    maxAttempts: 3,
    backoffMultiplier: 2,
    initialDelay: 5000,
    maxDelay: 300000,
    jitter: true,
    retryableStatuses: [MessageStatus.FAILED],
    retryableErrorCodes: [
      "NETWORK_TIMEOUT",
      "PROVIDER_CONNECTION_FAILED",
      "PROVIDER_RATE_LIMITED",
      "PROVIDER_SERVICE_UNAVAILABLE",
    ],
  };

  constructor(private options: RetryHandlerOptions) {
    super();

    this.options.policy = { ...this.defaultPolicy, ...this.options.policy };

    this.metrics = {
      totalRetries: 0,
      successfulRetries: 0,
      failedRetries: 0,
      exhaustedRetries: 0,
      queueSize: 0,
      averageRetryDelay: 0,
    };
  }

  /**
   * Start the retry handler
   */
  start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.scheduleNextCheck();
    this.emit("handler:started");
  }

  /**
   * Stop the retry handler
   */
  async stop(): Promise<void> {
    this.isRunning = false;

    if (this.checkTimer) {
      clearTimeout(this.checkTimer);
      this.checkTimer = undefined;
    }

    while (this.processing.size > 0) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    this.emit("handler:stopped");
  }

  /**
   * Add a failed delivery for retry
   */
  async addForRetry(deliveryReport: DeliveryReport): Promise<boolean> {
    if (!this.shouldRetry(deliveryReport)) {
      return false;
    }

    const existingItem = this.retryQueue.find(
      (item) => item.messageId === deliveryReport.messageId,
    );

    if (existingItem) {
      return this.updateRetryItem(existingItem, deliveryReport);
    }

    const retryItem = await this.createRetryItem(deliveryReport);

    if (this.retryQueue.length >= this.options.maxQueueSize) {
      this.cleanupQueue();

      if (this.retryQueue.length >= this.options.maxQueueSize) {
        this.emit("queue:full", { rejected: deliveryReport });
        return false;
      }
    }

    this.retryQueue.push(retryItem);
    this.updateMetrics();

    this.emit("retry:queued", {
      type: MessageEventType.MESSAGE_QUEUED,
      timestamp: new Date(),
      data: retryItem,
      metadata: deliveryReport.metadata,
    } as MessageEvent);

    return true;
  }

  /**
   * Cancel retry for a specific message
   */
  cancelRetry(messageId: string): boolean {
    const item = this.retryQueue.find((entry) => entry.messageId === messageId);
    if (!item) {
      return false;
    }

    item.status = "cancelled";
    item.updatedAt = new Date();
    this.updateMetrics();
    this.emit("retry:cancelled", item);
    return true;
  }

  /**
   * Get retry status for a message
   */
  getRetryStatus(messageId: string): RetryQueueItem | undefined {
    return this.retryQueue.find((item) => item.messageId === messageId);
  }

  /**
   * Get all retry queue items
   */
  getRetryQueue(): RetryQueueItem[] {
    return [...this.retryQueue];
  }

  /**
   * Get metrics
   */
  getMetrics(): RetryHandlerMetrics {
    return { ...this.metrics };
  }

  /**
   * Clean up terminal retry items
   */
  cleanup(): number {
    const initialLength = this.retryQueue.length;

    this.retryQueue = this.retryQueue.filter(
      (item) => item.status === "pending" || item.status === "processing",
    );

    const removed = initialLength - this.retryQueue.length;
    this.updateMetrics();

    return removed;
  }

  private scheduleNextCheck(): void {
    if (!this.isRunning) {
      return;
    }

    this.checkTimer = setTimeout(() => {
      this.processRetryQueue();
      this.scheduleNextCheck();
    }, this.options.checkInterval);
  }

  private async processRetryQueue(): Promise<void> {
    const now = new Date();

    const readyItems = this.retryQueue.filter(
      (item) =>
        item.status === "pending" &&
        item.nextRetryAt <= now &&
        !this.processing.has(item.id),
    );

    for (const item of readyItems) {
      this.processRetryItem(item);
    }
  }

  private async processRetryItem(item: RetryQueueItem): Promise<void> {
    this.processing.add(item.id);
    item.status = "processing";
    item.updatedAt = new Date();

    let attempt: RetryAttempt | undefined;

    try {
      const originalMetadata = item.originalDeliveryReport.metadata;
      const templateId =
        typeof originalMetadata.templateId === "string"
          ? originalMetadata.templateId
          : "";
      const variablesRaw = originalMetadata.variables;
      const variables = isObjectRecord(variablesRaw) ? variablesRaw : {};

      attempt = {
        messageId: item.messageId,
        phoneNumber: item.phoneNumber,
        attemptNumber:
          item.originalDeliveryReport.attempts.length + item.attempts.length + 1,
        scheduledAt: new Date(),
        provider:
          item.originalDeliveryReport.attempts[0]?.provider || "unknown",
        templateId,
        variables,
        metadata: originalMetadata,
      };

      item.attempts.push(attempt);

      this.emit("retry:started", {
        type: MessageEventType.MESSAGE_QUEUED,
        timestamp: new Date(),
        data: { item, attempt },
        metadata: item.originalDeliveryReport.metadata,
      } as MessageEvent);

      const result = await this.options.execute(attempt, item);

      item.status = "succeeded";
      item.updatedAt = new Date();
      this.processing.delete(item.id);
      this.metrics.successfulRetries++;
      this.metrics.totalRetries++;
      this.updateMetrics();

      await this.options.onRetrySuccess?.(item, result);

      this.emit("retry:success", {
        type: MessageEventType.MESSAGE_SENT,
        timestamp: new Date(),
        data: { item, attempt, result },
        metadata: item.originalDeliveryReport.metadata,
      } as MessageEvent);
    } catch (error) {
      const retryError =
        error instanceof Error ? error : new Error(String(error));
      this.processing.delete(item.id);
      this.metrics.failedRetries++;
      this.metrics.totalRetries++;

      const totalAttempts =
        item.originalDeliveryReport.attempts.length + item.attempts.length;
      const shouldRetryByPolicy = totalAttempts < this.options.policy.maxAttempts;
      const shouldRetryByError =
        attempt === undefined
          ? false
          : (this.options.shouldRetryError?.(retryError, item, attempt) ?? true);
      const shouldRetryAgain = shouldRetryByPolicy && shouldRetryByError;

      if (shouldRetryAgain) {
        const nextDelay = this.calculateNextDelay(totalAttempts);
        item.nextRetryAt = new Date(Date.now() + nextDelay);
        item.status = "pending";
      } else {
        item.status = "exhausted";
        this.metrics.exhaustedRetries++;
      }

      item.updatedAt = new Date();
      this.updateMetrics();

      await this.options.onRetryFailed?.(item, retryError);

      this.emit("retry:failed", {
        type: MessageEventType.MESSAGE_FAILED,
        timestamp: new Date(),
        data: { item, error: retryError, willRetry: shouldRetryAgain },
        metadata: item.originalDeliveryReport.metadata,
      } as MessageEvent);

      if (!shouldRetryAgain) {
        await this.options.onRetryExhausted?.(item);

        this.emit("retry:exhausted", {
          type: MessageEventType.MESSAGE_FAILED,
          timestamp: new Date(),
          data: { item, finalError: retryError },
          metadata: item.originalDeliveryReport.metadata,
        } as MessageEvent);
      }
    }
  }

  private shouldRetry(deliveryReport: DeliveryReport): boolean {
    const { policy } = this.options;

    if (!policy.retryableStatuses.includes(deliveryReport.status)) {
      return false;
    }

    let errorToCheck = deliveryReport.error;
    if (!errorToCheck && deliveryReport.attempts.length > 0) {
      const latestAttempt =
        deliveryReport.attempts[deliveryReport.attempts.length - 1];
      errorToCheck = latestAttempt.error;
    }

    if (errorToCheck) {
      const isRetryableError = policy.retryableErrorCodes.includes(
        errorToCheck.code,
      );
      if (!isRetryableError) {
        return false;
      }
    }

    return deliveryReport.attempts.length < policy.maxAttempts;
  }

  private async createRetryItem(
    deliveryReport: DeliveryReport,
  ): Promise<RetryQueueItem> {
    const initialDelay = this.calculateNextDelay(deliveryReport.attempts.length);

    return {
      id: `retry_${deliveryReport.messageId}_${Date.now()}`,
      messageId: deliveryReport.messageId,
      phoneNumber: deliveryReport.phoneNumber,
      originalDeliveryReport: deliveryReport,
      attempts: [],
      nextRetryAt: new Date(Date.now() + initialDelay),
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private updateRetryItem(
    item: RetryQueueItem,
    deliveryReport: DeliveryReport,
  ): boolean {
    if (
      item.status === "succeeded" ||
      item.status === "exhausted" ||
      item.status === "cancelled"
    ) {
      return false;
    }

    item.originalDeliveryReport = deliveryReport;
    item.updatedAt = new Date();

    if (item.status === "pending") {
      const totalAttempts =
        item.originalDeliveryReport.attempts.length + item.attempts.length;
      const nextDelay = this.calculateNextDelay(totalAttempts);
      item.nextRetryAt = new Date(Date.now() + nextDelay);
    }

    return true;
  }

  private calculateNextDelay(totalAttemptsCompleted: number): number {
    const attemptIndex = Math.max(0, totalAttemptsCompleted - 1);
    return this.calculateRetryDelay(attemptIndex);
  }

  private calculateRetryDelay(attemptIndex: number): number {
    const { policy } = this.options;

    let delay = policy.initialDelay * policy.backoffMultiplier ** attemptIndex;
    delay = Math.min(delay, policy.maxDelay);

    if (policy.jitter) {
      const jitterAmount = delay * 0.1;
      delay += (Math.random() - 0.5) * 2 * jitterAmount;
    }

    return Math.max(0, delay);
  }

  private cleanupQueue(): void {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);

    this.retryQueue = this.retryQueue.filter(
      (item) =>
        item.status === "pending" ||
        item.status === "processing" ||
        item.updatedAt > cutoffTime,
    );
  }

  private updateMetrics(): void {
    this.metrics.queueSize = this.retryQueue.length;
    this.metrics.lastRetryAt = new Date();

    const pendingItems = this.retryQueue.filter(
      (item) => item.status === "pending",
    );
    if (pendingItems.length > 0) {
      const totalDelay = pendingItems.reduce((sum, item) => {
        return sum + Math.max(0, item.nextRetryAt.getTime() - Date.now());
      }, 0);
      this.metrics.averageRetryDelay = totalDelay / pendingItems.length;
      return;
    }

    this.metrics.averageRetryDelay = 0;
  }
}
