import type { BaseProvider, StandardRequest, StandardResult } from '@k-msg/core';
import type { AlimTalkProvider, AlimTalkRequest, AlimTalkResult } from '../contracts/provider.contract';

/**
 * Manages the lifecycle and access to different messaging providers.
 */
export class ProviderService {
	private providers = new Map<string, BaseProvider<StandardRequest, StandardResult>>();
	private defaultProviderId?: string;

	/**
	 * @param defaultProviderId The ID of the provider to use when none is specified.
	 */
	constructor(defaultProviderId?: string) {
		this.defaultProviderId = defaultProviderId;
	}

	/**
	 * Registers a new provider instance.
	 * If no default provider is set, the first registered provider becomes the default.
	 * @param provider The provider instance to register.
	 */
	register(provider: BaseProvider<StandardRequest, StandardResult>): void {
		this.providers.set(provider.id, provider);
		if (!this.defaultProviderId) {
			this.defaultProviderId = provider.id;
		}
	}

	/**
	 * Retrieves a provider by its unique ID.
	 * @param providerId The ID of the provider.
	 * @returns The provider instance or undefined if not found.
	 */
	get(providerId: string): BaseProvider<StandardRequest, StandardResult> | undefined {
		return this.providers.get(providerId);
	}

	/**
	 * Retrieves a typed AlimTalk provider by its unique ID.
	 * @param providerId The ID of the provider.
	 * @returns The AlimTalk provider instance or undefined if not found or not an AlimTalk provider.
	 */
	getAlimTalk(providerId: string): AlimTalkProvider | undefined {
		const provider = this.providers.get(providerId);
		return provider && this.isAlimTalkProvider(provider) ? provider : undefined;
	}

	/**
	 * Retrieves the default provider.
	 * @returns The default provider instance or undefined if not set.
	 */
	getDefault(): BaseProvider<StandardRequest, StandardResult> | undefined {
		if (!this.defaultProviderId) return undefined;
		return this.providers.get(this.defaultProviderId);
	}

	/**
	 * Lists all registered providers.
	 * @returns An array of all provider instances.
	 */
	list(): BaseProvider<StandardRequest, StandardResult>[] {
		return Array.from(this.providers.values());
	}

	/**
	 * Lists all AlimTalk providers.
	 * @returns An array of AlimTalk provider instances.
	 */
	listAlimTalk(): AlimTalkProvider[] {
		return Array.from(this.providers.values()).filter(this.isAlimTalkProvider) as AlimTalkProvider[];
	}

	// 제네릭 send 메서드 (타입 안전한 메시지 전송)
	async send<TRequest extends StandardRequest, TResult extends StandardResult>(
		providerId: string,
		request: TRequest
	): Promise<TResult> {
		const provider = this.get(providerId);
		if (!provider) {
			throw new Error(`Provider not found: ${providerId}`);
		}
		return provider.send(request) as Promise<TResult>;
	}

	// AlimTalk 전용 send 메서드
	async sendAlimTalk(
		providerId: string,
		request: AlimTalkRequest
	): Promise<AlimTalkResult> {
		const provider = this.getAlimTalk(providerId);
		if (!provider) {
			throw new Error(`AlimTalk provider not found: ${providerId}`);
		}
		return provider.send(request);
	}

	// Type guard to check if a provider is an AlimTalk provider
	private isAlimTalkProvider(provider: BaseProvider): provider is AlimTalkProvider {
		return provider.type === 'messaging' &&
			   'templates' in provider &&
			   'channels' in provider &&
			   'messaging' in provider &&
			   'analytics' in provider &&
			   'account' in provider;
	}
}