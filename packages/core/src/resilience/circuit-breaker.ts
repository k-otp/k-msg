/**
 * Circuit breaker pattern implementation
 */

import { KMsgError, KMsgErrorCode } from "../errors";

export interface CircuitBreakerOptions {
  /** Consecutive failures that open the circuit. */
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
  // Identifies the half-open trial in flight, so a trial that outlives a
  // reset() cannot release a later trial's slot.
  private trial: symbol | undefined;

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

    // Half-open admits a single trial call; the rest fail fast until it
    // settles, so a recovering service is not hit by every waiting caller.
    let trial: symbol | undefined;
    if (this.state === "HALF_OPEN") {
      if (this.trial) {
        throw new KMsgError(
          KMsgErrorCode.NETWORK_SERVICE_UNAVAILABLE,
          "Circuit breaker is HALF_OPEN and a trial call is in flight",
          { state: this.state },
        );
      }
      trial = Symbol("trial");
      this.trial = trial;
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const result = await Promise.race([
        operation(),
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () =>
              reject(
                new KMsgError(
                  KMsgErrorCode.NETWORK_TIMEOUT,
                  "Circuit breaker timeout",
                  { timeout: this.options.timeout },
                ),
              ),
            this.options.timeout,
          );
        }),
      ]);

      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    } finally {
      // A pending timer would keep the event loop alive for `timeout` after
      // every call.
      if (timer !== undefined) clearTimeout(timer);
      if (trial && this.trial === trial) this.trial = undefined;
    }
  }

  private recordSuccess(): void {
    if (this.state === "HALF_OPEN") {
      this.state = "CLOSED";
      this.failureCount = 0;
      this.options.onClose?.();
      return;
    }
    // Only consecutive failures count toward the threshold.
    if (this.state === "CLOSED") {
      this.failureCount = 0;
    }
  }

  private recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (
      this.state === "HALF_OPEN" ||
      this.failureCount >= this.options.failureThreshold
    ) {
      const wasOpen = this.state === "OPEN";
      this.state = "OPEN";
      this.nextAttemptTime = this.lastFailureTime + this.options.resetTimeout;
      if (!wasOpen) this.options.onOpen?.();
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
    this.trial = undefined;
  }
}
