/**
 * Tests for standardized error handling system
 */

import { test, expect, describe } from 'bun:test';
import {
  KMessageError,
  KMessageErrorCode,
  ProviderError,
  TemplateError,
  MessageError,
  ErrorFactory,
  Result,
  ErrorUtils
} from './errors';

describe('KMessageError', () => {
  test('should create error with correct properties', () => {
    const error = new KMessageError(
      KMessageErrorCode.TEMPLATE_NOT_FOUND,
      'Template not found',
      { templateCode: 'TEST_001' }
    );

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(KMessageError);
    expect(error.name).toBe('KMessageError');
    expect(error.code).toBe(KMessageErrorCode.TEMPLATE_NOT_FOUND);
    expect(error.message).toBe('Template not found');
    expect(error.context.templateCode).toBe('TEST_001');
    expect(error.context.timestamp).toBeInstanceOf(Date);
    expect(error.retryable).toBe(false);
  });

  test('should set retryable correctly for different error codes', () => {
    const networkError = new KMessageError(
      KMessageErrorCode.NETWORK_TIMEOUT,
      'Network timeout'
    );
    expect(networkError.retryable).toBe(true);

    const validationError = new KMessageError(
      KMessageErrorCode.VALIDATION_ERROR,
      'Validation failed'
    );
    expect(validationError.retryable).toBe(false);
  });

  test('should support custom retryable setting', () => {
    const error = new KMessageError(
      KMessageErrorCode.UNKNOWN_ERROR,
      'Unknown error',
      {},
      { retryable: true }
    );
    expect(error.retryable).toBe(true);
  });

  test('should serialize to JSON correctly', () => {
    const error = new KMessageError(
      KMessageErrorCode.API_NOT_FOUND,
      'Not found',
      { requestId: '123' },
      { statusCode: 404 }
    );

    const json = error.toJSON();
    expect(json.name).toBe('KMessageError');
    expect(json.code).toBe(KMessageErrorCode.API_NOT_FOUND);
    expect(json.message).toBe('Not found');
    expect(json.context.requestId).toBe('123');
    expect(json.statusCode).toBe(404);
    expect(json.stack).toBeDefined();
  });
});

describe('ProviderError', () => {
  test('should create provider error with provider context', () => {
    const error = new ProviderError(
      'iwinv',
      KMessageErrorCode.PROVIDER_AUTHENTICATION_FAILED,
      'Auth failed'
    );

    expect(error).toBeInstanceOf(ProviderError);
    expect(error).toBeInstanceOf(KMessageError);
    expect(error.name).toBe('ProviderError');
    expect(error.context.providerId).toBe('iwinv');
  });
});

describe('TemplateError', () => {
  test('should create template error with template context', () => {
    const error = new TemplateError(
      'TEST_TEMPLATE',
      KMessageErrorCode.TEMPLATE_VALIDATION_FAILED,
      'Validation failed'
    );

    expect(error).toBeInstanceOf(TemplateError);
    expect(error).toBeInstanceOf(KMessageError);
    expect(error.name).toBe('TemplateError');
    expect(error.context.templateCode).toBe('TEST_TEMPLATE');
  });
});

describe('MessageError', () => {
  test('should create message error with phone context', () => {
    const error = new MessageError(
      '01012345678',
      KMessageErrorCode.MESSAGE_INVALID_PHONE_NUMBER,
      'Invalid phone'
    );

    expect(error).toBeInstanceOf(MessageError);
    expect(error).toBeInstanceOf(KMessageError);
    expect(error.name).toBe('MessageError');
    expect(error.context.phoneNumber).toBe('01012345678');
  });
});

