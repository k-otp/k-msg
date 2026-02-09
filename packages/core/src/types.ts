export type MessageType = 'ALIMTALK' | 'FRIENDTALK' | 'SMS' | 'LMS' | 'MMS';

export interface BaseOptions {
  to: string;
  from: string;
  messageId?: string;
}

export interface AlimTalkOptions extends BaseOptions {
  type: 'ALIMTALK';
  templateId: string;
  variables: Record<string, string>;
}

export interface Button {
  name: string;
  type: string;
  urlPc?: string;
  urlMobile?: string;
}

export interface FriendTalkOptions extends BaseOptions {
  type: 'FRIENDTALK';
  text: string;
  imageUrl?: string;
  buttons?: Button[];
}

export interface SmsOptions extends BaseOptions {
  type: 'SMS' | 'LMS' | 'MMS';
  text: string;
  subject?: string;
}

export type SendOptions = AlimTalkOptions | FriendTalkOptions | SmsOptions;

export interface SendResult {
  messageId: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  provider: string;
}

// Improved / Universal Provider Types
export interface ProviderHealthStatus {
  healthy: boolean;
  issues: string[];
  latency?: number;
  data?: Record<string, unknown>;
}

export interface PlatformHealthStatus {
  healthy: boolean;
  providers: Record<string, boolean>;
  issues: string[];
}

export interface PlatformInfo {
  version: string;
  providers: string[];
  features: string[];
}

export interface MessageSendOptions {
  templateId: string;
  recipients: {
    phoneNumber: string;
    variables?: Record<string, any>;
  }[];
  variables: Record<string, any>;
}

export interface MessageSendResult {
  results: Array<{
    messageId?: string;
    status: string;
    phoneNumber: string;
    error?: {
      message: string;
    };
  }>;
  summary: {
    total: number;
    sent: number;
    failed: number;
  };
}

export type ProviderType =
  | 'messaging'
  | 'sms'
  | 'email'
  | 'push'
  | 'voice';

export interface ProviderConfig {
  apiKey: string;
  baseUrl: string;
  timeout?: number;
  retries?: number;
  debug?: boolean;
  [key: string]: any;
}

export interface ConfigurationSchema {
  required: ConfigField[];
  optional: ConfigField[];
}

export interface ConfigField {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'url' | 'secret';
  description: string;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    enum?: string[];
  };
}

export interface DeliveryStatus {
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'cancelled';
  timestamp: Date;
  details?: Record<string, unknown>;
}

export enum StandardStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export enum StandardErrorCode {
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  INVALID_REQUEST = 'INVALID_REQUEST',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  TEMPLATE_NOT_FOUND = 'TEMPLATE_NOT_FOUND',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  PROVIDER_ERROR = 'PROVIDER_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR'
}

export interface StandardError {
  code: StandardErrorCode;
  message: string;
  retryable: boolean;
  details?: Record<string, any>;
}

export interface StandardRequest {
  templateCode: string;
  phoneNumber: string;
  variables: Record<string, any>;
  options?: {
    scheduledAt?: Date;
    senderNumber?: string;
    subject?: string;
    [key: string]: any;
  };
}

export interface StandardResult {
  messageId: string;
  status: StandardStatus;
  provider: string;
  timestamp: Date;
  phoneNumber: string;
  error?: StandardError;
  metadata?: Record<string, any>;
}

export interface ProviderMetadata {
  id: string;
  name: string;
  version: string;
  description?: string;
  supportedFeatures: string[];
  capabilities: Record<string, any>;
  endpoints: Record<string, string>;
  authType?: string;
  responseFormat?: string;
}

export interface ProviderFactoryConfig {
  providers: Record<string, ProviderConfig>;
}

// Interfaces for classes to implement
export abstract class BaseProviderAdapter {
  protected config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  abstract adaptRequest(request: StandardRequest): any;
  abstract adaptResponse(response: any): StandardResult;
  abstract mapError(error: any): StandardError;
  abstract getAuthHeaders(): Record<string, string>;
  abstract getBaseUrl(): string;
  abstract getEndpoint(operation: string): string;

  public getRequestConfig(): RequestInit {
    return {
      method: 'POST',
      headers: this.getAuthHeaders()
    };
  }

  public validateResponse(response: Response): boolean {
    return response.ok;
  }

  protected generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  protected log(message: string, data?: any): void {
    if (this.config.debug) {
      console.log(`[Adapter] ${message}`, data || '');
    }
  }

  public isRetryableError(error: any): boolean {
    return false;
  }
}

export interface BaseProvider<TRequest = StandardRequest, TResult = StandardResult> {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly version: string;
  healthCheck(): Promise<ProviderHealthStatus>;
  send<T extends TRequest = TRequest, R extends TResult = TResult>(request: T): Promise<R>;
  getStatus?(requestId: string): Promise<DeliveryStatus>;
  cancel?(requestId: string): Promise<boolean>;
  destroy?(): void;
}

export interface AdapterFactory {
  create(config: ProviderConfig): any;
  supports(providerId: string): boolean;
  getMetadata(): ProviderMetadata;
}

export interface KMsg {
  getInfo(): PlatformInfo;
  registerProvider(provider: any): void;
  getProvider(providerId: string): any | null;
  listProviders(): string[];
  healthCheck(): Promise<PlatformHealthStatus>;
  messages: {
    send(options: MessageSendOptions): Promise<MessageSendResult>;
    getStatus(messageId: string): Promise<string>;
  };
}

export interface Config {
  defaultProvider?: string;
  providers: string[];
  features: {
    enableBulkSending?: boolean;
    enableScheduling?: boolean;
    enableAnalytics?: boolean;
  };
}

export enum TemplateCategory {
  AUTHENTICATION = 'AUTHENTICATION',
  NOTIFICATION = 'NOTIFICATION',
  PROMOTION = 'PROMOTION',
  INFORMATION = 'INFORMATION',
  RESERVATION = 'RESERVATION',
  SHIPPING = 'SHIPPING',
  PAYMENT = 'PAYMENT'
}
