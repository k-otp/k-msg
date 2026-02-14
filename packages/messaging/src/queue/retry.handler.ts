/**
 * Retry handler for failed message deliveries
 */

import { RetryHandler as CoreRetryHandler, ErrorUtils } from "@k-msg/core";
import { EventEmitter } from "events";
import {
  DeliveryAttempt,
  type DeliveryReport,
  type MessageEvent,
  MessageEventType,
  MessageStatus,
} from "../types/message.types";

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
  variables: Record<string, any>;
  metadata: Record<string, any>;
}

export interface RetryQueueItem {
  id: string;
  messageId: string;
  phoneNumber: string;
  originalDeliveryReport: DeliveryReport;
  attempts: RetryAttempt[];
  nextRetryAt: Date;
  status: "pending" | "processing" | "exhausted" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

export interface RetryHandlerOptions {
  policy: RetryPolicy;
  checkInterval: number;
  maxQueueSize: number;
  enablePersistence: boolean;
  onRetryExhausted?: (item: RetryQueueItem) => Promise<void>;
  onRetrySuccess?: (item: RetryQueueItem, result: any) => Promise<void>;
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
  private checkTimer?: NodeJS.Timeout;
  private isRunning = false;
  private metrics: RetryHandlerMetrics;

  private defaultPolicy: RetryPolicy = {
    maxAttempts: 3,
    backoffMultiplier: 2,
    initialDelay: 5000, // 5 seconds
    maxDelay: 300000, // 5 minutes
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

    // Wait for active retries to complete
    while (this.processing.size > 0) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    this.emit("handler:stopped");
  }

