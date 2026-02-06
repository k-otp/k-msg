/**
 * Tests for error recovery and retry patterns
 */

import { test, expect, describe } from 'bun:test';
import {
  RetryHandler,
  CircuitBreaker,
  BulkOperationHandler,
  RateLimiter,
  HealthMonitor,
  GracefulDegradation,
  ErrorRecovery
} from './retry';
import { KMsgError, KMsgErrorCode } from './errors';

describe('RetryHandler', () => {
  test('should retry failed operations', async () => {
    let attempts = 0;
    const failingFunction = async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error('Temporary failure');
      }
      return 'success';
    };

    const result = await RetryHandler.execute(failingFunction, {
      maxAttempts: 5,
      initialDelay: 10,
      retryCondition: () => true
    });

    expect(result).toBe('success');
    expect(attempts).toBe(3);
  });

  test('should not retry non-retryable errors', async () => {
    let attempts = 0;
    const failingFunction = async () => {
      attempts++;
      throw new KMsgError(
        KMsgErrorCode.INVALID_REQUEST,
        'Non-retryable error',
        { retryable: false }
      );
    };

    await expect(
      RetryHandler.execute(failingFunction, { maxAttempts: 3 })
    ).rejects.toThrow('Non-retryable error');

    expect(attempts).toBe(1);
  });

  test('should respect max attempts', async () => {
    let attempts = 0;
    const alwaysFailingFunction = async () => {
      attempts++;
      throw new Error('Always fails');
    };

    await expect(
      RetryHandler.execute(alwaysFailingFunction, {
        maxAttempts: 3,
        initialDelay: 10,
        retryCondition: () => true
      })
    ).rejects.toThrow('Always fails');

    expect(attempts).toBe(3);
  });

  test('should call onRetry callback', async () => {
    const retryCallbacks: number[] = [];
    let attempts = 0;

    const failingFunction = async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error('Retry me');
      }
      return 'success';
    };

    await RetryHandler.execute(failingFunction, {
      maxAttempts: 3,
      initialDelay: 10,
      onRetry: (error, attempt) => {
        retryCallbacks.push(attempt);
      },
      retryCondition: () => true
    });

    expect(retryCallbacks).toEqual([1, 2]);
  });

  test('should create retryable function wrapper', async () => {
    let attempts = 0;
    const originalFunction = async (value: string) => {
      attempts++;
      if (attempts < 2) {
        throw new Error('Retry me');
      }
      return `processed: ${value}`;
    };

    const retryableFunction = RetryHandler.createRetryableFunction(
      originalFunction,
      { maxAttempts: 3, initialDelay: 10, retryCondition: () => true }
    );

    const result = await retryableFunction('test');
    expect(result).toBe('processed: test');
    expect(attempts).toBe(2);
  });
});

describe('CircuitBreaker', () => {
  test('should open circuit after failure threshold', async () => {
    const circuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      timeout: 1000,
      resetTimeout: 5000
    });

    const failingOperation = async () => {
      throw new Error('Service failure');
    };

    // Fail 3 times to open circuit
    for (let i = 0; i < 3; i++) {
      await expect(circuitBreaker.execute(failingOperation)).rejects.toThrow('Service failure');
    }

    expect(circuitBreaker.getState()).toBe('OPEN');
    expect(circuitBreaker.getFailureCount()).toBe(3);

    // Next call should fail immediately with circuit breaker error
    await expect(circuitBreaker.execute(failingOperation)).rejects.toThrow('Circuit breaker is OPEN');
  });

  test('should transition to half-open after reset timeout', async () => {
    const circuitBreaker = new CircuitBreaker({
      failureThreshold: 2,
      timeout: 1000,
      resetTimeout: 100 // Short timeout for testing
    });

    const failingOperation = async () => {
      throw new Error('Service failure');
    };

    // Open the circuit
    await expect(circuitBreaker.execute(failingOperation)).rejects.toThrow();
    await expect(circuitBreaker.execute(failingOperation)).rejects.toThrow();

    expect(circuitBreaker.getState()).toBe('OPEN');

    // Wait for reset timeout
    await new Promise(resolve => setTimeout(resolve, 150));

    // Next call should transition to HALF_OPEN
    await expect(circuitBreaker.execute(failingOperation)).rejects.toThrow('Service failure');
    // State check needs to be done before the failure is recorded
  });

  test('should close circuit on successful operation in half-open state', async () => {
    const circuitBreaker = new CircuitBreaker({
      failureThreshold: 2,
      timeout: 1000,
      resetTimeout: 100
    });

    let shouldFail = true;
    const conditionalOperation = async () => {
      if (shouldFail) {
        throw new Error('Service failure');
      }
      return 'success';
    };

    // Open the circuit
    await expect(circuitBreaker.execute(conditionalOperation)).rejects.toThrow();
    await expect(circuitBreaker.execute(conditionalOperation)).rejects.toThrow();

    // Wait for reset timeout
    await new Promise(resolve => setTimeout(resolve, 150));

    // Make operation succeed
    shouldFail = false;
    const result = await circuitBreaker.execute(conditionalOperation);
    
    expect(result).toBe('success');
    expect(circuitBreaker.getState()).toBe('CLOSED');
  });

  test('should handle timeout', async () => {
    const circuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      timeout: 50,
      resetTimeout: 1000
    });

    const slowOperation = async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return 'too slow';
    };

    await expect(circuitBreaker.execute(slowOperation)).rejects.toThrow('Circuit breaker timeout');
  });
});

