import {
  AlimTalkProvider,
  AlimTalkRequest,
  AlimTalkResult,
  ProviderCapabilities,
  TemplateContract,
  ChannelContract,
  MessagingContract,
  AnalyticsContract,
  AccountContract,
  ProviderConfiguration,
  ConfigurationField
} from '../contracts/provider.contract';
import type { DeliveryStatus, ConfigurationSchema } from '@k-msg/core';

export abstract class BaseAlimTalkProvider implements AlimTalkProvider {
  public abstract readonly id: string;
  public abstract readonly name: string;
  public readonly type: 'messaging' = 'messaging';
  public abstract readonly version: string;
  public abstract readonly capabilities: ProviderCapabilities;
  
  protected config: Record<string, unknown> = {};
  protected isConfigured: boolean = false;

  // Abstract contracts - must be implemented by concrete providers
  public abstract templates: TemplateContract;
  public abstract channels: ChannelContract;
  public abstract messaging: MessagingContract;
  public abstract analytics: AnalyticsContract;
  public abstract account: AccountContract;

  constructor(config?: Record<string, unknown>) {
    if (config) {
      this.configure(config);
    }
  }

  /**
   * Configure the provider with necessary credentials and settings
   */
  public configure(config: Record<string, unknown>): void {
    this.validateConfiguration(config);
    this.config = { ...config };
    this.isConfigured = true;
    this.onConfigured();
  }

  // BaseProvider 필수 메서드들
  public abstract send<T extends AlimTalkRequest = AlimTalkRequest, R extends AlimTalkResult = AlimTalkResult>(request: T): Promise<R>;
  public abstract getStatus(requestId: string): Promise<DeliveryStatus>;
  public abstract cancel?(requestId: string): Promise<boolean>;
  public abstract getSupportedFeatures(): string[];
  public abstract getConfigurationSchema(): ConfigurationSchema;

  // 기존 메서드들
  public abstract getProviderConfiguration(): ProviderConfiguration;

  /**
   * Validate the provided configuration
   */
  protected validateConfiguration(config: Record<string, unknown>): void {
    const schema = this.getProviderConfiguration();
    
    // Check required fields
    for (const field of schema.required) {
      if (!(field.key in config)) {
        throw new Error(`Required configuration field '${field.key}' is missing`);
      }
      
      this.validateFieldValue(field, config[field.key]);
    }

    // Check optional fields if provided
    for (const field of schema.optional) {
      if (field.key in config) {
        this.validateFieldValue(field, config[field.key]);
      }
    }
  }

  private validateFieldValue(field: ConfigurationField, value: unknown): void {
    // Type validation
    switch (field.type) {
      case 'string':
        if (typeof value !== 'string') {
          throw new Error(`Field '${field.key}' must be a string`);
        }
        break;
      case 'number':
        if (typeof value !== 'number') {
          throw new Error(`Field '${field.key}' must be a number`);
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          throw new Error(`Field '${field.key}' must be a boolean`);
        }
        break;
      case 'url':
        try {
          new URL(String(value));
        } catch {
          throw new Error(`Field '${field.key}' must be a valid URL`);
        }
        break;
    }

    // Additional validation
    if (field.validation) {
      if (field.validation.pattern) {
        const regex = new RegExp(field.validation.pattern);
        if (!regex.test(String(value))) {
          throw new Error(`Field '${field.key}' does not match required pattern`);
        }
      }
      
      if (field.validation.min !== undefined && Number(value) < field.validation.min) {
        throw new Error(`Field '${field.key}' must be at least ${field.validation.min}`);
      }
      
      if (field.validation.max !== undefined && Number(value) > field.validation.max) {
        throw new Error(`Field '${field.key}' must be at most ${field.validation.max}`);
      }
    }
  }

  /**
   * Called after configuration is set
   */
  protected onConfigured(): void {
    // Override in concrete implementations if needed
  }

  /**
   * Check if the provider is properly configured
   */
  public isReady(): boolean {
    return this.isConfigured;
  }

