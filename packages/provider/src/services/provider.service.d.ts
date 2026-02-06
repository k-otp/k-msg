import type { BaseProvider } from '@k-msg/core';
/**
 * Manages the lifecycle and access to different messaging providers.
 */
export declare class ProviderService {
    private providers;
    private defaultProviderId?;
    /**
     * @param defaultProviderId The ID of the provider to use when none is specified.
     */
    constructor(defaultProviderId?: string);
    /**
     * Registers a new provider instance.
     * If no default provider is set, the first registered provider becomes the default.
     * @param provider The provider instance to register.
     */
    register(provider: BaseProvider): void;
    /**
     * Retrieves a provider by its unique ID.
     * @param providerId The ID of the provider.
     * @returns The provider instance or undefined if not found.
     */
    get(providerId: string): BaseProvider | undefined;
    /**
     * Retrieves the default provider.
     * @returns The default provider instance or undefined if not set.
     */
    getDefault(): BaseProvider | undefined;
    /**
     * Lists all registered providers.
     * @returns An array of all provider instances.
     */
    list(): BaseProvider[];
}
//# sourceMappingURL=provider.service.d.ts.map