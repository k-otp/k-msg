import type { BaseProvider, StandardRequest, StandardResult } from '@k-msg/core';
import type { AlimTalkProvider, AlimTalkRequest, AlimTalkResult } from '../contracts/provider.contract';
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
    register(provider: BaseProvider<StandardRequest, StandardResult>): void;
    /**
     * Retrieves a provider by its unique ID.
     * @param providerId The ID of the provider.
     * @returns The provider instance or undefined if not found.
     */
    get(providerId: string): BaseProvider<StandardRequest, StandardResult> | undefined;
    /**
     * Retrieves a typed AlimTalk provider by its unique ID.
     * @param providerId The ID of the provider.
     * @returns The AlimTalk provider instance or undefined if not found or not an AlimTalk provider.
     */
    getAlimTalk(providerId: string): AlimTalkProvider | undefined;
    /**
     * Retrieves the default provider.
     * @returns The default provider instance or undefined if not set.
     */
    getDefault(): BaseProvider<StandardRequest, StandardResult> | undefined;
    /**
     * Lists all registered providers.
     * @returns An array of all provider instances.
     */
    list(): BaseProvider<StandardRequest, StandardResult>[];
    /**
     * Lists all AlimTalk providers.
     * @returns An array of AlimTalk provider instances.
     */
    listAlimTalk(): AlimTalkProvider[];
    send<TRequest extends StandardRequest, TResult extends StandardResult>(providerId: string, request: TRequest): Promise<TResult>;
    sendAlimTalk(providerId: string, request: AlimTalkRequest): Promise<AlimTalkResult>;
    private isAlimTalkProvider;
}
