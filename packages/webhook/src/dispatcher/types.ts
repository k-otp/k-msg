/**
 * Dispatcher Type Definitions
 */

import type { WebhookEndpoint, WebhookEvent } from "../types/webhook.types";

export interface DispatchConfig {
  maxConcurrentRequests: number;
  requestTimeoutMs: number;
  defaultRetries: number;
  circuitBreakerThreshold: number;
  circuitBreakerTimeoutMs: number;
}

export interface BatchConfig {
  maxBatchSize: number;
  batchTimeoutMs: number;
  maxConcurrentBatches: number;
  enablePrioritization: boolean;
  priorityLevels: number;
}

export interface QueueConfig {
  maxQueueSize: number;
  persistToDisk: boolean;
  diskPath?: string;
  compressionEnabled: boolean;
  ttlMs: number;
}

export interface LoadBalancerConfig {
  strategy: "round-robin" | "least-connections" | "weighted" | "random";
  healthCheckInterval: number;
  healthCheckTimeoutMs: number;
  weights?: Record<string, number>;
}

export interface DispatchJob {
  id: string;
  event: WebhookEvent;
  endpoint: WebhookEndpoint;
  priority: number;
  createdAt: Date;
  scheduledAt: Date;
  attempts: number;
  maxAttempts: number;
  nextRetryAt?: Date;
}

export interface CircuitBreakerState {
  endpointId: string;
  state: "closed" | "open" | "half-open";
  failureCount: number;
  lastFailureTime?: Date;
  nextRetryTime?: Date;
}
