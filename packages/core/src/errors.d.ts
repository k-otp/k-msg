/**
 * Standardized error handling system for K-Message Platform
 */
export declare enum KMessageErrorCode {
    UNKNOWN_ERROR = "UNKNOWN_ERROR",
    VALIDATION_ERROR = "VALIDATION_ERROR",
    CONFIGURATION_ERROR = "CONFIGURATION_ERROR",
    PROVIDER_NOT_FOUND = "PROVIDER_NOT_FOUND",
    PROVIDER_NOT_AVAILABLE = "PROVIDER_NOT_AVAILABLE",
    PROVIDER_AUTHENTICATION_FAILED = "PROVIDER_AUTHENTICATION_FAILED",
    PROVIDER_CONNECTION_FAILED = "PROVIDER_CONNECTION_FAILED",
    PROVIDER_RATE_LIMITED = "PROVIDER_RATE_LIMITED",
    PROVIDER_INSUFFICIENT_BALANCE = "PROVIDER_INSUFFICIENT_BALANCE",
    TEMPLATE_NOT_FOUND = "TEMPLATE_NOT_FOUND",
    TEMPLATE_VALIDATION_FAILED = "TEMPLATE_VALIDATION_FAILED",
    TEMPLATE_CREATION_FAILED = "TEMPLATE_CREATION_FAILED",
    TEMPLATE_MODIFICATION_FAILED = "TEMPLATE_MODIFICATION_FAILED",
    TEMPLATE_DELETION_FAILED = "TEMPLATE_DELETION_FAILED",
    MESSAGE_SEND_FAILED = "MESSAGE_SEND_FAILED",
    MESSAGE_INVALID_PHONE_NUMBER = "MESSAGE_INVALID_PHONE_NUMBER",
    MESSAGE_INVALID_VARIABLES = "MESSAGE_INVALID_VARIABLES",
    MESSAGE_QUOTA_EXCEEDED = "MESSAGE_QUOTA_EXCEEDED",
    MESSAGE_RESERVATION_FAILED = "MESSAGE_RESERVATION_FAILED",
    MESSAGE_CANCELLATION_FAILED = "MESSAGE_CANCELLATION_FAILED",
    NETWORK_TIMEOUT = "NETWORK_TIMEOUT",
    NETWORK_CONNECTION_FAILED = "NETWORK_CONNECTION_FAILED",
    NETWORK_SERVICE_UNAVAILABLE = "NETWORK_SERVICE_UNAVAILABLE",
    API_INVALID_REQUEST = "API_INVALID_REQUEST",
    API_UNAUTHORIZED = "API_UNAUTHORIZED",
    API_FORBIDDEN = "API_FORBIDDEN",
    API_NOT_FOUND = "API_NOT_FOUND",
    API_TOO_MANY_REQUESTS = "API_TOO_MANY_REQUESTS",
    API_INTERNAL_SERVER_ERROR = "API_INTERNAL_SERVER_ERROR"
}
export interface KMessageErrorContext {
    providerId?: string;
    templateCode?: string;
    phoneNumber?: string;
    messageId?: string;
    requestId?: string;
    timestamp?: Date;
    [key: string]: any;
}
export declare class KMessageError extends Error {
    readonly code: KMessageErrorCode;
    readonly context: KMessageErrorContext;
    readonly retryable: boolean;
    readonly statusCode?: number;
    readonly cause?: Error;
    constructor(code: KMessageErrorCode, message: string, context?: KMessageErrorContext, options?: {
        retryable?: boolean;
        statusCode?: number;
        cause?: Error;
    });
    private isRetryableByDefault;
    toJSON(): {
        name: string;
        code: KMessageErrorCode;
        message: string;
        context: KMessageErrorContext;
        retryable: boolean;
        statusCode: number | undefined;
        stack: string | undefined;
    };
}
export declare class ProviderError extends KMessageError {
    constructor(providerId: string, code: KMessageErrorCode, message: string, context?: Omit<KMessageErrorContext, 'providerId'>, options?: {
        retryable?: boolean;
        statusCode?: number;
        cause?: Error;
    });
}
export declare class TemplateError extends KMessageError {
    constructor(templateCode: string, code: KMessageErrorCode, message: string, context?: Omit<KMessageErrorContext, 'templateCode'>, options?: {
        retryable?: boolean;
        statusCode?: number;
        cause?: Error;
    });
}
export declare class MessageError extends KMessageError {
    constructor(phoneNumber: string, code: KMessageErrorCode, message: string, context?: Omit<KMessageErrorContext, 'phoneNumber'>, options?: {
        retryable?: boolean;
        statusCode?: number;
        cause?: Error;
    });
}
/**
 * Error factory functions for common error scenarios
 */
export declare const ErrorFactory: {
    providerNotFound: (providerId: string) => ProviderError;
    providerNotAvailable: (providerId: string, reason?: string) => ProviderError;
    authenticationFailed: (providerId: string, details?: string) => ProviderError;
    templateNotFound: (templateCode: string) => TemplateError;
    invalidPhoneNumber: (phoneNumber: string) => MessageError;
    networkTimeout: (providerId?: string, timeout?: number) => KMessageError;
    rateLimited: (providerId: string, retryAfter?: number) => ProviderError;
    insufficientBalance: (providerId: string, balance?: string) => ProviderError;
    fromHttpStatus: (statusCode: number, message: string, context?: KMessageErrorContext) => KMessageError;
};
/**
 * Result wrapper for operations that can fail
 */
export type Result<T, E = KMessageError> = {
    success: true;
    data: T;
} | {
    success: false;
    error: E;
};
export declare const Result: {
    success: <T>(data: T) => Result<T>;
    failure: <E = KMessageError>(error: E) => Result<never, E>;
    fromPromise: <T>(promise: Promise<T>) => Promise<Result<T>>;
};
/**
 * Error handling utilities
 */
export declare const ErrorUtils: {
    isRetryable: (error: Error) => boolean;
    getStatusCode: (error: Error) => number;
    formatErrorForClient: (error: Error) => {
        code: KMessageErrorCode;
        message: string;
        retryable: boolean;
        context: KMessageErrorContext;
    };
    formatErrorForLogging: (error: Error) => {
        name: string;
        message: string;
        stack: string | undefined;
    } | {
        code: KMessageErrorCode;
        context: KMessageErrorContext;
        retryable: boolean;
        statusCode: number | undefined;
        name: string;
        message: string;
        stack: string | undefined;
    };
};
//# sourceMappingURL=errors.d.ts.map