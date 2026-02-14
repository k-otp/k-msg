/**
 * Graceful degradation handler
 */

import { KMsgError, KMsgErrorCode } from "../errors";
import { RetryHandler, type RetryOptions } from "./retry-handler";

export class GracefulDegradation {
  private fallbackStrategies: Map<string, () => Promise<any>> = new Map();

  registerFallback<T>(
    operationName: string,
    fallbackFunction: () => Promise<T>,
  ): void {
    this.fallbackStrategies.set(operationName, fallbackFunction);
  }

  async executeWithFallback<T>(
    operationName: string,
    primaryOperation: () => Promise<T>,
    options: {
      timeout?: number;
      retryOptions?: Partial<RetryOptions>;
    } = {},
  ): Promise<T> {
    const timeout = options.timeout || 10000;

    try {
      const result = await Promise.race([
        RetryHandler.execute(primaryOperation, options.retryOptions),
        new Promise<never>((_, reject) =>
          setTimeout(
            () =>
              reject(
                new KMsgError(
                  KMsgErrorCode.NETWORK_TIMEOUT,
                  `Operation ${operationName} timed out`,
                  { operationName, timeout },
                ),
              ),
            timeout,
          ),
        ),
      ]);

      return result;
    } catch (error) {
      console.warn(
        `Primary operation ${operationName} failed, attempting fallback:`,
        error,
      );

      const fallback = this.fallbackStrategies.get(operationName);
      if (fallback) {
        try {
          return await fallback();
        } catch (fallbackError) {
          throw new KMsgError(
            KMsgErrorCode.UNKNOWN_ERROR,
            `Both primary and fallback operations failed for ${operationName}`,
            {
              operationName,
              primaryError: (error as Error).message,
              fallbackError: (fallbackError as Error).message,
              cause: error as Error,
            },
          );
        }
      }

      throw error;
    }
  }
}
