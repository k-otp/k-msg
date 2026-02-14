import type { EventEmitter } from "events";

export interface ProviderPlugin {
  readonly metadata: ProviderMetadata;
  readonly capabilities: ProviderCapabilities;

  initialize(context: PluginContext): Promise<void>;
  destroy(): Promise<void>;

  middleware?: ProviderMiddleware[];
  getImplementation(): ProviderImplementation;
}

export interface ProviderMetadata {
  name: string;
  version: string;
  author: string;
  description: string;
  homepage?: string;
  repository?: string;
}

export interface ProviderCapabilities {
  messaging: {
    single: boolean;
    bulk: boolean;
    maxBulkSize?: number;
    maxMessageLength?: number;
    variableSupport?: boolean;
    maxVariables?: number;
  };

  scheduling?: {
    supported: boolean;
    maxAdvanceDays?: number;
    minAdvanceMinutes?: number;
    modifiable?: boolean;
    cancellable?: boolean;
  };

  templating?: {
    supported: boolean;
    crud: boolean;
    validation: boolean;
    buttonTypes?: string[];
    maxButtons?: number;
    reviewRequired?: boolean;
    reviewTime?: string;
  };

  resending?: {
    supported: boolean;
    fallbackTypes?: string[];
    customContent?: boolean;
  };

  webhooks?: {
    delivery: boolean;
    status: boolean;
  };

  rateLimit?: {
    messagesPerSecond?: number;
    messagesPerMinute?: number;
    messagesPerHour?: number;
    messagesPerDay?: number;
  };
}

export interface PluginContext {
  config: ProviderConfig;
  logger: Logger;
  metrics: MetricsCollector;
  storage: PluginStorage;
  eventBus: EventEmitter;
}

export interface ProviderConfig {
  apiUrl: string;
  apiKey?: string;
  secretKey?: string;
  userId?: string;
  senderKey?: string;
  plusFriendId?: string;
  headers?: Record<string, string>;
  customFields?: Record<string, any>;
  timeout?: number;
  retryConfig?: RetryConfig;
  logLevel?: string;
}

export interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  retryableErrors?: string[];
  retryableStatusCodes?: number[];
}

export interface Logger {
  info(message: string, ...args: any[]): void;
  error(message: string, error?: any): void;
  debug(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
}

export interface MetricsCollector {
  increment(metric: string, labels?: Record<string, string>): void;
  histogram(
    metric: string,
    value: number,
    labels?: Record<string, string>,
  ): void;
  gauge(metric: string, value: number, labels?: Record<string, string>): void;
}

export interface PluginStorage {
  get(key: string): Promise<any>;
  set(key: string, value: any, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
}

import type {
  AnalyticsService,
  BalanceService,
  HistoryService,
  MessagingService,
  SchedulingService,
  TemplatingService,
  WebhookService,
} from "./services";

export interface ProviderImplementation {
  messaging: MessagingService;
  scheduling?: SchedulingService;
  templating?: TemplatingService;
  analytics?: AnalyticsService;
  webhooks?: WebhookService;
  balance?: BalanceService;
  history?: HistoryService;
}

export interface ProviderMiddleware {
  name: string;
  pre?: (context: MiddlewareContext) => Promise<void>;
  post?: (context: MiddlewareContext) => Promise<void>;
  error?: (error: Error, context: MiddlewareContext) => Promise<void>;
}

export interface MiddlewareContext {
  request: any;
  response?: any;
  metadata: Record<string, any>;
  startTime: number;
}