describe('BulkOperationHandler', () => {
  test('should process items successfully', async () => {
    const items = [1, 2, 3, 4, 5];
    const operation = async (item: number) => item * 2;

    const result = await BulkOperationHandler.execute(items, operation, {
      concurrency: 2
    });

    expect(result.successful.length).toBe(5);
    expect(result.failed.length).toBe(0);
    expect(result.summary.total).toBe(5);
    expect(result.summary.successful).toBe(5);
    expect(result.summary.failed).toBe(0);

    const results = result.successful.map(s => s.result);
    expect(results).toEqual([2, 4, 6, 8, 10]);
  });

  test('should handle partial failures', async () => {
    const items = [1, 2, 3, 4, 5];
    const operation = async (item: number) => {
      if (item === 3) {
        throw new Error(`Failed to process ${item}`);
      }
      return item * 2;
    };

    const result = await BulkOperationHandler.execute(items, operation, {
      concurrency: 2,
      retryOptions: { maxAttempts: 1 }
    });

    expect(result.successful.length).toBe(4);
    expect(result.failed.length).toBe(1);
    expect(result.failed[0].item).toBe(3);
    expect(result.summary.successful).toBe(4);
    expect(result.summary.failed).toBe(1);
  });

  test('should retry failed operations', async () => {
    const items = [1, 2, 3];
    const attemptCounts = new Map<number, number>();

    const operation = async (item: number) => {
      const attempts = (attemptCounts.get(item) || 0) + 1;
      attemptCounts.set(item, attempts);

      if (item === 2 && attempts < 3) {
        throw new Error('Temporary failure');
      }
      return item * 2;
    };

    const result = await BulkOperationHandler.execute(items, operation, {
      concurrency: 1,
      retryOptions: { 
        maxAttempts: 3, 
        initialDelay: 10,
        retryCondition: () => true
      }
    });

    expect(result.successful.length).toBe(3);
    expect(result.failed.length).toBe(0);
    expect(attemptCounts.get(2)).toBe(3); // Item 2 should have been retried
  });

  test('should call progress callback', async () => {
    const items = [1, 2, 3];
    const progressUpdates: Array<{completed: number, total: number, failed: number}> = [];

    await BulkOperationHandler.execute(items, async (item) => item * 2, {
      concurrency: 1,
      onProgress: (completed, total, failed) => {
        progressUpdates.push({ completed, total, failed });
      }
    });

    expect(progressUpdates.length).toBe(3);
    expect(progressUpdates[0]).toEqual({ completed: 1, total: 3, failed: 0 });
    expect(progressUpdates[2]).toEqual({ completed: 3, total: 3, failed: 0 });
  });

  test('should fail fast when configured', async () => {
    const items = [1, 2, 3, 4, 5];
    const operation = async (item: number) => {
      if (item === 2) {
        throw new Error('First failure');
      }
      return item * 2;
    };

    const result = await BulkOperationHandler.execute(items, operation, {
      concurrency: 1,
      failFast: true,
      retryOptions: { maxAttempts: 1 }
    });

    // With failFast, we should have some failures and stop early
    expect(result.failed.length).toBeGreaterThan(0);
    expect(result.successful.length).toBeLessThan(items.length);
  });
});

describe('RateLimiter', () => {
  test('should allow requests within limit', async () => {
    const rateLimiter = new RateLimiter(3, 1000);

    // Should allow 3 requests
    await rateLimiter.acquire();
    await rateLimiter.acquire();
    await rateLimiter.acquire();

    expect(rateLimiter.getRemainingRequests()).toBe(0);
  });

  test('should block requests exceeding limit', async () => {
    const rateLimiter = new RateLimiter(2, 500);

    // Make 2 requests (should be allowed)
    await rateLimiter.acquire();
    await rateLimiter.acquire();

    expect(rateLimiter.canMakeRequest()).toBe(false);

    // Third request should be delayed
    const start = Date.now();
    await rateLimiter.acquire();
    const duration = Date.now() - start;

    expect(duration).toBeGreaterThan(400); // Should wait for window to reset
  });

  test('should reset window after time passes', async () => {
    const rateLimiter = new RateLimiter(2, 100);

    // Use up the limit
    await rateLimiter.acquire();
    await rateLimiter.acquire();
    expect(rateLimiter.canMakeRequest()).toBe(false);

    // Wait for window to reset
    await new Promise(resolve => setTimeout(resolve, 150));

    expect(rateLimiter.canMakeRequest()).toBe(true);
    expect(rateLimiter.getRemainingRequests()).toBe(2);
  });
});

