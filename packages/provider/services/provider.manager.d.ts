import type { BaseProvider, ProviderType, StandardRequest, StandardResult } from '@k-msg/core';
import type { AlimTalkProvider, AlimTalkRequest, AlimTalkResult } from '../contracts/provider.contract';
import type { SMSProvider, SMSRequest, SMSResult } from '../contracts/sms.contract';
export declare class ProviderManager {
    private providers;
    private defaultProvider?;
    registerProvider(provider: BaseProvider<StandardRequest, StandardResult>): void;
    unregisterProvider(providerId: string): void;
    getProvider(providerId?: string): BaseProvider<StandardRequest, StandardResult> | null;
    getAlimTalkProvider(providerId?: string): AlimTalkProvider | null;
    listProviders(): BaseProvider<StandardRequest, StandardResult>[];
    listAlimTalkProviders(): AlimTalkProvider[];
    setDefaultProvider(providerId: string): void;
    healthCheckAll(): Promise<Record<string, boolean>>;
    getProvidersForChannel(channel: string): BaseProvider<StandardRequest, StandardResult>[];
    getProvidersByType(type: ProviderType): BaseProvider<StandardRequest, StandardResult>[];
    getSMSProvider(providerId?: string): SMSProvider | null;
    listSMSProviders(): SMSProvider[];
    send<TRequest extends StandardRequest, TResult extends StandardResult>(providerId: string, request: TRequest): Promise<TResult>;
    sendAlimTalk(providerId: string | undefined, request: AlimTalkRequest): Promise<AlimTalkResult>;
    sendSMS(providerId: string | undefined, request: SMSRequest): Promise<SMSResult>;
    private isAlimTalkProvider;
    private isSMSProvider;
}
