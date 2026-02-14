/**
 * Circuit breaker pattern implementation
 */

import { KMsgError, KMsgErrorCode } from "../errors";

export interface CircuitBreakerOptions {
  failureThreshold: number;
  timeout: number;
  resetTimeout: number;
  onOpen?: () => void;
  onHalfOpen?: () => void;
  onClose?: () => void;
}

export class CircuitBreaker {
  private state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";
  private failureCount = 0;
  private lastFailureTime = 0;
  private nextAttemptTime = 0;

  constructor(private options: CircuitBreakerOptions) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    const now = Date.now();

    switch (this.state) {
      case "OPEN":
        if (now < this.nextAttemptTime) {
          throw new KMsgError(
            KMsgErrorCode.NETWORK_SERVICE_UNAVAILABLE,
            "Circuit breaker is OPEN",
            { state: this.state, nextAttemptTime: this.nextAttemptTime },
          );
        }
        this.state = "HALF_OPEN";
        this.options.onHalfOpen?.();
        break;

      case "HALF_OPEN":
        break;

      case "CLOSED":
        break;
    }

    try {
      const result = await Promise.race([
        operation(),
        new Promise<never>((_, reject) =>
          setTimeout(
            () =>
              reject(
                new KMsgError(
                  KMsgErrorCode.NETWORK_TIMEOUT,
                  "Circuit breaker timeout",
                  { timeout: this.options.timeout },
                ),
              ),
            this.options.timeout,
          ),
        ),
      ]);

      if (this.state === "HALF_OPEN") {
        this.state = "CLOSED";
        this.failureCount = 0;
        this.options.onClose?.();
      }

      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.options.failureThreshold) {
      this.state = "OPEN";
      this.nextAttemptTime = this.lastFailureTime + this.options.resetTimeout;
      this.options.onOpen?.();
    }
  }

  getState(): string {
    return this.state;
  }

  getFailureCount(): number {
    return this.failureCount;
  }

  reset(): void {
    this.state = "CLOSED";
    this.failureCount = 0;
    this.lastFailureTime = 0;
    this.nextAttemptTime = 0;
  }
}
