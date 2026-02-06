import type { ProviderPlugin, ProviderConfig, Logger, MetricsCollector, PluginStorage } from '../interfaces';
export declare class PluginRegistry {
    private plugins;
    private instances;
    register(plugin: ProviderPlugin): void;
    create(pluginId: string, config: ProviderConfig, options?: {
        logger?: Logger;
        metrics?: MetricsCollector;
        storage?: PluginStorage;
    }): Promise<ProviderPlugin>;
    loadAndCreate(pluginId: string, config: ProviderConfig, options?: any): Promise<ProviderPlugin>;
    getSupportedTypes(): string[];
    validateProviderConfig(type: string, config: ProviderConfig): boolean;
    destroyAll(): Promise<void>;
}
//# sourceMappingURL=plugin-registry.d.ts.map