import type { ProviderMiddleware } from '../interfaces';
export declare function createRetryMiddleware(options: {
    maxRetries: number;
    retryDelay: number;
    retryableErrors?: string[];
    retryableStatusCodes?: number[];
}): ProviderMiddleware;
export declare function createRateLimitMiddleware(options: {
    messagesPerSecond?: number;
    messagesPerMinute?: number;
    messagesPerHour?: number;
    messagesPerDay?: number;
    strategy?: 'sliding-window' | 'fixed-window';
}): ProviderMiddleware;
export declare function createLoggingMiddleware(options: {
    logger: any;
    logLevel?: string;
}): ProviderMiddleware;
export declare function createMetricsMiddleware(options: {
    collector: any;
    labels?: Record<string, string>;
}): ProviderMiddleware;
export declare function createCircuitBreakerMiddleware(options: {
    threshold: number;
    timeout: number;
    resetTimeout: number;
}): ProviderMiddleware;
