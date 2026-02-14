import {
  ErrorUtils,
  fail,
  KMsgError,
  KMsgErrorCode,
  type RetryOptions,
  type Result,
  type SendInput,
  type SendResult,
} from "@k-msg/core";
import type { KMsg } from "../k-msg";
import {
  type BulkBatchResult,
  type BulkMessageRequest,
  type BulkMessageResult,
  type BulkRecipient,
  MessageStatus,
  type RecipientResult,
} from "../types/message.types";

export class BulkMessageSender {
  private kmsg: KMsg;
  private activeBulkJobs: Map<string, BulkJob> = new Map();

  constructor(kmsg: KMsg) {
    this.kmsg = kmsg;
  }

  async sendBulk(request: BulkMessageRequest): Promise<BulkMessageResult> {
    const requestId = this.generateRequestId();
    const batchSize = request.options?.batchSize || 100;
    const batchDelay = request.options?.batchDelay || 1000;

    // Split recipients into batches
    const batches = this.createBatches(request.recipients, batchSize);

    const bulkResult: BulkMessageResult = {
      requestId,
      totalRecipients: request.recipients.length,
      batches: [],
      summary: {
        queued: request.recipients.length,
        sent: 0,
        failed: 0,
        processing: 0,
      },
      createdAt: new Date(),
    };

    // Create bulk job for tracking
    const bulkJob: BulkJob = {
      id: requestId,
      request,
      result: bulkResult,
      status: "processing",
      createdAt: new Date(),
    };

    this.activeBulkJobs.set(requestId, bulkJob);

    // Process batches asynchronously
    this.processBatchesAsync(bulkJob, batches, batchDelay);

    return bulkResult;
  }

