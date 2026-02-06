/**
 * Core AlimTalk Platform types and interfaces
 */
export * from './errors';
export * from './test-utils';
export * from './retry';
export * from './platform';
export interface ProviderHealthStatus {
    healthy: boolean;
    issues: string[];
    data?: {
        balance?: string;
        status?: string;
        code?: number;
        message?: string;
    };
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
export interface BaseProvider {
    id: string;
    name: string;
    healthCheck(): Promise<ProviderHealthStatus>;
    sendMessage?(templateCode: string, phoneNumber: string, variables: Record<string, any>, options?: any): Promise<any>;
    getTemplates?(page: number, size: number, filters?: any): Promise<any>;
    createTemplate?(name: string, content: string, category?: string, variables?: any[], buttons?: any[]): Promise<any>;
    modifyTemplate?(templateCode: string, name: string, content: string, buttons?: any[]): Promise<any>;
    deleteTemplate?(templateCode: string): Promise<any>;
    getHistory?(page: number, size: number, filters?: any): Promise<any>;
    cancelReservation?(messageId: string): Promise<any>;
}
/**
 * Core AlimTalk Platform interface
 */
export interface KMsg {
    getInfo(): PlatformInfo;
    registerProvider(provider: BaseProvider): void;
    getProvider(providerId: string): BaseProvider | null;
    listProviders(): string[];
    healthCheck(): Promise<PlatformHealthStatus>;
    messages: {
        send(options: MessageSendOptions): Promise<MessageSendResult>;
        getStatus(messageId: string): Promise<string>;
    };
}
/**
 * Configuration interface
 */
export interface Config {
    providers: string[];
    defaultProvider: string;
    features: {
        enableBulkSending?: boolean;
        enableScheduling?: boolean;
        enableAnalytics?: boolean;
    };
}
/**
 * Template categories
 */
export declare enum TemplateCategory {
    AUTHENTICATION = "AUTHENTICATION",
    NOTIFICATION = "NOTIFICATION",
    PROMOTION = "PROMOTION",
    INFORMATION = "INFORMATION",
    RESERVATION = "RESERVATION",
    SHIPPING = "SHIPPING",
    PAYMENT = "PAYMENT"
}
//# sourceMappingURL=index.d.ts.map