describe('ErrorFactory', () => {
  test('providerNotFound should create correct error', () => {
    const error = ErrorFactory.providerNotFound('test-provider');
    
    expect(error).toBeInstanceOf(ProviderError);
    expect(error.code).toBe(KMessageErrorCode.PROVIDER_NOT_FOUND);
    expect(error.context.providerId).toBe('test-provider');
    expect(error.retryable).toBe(false);
    expect(error.statusCode).toBe(404);
  });

  test('authenticationFailed should create correct error', () => {
    const error = ErrorFactory.authenticationFailed('iwinv', 'Invalid API key');
    
    expect(error).toBeInstanceOf(ProviderError);
    expect(error.code).toBe(KMessageErrorCode.PROVIDER_AUTHENTICATION_FAILED);
    expect(error.message).toContain('Invalid API key');
    expect(error.retryable).toBe(false);
    expect(error.statusCode).toBe(401);
  });

  test('networkTimeout should create correct error', () => {
    const error = ErrorFactory.networkTimeout('iwinv', 5000);
    
    expect(error.code).toBe(KMessageErrorCode.NETWORK_TIMEOUT);
    expect(error.message).toContain('5000ms');
    expect(error.retryable).toBe(true);
    expect(error.statusCode).toBe(408);
  });

  test('rateLimited should create correct error', () => {
    const error = ErrorFactory.rateLimited('iwinv', 60);
    
    expect(error).toBeInstanceOf(ProviderError);
    expect(error.code).toBe(KMessageErrorCode.PROVIDER_RATE_LIMITED);
    expect(error.message).toContain('60s');
    expect(error.retryable).toBe(true);
    expect(error.statusCode).toBe(429);
  });

  test('fromHttpStatus should map status codes correctly', () => {
    const tests = [
      { status: 400, expectedCode: KMessageErrorCode.API_INVALID_REQUEST, retryable: false },
      { status: 401, expectedCode: KMessageErrorCode.API_UNAUTHORIZED, retryable: false },
      { status: 404, expectedCode: KMessageErrorCode.API_NOT_FOUND, retryable: false },
      { status: 408, expectedCode: KMessageErrorCode.NETWORK_TIMEOUT, retryable: true },
      { status: 429, expectedCode: KMessageErrorCode.API_TOO_MANY_REQUESTS, retryable: true },
      { status: 500, expectedCode: KMessageErrorCode.API_INTERNAL_SERVER_ERROR, retryable: true },
      { status: 502, expectedCode: KMessageErrorCode.API_INTERNAL_SERVER_ERROR, retryable: true },
      { status: 999, expectedCode: KMessageErrorCode.UNKNOWN_ERROR, retryable: false }
    ];

    tests.forEach(({ status, expectedCode, retryable }) => {
      const error = ErrorFactory.fromHttpStatus(status, 'Test error');
      expect(error.code).toBe(expectedCode);
      expect(error.retryable).toBe(retryable);
      expect(error.statusCode).toBe(status);
    });
  });
});

describe('Result', () => {
  test('success should create success result', () => {
    const result = Result.success('test data');
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('test data');
    }
  });

  test('failure should create failure result', () => {
    const error = new KMessageError(KMessageErrorCode.UNKNOWN_ERROR, 'Test error');
    const result = Result.failure(error);
    
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(error);
    }
  });

  test('fromPromise should handle successful promise', async () => {
    const promise = Promise.resolve('success');
    const result = await Result.fromPromise(promise);
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('success');
    }
  });

  test('fromPromise should handle KMessageError rejection', async () => {
    const error = new KMessageError(KMessageErrorCode.VALIDATION_ERROR, 'Validation failed');
    const promise = Promise.reject(error);
    const result = await Result.fromPromise(promise);
    
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(error);
    }
  });

  test('fromPromise should wrap regular Error', async () => {
    const error = new Error('Regular error');
    const promise = Promise.reject(error);
    const result = await Result.fromPromise(promise);
    
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(KMessageError);
      expect(result.error.code).toBe(KMessageErrorCode.UNKNOWN_ERROR);
      expect(result.error.cause).toBe(error);
    }
  });
});

