/**
 * Standardized error handling system for K-Message Platform
 */

export enum KMessageErrorCode {
  // General errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  
  // Provider errors
  PROVIDER_NOT_FOUND = 'PROVIDER_NOT_FOUND',
  PROVIDER_NOT_AVAILABLE = 'PROVIDER_NOT_AVAILABLE',
  PROVIDER_AUTHENTICATION_FAILED = 'PROVIDER_AUTHENTICATION_FAILED',
  PROVIDER_CONNECTION_FAILED = 'PROVIDER_CONNECTION_FAILED',
  PROVIDER_RATE_LIMITED = 'PROVIDER_RATE_LIMITED',
  PROVIDER_INSUFFICIENT_BALANCE = 'PROVIDER_INSUFFICIENT_BALANCE',
  
  // Template errors
  TEMPLATE_NOT_FOUND = 'TEMPLATE_NOT_FOUND',
  TEMPLATE_VALIDATION_FAILED = 'TEMPLATE_VALIDATION_FAILED',
  TEMPLATE_CREATION_FAILED = 'TEMPLATE_CREATION_FAILED',
  TEMPLATE_MODIFICATION_FAILED = 'TEMPLATE_MODIFICATION_FAILED',
  TEMPLATE_DELETION_FAILED = 'TEMPLATE_DELETION_FAILED',
  
  // Message errors
  MESSAGE_SEND_FAILED = 'MESSAGE_SEND_FAILED',
  MESSAGE_INVALID_PHONE_NUMBER = 'MESSAGE_INVALID_PHONE_NUMBER',
  MESSAGE_INVALID_VARIABLES = 'MESSAGE_INVALID_VARIABLES',
  MESSAGE_QUOTA_EXCEEDED = 'MESSAGE_QUOTA_EXCEEDED',
  MESSAGE_RESERVATION_FAILED = 'MESSAGE_RESERVATION_FAILED',
  MESSAGE_CANCELLATION_FAILED = 'MESSAGE_CANCELLATION_FAILED',
  
  // Network errors
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  NETWORK_CONNECTION_FAILED = 'NETWORK_CONNECTION_FAILED',
  NETWORK_SERVICE_UNAVAILABLE = 'NETWORK_SERVICE_UNAVAILABLE',
  
  // API errors
  API_INVALID_REQUEST = 'API_INVALID_REQUEST',
  API_UNAUTHORIZED = 'API_UNAUTHORIZED',
  API_FORBIDDEN = 'API_FORBIDDEN',
  API_NOT_FOUND = 'API_NOT_FOUND',
  API_TOO_MANY_REQUESTS = 'API_TOO_MANY_REQUESTS',
  API_INTERNAL_SERVER_ERROR = 'API_INTERNAL_SERVER_ERROR'
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

export class KMessageError extends Error {
  public readonly code: KMessageErrorCode;
  public readonly context: KMessageErrorContext;
  public readonly retryable: boolean;
  public readonly statusCode?: number;
  public readonly cause?: Error;

  constructor(
    code: KMessageErrorCode,
    message: string,
    context: KMessageErrorContext = {},
    options: {
      retryable?: boolean;
      statusCode?: number;
      cause?: Error;
    } = {}
  ) {
    super(message);
    this.name = 'KMessageError';
    this.code = code;
    this.context = {
      ...context,
      timestamp: context.timestamp || new Date()
    };
    this.retryable = options.retryable ?? this.isRetryableByDefault(code);
    this.statusCode = options.statusCode;
    this.cause = options.cause;

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, KMessageError);
    }
  }

  private isRetryableByDefault(code: KMessageErrorCode): boolean {
    const retryableCodes = [
      KMessageErrorCode.NETWORK_TIMEOUT,
      KMessageErrorCode.NETWORK_CONNECTION_FAILED,
      KMessageErrorCode.NETWORK_SERVICE_UNAVAILABLE,
      KMessageErrorCode.PROVIDER_CONNECTION_FAILED,
      KMessageErrorCode.PROVIDER_RATE_LIMITED,
      KMessageErrorCode.API_TOO_MANY_REQUESTS,
      KMessageErrorCode.API_INTERNAL_SERVER_ERROR
    ];
    return retryableCodes.includes(code);
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context,
      retryable: this.retryable,
      statusCode: this.statusCode,
      stack: this.stack
    };
  }
}

