import type {
  ProviderPlugin,
  ProviderMetadata,
  ProviderCapabilities,
  PluginContext,
  ProviderMiddleware,
  ProviderImplementation
} from '../interfaces';

export abstract class BasePlugin implements ProviderPlugin {
  abstract readonly metadata: ProviderMetadata;
  abstract readonly capabilities: ProviderCapabilities;

  protected context!: PluginContext;
  public middleware: ProviderMiddleware[] = [];

  async initialize(context: PluginContext): Promise<void> {
    this.context = context;
    this.context.logger.info(`Initializing plugin: ${this.metadata.name}`);
  }

  async destroy(): Promise<void> {
    this.context.logger.info(`Destroying plugin: ${this.metadata.name}`);
    // 서브클래스에서 오버라이드 가능
  }

  abstract getImplementation(): ProviderImplementation;

  protected async executeMiddleware(
    phase: 'pre' | 'post' | 'error',
    context: any,
    error?: Error
  ): Promise<void> {
    for (const middleware of this.middleware) {
      try {
        if (phase === 'pre' && middleware.pre) {
          await middleware.pre(context);
        } else if (phase === 'post' && middleware.post) {
          await middleware.post(context);
        } else if (phase === 'error' && middleware.error && error) {
          await middleware.error(error, context);
        }
      } catch (err) {
        this.context.logger.error(`Middleware ${middleware.name} failed`, err);
        throw err;
      }
    }
  }

  protected createMiddlewareContext(request: any, metadata: Record<string, any> = {}) {
    return {
      request,
      response: undefined as any,
      metadata: {
        ...metadata,
        pluginName: this.metadata.name,
        pluginVersion: this.metadata.version
      },
      startTime: Date.now()
    };
  }

  protected validateConfig(config: any, required: string[]): void {
    for (const field of required) {
      if (!config[field]) {
        throw new Error(`${this.metadata.name}: Missing required config field: ${field}`);
      }
    }
  }

  protected async makeRequest(
    url: string,
    options: RequestInit,
    metadata: Record<string, any> = {}
  ): Promise<Response> {
    const context = this.createMiddlewareContext({ url, options }, metadata);

    try {
      await this.executeMiddleware('pre', context);

      const response = await fetch(url, {
        ...options,
        headers: {
          'User-Agent': `K-OTP-${this.metadata.name}/${this.metadata.version}`,
          ...this.context.config.headers,
          ...options.headers,
        },
        signal: AbortSignal.timeout(this.context.config.timeout || 30000)
      });

      context.response = response;
      await this.executeMiddleware('post', context);

      return response;
    } catch (error) {
      await this.executeMiddleware('error', context, error as Error);
      throw error;
    }
  }

  /**
   * Make HTTP request and parse JSON response
   * Subclasses should use their specific response adapters to transform the result
   */
  protected async makeJSONRequest<T = any>(
    url: string,
    options: RequestInit,
    metadata: Record<string, any> = {}
  ): Promise<T> {
    const response = await this.makeRequest(url, options, metadata);

    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
      (error as any).response = response;
      (error as any).status = response.status;
      throw error;
    }

    try {
      return await response.json() as T;
    } catch (parseError) {
      const error = new Error('Failed to parse JSON response');
      (error as any).response = response;
      (error as any).parseError = parseError;
      throw error;
    }
  }

  /**
   * Helper method for logging provider-specific operations
   */
  protected logOperation(operation: string, data?: any): void {
    this.context.logger.info(`${this.metadata.name}: ${operation}`, data);
  }

  /**
   * Helper method for logging provider-specific errors
   */
  protected logError(operation: string, error: any, data?: any): void {
    this.context.logger.error(`${this.metadata.name}: ${operation} failed`, { error, data });
  }
}