  /**
   * Get configuration value
   */
  protected getConfig<T = unknown>(key: string): T {
    if (!this.isConfigured) {
      throw new Error('Provider is not configured');
    }
    return this.config[key] as T;
  }

  /**
   * Check if a configuration key exists
   */
  protected hasConfig(key: string): boolean {
    return key in this.config;
  }

  // BaseProvider getCapabilities 구현
  public getCapabilities() {
    return this.capabilities;
  }

  /**
   * Perform health check on the provider
   */
  public async healthCheck(): Promise<{
    healthy: boolean;
    issues: string[];
    latency?: number;
  }> {
    const issues: string[] = [];
    const startTime = Date.now();

    try {
      if (!this.isReady()) {
        issues.push('Provider is not configured');
        return { healthy: false, issues };
      }

      // Test basic connectivity
      await this.testConnectivity();
      
      // Test authentication
      await this.testAuthentication();

      const latency = Date.now() - startTime;
      
      return {
        healthy: issues.length === 0,
        issues,
        latency
      };

    } catch (error) {
      issues.push(`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        healthy: false,
        issues,
        latency: Date.now() - startTime
      };
    }
  }

  /**
   * Test basic connectivity to the provider
   */
  protected abstract testConnectivity(): Promise<void>;

  /**
   * Test authentication with the provider
   */
  protected abstract testAuthentication(): Promise<void>;

  /**
   * Get provider information
   */
  public getInfo(): {
    id: string;
    name: string;
    version: string;
    capabilities: ProviderCapabilities;
    configured: boolean;
  } {
    return {
      id: this.id,
      name: this.name,
      version: this.getVersion(),
      capabilities: this.capabilities,
      configured: this.isConfigured
    };
  }

  /**
   * Get provider version
   */
  protected abstract getVersion(): string;

  /**
   * Cleanup resources when provider is destroyed
   */
  public destroy(): void {
    this.config = {};
    this.isConfigured = false;
    this.onDestroy();
  }

  /**
   * Called when provider is being destroyed
   */
  protected onDestroy(): void {
    // Override in concrete implementations if needed
  }

  /**
   * Create standardized error
   */
  protected createError(code: string, message: string, details?: Record<string, unknown>): Error {
    const error = new Error(message) as Error & { code?: string; provider?: string; details?: Record<string, unknown> };
    error.code = code;
    error.provider = this.id;
    error.details = details;
    return error;
  }

  /**
   * Log provider activity
   */
  protected log(level: 'info' | 'warn' | 'error', message: string, data?: unknown): void {
    const logData: Record<string, unknown> = {
      provider: this.id,
      level,
      message,
      timestamp: new Date().toISOString()
    };

    if (data) {
      logData.data = data;
    }

    // In a real implementation, this would use a proper logging system
    console.log(JSON.stringify(logData));
  }

  /**
   * Handle rate limiting
   */
  protected async handleRateLimit(operation: string): Promise<void> {
    // In a real implementation, this would check rate limits and implement backoff
    const rateLimit = this.capabilities.messaging.maxRequestsPerSecond;
    
    // Simple implementation - can be enhanced with proper rate limiting
    if (rateLimit > 0) {
      const delay = 1000 / rateLimit;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  /**
   * Retry mechanism for failed operations
   */
  protected async withRetry<T>(
    operation: () => Promise<T>,
    options: {
      maxRetries?: number;
      initialDelay?: number;
      maxDelay?: number;
      backoffFactor?: number;
    } = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      initialDelay = 1000,
      maxDelay = 10000,
      backoffFactor = 2
    } = options;

    let lastError: Error;
    let delay = initialDelay;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          break; // No more retries
        }

        this.log('warn', `Operation failed, retrying in ${delay}ms`, {
          attempt: attempt + 1,
          maxRetries,
          error: lastError.message
        });

        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * backoffFactor, maxDelay);
      }
    }

    throw lastError!;
  }
}