  private async processBatchesAsync(
    bulkJob: BulkJob,
    batches: BulkRecipient[][],
    batchDelay: number,
  ): Promise<void> {
    try {
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const batchId = `${bulkJob.id}_batch_${i + 1}`;

        const batchResult: BulkBatchResult = {
          batchId,
          batchNumber: i + 1,
          recipients: [],
          status: "processing",
          createdAt: new Date(),
        };

        bulkJob.result.batches.push(batchResult);
        bulkJob.result.summary.processing += batch.length;
        bulkJob.result.summary.queued -= batch.length;

        try {
          // Process batch
          const batchRecipients = await this.processBatch(
            bulkJob.request,
            batch,
            batchId,
          );

          batchResult.recipients = batchRecipients;
          batchResult.status = "completed";
          batchResult.completedAt = new Date();

          // Update summary
          const sent = batchRecipients.filter(
            (r) => r.status === MessageStatus.SENT,
          ).length;
          const failed = batchRecipients.filter(
            (r) => r.status === MessageStatus.FAILED,
          ).length;

          bulkJob.result.summary.sent += sent;
          bulkJob.result.summary.failed += failed;
          bulkJob.result.summary.processing -= batch.length;
        } catch (error) {
          batchResult.status = "failed";
          batchResult.completedAt = new Date();

          // Mark all recipients in this batch as failed
          batchResult.recipients = batch.map((recipient) => ({
            phoneNumber: recipient.phoneNumber,
            status: MessageStatus.FAILED,
            error: {
              code: "BATCH_ERROR",
              message:
                error instanceof Error
                  ? error.message
                  : "Batch processing failed",
            },
            metadata: recipient.metadata,
          }));

          bulkJob.result.summary.failed += batch.length;
          bulkJob.result.summary.processing -= batch.length;
        }

        // Add delay between batches (except for the last one)
        if (i < batches.length - 1) {
          await this.delay(batchDelay);
        }
      }

      bulkJob.status = "completed";
      bulkJob.result.completedAt = new Date();
    } catch (error) {
      bulkJob.status = "failed";
      bulkJob.result.completedAt = new Date();
    }
  }

  private async processBatch(
    request: BulkMessageRequest,
    batchRecipients: BulkRecipient[],
    batchId: string,
  ): Promise<RecipientResult[]> {
    const maxConcurrency = request.options?.maxConcurrency || 10;
    void batchId;

    const type = request.type ?? "ALIMTALK";
    const from = request.options?.from || request.options?.senderNumber;

    const inputs: SendInput[] = batchRecipients.map((recipient) => {
      const variables = {
        ...(request.commonVariables || {}),
        ...(recipient.variables || {}),
      };

      if (type === "NSA") {
        return {
          type: "NSA",
          to: recipient.phoneNumber,
          ...(from ? { from } : {}),
          templateCode: request.templateCode,
          variables,
        };
      }

      if (type === "RCS_TPL" || type === "RCS_ITPL" || type === "RCS_LTPL") {
        return {
          type,
          to: recipient.phoneNumber,
          ...(from ? { from } : {}),
          templateCode: request.templateCode,
          variables,
        };
      }

      return {
        type: "ALIMTALK",
        to: recipient.phoneNumber,
        ...(from ? { from } : {}),
        templateCode: request.templateCode,
        variables,
      };
    });

    const results = await this.sendManyWithRetry(inputs, maxConcurrency, {
      ...request.options?.retryOptions,
    });

    return results.map((result, idx) =>
      this.toRecipientResult(batchRecipients[idx]!, result),
    );
  }

  private async sendManyWithRetry(
    inputs: SendInput[],
    concurrency: number,
    retryOptions: Partial<RetryOptions> = {},
  ): Promise<Array<Result<SendResult, KMsgError>>> {
    if (inputs.length === 0) return [];

    const maxAttempts =
      typeof retryOptions.maxAttempts === "number" && retryOptions.maxAttempts > 0
        ? Math.floor(retryOptions.maxAttempts)
        : 3;
    const initialDelay =
      typeof retryOptions.initialDelay === "number" && retryOptions.initialDelay > 0
        ? retryOptions.initialDelay
        : 1000;
    const maxDelay =
      typeof retryOptions.maxDelay === "number" && retryOptions.maxDelay > 0
        ? retryOptions.maxDelay
        : 30000;
    const backoffMultiplier =
      typeof retryOptions.backoffMultiplier === "number" &&
      retryOptions.backoffMultiplier > 1
        ? retryOptions.backoffMultiplier
        : 2;
    const jitter =
      typeof retryOptions.jitter === "boolean" ? retryOptions.jitter : true;
    const retryCondition =
      retryOptions.retryCondition ||
      ((error: Error) => ErrorUtils.isRetryable(error));

    const safeConcurrency =
      typeof concurrency === "number" && concurrency > 0
        ? Math.floor(concurrency)
        : 10;

    const results: Array<Result<SendResult, KMsgError>> = new Array(inputs.length);
    let pending = inputs.map((_, i) => i);
    let delayMs = initialDelay;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      if (pending.length === 0) break;

      const attemptInputs = pending.map((idx) => inputs[idx]!);
      const attemptResults = await this.kmsg.sendMany(attemptInputs, {
        concurrency: safeConcurrency,
      });

      const nextPending: number[] = [];
      for (let i = 0; i < attemptResults.length; i += 1) {
        const originalIdx = pending[i]!;
        const result = attemptResults[i]!;

        if (result.isSuccess) {
          results[originalIdx] = result;
          continue;
        }

        let shouldRetry = false;
        if (attempt < maxAttempts) {
          try {
            shouldRetry = retryCondition(result.error, attempt);
          } catch {
            shouldRetry = false;
          }
        }

        if (shouldRetry) {
          retryOptions.onRetry?.(result.error, attempt);
          nextPending.push(originalIdx);
        } else {
          results[originalIdx] = result;
        }
      }

      pending = nextPending;
      if (pending.length === 0) break;
      if (attempt >= maxAttempts) break;

      const actualDelay = jitter
        ? delayMs + Math.random() * delayMs * 0.1
        : delayMs;
      await this.delay(actualDelay);
      delayMs = Math.min(delayMs * backoffMultiplier, maxDelay);
    }

    // Safety fill (should not happen; defensive in case of unexpected sendMany behavior).
    for (let i = 0; i < results.length; i += 1) {
      if (results[i] === undefined) {
        results[i] = fail(
          new KMsgError(
            KMsgErrorCode.MESSAGE_SEND_FAILED,
            "Bulk send failed (no result)",
          ),
        );
      }
    }

    return results;
  }

  private toRecipientResult(
    recipient: BulkRecipient,
    result: Result<SendResult, KMsgError>,
  ): RecipientResult {
    if (result.isSuccess) {
      const status =
        result.value.status === "SENT"
          ? MessageStatus.SENT
          : result.value.status === "FAILED"
            ? MessageStatus.FAILED
            : MessageStatus.QUEUED;

      return {
        phoneNumber: recipient.phoneNumber,
        messageId: result.value.messageId,
        status,
        metadata: recipient.metadata,
      };
    }

    return {
      phoneNumber: recipient.phoneNumber,
      status: MessageStatus.FAILED,
      error: {
        code: result.error.code,
        message: result.error.message,
        details: result.error.details,
      },
      metadata: recipient.metadata,
    };
  }

  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }

    return batches;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private generateRequestId(): string {
    return `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async getBulkStatus(requestId: string): Promise<BulkMessageResult | null> {
    const job = this.activeBulkJobs.get(requestId);
    return job ? job.result : null;
  }

  async cancelBulkJob(requestId: string): Promise<boolean> {
    const job = this.activeBulkJobs.get(requestId);
    if (!job) {
      return false;
    }

    job.status = "cancelled";

    // Cancel pending batches
    for (const batch of job.result.batches) {
      if (batch.status === "pending" || batch.status === "processing") {
        batch.status = "failed";
        batch.completedAt = new Date();
      }
    }

    return true;
  }

  async retryFailedBatch(
    requestId: string,
    batchId: string,
  ): Promise<BulkBatchResult | null> {
    const job = this.activeBulkJobs.get(requestId);
    if (!job) {
      return null;
    }

    const batch = job.result.batches.find((b) => b.batchId === batchId);
    if (!batch || batch.status !== "failed") {
      return null;
    }

    // Reset batch status
    batch.status = "processing";
    batch.createdAt = new Date();
    delete batch.completedAt;

    try {
      // Extract failed recipients for retry
      const failedRecipients = batch.recipients
        .filter((r) => r.status === MessageStatus.FAILED)
        .map((r) => ({
          phoneNumber: r.phoneNumber,
          variables: {},
          metadata: r.metadata,
        }));

      const retryResults = await this.processBatch(
        job.request,
        failedRecipients,
        batchId,
      );

      batch.recipients = retryResults;
      batch.status = "completed";
      batch.completedAt = new Date();

      return batch;
    } catch (error) {
      batch.status = "failed";
      batch.completedAt = new Date();
      return batch;
    }
  }

  cleanup(): void {
    // Remove completed jobs older than 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    for (const [id, job] of this.activeBulkJobs) {
      if (job.status === "completed" && job.createdAt < oneDayAgo) {
        this.activeBulkJobs.delete(id);
      }
    }
  }
}

interface BulkJob {
  id: string;
  request: BulkMessageRequest;
  result: BulkMessageResult;
  status: "processing" | "completed" | "failed" | "cancelled";
  createdAt: Date;
}
