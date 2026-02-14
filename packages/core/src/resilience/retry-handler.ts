/**
 * Retry options and handler for K-Message Platform
 */

import { ErrorUtils } from "../errors";

export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  jitter?: boolean;
  retryCondition?: (error: Error, attempt: number) => boolean;
  onRetry?: (error: Error, attempt: number) => void;
}

/**
 * Exponential backoff retry mechanism
 */
export class RetryHandler {
  private static defaultOptions: RetryOptions = {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    jitter: true,
    retryCondition: (error) => ErrorUtils.isRetryable(error),
  };

  static async execute<T>(
    operation: () => Promise<T>,
    options: Partial<RetryOptions> = {},
  ): Promise<T> {
    const opts = {
      ...RetryHandler.defaultOptions,
      ...options,
    } as Required<RetryOptions>;
    let lastError: Error;
    let delay = opts.initialDelay;

    for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (
          attempt === opts.maxAttempts ||
          !opts.retryCondition!(lastError, attempt)
        ) {
          throw lastError;
        }

        const actualDelay = opts.jitter
          ? delay + Math.random() * delay * 0.1
          : delay;

        opts.onRetry?.(lastError, attempt);

        await new Promise((resolve) => setTimeout(resolve, actualDelay));

        delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelay);
      }
    }

    throw lastError!;
  }

  static createRetryableFunction<T extends any[], R>(
    func: (...args: T) => Promise<R>,
    options: Partial<RetryOptions> = {},
  ): (...args: T) => Promise<R> {
    return async (...args: T) => {
      return RetryHandler.execute(() => func(...args), options);
    };
  }
}