export class ProviderError extends KMessageError {
  constructor(
    providerId: string,
    code: KMessageErrorCode,
    message: string,
    context: Omit<KMessageErrorContext, 'providerId'> = {},
    options: {
      retryable?: boolean;
      statusCode?: number;
      cause?: Error;
    } = {}
  ) {
    super(code, message, { ...context, providerId }, options);
    this.name = 'ProviderError';
  }
}

export class TemplateError extends KMessageError {
  constructor(
    templateCode: string,
    code: KMessageErrorCode,
    message: string,
    context: Omit<KMessageErrorContext, 'templateCode'> = {},
    options: {
      retryable?: boolean;
      statusCode?: number;
      cause?: Error;
    } = {}
  ) {
    super(code, message, { ...context, templateCode }, options);
    this.name = 'TemplateError';
  }
}

export class MessageError extends KMessageError {
  constructor(
    phoneNumber: string,
    code: KMessageErrorCode,
    message: string,
    context: Omit<KMessageErrorContext, 'phoneNumber'> = {},
    options: {
      retryable?: boolean;
      statusCode?: number;
      cause?: Error;
    } = {}
  ) {
    super(code, message, { ...context, phoneNumber }, options);
    this.name = 'MessageError';
  }
}

/**
 * Error factory functions for common error scenarios
 */
export const ErrorFactory = {
  providerNotFound: (providerId: string) =>
    new ProviderError(
      providerId,
      KMessageErrorCode.PROVIDER_NOT_FOUND,
      `Provider '${providerId}' not found`,
      {},
      { retryable: false, statusCode: 404 }
    ),

  providerNotAvailable: (providerId: string, reason?: string) =>
    new ProviderError(
      providerId,
      KMessageErrorCode.PROVIDER_NOT_AVAILABLE,
      `Provider '${providerId}' is not available${reason ? `: ${reason}` : ''}`,
      {},
      { retryable: true, statusCode: 503 }
    ),

  authenticationFailed: (providerId: string, details?: string) =>
    new ProviderError(
      providerId,
      KMessageErrorCode.PROVIDER_AUTHENTICATION_FAILED,
      `Authentication failed for provider '${providerId}'${details ? `: ${details}` : ''}`,
      {},
      { retryable: false, statusCode: 401 }
    ),

  templateNotFound: (templateCode: string) =>
    new TemplateError(
      templateCode,
      KMessageErrorCode.TEMPLATE_NOT_FOUND,
      `Template '${templateCode}' not found`,
      {},
      { retryable: false, statusCode: 404 }
    ),

  invalidPhoneNumber: (phoneNumber: string) =>
    new MessageError(
      phoneNumber,
      KMessageErrorCode.MESSAGE_INVALID_PHONE_NUMBER,
      `Invalid phone number format: ${phoneNumber}`,
      {},
      { retryable: false, statusCode: 400 }
    ),

  networkTimeout: (providerId?: string, timeout?: number) =>
    new KMessageError(
      KMessageErrorCode.NETWORK_TIMEOUT,
      `Network request timed out${timeout ? ` after ${timeout}ms` : ''}`,
      { providerId },
      { retryable: true, statusCode: 408 }
    ),

  rateLimited: (providerId: string, retryAfter?: number) =>
    new ProviderError(
      providerId,
      KMessageErrorCode.PROVIDER_RATE_LIMITED,
      `Rate limit exceeded for provider '${providerId}'${retryAfter ? `. Retry after ${retryAfter}s` : ''}`,
      { retryAfter },
      { retryable: true, statusCode: 429 }
    ),

  insufficientBalance: (providerId: string, balance?: string) =>
    new ProviderError(
      providerId,
      KMessageErrorCode.PROVIDER_INSUFFICIENT_BALANCE,
      `Insufficient balance for provider '${providerId}'${balance ? `. Current balance: ${balance}` : ''}`,
      { balance },
      { retryable: false, statusCode: 402 }
    ),

  fromHttpStatus: (statusCode: number, message: string, context: KMessageErrorContext = {}) => {
    let code: KMessageErrorCode;
    let retryable = false;

    switch (statusCode) {
      case 400:
        code = KMessageErrorCode.API_INVALID_REQUEST;
        break;
      case 401:
        code = KMessageErrorCode.API_UNAUTHORIZED;
        break;
      case 403:
        code = KMessageErrorCode.API_FORBIDDEN;
        break;
      case 404:
        code = KMessageErrorCode.API_NOT_FOUND;
        break;
      case 408:
        code = KMessageErrorCode.NETWORK_TIMEOUT;
        retryable = true;
        break;
      case 429:
        code = KMessageErrorCode.API_TOO_MANY_REQUESTS;
        retryable = true;
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        code = KMessageErrorCode.API_INTERNAL_SERVER_ERROR;
        retryable = true;
        break;
      default:
        code = KMessageErrorCode.UNKNOWN_ERROR;
        retryable = statusCode >= 500 && statusCode < 600;
    }

    return new KMessageError(code, message, context, { retryable, statusCode });
  }
};

