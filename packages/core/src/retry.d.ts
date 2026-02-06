/**
 * Error recovery and retry patterns for K-Message Platform
 */
export interface RetryOptions {
    maxAttempts: number;
    initialDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
    jitter: boolean;
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
export declare class RetryHandler {
    private static defaultOptions;
    static execute<T>(operation: () => Promise<T>, options?: Partial<RetryOptions>): Promise<T>;
    static createRetryableFunction<T extends any[], R>(func: (...args: T) => Promise<R>, options?: Partial<RetryOptions>): (...args: T) => Promise<R>;
}
/**
 * Circuit breaker pattern implementation
 */
export declare class CircuitBreaker {
    private options;
    private state;
    private failureCount;
    private lastFailureTime;
    private nextAttemptTime;
    constructor(options: CircuitBreakerOptions);
    execute<T>(operation: () => Promise<T>): Promise<T>;
    private recordFailure;
    getState(): string;
    getFailureCount(): number;
    reset(): void;
}
/**
 * Bulk operation handler with error recovery
 */
export declare class BulkOperationHandler {
    static execute<T, R>(items: T[], operation: (item: T) => Promise<R>, options?: Partial<BulkOperationOptions>): Promise<{
        successful: {
            item: T;
            result: R;
        }[];
        failed: {
            item: T;
            error: Error;
        }[];
        summary: {
            total: number;
            successful: number;
            failed: number;
            duration: number;
        };
    }>;
    private static createBatches;
}
/**
 * Rate limiter for API calls
 */
export declare class RateLimiter {
    private maxRequests;
    private windowMs;
    private requests;
    constructor(maxRequests: number, windowMs: number);
    acquire(): Promise<void>;
    canMakeRequest(): boolean;
    getRemainingRequests(): number;
}
/**
 * Health check monitor with automatic recovery
 */
export declare class HealthMonitor {
    private services;
    private healthStatus;
    private lastCheck;
    private checkInterval;
    private intervalId?;
    constructor(services: Map<string, () => Promise<boolean>>, checkIntervalMs?: number);
    start(): void;
    stop(): void;
    private checkAllServices;
    getServiceHealth(serviceName: string): boolean | undefined;
    getAllHealth(): Record<string, boolean>;
    isServiceHealthy(serviceName: string): boolean;
    getLastCheckTime(serviceName: string): number | undefined;
}
/**
 * Graceful degradation handler
 */
export declare class GracefulDegradation {
    private fallbackStrategies;
    registerFallback<T>(operationName: string, fallbackFunction: () => Promise<T>): void;
    executeWithFallback<T>(operationName: string, primaryOperation: () => Promise<T>, options?: {
        timeout?: number;
        retryOptions?: Partial<RetryOptions>;
    }): Promise<T>;
}
/**
 * Error recovery utilities
 */
export declare const ErrorRecovery: {
    /**
     * Create a resilient function that combines multiple recovery patterns
     */
    createResilientFunction<T extends any[], R>(func: (...args: T) => Promise<R>, options?: {
        retryOptions?: Partial<RetryOptions>;
        circuitBreaker?: CircuitBreakerOptions;
        rateLimiter?: {
            maxRequests: number;
            windowMs: number;
        };
        timeout?: number;
        fallback?: (...args: T) => Promise<R>;
    }): (...args: T) => Promise<R>;
};
//# sourceMappingURL=retry.d.ts.map