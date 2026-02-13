import type { StandardRequest, StandardResult, DeliveryStatus } from './standard';

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

export interface ProviderHealthStatus {
    healthy: boolean;
    issues: string[];
    latency?: number;
    data?: Record<string, unknown>;
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

export abstract class BaseProviderAdapter {
    protected config: ProviderConfig;

    constructor(config: ProviderConfig) {
        this.config = config;
    }

    abstract adaptRequest(request: StandardRequest): any;
    abstract adaptResponse(response: any): StandardResult;
    abstract mapError(error: any): import('./standard').StandardError;
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
