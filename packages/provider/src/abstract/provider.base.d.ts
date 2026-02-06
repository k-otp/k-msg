import { AlimTalkProvider, ProviderCapabilities, TemplateContract, ChannelContract, MessagingContract, AnalyticsContract, AccountContract, ProviderConfiguration } from '../contracts/provider.contract';
export declare abstract class BaseAlimTalkProvider implements AlimTalkProvider {
    abstract readonly id: string;
    abstract readonly name: string;
    abstract readonly capabilities: ProviderCapabilities;
    protected config: Record<string, unknown>;
    protected isConfigured: boolean;
    abstract templates: TemplateContract;
    abstract channels: ChannelContract;
    abstract messaging: MessagingContract;
    abstract analytics: AnalyticsContract;
    abstract account: AccountContract;
    constructor(config?: Record<string, unknown>);
    /**
     * Configure the provider with necessary credentials and settings
     */
    configure(config: Record<string, unknown>): void;
    /**
     * Get the configuration schema for this provider
     */
    abstract getConfigurationSchema(): ProviderConfiguration;
    /**
     * Validate the provided configuration
     */
    protected validateConfiguration(config: Record<string, unknown>): void;
    private validateFieldValue;
    /**
     * Called after configuration is set
     */
    protected onConfigured(): void;
    /**
     * Check if the provider is properly configured
     */
    isReady(): boolean;
    /**
     * Get configuration value
     */
    protected getConfig<T = unknown>(key: string): T;
    /**
     * Check if a configuration key exists
     */
    protected hasConfig(key: string): boolean;
    /**
     * Perform health check on the provider
     */
    healthCheck(): Promise<{
        healthy: boolean;
        issues: string[];
        latency?: number;
    }>;
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
    getInfo(): {
        id: string;
        name: string;
        version: string;
        capabilities: ProviderCapabilities;
        configured: boolean;
    };
    /**
     * Get provider version
     */
    protected abstract getVersion(): string;
    /**
     * Cleanup resources when provider is destroyed
     */
    destroy(): void;
    /**
     * Called when provider is being destroyed
     */
    protected onDestroy(): void;
    /**
     * Create standardized error
     */
    protected createError(code: string, message: string, details?: Record<string, unknown>): Error;
    /**
     * Log provider activity
     */
    protected log(level: 'info' | 'warn' | 'error', message: string, data?: unknown): void;
    /**
     * Handle rate limiting
     */
    protected handleRateLimit(operation: string): Promise<void>;
    /**
     * Retry mechanism for failed operations
     */
    protected withRetry<T>(operation: () => Promise<T>, options?: {
        maxRetries?: number;
        initialDelay?: number;
        maxDelay?: number;
        backoffFactor?: number;
    }): Promise<T>;
}
//# sourceMappingURL=provider.base.d.ts.map