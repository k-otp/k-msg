import { KMsgError, KMsgErrorCode, RetryHandler } from "@k-msg/core";
import type { KMsg } from "../k-msg";
import {
  type BulkBatchResult,
  type BulkMessageRequest,
  type BulkMessageResult,
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
    batches: any[][],
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
    batchRecipients: any[],
    batchId: string,
  ): Promise<RecipientResult[]> {
    const results: RecipientResult[] = [];
    const maxConcurrency = request.options?.maxConcurrency || 10;

    // Process recipients in parallel with concurrency limit
    const promises: Promise<RecipientResult>[] = [];

    for (let i = 0; i < batchRecipients.length; i += maxConcurrency) {
      const chunk = batchRecipients.slice(i, i + maxConcurrency);

      const chunkPromises = chunk.map((recipient) =>
        this.processRecipient(request, recipient),
      );

      const chunkResults = await Promise.allSettled(chunkPromises);

      for (const result of chunkResults) {
        if (result.status === "fulfilled") {
          results.push(result.value);
        } else {
          // Handle promise rejection
          results.push({
            phoneNumber: "unknown",
            status: MessageStatus.FAILED,
            error: {
              code: "PROCESSING_ERROR",
              message: result.reason?.message || "Unknown processing error",
            },
          });
        }
      }
    }

    return results;
  }

  private async processRecipient(
    request: BulkMessageRequest,
    recipient: any,
  ): Promise<RecipientResult> {
    const retryOptions = {
      maxAttempts: 3,
      initialDelay: 1000,
      backoffMultiplier: 2,
      ...request.options?.retryOptions,
    };

    try {
      const variables = { ...request.commonVariables, ...recipient.variables };

      return await RetryHandler.execute(async () => {
        const result = await this.kmsg.send({
          type: "ALIMTALK",
          to: recipient.phoneNumber,
          from: (request.options as any)?.senderNumber || "",
          templateId: request.templateId,
          variables: variables as Record<string, string>,
        });

        if (result.isSuccess) {
          return {
            phoneNumber: recipient.phoneNumber,
            messageId: result.value.messageId,
            status:
              result.value.status === "SENT"
                ? MessageStatus.SENT
                : MessageStatus.QUEUED,
            metadata: recipient.metadata,
          };
        } else {
          throw result.error;
        }
      }, retryOptions);
    } catch (error) {
      return {
        phoneNumber: recipient.phoneNumber,
        status: MessageStatus.FAILED,
        error: {
          code: error instanceof KMsgError ? error.code : "RECIPIENT_ERROR",
          message: error instanceof Error ? error.message : "Unknown error",
        },
        metadata: recipient.metadata,
      };
    }
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
