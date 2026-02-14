/**
 * Error recovery utilities - combines multiple recovery patterns
 */

import { KMsgError, KMsgErrorCode } from "../errors";
import { CircuitBreaker, type CircuitBreakerOptions } from "./circuit-breaker";
import { RateLimiter } from "./rate-limiter";
import { RetryHandler, type RetryOptions } from "./retry-handler";

export const ErrorRecovery = {
  /**
   * Create a resilient function that combines multiple recovery patterns
   */
  createResilientFunction<T extends any[], R>(
    func: (...args: T) => Promise<R>,
    options: {
      retryOptions?: Partial<RetryOptions>;
      circuitBreaker?: CircuitBreakerOptions;
      rateLimiter?: { maxRequests: number; windowMs: number };
      timeout?: number;
      fallback?: (...args: T) => Promise<R>;
    } = {},
  ): (...args: T) => Promise<R> {
    let circuitBreaker: CircuitBreaker | undefined;
    let rateLimiter: RateLimiter | undefined;

    if (options.circuitBreaker) {
      circuitBreaker = new CircuitBreaker(options.circuitBreaker);
    }

    if (options.rateLimiter) {
      rateLimiter = new RateLimiter(
        options.rateLimiter.maxRequests,
        options.rateLimiter.windowMs,
      );
    }

    return async (...args: T): Promise<R> => {
      if (rateLimiter) {
        await rateLimiter.acquire();
      }

      const operation = async () => {
        const wrappedFunc = async () => {
          if (options.timeout) {
            return Promise.race([
              func(...args),
              new Promise<never>((_, reject) =>
                setTimeout(
                  () =>
                    reject(
                      new KMsgError(
                        KMsgErrorCode.NETWORK_TIMEOUT,
                        "Operation timed out",
                        { timeout: options.timeout },
                      ),
                    ),
                  options.timeout,
                ),
              ),
            ]);
          }
          return func(...args);
        };

        if (circuitBreaker) {
          return circuitBreaker.execute(wrappedFunc);
        }
        return wrappedFunc();
      };

      try {
        return await RetryHandler.execute(operation, options.retryOptions);
      } catch (error) {
        if (options.fallback) {
          console.warn("Primary operation failed, using fallback:", error);
          return options.fallback(...args);
        }
        throw error;
      }
    };
  },
};
