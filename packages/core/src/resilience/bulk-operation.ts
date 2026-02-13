/**
 * Bulk operation handler with error recovery
 */

import { KMsgError, KMsgErrorCode } from '../errors';
import { RetryHandler, RetryOptions } from './retry-handler';

export interface BulkOperationOptions {
    concurrency: number;
    retryOptions: RetryOptions;
    failFast: boolean;
    onProgress?: (completed: number, total: number, failed: number) => void;
}

export class BulkOperationHandler {
    static async execute<T, R>(
        items: T[],
        operation: (item: T) => Promise<R>,
        options: Partial<BulkOperationOptions> = {}
    ): Promise<{
        successful: { item: T; result: R }[];
        failed: { item: T; error: Error }[];
        summary: {
            total: number;
            successful: number;
            failed: number;
            duration: number;
        };
    }> {
        const opts: BulkOperationOptions = {
            concurrency: 5,
            retryOptions: {
                maxAttempts: 3,
                initialDelay: 1000,
                maxDelay: 10000,
                backoffMultiplier: 2,
                jitter: true
            },
            failFast: false,
            ...options
        };

        const startTime = Date.now();
        const successful: { item: T; result: R }[] = [];
        const failed: { item: T; error: Error }[] = [];
        let completed = 0;

        const retryableOperation = RetryHandler.createRetryableFunction(
            operation,
            opts.retryOptions
        );

        const batches = this.createBatches(items, opts.concurrency);

        for (const batch of batches) {
            const batchPromises = batch.map(async (item) => {
                try {
                    const result = await retryableOperation(item);
                    successful.push({ item, result });
                } catch (error) {
                    failed.push({ item, error: error as Error });

                    if (opts.failFast) {
                        throw new KMsgError(
                            KMsgErrorCode.MESSAGE_SEND_FAILED,
                            `Bulk operation failed fast after ${failed.length} failures`,
                            { totalItems: items.length, failedCount: failed.length }
                        );
                    }
                } finally {
                    completed++;
                    opts.onProgress?.(completed, items.length, failed.length);
                }
            });

            await Promise.allSettled(batchPromises);

            if (opts.failFast && failed.length > 0) {
                break;
            }
        }

        const duration = Date.now() - startTime;

        return {
            successful,
            failed,
            summary: {
                total: items.length,
                successful: successful.length,
                failed: failed.length,
                duration
            }
        };
    }

    private static createBatches<T>(items: T[], batchSize: number): T[][] {
        const batches: T[][] = [];
        for (let i = 0; i < items.length; i += batchSize) {
            batches.push(items.slice(i, i + batchSize));
        }
        return batches;
    }
}