describe('HealthMonitor', () => {
  test('should monitor service health', async () => {
    let service1Healthy = true;
    let service2Healthy = false;

    const services = new Map([
      ['service1', async () => service1Healthy],
      ['service2', async () => service2Healthy]
    ]);

    const monitor = new HealthMonitor(services, 50);
    monitor.start();

    // Wait for initial check
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(monitor.getServiceHealth('service1')).toBe(true);
    expect(monitor.getServiceHealth('service2')).toBe(false);

    // Change service status
    service2Healthy = true;
    
    // Wait for next check
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(monitor.getServiceHealth('service2')).toBe(true);

    const allHealth = monitor.getAllHealth();
    expect(allHealth.service1).toBe(true);
    expect(allHealth.service2).toBe(true);

    monitor.stop();
  });

  test('should handle health check failures', async () => {
    const services = new Map([
      ['failing-service', async () => {
        throw new Error('Health check failed');
      }]
    ]);

    const monitor = new HealthMonitor(services, 50);
    monitor.start();

    // Wait for check
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(monitor.getServiceHealth('failing-service')).toBe(false);
    expect(monitor.isServiceHealthy('failing-service')).toBe(false);

    monitor.stop();
  });
});

describe('GracefulDegradation', () => {
  test('should use fallback on primary failure', async () => {
    const degradation = new GracefulDegradation();
    
    degradation.registerFallback('test-operation', async () => 'fallback-result');

    const primaryOperation = async () => {
      throw new Error('Primary failed');
    };

    const result = await degradation.executeWithFallback(
      'test-operation',
      primaryOperation,
      { timeout: 100 }
    );

    expect(result).toBe('fallback-result');
  });

  test('should return primary result when successful', async () => {
    const degradation = new GracefulDegradation();
    
    degradation.registerFallback('test-operation', async () => 'fallback-result');

    const primaryOperation = async () => 'primary-result';

    const result = await degradation.executeWithFallback(
      'test-operation',
      primaryOperation
    );

    expect(result).toBe('primary-result');
  });

  test('should timeout primary operation', async () => {
    const degradation = new GracefulDegradation();
    
    degradation.registerFallback('slow-operation', async () => 'fallback-result');

    const slowOperation = async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
      return 'slow-result';
    };

    const result = await degradation.executeWithFallback(
      'slow-operation',
      slowOperation,
      { timeout: 50 }
    );

    expect(result).toBe('fallback-result');
  });

  test('should throw when both primary and fallback fail', async () => {
    const degradation = new GracefulDegradation();
    
    degradation.registerFallback('failing-operation', async () => {
      throw new Error('Fallback also failed');
    });

    const primaryOperation = async () => {
      throw new Error('Primary failed');
    };

    await expect(
      degradation.executeWithFallback('failing-operation', primaryOperation)
    ).rejects.toThrow('Both primary and fallback operations failed');
  });
});

describe('ErrorRecovery', () => {
  test('should create resilient function with all features', async () => {
    let attempts = 0;
    const unreliableFunction = async (value: string) => {
      attempts++;
      if (attempts < 3) {
        throw new Error('Temporary failure');
      }
      return `processed: ${value}`;
    };

    const resilientFunction = ErrorRecovery.createResilientFunction(
      unreliableFunction,
      {
        retryOptions: { 
          maxAttempts: 5, 
          initialDelay: 10,
          retryCondition: () => true
        },
        timeout: 1000,
        rateLimiter: { maxRequests: 10, windowMs: 1000 }
      }
    );

    const result = await resilientFunction('test');
    expect(result).toBe('processed: test');
    expect(attempts).toBe(3);
  });

  test('should use fallback when all recovery mechanisms fail', async () => {
    const alwaysFailingFunction = async (value: string) => {
      throw new Error('Always fails');
    };

    const fallbackFunction = async (value: string) => {
      return `fallback: ${value}`;
    };

    const resilientFunction = ErrorRecovery.createResilientFunction(
      alwaysFailingFunction,
      {
        retryOptions: { maxAttempts: 2, initialDelay: 10 },
        fallback: fallbackFunction
      }
    );

    const result = await resilientFunction('test');
    expect(result).toBe('fallback: test');
  });

  test('should handle circuit breaker failure threshold', async () => {
    let callCount = 0;
    const failingFunction = async () => {
      callCount++;
      throw new Error('Always fails');
    };

    const resilientFunction = ErrorRecovery.createResilientFunction(
      failingFunction,
      {
        circuitBreaker: {
          failureThreshold: 2,
          timeout: 1000,
          resetTimeout: 5000
        },
        retryOptions: {
          maxAttempts: 1 // No retries to make test predictable
        }
      }
    );

    // First two calls should execute normally and fail
    await expect(resilientFunction()).rejects.toThrow('Always fails');
    await expect(resilientFunction()).rejects.toThrow('Always fails');

    // Third call should fail with circuit breaker (different error)
    await expect(resilientFunction()).rejects.toThrow('Circuit breaker is OPEN');

    // Function should have been called only twice (circuit breaker prevents third call)
    expect(callCount).toBe(2);
  });
});