  /**
   * Add a failed delivery for retry
   */
  async addForRetry(deliveryReport: DeliveryReport): Promise<boolean> {
    // Check if this message should be retried
    if (!this.shouldRetry(deliveryReport)) {
      return false;
    }

    // Check if already in retry queue
    const existingItem = this.retryQueue.find(
      (item) => item.messageId === deliveryReport.messageId,
    );

    if (existingItem) {
      // Update existing item
      return this.updateRetryItem(existingItem, deliveryReport);
    }

    // Create new retry item
    const retryItem = await this.createRetryItem(deliveryReport);

    if (this.retryQueue.length >= this.options.maxQueueSize) {
      // Remove oldest exhausted items to make space
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
    const item = this.retryQueue.find((item) => item.messageId === messageId);
    if (item) {
      item.status = "cancelled";
      item.updatedAt = new Date();
      this.updateMetrics();
      this.emit("retry:cancelled", item);
      return true;
    }
    return false;
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
   * Clean up completed/exhausted retry items
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

    try {
      // Create retry attempt
      const attempt: RetryAttempt = {
        messageId: item.messageId,
        phoneNumber: item.phoneNumber,
        attemptNumber: item.attempts.length + 1,
        scheduledAt: new Date(),
        provider:
          item.originalDeliveryReport.attempts[0]?.provider || "unknown",
        templateId: item.originalDeliveryReport.metadata.templateId || "",
        variables: item.originalDeliveryReport.metadata.variables || {},
        metadata: item.originalDeliveryReport.metadata,
      };

      item.attempts.push(attempt);

      // Emit retry started event
      this.emit("retry:started", {
        type: MessageEventType.MESSAGE_QUEUED,
        timestamp: new Date(),
        data: { item, attempt },
        metadata: item.originalDeliveryReport.metadata,
      } as MessageEvent);

      // Execute retry (this would integrate with actual message sender)
      const result = await this.executeRetry(attempt);

      // Retry succeeded
      item.status = "exhausted"; // Mark as completed
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
      this.processing.delete(item.id);
      this.metrics.failedRetries++;
      this.metrics.totalRetries++;

      const maxAttempts = this.options.policy.maxAttempts;
      const shouldRetryAgain = item.attempts.length < maxAttempts;

      if (shouldRetryAgain) {
        // Schedule next retry
        const nextDelay = this.calculateRetryDelay(item.attempts.length);
        item.nextRetryAt = new Date(Date.now() + nextDelay);
        item.status = "pending";
      } else {
        // Retry exhausted
        item.status = "exhausted";
        this.metrics.exhaustedRetries++;

        await this.options.onRetryExhausted?.(item);

        this.emit("retry:exhausted", {
          type: MessageEventType.MESSAGE_FAILED,
          timestamp: new Date(),
          data: { item, finalError: error },
          metadata: item.originalDeliveryReport.metadata,
        } as MessageEvent);
      }

      item.updatedAt = new Date();
      this.updateMetrics();

      await this.options.onRetryFailed?.(item, error as Error);

      this.emit("retry:failed", {
        type: MessageEventType.MESSAGE_FAILED,
        timestamp: new Date(),
        data: { item, error, willRetry: shouldRetryAgain },
        metadata: item.originalDeliveryReport.metadata,
      } as MessageEvent);
    }
  }

  private async executeRetry(attempt: RetryAttempt): Promise<any> {
    // This would integrate with the actual message sender
    // For now, simulate the retry operation
    return CoreRetryHandler.execute(
      async () => {
        // Simulate message sending
        if (Math.random() < 0.7) {
          // 70% success rate for retries
          return {
            messageId: attempt.messageId,
            status: "sent",
            sentAt: new Date(),
          };
        } else {
          throw new Error("Retry failed");
        }
      },
      {
        maxAttempts: 1, // We handle retries at a higher level
        initialDelay: 0,
        retryCondition: () => false, // No retries at this level
      },
    );
  }

  private shouldRetry(deliveryReport: DeliveryReport): boolean {
    const { policy } = this.options;

    // Check if status is retryable
    if (!policy.retryableStatuses.includes(deliveryReport.status)) {
      return false;
    }

    // Check if error code is retryable
    // First check top-level error, then latest attempt error
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

    // Check if attempts haven't been exhausted
    return deliveryReport.attempts.length < policy.maxAttempts;
  }

  private async createRetryItem(
    deliveryReport: DeliveryReport,
  ): Promise<RetryQueueItem> {
    const initialDelay = this.calculateRetryDelay(
      deliveryReport.attempts.length,
    );

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
    if (item.status === "exhausted" || item.status === "cancelled") {
      return false;
    }

    // Update the delivery report
    item.originalDeliveryReport = deliveryReport;
    item.updatedAt = new Date();

    // Recalculate next retry time if needed
    if (item.status === "pending") {
      const nextDelay = this.calculateRetryDelay(item.attempts.length);
      item.nextRetryAt = new Date(Date.now() + nextDelay);
    }

    return true;
  }

  private calculateRetryDelay(attemptNumber: number): number {
    const { policy } = this.options;

    let delay = policy.initialDelay * policy.backoffMultiplier ** attemptNumber;
    delay = Math.min(delay, policy.maxDelay);

    // Add jitter if enabled
    if (policy.jitter) {
      const jitterAmount = delay * 0.1; // 10% jitter
      delay += (Math.random() - 0.5) * 2 * jitterAmount;
    }

    return Math.max(0, delay);
  }

  private cleanupQueue(): void {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

    this.retryQueue = this.retryQueue.filter(
      (item) =>
        item.status === "pending" ||
        item.status === "processing" ||
        (item.status === "exhausted" && item.updatedAt > cutoffTime),
    );
  }

  private updateMetrics(): void {
    this.metrics.queueSize = this.retryQueue.length;
    this.metrics.lastRetryAt = new Date();

    // Calculate average retry delay
    const pendingItems = this.retryQueue.filter(
      (item) => item.status === "pending",
    );
    if (pendingItems.length > 0) {
      const totalDelay = pendingItems.reduce((sum, item) => {
        return sum + Math.max(0, item.nextRetryAt.getTime() - Date.now());
      }, 0);
      this.metrics.averageRetryDelay = totalDelay / pendingItems.length;
    }
  }
}