/**
 * Result wrapper for operations that can fail
 */
export type Result<T, E = KMessageError> = 
  | { success: true; data: T }
  | { success: false; error: E };

export const Result = {
  success: <T>(data: T): Result<T> => ({ success: true, data }),
  failure: <E = KMessageError>(error: E): Result<never, E> => ({ success: false, error }),
  
  fromPromise: async <T>(promise: Promise<T>): Promise<Result<T>> => {
    try {
      const data = await promise;
      return Result.success(data);
    } catch (error) {
      if (error instanceof KMessageError) {
        return Result.failure(error);
      }
      return Result.failure(new KMessageError(
        KMessageErrorCode.UNKNOWN_ERROR,
        error instanceof Error ? error.message : 'Unknown error occurred',
        {},
        { cause: error instanceof Error ? error : undefined }
      ));
    }
  }
};

/**
 * Error handling utilities
 */
export const ErrorUtils = {
  isRetryable: (error: Error): boolean => {
    if (error instanceof KMessageError) {
      return error.retryable;
    }
    // For non-KMessageError, consider network-related errors as retryable
    const retryableMessages = ['timeout', 'ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT'];
    return retryableMessages.some(msg => 
      error.message.toLowerCase().includes(msg.toLowerCase())
    );
  },

  getStatusCode: (error: Error): number => {
    if (error instanceof KMessageError && error.statusCode) {
      return error.statusCode;
    }
    return 500; // Default to internal server error
  },

  formatErrorForClient: (error: Error) => {
    if (error instanceof KMessageError) {
      return {
        code: error.code,
        message: error.message,
        retryable: error.retryable,
        context: error.context
      };
    }
    
    return {
      code: KMessageErrorCode.UNKNOWN_ERROR,
      message: error.message || 'Unknown error occurred',
      retryable: false,
      context: {}
    };
  },

  formatErrorForLogging: (error: Error) => {
    const baseInfo = {
      name: error.name,
      message: error.message,
      stack: error.stack
    };

    if (error instanceof KMessageError) {
      return {
        ...baseInfo,
        code: error.code,
        context: error.context,
        retryable: error.retryable,
        statusCode: error.statusCode
      };
    }

    return baseInfo;
  }
};