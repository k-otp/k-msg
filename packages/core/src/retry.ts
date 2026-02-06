/**
 * Error recovery and retry patterns for K-Message Platform
 */

import { KMsgError, KMsgErrorCode, ErrorUtils } from './errors';

export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  jitter?: boolean;
  retryCondition?: (error: Error, attempt: number) => boolean;
  onRetry?: (error: Error, attempt: number) => void;
}

export interface CircuitBreakerOptions {
  failureThreshold: number;
  timeout: number;
  resetTimeout: number;
  onOpen?: () => void;
  onHalfOpen?: () => void;
  onClose?: () => void;
}

export interface BulkOperationOptions {
  concurrency: number;
  retryOptions: RetryOptions;
  failFast: boolean;
  onProgress?: (completed: number, total: number, failed: number) => void;
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
    retryCondition: (error) => ErrorUtils.isRetryable(error)
  };

  static async execute<T>(
    operation: () => Promise<T>,
    options: Partial<RetryOptions> = {}
  ): Promise<T> {
    const opts = { ...this.defaultOptions, ...options } as Required<RetryOptions>;
    let lastError: Error;
    let delay = opts.initialDelay;

    for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Check if we should retry
        if (attempt === opts.maxAttempts || !opts.retryCondition!(lastError, attempt)) {
          throw lastError;
        }

        // Calculate delay with optional jitter
        const actualDelay = opts.jitter
          ? delay + Math.random() * delay * 0.1
          : delay;

        // Call retry callback if provided
        opts.onRetry?.(lastError, attempt);

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, actualDelay));

        // Increase delay for next attempt
        delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelay);
      }
    }

    throw lastError!;
  }

  static createRetryableFunction<T extends any[], R>(
    func: (...args: T) => Promise<R>,
    options: Partial<RetryOptions> = {}
  ): (...args: T) => Promise<R> {
    return async (...args: T) => {
      return this.execute(() => func(...args), options);
    };
  }
}

/**
 * Circuit breaker pattern implementation
 */
export class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime = 0;
  private nextAttemptTime = 0;

  constructor(private options: CircuitBreakerOptions) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    const now = Date.now();

    switch (this.state) {
      case 'OPEN':
        if (now < this.nextAttemptTime) {
          throw new KMsgError(
            KMsgErrorCode.NETWORK_SERVICE_UNAVAILABLE,
            'Circuit breaker is OPEN',
            { state: this.state, nextAttemptTime: this.nextAttemptTime }
          );
        }
        this.state = 'HALF_OPEN';
        this.options.onHalfOpen?.();
        break;

      case 'HALF_OPEN':
        // Allow one request to test if service is back
        break;

      case 'CLOSED':
        // Normal operation
        break;
    }

    try {
      const result = await Promise.race([
        operation(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(
            new KMsgError(
              KMsgErrorCode.NETWORK_TIMEOUT,
              'Circuit breaker timeout',
              { timeout: this.options.timeout }
            )
          ), this.options.timeout)
        )
      ]);

      // Success - close circuit if it was half-open
      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED';
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
      this.state = 'OPEN';
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
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.lastFailureTime = 0;
    this.nextAttemptTime = 0;
  }
}

