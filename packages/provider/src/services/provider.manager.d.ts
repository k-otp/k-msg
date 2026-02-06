import type { BaseProvider } from '@k-msg/core';
export declare class ProviderManager {
    private providers;
    private defaultProvider?;
    registerProvider(provider: BaseProvider): void;
    unregisterProvider(providerId: string): void;
    getProvider(providerId?: string): BaseProvider | null;
    listProviders(): BaseProvider[];
    setDefaultProvider(providerId: string): void;
    healthCheckAll(): Promise<Record<string, boolean>>;
    getProvidersForChannel(channel: string): BaseProvider[];
}
//# sourceMappingURL=provider.manager.d.ts.map