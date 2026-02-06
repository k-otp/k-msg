import type { KMsg, BaseProvider, Config, PlatformInfo, PlatformHealthStatus, MessageSendOptions, MessageSendResult } from './index';
/**
 * Core AlimTalk Platform implementation
 */
export declare class AlimTalkPlatform implements KMsg {
    private providers;
    private config;
    private defaultProvider?;
    constructor(config: Config);
    getInfo(): PlatformInfo;
    registerProvider(provider: BaseProvider): void;
    getProvider(providerId: string): BaseProvider | null;
    listProviders(): string[];
    getDefaultProvider(): BaseProvider | null;
    healthCheck(): Promise<PlatformHealthStatus>;
    get messages(): {
        send: (options: MessageSendOptions) => Promise<MessageSendResult>;
        getStatus: (messageId: string) => Promise<string>;
    };
    templates(providerId?: string): Promise<{
        list: (page?: number, size?: number, filters?: any) => Promise<any>;
        create: (name: string, content: string, category?: string, variables?: any[], buttons?: any[]) => Promise<any>;
        modify: (templateCode: string, name: string, content: string, buttons?: any[]) => Promise<any>;
        delete: (templateCode: string) => Promise<any>;
    }>;
    history(providerId?: string): Promise<{
        list: (page?: number, size?: number, filters?: any) => Promise<any>;
        cancelReservation: (messageId: string) => Promise<any>;
    }>;
    providerHealth(providerId: string): Promise<import("./index").ProviderHealthStatus>;
}
//# sourceMappingURL=platform.d.ts.map