/**
 * Bulk operation handler with error recovery
 */
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

    // Create operation with retry
    const retryableOperation = RetryHandler.createRetryableFunction(
      operation,
      opts.retryOptions
    );

    // Process items in batches with controlled concurrency
    const batches = this.createBatches(items, opts.concurrency);

    for (const batch of batches) {
      const batchPromises = batch.map(async (item) => {
        try {
          const result = await retryableOperation(item);
          successful.push({ item, result });
        } catch (error) {
          failed.push({ item, error: error as Error });

          // Fail fast if configured
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

      // Early termination if fail fast is enabled and we have failures
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

/**
 * Rate limiter for API calls
 */
export class RateLimiter {
  private requests: number[] = [];

  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}

  async acquire(): Promise<void> {
    const now = Date.now();
    
    // Remove old requests outside the window
    this.requests = this.requests.filter(time => now - time < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.windowMs - (now - oldestRequest);
      
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return this.acquire(); // Retry after waiting
      }
    }

    this.requests.push(now);
  }

  canMakeRequest(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    return this.requests.length < this.maxRequests;
  }

  getRemainingRequests(): number {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    return Math.max(0, this.maxRequests - this.requests.length);
  }
}

/**
 * Health check monitor with automatic recovery
 */
export class HealthMonitor {
  private healthStatus: Map<string, boolean> = new Map();
  private lastCheck: Map<string, number> = new Map();
  private checkInterval: number;
  private intervalId?: NodeJS.Timeout;

  constructor(
    private services: Map<string, () => Promise<boolean>>,
    checkIntervalMs: number = 30000
  ) {
    this.checkInterval = checkIntervalMs;
  }

  start(): void {
    this.intervalId = setInterval(() => {
      this.checkAllServices();
    }, this.checkInterval);

    // Initial check
    this.checkAllServices();
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  private async checkAllServices(): Promise<void> {
    const checks = Array.from(this.services.entries()).map(
      async ([serviceName, healthCheck]) => {
        try {
          const isHealthy = await healthCheck();
          const wasHealthy = this.healthStatus.get(serviceName);
          
          this.healthStatus.set(serviceName, isHealthy);
          this.lastCheck.set(serviceName, Date.now());

          // Log status changes
          if (wasHealthy !== undefined && wasHealthy !== isHealthy) {
            console.log(`Service ${serviceName} status changed: ${wasHealthy ? 'healthy' : 'unhealthy'} -> ${isHealthy ? 'healthy' : 'unhealthy'}`);
          }
        } catch (error) {
          this.healthStatus.set(serviceName, false);
          this.lastCheck.set(serviceName, Date.now());
          console.error(`Health check failed for ${serviceName}:`, error);
        }
      }
    );

    await Promise.allSettled(checks);
  }

  getServiceHealth(serviceName: string): boolean | undefined {
    return this.healthStatus.get(serviceName);
  }

  getAllHealth(): Record<string, boolean> {
    return Object.fromEntries(this.healthStatus);
  }

  isServiceHealthy(serviceName: string): boolean {
    return this.healthStatus.get(serviceName) === true;
  }

  getLastCheckTime(serviceName: string): number | undefined {
    return this.lastCheck.get(serviceName);
  }
}

/**
 * Graceful degradation handler
 */
export class GracefulDegradation {
  private fallbackStrategies: Map<string, () => Promise<any>> = new Map();

  registerFallback<T>(
    operationName: string,
    fallbackFunction: () => Promise<T>
  ): void {
    this.fallbackStrategies.set(operationName, fallbackFunction);
  }

  async executeWithFallback<T>(
    operationName: string,
    primaryOperation: () => Promise<T>,
    options: {
      timeout?: number;
      retryOptions?: Partial<RetryOptions>;
    } = {}
  ): Promise<T> {
    const timeout = options.timeout || 10000;
    
    try {
      // Try primary operation with timeout
      const result = await Promise.race([
        RetryHandler.execute(primaryOperation, options.retryOptions),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(
            new KMsgError(
              KMsgErrorCode.NETWORK_TIMEOUT,
              `Operation ${operationName} timed out`,
              { operationName, timeout }
            )
          ), timeout)
        )
      ]);

      return result;
    } catch (error) {
      console.warn(`Primary operation ${operationName} failed, attempting fallback:`, error);

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
              cause: error as Error
            }
          );
        }
      }

      throw error;
    }
  }
}

/**
 * Error recovery utilities
 */
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
    } = {}
  ): (...args: T) => Promise<R> {
    let circuitBreaker: CircuitBreaker | undefined;
    let rateLimiter: RateLimiter | undefined;

    if (options.circuitBreaker) {
      circuitBreaker = new CircuitBreaker(options.circuitBreaker);
    }

    if (options.rateLimiter) {
      rateLimiter = new RateLimiter(
        options.rateLimiter.maxRequests,
        options.rateLimiter.windowMs
      );
    }

    return async (...args: T): Promise<R> => {
      // Apply rate limiting
      if (rateLimiter) {
        await rateLimiter.acquire();
      }

      const operation = async () => {
        const wrappedFunc = async () => {
          if (options.timeout) {
            return Promise.race([
              func(...args),
              new Promise<never>((_, reject) =>
                setTimeout(() => reject(
                  new KMsgError(
                    KMsgErrorCode.NETWORK_TIMEOUT,
                    'Operation timed out',
                    { timeout: options.timeout }
                  )
                ), options.timeout)
              )
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
          console.warn('Primary operation failed, using fallback:', error);
          return options.fallback(...args);
        }
        throw error;
      }
    };
  }
};