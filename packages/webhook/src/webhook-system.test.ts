/**
 * Comprehensive tests for webhook-system package
 */

import { test, expect, describe, beforeEach, afterEach } from 'bun:test';
import {
  // Services
  WebhookService,
  WebhookDispatcher,
  WebhookRegistry,
  MockHttpClient,

  // Dispatchers
  BatchDispatcher,
  QueueManager,
  LoadBalancer,

  // Registry
  EndpointManager,
  DeliveryStore,

  // Security & Retry
  SecurityManager,
  RetryManager,

  // Types
  WebhookEventType,
  type WebhookConfig,
  type WebhookEvent,
  type WebhookEndpoint,
  type WebhookDelivery
} from './index';

// Test data helpers
const createTestEvent = (type: WebhookEventType = WebhookEventType.MESSAGE_SENT): WebhookEvent => ({
  id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  type,
  timestamp: new Date(),
  data: {
    messageId: 'msg-123',
    status: 'sent',
    recipient: '+1234567890'
  },
  metadata: {
    providerId: 'test-provider',
    channelId: 'test-channel',
    messageId: 'msg-123',
    userId: 'user-123',
    organizationId: 'org-123',
    correlationId: 'corr-123'
  },
  version: '1.0'
});

const createTestEndpoint = (events: WebhookEventType[] = [WebhookEventType.MESSAGE_SENT]): Omit<WebhookEndpoint, 'id' | 'createdAt' | 'updatedAt' | 'status'> => ({
  url: `https://webhook.example.com/test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  name: 'Test Endpoint',
  description: 'Test webhook endpoint',
  active: true,
  events,
  headers: {
    'Authorization': 'Bearer test-token'
  },
  secret: 'test-secret-key',
  retryConfig: {
    maxRetries: 3,
    retryDelayMs: 1000,
    backoffMultiplier: 2
  }
});

const createTestConfig = (): WebhookConfig => ({
  maxRetries: 3,
  retryDelayMs: 1000,
  maxDelayMs: 300000,
  backoffMultiplier: 2,
  jitter: true,
  timeoutMs: 30000,
  enableSecurity: true,
  secretKey: 'test-secret',
  algorithm: 'sha256',
  signatureHeader: 'X-Webhook-Signature',
  signaturePrefix: 'sha256=',
  enabledEvents: [
    WebhookEventType.MESSAGE_SENT,
    WebhookEventType.MESSAGE_DELIVERED,
    WebhookEventType.MESSAGE_FAILED
  ],
  batchSize: 10,
  batchTimeoutMs: 5000
});

describe('WebhookService', () => {
  let webhookService: WebhookService;
  let config: WebhookConfig;
  let mockHttpClient: MockHttpClient;

  beforeEach(() => {
    config = createTestConfig();
    mockHttpClient = new MockHttpClient();
    webhookService = new WebhookService(config, mockHttpClient);
  });

  afterEach(async () => {
    await webhookService.shutdown();
  });

  test('should initialize with configuration', () => {
    expect(webhookService).toBeDefined();
  });

  test('should register webhook endpoint', async () => {
    const endpointData = createTestEndpoint();
    const endpoint = await webhookService.registerEndpoint(endpointData);
    
    expect(endpoint.id).toBeDefined();
    expect(endpoint.url).toBe(endpointData.url);
    expect(endpoint.status).toBe('active');
    expect(endpoint.createdAt).toBeInstanceOf(Date);
    expect(endpoint.updatedAt).toBeInstanceOf(Date);
  });

  test('should update webhook endpoint', async () => {
    const endpointData = createTestEndpoint();
    const endpoint = await webhookService.registerEndpoint(endpointData);
    
    const updates = {
      name: 'Updated Test Endpoint',
      active: false
    };

    // Add small delay to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 1));

    const updatedEndpoint = await webhookService.updateEndpoint(endpoint.id, updates);
    
    expect(updatedEndpoint.name).toBe(updates.name);
    expect(updatedEndpoint.active).toBe(updates.active);
    expect(updatedEndpoint.updatedAt.getTime()).toBeGreaterThan(endpoint.updatedAt.getTime());
  });

  test('should delete webhook endpoint', async () => {
    const endpointData = createTestEndpoint();
    const endpoint = await webhookService.registerEndpoint(endpointData);
    
    await webhookService.deleteEndpoint(endpoint.id);
    
    const deletedEndpoint = await webhookService.getEndpoint(endpoint.id);
    expect(deletedEndpoint).toBeNull();
  });

  test('should emit webhook event asynchronously', async () => {
    const endpointData = createTestEndpoint([WebhookEventType.MESSAGE_SENT]);
    await webhookService.registerEndpoint(endpointData);
    
    const event = createTestEvent(WebhookEventType.MESSAGE_SENT);
    
    // Should not throw
    await webhookService.emit(event);
    expect(true).toBe(true);
  });

  test('should emit webhook event synchronously', async () => {
    const endpointData = createTestEndpoint([WebhookEventType.MESSAGE_SENT]);
    const endpoint = await webhookService.registerEndpoint(endpointData);
    
    const event = createTestEvent(WebhookEventType.MESSAGE_SENT);
    
    const deliveries = await webhookService.emitSync(event);
    
    expect(deliveries.length).toBe(1);
    expect(deliveries[0].endpointId).toBe(endpoint.id);
    expect(deliveries[0].eventId).toBe(event.id);
  });

  test('should test webhook endpoint', async () => {
    const endpointData = createTestEndpoint();
    const endpoint = await webhookService.registerEndpoint(endpointData);
    
    const testResult = await webhookService.testEndpoint(endpoint.id);
    
    expect(testResult.endpointId).toBe(endpoint.id);
    expect(testResult.url).toBe(endpoint.url);
    expect(testResult.responseTime).toBeGreaterThan(0);
    expect(testResult.testedAt).toBeInstanceOf(Date);
  });

  test('should get webhook statistics', async () => {
    const endpointData = createTestEndpoint();
    const endpoint = await webhookService.registerEndpoint(endpointData);
    
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const stats = await webhookService.getStats(endpoint.id, { start: oneHourAgo, end: now });
    
    expect(stats.endpointId).toBe(endpoint.id);
    expect(stats.timeRange.start).toEqual(oneHourAgo);
    expect(stats.timeRange.end).toEqual(now);
    expect(stats.totalDeliveries).toBeGreaterThanOrEqual(0);
    expect(stats.successRate).toBeGreaterThanOrEqual(0);
  });

  test('should pause and resume endpoint', async () => {
    const endpointData = createTestEndpoint();
    let endpoint = await webhookService.registerEndpoint(endpointData);
    
    await webhookService.pauseEndpoint(endpoint.id);
    endpoint = (await webhookService.getEndpoint(endpoint.id))!;
    expect(endpoint.status).toBe('suspended');
    
    await webhookService.resumeEndpoint(endpoint.id);
    endpoint = (await webhookService.getEndpoint(endpoint.id))!;
    expect(endpoint.status).toBe('active');
  });
});

describe('WebhookDispatcher', () => {
  let dispatcher: WebhookDispatcher;
  let config: WebhookConfig;
  let mockHttpClient: MockHttpClient;

  beforeEach(() => {
    config = createTestConfig();
    mockHttpClient = new MockHttpClient();
    dispatcher = new WebhookDispatcher(config, mockHttpClient);
  });

  afterEach(async () => {
    await dispatcher.shutdown();
  });

  test('should dispatch webhook to endpoint', async () => {
    const event = createTestEvent();
    const endpointData = createTestEndpoint();
    const endpoint: WebhookEndpoint = {
      ...endpointData,
      id: 'test-endpoint',
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active'
    };

    const delivery = await dispatcher.dispatch(event, endpoint);

    expect(delivery.id).toBeDefined();
    expect(delivery.endpointId).toBe(endpoint.id);
    expect(delivery.eventId).toBe(event.id);
    expect(delivery.url).toBe(endpoint.url);
    expect(delivery.httpMethod).toBe('POST');
    expect(delivery.attempts.length).toBeGreaterThan(0);
  });

  test('should include security headers in dispatch', async () => {
    const event = createTestEvent();
    const endpointData = createTestEndpoint();
    const endpoint: WebhookEndpoint = {
      ...endpointData,
      id: 'test-endpoint',
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active'
    };

    const delivery = await dispatcher.dispatch(event, endpoint);

    expect(delivery.headers['Content-Type']).toBe('application/json');
    expect(delivery.headers['X-Webhook-ID']).toBe(event.id);
    expect(delivery.headers['X-Webhook-Event']).toBe(event.type);
    expect(delivery.headers['X-Webhook-Signature']).toBeDefined();
    expect(delivery.headers['User-Agent']).toBe('K-Message-Webhook/1.0');
  });
});

describe('BatchDispatcher', () => {
  let batchDispatcher: BatchDispatcher;

  beforeEach(() => {
    batchDispatcher = new BatchDispatcher({
      maxBatchSize: 5,
      batchTimeoutMs: 1000,
      maxConcurrentBatches: 2,
      enablePrioritization: true,
      priorityLevels: 3
    });
  });

  afterEach(async () => {
    await batchDispatcher.shutdown();
  });

  test('should add job to batch queue', async () => {
    const event = createTestEvent();
    const endpointData = createTestEndpoint();
    const endpoint: WebhookEndpoint = {
      ...endpointData,
      id: 'test-endpoint',
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active'
    };

    const job = {
      id: 'test-job',
      event,
      endpoint,
      priority: 5,
      createdAt: new Date(),
      scheduledAt: new Date(),
      attempts: 0,
      maxAttempts: 3
    };

    await batchDispatcher.addJob(job);
    
    const stats = batchDispatcher.getBatchStats();
    expect(stats.pendingJobsCount).toBeGreaterThan(0);
  });

  test('should process batch when size limit reached', async () => {
    const endpointData = createTestEndpoint();
    const endpoint: WebhookEndpoint = {
      ...endpointData,
      id: 'test-endpoint',
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active'
    };

    const jobs = Array.from({ length: 6 }, (_, i) => ({
      id: `test-job-${i}`,
      event: createTestEvent(),
      endpoint,
      priority: Math.floor(Math.random() * 10),
      createdAt: new Date(),
      scheduledAt: new Date(),
      attempts: 0,
      maxAttempts: 3
    }));

    // Add jobs one by one
    for (const job of jobs) {
      await batchDispatcher.addJob(job);
    }

    // Wait for batch processing
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const stats = batchDispatcher.getBatchStats();
    // Should have processed at least one batch
    expect(stats.pendingJobsCount).toBeLessThan(jobs.length);
  });

  test('should get batch statistics', () => {
    const stats = batchDispatcher.getBatchStats();
    
    expect(stats.pendingJobsCount).toBeGreaterThanOrEqual(0);
    expect(stats.activeBatchesCount).toBeGreaterThanOrEqual(0);
    expect(stats.endpointsWithPendingJobs).toBeGreaterThanOrEqual(0);
    expect(stats.averageQueueSize).toBeGreaterThanOrEqual(0);
  });
});

describe('QueueManager', () => {
  let queueManager: QueueManager;

  beforeEach(() => {
    queueManager = new QueueManager({
      maxQueueSize: 100,
      persistToDisk: false,
      compressionEnabled: false,
      ttlMs: 60000 // 1분
    });
  });

  afterEach(async () => {
    await queueManager.shutdown();
  });

  test('should enqueue and dequeue jobs', async () => {
    const event = createTestEvent();
    const endpointData = createTestEndpoint();
    const endpoint: WebhookEndpoint = {
      ...endpointData,
      id: 'test-endpoint',
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active'
    };

    const job = {
      id: 'test-job',
      event,
      endpoint,
      priority: 5,
      createdAt: new Date(),
      scheduledAt: new Date(),
      attempts: 0,
      maxAttempts: 3
    };

    const enqueued = await queueManager.enqueue(job);
    expect(enqueued).toBe(true);

    const dequeued = await queueManager.dequeue();
    expect(dequeued).toBeDefined();
    expect(dequeued!.id).toBe(job.id);
  });

  test('should prioritize high priority jobs', async () => {
    const endpointData = createTestEndpoint();
    const endpoint: WebhookEndpoint = {
      ...endpointData,
      id: 'test-endpoint',
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active'
    };

    const lowPriorityJob = {
      id: 'low-priority-job',
      event: createTestEvent(),
      endpoint,
      priority: 2,
      createdAt: new Date(),
      scheduledAt: new Date(),
      attempts: 0,
      maxAttempts: 3
    };

    const highPriorityJob = {
      id: 'high-priority-job',
      event: createTestEvent(),
      endpoint,
      priority: 9,
      createdAt: new Date(),
      scheduledAt: new Date(),
      attempts: 0,
      maxAttempts: 3
    };

    // Enqueue low priority first
    await queueManager.enqueue(lowPriorityJob);
    await queueManager.enqueue(highPriorityJob);

    // High priority should be dequeued first
    const firstJob = await queueManager.dequeue();
    expect(firstJob!.id).toBe(highPriorityJob.id);

    const secondJob = await queueManager.dequeue();
    expect(secondJob!.id).toBe(lowPriorityJob.id);
  });

  test('should remove specific jobs', async () => {
    const event = createTestEvent();
    const endpointData = createTestEndpoint();
    const endpoint: WebhookEndpoint = {
      ...endpointData,
      id: 'test-endpoint',
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active'
    };

    const job = {
      id: 'test-job-to-remove',
      event,
      endpoint,
      priority: 5,
      createdAt: new Date(),
      scheduledAt: new Date(),
      attempts: 0,
      maxAttempts: 3
    };

    await queueManager.enqueue(job);
    const removed = await queueManager.removeJob(job.id);
    expect(removed).toBe(true);

    const dequeued = await queueManager.dequeue();
    expect(dequeued).toBeNull();
  });

  test('should get queue statistics', () => {
    const stats = queueManager.getStats();
    
    expect(stats.totalJobs).toBeGreaterThanOrEqual(0);
    expect(stats.highPriorityJobs).toBeGreaterThanOrEqual(0);
    expect(stats.mediumPriorityJobs).toBeGreaterThanOrEqual(0);
    expect(stats.lowPriorityJobs).toBeGreaterThanOrEqual(0);
    expect(stats.delayedJobs).toBeGreaterThanOrEqual(0);
    expect(stats.queueUtilization).toBeGreaterThanOrEqual(0);
  });
});

describe('LoadBalancer', () => {
  let loadBalancer: LoadBalancer;

  beforeEach(() => {
    loadBalancer = new LoadBalancer({
      strategy: 'round-robin',
      healthCheckInterval: 1000,
      healthCheckTimeoutMs: 500
    });
  });

  afterEach(async () => {
    await loadBalancer.shutdown();
  });

  test('should register and select endpoints', async () => {
    const endpointData = createTestEndpoint();
    const endpoint: WebhookEndpoint = {
      ...endpointData,
      id: 'test-endpoint',
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active'
    };

    await loadBalancer.registerEndpoint(endpoint);
    
    const selected = await loadBalancer.selectEndpoint([endpoint]);
    expect(selected).toBeDefined();
    expect(selected!.id).toBe(endpoint.id);
  });

  test('should track request completion', async () => {
    const endpointData = createTestEndpoint();
    const endpoint: WebhookEndpoint = {
      ...endpointData,
      id: 'test-endpoint',
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active'
    };

    await loadBalancer.registerEndpoint(endpoint);
    await loadBalancer.selectEndpoint([endpoint]);
    
    // Complete request successfully
    await loadBalancer.onRequestComplete(endpoint.id, true, 250);
    
    const health = loadBalancer.getEndpointHealth(endpoint.id);
    expect(health).toBeDefined();
    expect(health!.isHealthy).toBe(true);
    expect(health!.averageResponseTime).toBeGreaterThan(0);
  });

  test('should handle endpoint failures', async () => {
    const endpointData = createTestEndpoint();
    const endpoint: WebhookEndpoint = {
      ...endpointData,
      id: 'test-endpoint',
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active'
    };

    await loadBalancer.registerEndpoint(endpoint);
    
    // Simulate multiple failures
    for (let i = 0; i < 4; i++) {
      await loadBalancer.onRequestComplete(endpoint.id, false, 1000);
    }
    
    const health = loadBalancer.getEndpointHealth(endpoint.id);
    expect(health!.isHealthy).toBe(false);
    expect(health!.consecutiveFailures).toBeGreaterThanOrEqual(3);
  });

  test('should get load balancer statistics', () => {
    const stats = loadBalancer.getStats();
    
    expect(stats.totalEndpoints).toBeGreaterThanOrEqual(0);
    expect(stats.healthyEndpoints).toBeGreaterThanOrEqual(0);
    expect(stats.activeConnections).toBeGreaterThanOrEqual(0);
    expect(stats.circuitBreakersOpen).toBeGreaterThanOrEqual(0);
    expect(stats.averageResponseTime).toBeGreaterThanOrEqual(0);
  });
});

describe('SecurityManager', () => {
  let securityManager: SecurityManager;
  let config: WebhookConfig;

  beforeEach(() => {
    config = createTestConfig();
    securityManager = new SecurityManager(config);
  });

  test('should generate and verify signatures', () => {
    const payload = JSON.stringify({ test: 'data' });
    const secret = 'test-secret-key';
    
    const signature = securityManager.generateSignature(payload, secret);
    expect(signature).toBeDefined();
    expect(signature.startsWith('sha256=')).toBe(true);
    
    const isValid = securityManager.verifySignature(payload, signature, secret);
    expect(isValid).toBe(true);
    
    const isInvalid = securityManager.verifySignature(payload, 'invalid-signature', secret);
    expect(isInvalid).toBe(false);
  });

  test('should extract signature from headers', () => {
    const headers = {
      'x-webhook-signature': 'sha256=abcdef123456',
      'content-type': 'application/json'
    };
    
    const signature = securityManager.extractSignature(headers);
    expect(signature).toBe('sha256=abcdef123456');
  });

  test('should create security headers', () => {
    const payload = JSON.stringify({ test: 'data' });
    const secret = 'test-secret-key';
    
    const headers = securityManager.createSecurityHeaders(payload, secret);
    
    expect(headers['X-Webhook-Signature']).toBeDefined();
    expect(headers['X-Webhook-Timestamp']).toBeDefined();
    expect(headers['X-Webhook-ID']).toBeDefined();
    expect(headers['User-Agent']).toBe('K-Message-Webhook/1.0');
  });

  test('should verify timestamp within tolerance', () => {
    const currentTime = Math.floor(Date.now() / 1000).toString();
    const oldTime = (Math.floor(Date.now() / 1000) - 600).toString(); // 10분 전
    
    expect(securityManager.verifyTimestamp(currentTime, 300)).toBe(true);
    expect(securityManager.verifyTimestamp(oldTime, 300)).toBe(false);
  });
});

describe('RetryManager', () => {
  let retryManager: RetryManager;
  let config: WebhookConfig;

  beforeEach(() => {
    config = createTestConfig();
    retryManager = new RetryManager(config);
  });

  test('should calculate next retry time', () => {
    const nextRetry = retryManager.calculateNextRetry(1);
    expect(nextRetry).toBeInstanceOf(Date);
    expect(nextRetry.getTime()).toBeGreaterThan(Date.now());
  });

  test('should determine retry eligibility', () => {
    expect(retryManager.shouldRetry(0)).toBe(true);
    expect(retryManager.shouldRetry(1)).toBe(true);
    expect(retryManager.shouldRetry(3)).toBe(false); // exceeds maxRetries
  });

  test('should handle retryable errors', () => {
    const networkError = new Error('ECONNRESET');
    const timeoutError = new Error('Request timeout');
    const clientError = new Error('Bad request');
    
    expect(retryManager.shouldRetry(1, networkError)).toBe(true);
    expect(retryManager.shouldRetry(1, timeoutError)).toBe(true);
    expect(retryManager.shouldRetry(1, clientError)).toBe(false);
  });

  test('should determine retry based on HTTP status', () => {
    expect(retryManager.shouldRetryStatus(500)).toBe(true); // Server error
    expect(retryManager.shouldRetryStatus(502)).toBe(true); // Bad Gateway
    expect(retryManager.shouldRetryStatus(429)).toBe(true); // Too Many Requests
    expect(retryManager.shouldRetryStatus(400)).toBe(false); // Bad Request
    expect(retryManager.shouldRetryStatus(404)).toBe(false); // Not Found
    expect(retryManager.shouldRetryStatus(200)).toBe(false); // Success
  });

  test('should calculate backoff delay', () => {
    const delay1 = retryManager.getBackoffDelay(1);
    const delay2 = retryManager.getBackoffDelay(2);
    const delay3 = retryManager.getBackoffDelay(3);
    
    expect(delay1).toBe(2000); // 1000 * 2^1
    expect(delay2).toBe(4000); // 1000 * 2^2
    expect(delay3).toBe(8000); // 1000 * 2^3
  });
});

describe('EndpointManager', () => {
  let endpointManager: EndpointManager;

  beforeEach(() => {
    endpointManager = new EndpointManager({
      type: 'memory',
      retentionDays: 30
    });
  });

  afterEach(async () => {
    await endpointManager.shutdown();
  });

  test('should add and retrieve endpoints', async () => {
    const endpointData = createTestEndpoint();
    const endpoint: WebhookEndpoint = {
      ...endpointData,
      id: 'test-endpoint',
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active'
    };

    await endpointManager.addEndpoint(endpoint);
    
    const retrieved = await endpointManager.getEndpoint(endpoint.id);
    expect(retrieved).toBeDefined();
    expect(retrieved!.id).toBe(endpoint.id);
    expect(retrieved!.url).toBe(endpoint.url);
  });

  test('should search endpoints with filters', async () => {
    const endpoints: WebhookEndpoint[] = [
      {
        ...createTestEndpoint([WebhookEventType.MESSAGE_SENT]),
        id: 'endpoint-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active'
      },
      {
        ...createTestEndpoint([WebhookEventType.MESSAGE_DELIVERED]),
        id: 'endpoint-2',
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'inactive'
      }
    ];

    for (const endpoint of endpoints) {
      await endpointManager.addEndpoint(endpoint);
    }

    // Search by status
    const activeEndpoints = await endpointManager.searchEndpoints(
      { status: 'active' },
      { page: 1, limit: 10 }
    );
    
    expect(activeEndpoints.items.length).toBe(1);
    expect(activeEndpoints.items[0].status).toBe('active');

    // Search by event type
    const sentEventEndpoints = await endpointManager.searchEndpoints(
      { events: [WebhookEventType.MESSAGE_SENT] },
      { page: 1, limit: 10 }
    );
    
    expect(sentEventEndpoints.items.length).toBe(1);
    expect(sentEventEndpoints.items[0].events).toContain(WebhookEventType.MESSAGE_SENT);
  });

  test('should get active endpoints for specific event', async () => {
    const endpoint: WebhookEndpoint = {
      ...createTestEndpoint([WebhookEventType.MESSAGE_SENT, WebhookEventType.MESSAGE_DELIVERED]),
      id: 'test-endpoint',
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active'
    };

    await endpointManager.addEndpoint(endpoint);
    
    const activeEndpoints = await endpointManager.getActiveEndpointsForEvent(WebhookEventType.MESSAGE_SENT);
    expect(activeEndpoints.length).toBe(1);
    expect(activeEndpoints[0].id).toBe(endpoint.id);
  });

  test('should get endpoint statistics', async () => {
    const endpoints: WebhookEndpoint[] = [
      {
        ...createTestEndpoint([WebhookEventType.MESSAGE_SENT]),
        id: 'endpoint-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active'
      },
      {
        ...createTestEndpoint([WebhookEventType.MESSAGE_DELIVERED]),
        id: 'endpoint-2',
        createdAt: new Date(),  
        updatedAt: new Date(),
        status: 'inactive'
      }
    ];

    for (const endpoint of endpoints) {
      await endpointManager.addEndpoint(endpoint);
    }

    const stats = endpointManager.getStats();
    
    expect(stats.totalEndpoints).toBe(2);
    expect(stats.activeEndpoints).toBe(1);
    expect(stats.inactiveEndpoints).toBe(1);
    expect(stats.eventSubscriptions[WebhookEventType.MESSAGE_SENT]).toBe(1);
    expect(stats.eventSubscriptions[WebhookEventType.MESSAGE_DELIVERED]).toBe(1);
  });
});

describe('DeliveryStore', () => {
  let deliveryStore: DeliveryStore;

  beforeEach(() => {
    deliveryStore = new DeliveryStore({
      type: 'memory',
      retentionDays: 7,
      maxMemoryUsage: 10 * 1024 * 1024 // 10MB
    });
  });

  afterEach(async () => {
    await deliveryStore.shutdown();
  });

  test('should save and retrieve deliveries', async () => {
    const delivery: WebhookDelivery = {
      id: 'test-delivery',
      endpointId: 'test-endpoint',
      eventId: 'test-event',
      url: 'https://webhook.example.com/test',
      httpMethod: 'POST',
      headers: { 'Content-Type': 'application/json' },
      payload: JSON.stringify({ test: 'data' }),
      attempts: [{
        attemptNumber: 1,
        timestamp: new Date(),
        httpStatus: 200,
        responseBody: 'OK',
        latencyMs: 250
      }],
      status: 'success',
      createdAt: new Date(),
      completedAt: new Date()
    };

    await deliveryStore.saveDelivery(delivery);
    
    const retrieved = await deliveryStore.getDelivery(delivery.id);
    expect(retrieved).toBeDefined();
    expect(retrieved!.id).toBe(delivery.id);
    expect(retrieved!.status).toBe(delivery.status);
  });

  test('should search deliveries with filters', async () => {
    const deliveries: WebhookDelivery[] = [
      {
        id: 'delivery-1',
        endpointId: 'endpoint-1',
        eventId: 'event-1',
        url: 'https://webhook.example.com/test1',
        httpMethod: 'POST',
        headers: {},
        payload: '{}',
        attempts: [],
        status: 'success',
        createdAt: new Date(),
        completedAt: new Date()
      },
      {
        id: 'delivery-2',
        endpointId: 'endpoint-2',
        eventId: 'event-2',
        url: 'https://webhook.example.com/test2',
        httpMethod: 'POST',
        headers: {},
        payload: '{}',
        attempts: [],
        status: 'failed',
        createdAt: new Date()
      }
    ];

    for (const delivery of deliveries) {
      await deliveryStore.saveDelivery(delivery);
    }

    // Search by status
    const successfulDeliveries = await deliveryStore.searchDeliveries(
      { status: 'success' },
      { page: 1, limit: 10 }
    );
    
    expect(successfulDeliveries.items.length).toBe(1);
    expect(successfulDeliveries.items[0].status).toBe('success');

    // Search by endpoint
    const endpoint1Deliveries = await deliveryStore.searchDeliveries(
      { endpointId: 'endpoint-1' },
      { page: 1, limit: 10 }
    );
    
    expect(endpoint1Deliveries.items.length).toBe(1);
    expect(endpoint1Deliveries.items[0].endpointId).toBe('endpoint-1');
  });

  test('should get delivery statistics', async () => {
    const deliveries: WebhookDelivery[] = [
      {
        id: 'delivery-1',
        endpointId: 'test-endpoint',
        eventId: 'event-1',
        url: 'https://webhook.example.com/test',
        httpMethod: 'POST',
        headers: {},
        payload: '{}',
        attempts: [{ attemptNumber: 1, timestamp: new Date(), latencyMs: 200 }],
        status: 'success',
        createdAt: new Date(),
        completedAt: new Date()
      },
      {
        id: 'delivery-2',
        endpointId: 'test-endpoint',
        eventId: 'event-2',
        url: 'https://webhook.example.com/test',
        httpMethod: 'POST',
        headers: {},
        payload: '{}',
        attempts: [{ attemptNumber: 1, timestamp: new Date(), latencyMs: 500, error: 'Network error' }],
        status: 'failed',
        createdAt: new Date()
      }
    ];

    for (const delivery of deliveries) {
      await deliveryStore.saveDelivery(delivery);
    }

    const stats = await deliveryStore.getDeliveryStats('test-endpoint');
    
    expect(stats.totalDeliveries).toBe(2);
    expect(stats.successfulDeliveries).toBe(1);
    expect(stats.failedDeliveries).toBe(1);
    expect(stats.successRate).toBe(50);
    expect(stats.averageLatency).toBeGreaterThan(0);
    expect(stats.errorBreakdown['Network error']).toBe(1);
  });

  test('should get storage statistics', () => {
    const stats = deliveryStore.getStorageStats();
    
    expect(stats.totalDeliveries).toBeGreaterThanOrEqual(0);
    expect(stats.memoryUsage).toBeGreaterThanOrEqual(0);
    expect(stats.indexSizes.byEndpoint).toBeGreaterThanOrEqual(0);
    expect(stats.indexSizes.byStatus).toBeGreaterThanOrEqual(0);
    expect(stats.indexSizes.byDate).toBeGreaterThanOrEqual(0);
  });
});

describe('Integration Tests', () => {
  test('should handle complete webhook workflow', async () => {
    // 1. 설정
    const config = createTestConfig();
    const mockHttpClient = new MockHttpClient();
    const webhookService = new WebhookService(config, mockHttpClient);

    try {
      // 2. 엔드포인트 등록
      const endpointData = createTestEndpoint([WebhookEventType.MESSAGE_SENT]);
      const endpoint = await webhookService.registerEndpoint(endpointData);
      expect(endpoint.id).toBeDefined();

      // 3. 단일 이벤트 동기 전송 테스트
      const event = createTestEvent(WebhookEventType.MESSAGE_SENT);
      const deliveries = await webhookService.emitSync(event);
      expect(deliveries.length).toBe(1);
      expect(deliveries[0].endpointId).toBe(endpoint.id);

      // 4. 비동기 전송 테스트
      await webhookService.emit(event);

      // 5. 통계 조회
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const stats = await webhookService.getStats(endpoint.id, { start: oneHourAgo, end: now });
      
      expect(stats.endpointId).toBe(endpoint.id);
      expect(stats.totalDeliveries).toBeGreaterThanOrEqual(0);

    } finally {
      await webhookService.shutdown();
    }
  });

  test('should handle endpoint lifecycle management', async () => {
    const config = createTestConfig();
    const webhookService = new WebhookService(config);

    try {
      // 엔드포인트 생성
      const endpointData = createTestEndpoint();
      let endpoint = await webhookService.registerEndpoint(endpointData);
      
      // 엔드포인트 조회
      let retrieved = await webhookService.getEndpoint(endpoint.id);
      expect(retrieved).toBeDefined();
      expect(retrieved!.status).toBe('active');

      // 엔드포인트 일시정지
      await webhookService.pauseEndpoint(endpoint.id);
      retrieved = await webhookService.getEndpoint(endpoint.id);
      expect(retrieved!.status).toBe('suspended');

      // 엔드포인트 재개
      await webhookService.resumeEndpoint(endpoint.id);
      retrieved = await webhookService.getEndpoint(endpoint.id);
      expect(retrieved!.status).toBe('active');

      // 엔드포인트 업데이트
      const updates = { name: 'Updated Endpoint', active: false };
      const updated = await webhookService.updateEndpoint(endpoint.id, updates);
      expect(updated.name).toBe(updates.name);
      expect(updated.active).toBe(updates.active);

      // 엔드포인트 삭제
      await webhookService.deleteEndpoint(endpoint.id);
      const deleted = await webhookService.getEndpoint(endpoint.id);
      expect(deleted).toBeNull();

    } finally {
      await webhookService.shutdown();
    }
  });

  test('should handle error scenarios gracefully', async () => {
    const config = createTestConfig();
    const webhookService = new WebhookService(config);

    try {
      // 존재하지 않는 엔드포인트 조회
      const nonExistent = await webhookService.getEndpoint('non-existent-id');
      expect(nonExistent).toBeNull();

      // 존재하지 않는 엔드포인트 업데이트 시도
      await expect(webhookService.updateEndpoint('non-existent-id', { name: 'Test' }))
        .rejects.toThrow('not found');

      // 존재하지 않는 엔드포인트 테스트 시도
      await expect(webhookService.testEndpoint('non-existent-id'))
        .rejects.toThrow('not found');

      // 비활성화된 이벤트 타입 전송
      const disabledEvent = createTestEvent(WebhookEventType.TEMPLATE_CREATED);
      
      // Should not throw (just silently ignore)
      await webhookService.emit(disabledEvent);
      expect(true).toBe(true);

    } finally {
      await webhookService.shutdown();
    }
  });
});