import type { ProviderPlugin, ProviderMetadata, ProviderCapabilities, PluginContext, ProviderMiddleware, ProviderImplementation } from '../interfaces';
export declare abstract class BasePlugin implements ProviderPlugin {
    abstract readonly metadata: ProviderMetadata;
    abstract readonly capabilities: ProviderCapabilities;
    protected context: PluginContext;
    middleware: ProviderMiddleware[];
    initialize(context: PluginContext): Promise<void>;
    destroy(): Promise<void>;
    abstract getImplementation(): ProviderImplementation;
    protected executeMiddleware(phase: 'pre' | 'post' | 'error', context: any, error?: Error): Promise<void>;
    protected createMiddlewareContext(request: any, metadata?: Record<string, any>): {
        request: any;
        response: any;
        metadata: {
            pluginName: string;
            pluginVersion: string;
        };
        startTime: number;
    };
    protected validateConfig(config: any, required: string[]): void;
    protected makeRequest(url: string, options: RequestInit, metadata?: Record<string, any>): Promise<Response>;
    /**
     * Make HTTP request and parse JSON response
     * Subclasses should use their specific response adapters to transform the result
     */
    protected makeJSONRequest<T = any>(url: string, options: RequestInit, metadata?: Record<string, any>): Promise<T>;
    /**
     * Helper method for logging provider-specific operations
     */
    protected logOperation(operation: string, data?: any): void;
    /**
     * Helper method for logging provider-specific errors
     */
    protected logError(operation: string, error: any, data?: any): void;
}