describe('ErrorUtils', () => {
  test('isRetryable should identify retryable errors', () => {
    const retryableError = new KMessageError(
      KMessageErrorCode.NETWORK_TIMEOUT,
      'Timeout',
      {},
      { retryable: true }
    );
    expect(ErrorUtils.isRetryable(retryableError)).toBe(true);

    const nonRetryableError = new KMessageError(
      KMessageErrorCode.VALIDATION_ERROR,
      'Validation failed',
      {},
      { retryable: false }
    );
    expect(ErrorUtils.isRetryable(nonRetryableError)).toBe(false);

    // Test regular errors with retryable message patterns
    const timeoutError = new Error('Connection timeout');
    expect(ErrorUtils.isRetryable(timeoutError)).toBe(true);

    const regularError = new Error('Invalid input');
    expect(ErrorUtils.isRetryable(regularError)).toBe(false);
  });

  test('getStatusCode should return correct status codes', () => {
    const errorWithStatus = new KMessageError(
      KMessageErrorCode.API_NOT_FOUND,
      'Not found',
      {},
      { statusCode: 404 }
    );
    expect(ErrorUtils.getStatusCode(errorWithStatus)).toBe(404);

    const regularError = new Error('Regular error');
    expect(ErrorUtils.getStatusCode(regularError)).toBe(500);
  });

  test('formatErrorForClient should format errors correctly', () => {
    const kMessageError = new KMessageError(
      KMessageErrorCode.TEMPLATE_NOT_FOUND,
      'Template not found',
      { templateCode: 'TEST_001' },
      { retryable: false }
    );

    const formatted = ErrorUtils.formatErrorForClient(kMessageError);
    expect(formatted.code).toBe(KMessageErrorCode.TEMPLATE_NOT_FOUND);
    expect(formatted.message).toBe('Template not found');
    expect(formatted.retryable).toBe(false);
    expect(formatted.context.templateCode).toBe('TEST_001');

    const regularError = new Error('Regular error');
    const formattedRegular = ErrorUtils.formatErrorForClient(regularError);
    expect(formattedRegular.code).toBe(KMessageErrorCode.UNKNOWN_ERROR);
    expect(formattedRegular.message).toBe('Regular error');
    expect(formattedRegular.retryable).toBe(false);
  });

  test('formatErrorForLogging should include detailed info', () => {
    const kMessageError = new KMessageError(
      KMessageErrorCode.PROVIDER_CONNECTION_FAILED,
      'Connection failed',
      { providerId: 'iwinv' },
      { statusCode: 503, retryable: true }
    );

    const logged = ErrorUtils.formatErrorForLogging(kMessageError);
    expect(logged.name).toBe('KMessageError');
    expect(logged.message).toBe('Connection failed');
    expect(logged.code).toBe(KMessageErrorCode.PROVIDER_CONNECTION_FAILED);
    expect(logged.context.providerId).toBe('iwinv');
    expect(logged.retryable).toBe(true);
    expect(logged.statusCode).toBe(503);
    expect(logged.stack).toBeDefined();

    const regularError = new Error('Regular error');
    const loggedRegular = ErrorUtils.formatErrorForLogging(regularError);
    expect(loggedRegular.name).toBe('Error');
    expect(loggedRegular.message).toBe('Regular error');
    expect(loggedRegular.stack).toBeDefined();
    expect('code' in loggedRegular).toBe(false);
  });
});

describe('Error Integration', () => {
  test('should maintain error chain with cause', () => {
    const originalError = new Error('Original error');
    const wrappedError = new KMessageError(
      KMessageErrorCode.PROVIDER_CONNECTION_FAILED,
      'Wrapped error',
      { providerId: 'test' },
      { cause: originalError }
    );

    expect(wrappedError.cause).toBe(originalError);
  });

  test('should work with async error handling patterns', async () => {
    const failingFunction = async (): Promise<string> => {
      throw new TemplateError(
        'TEST_TEMPLATE',
        KMessageErrorCode.TEMPLATE_NOT_FOUND,
        'Template not found'
      );
    };

    const result = await Result.fromPromise(failingFunction());
    
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(TemplateError);
      expect(result.error.code).toBe(KMessageErrorCode.TEMPLATE_NOT_FOUND);
    }
  });
});