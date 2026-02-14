import type {
  BaseProvider,
  ProviderType,
  StandardRequest,
  StandardResult,
} from "@k-msg/core";
import type {
  AlimTalkProvider,
  AlimTalkRequest,
  AlimTalkResult,
} from "../contracts/provider.contract";
import type {
  SMSProvider,
  SMSRequest,
  SMSResult,
} from "../contracts/sms.contract";

export class ProviderManager {
  private providers: Map<
    string,
    BaseProvider<StandardRequest, StandardResult>
  > = new Map();
  private defaultProvider?: string;

  registerProvider(
    provider: BaseProvider<StandardRequest, StandardResult>,
  ): void {
    this.providers.set(provider.id, provider);

    // 첫 번째 프로바이더를 기본으로 설정
    if (!this.defaultProvider) {
      this.defaultProvider = provider.id;
    }
  }

  unregisterProvider(providerId: string): void {
    this.providers.delete(providerId);

    if (this.defaultProvider === providerId) {
      const remaining = Array.from(this.providers.keys());
      this.defaultProvider = remaining.length > 0 ? remaining[0] : undefined;
    }
  }

  getProvider(
    providerId?: string,
  ): BaseProvider<StandardRequest, StandardResult> | null {
    const id = providerId || this.defaultProvider;
    return id ? this.providers.get(id) || null : null;
  }

  // Type-safe getter for AlimTalk providers
  getAlimTalkProvider(providerId?: string): AlimTalkProvider | null {
    const provider = this.getProvider(providerId);
    return provider && this.isAlimTalkProvider(provider) ? provider : null;
  }

  listProviders(): BaseProvider<StandardRequest, StandardResult>[] {
    return Array.from(this.providers.values());
  }

  listAlimTalkProviders(): AlimTalkProvider[] {
    return Array.from(this.providers.values()).filter(
      this.isAlimTalkProvider,
    ) as AlimTalkProvider[];
  }

  setDefaultProvider(providerId: string): void {
    if (!this.providers.has(providerId)) {
      throw new Error(`Provider ${providerId} not found`);
    }
    this.defaultProvider = providerId;
  }

  async healthCheckAll(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    for (const [id, provider] of this.providers.entries()) {
      try {
        const health = await provider.healthCheck();
        results[id] = health.healthy;
      } catch (error) {
        results[id] = false;
      }
    }

    return results;
  }

  getProvidersForChannel(
    channel: string,
  ): BaseProvider<StandardRequest, StandardResult>[] {
    return Array.from(this.providers.values()).filter((provider) => {
      switch (channel) {
        case "alimtalk":
          return this.isAlimTalkProvider(provider);
        case "sms":
          return this.isSMSProvider(provider);
        default:
          return false;
      }
    });
  }

  // Provider type별 조회
  getProvidersByType(
    type: ProviderType,
  ): BaseProvider<StandardRequest, StandardResult>[] {
    return Array.from(this.providers.values()).filter(
      (provider) => provider.type === type,
    );
  }

  // SMS Provider 전용 조회
  getSMSProvider(providerId?: string): SMSProvider | null {
    const provider = this.getProvider(providerId);
    return provider && this.isSMSProvider(provider) ? provider : null;
  }

  listSMSProviders(): SMSProvider[] {
    return Array.from(this.providers.values()).filter(
      this.isSMSProvider,
    ) as SMSProvider[];
  }

  // 제네릭 send 메서드 (타입 안전한 메시지 전송)
  async send<TRequest extends StandardRequest, TResult extends StandardResult>(
    providerId: string,
    request: TRequest,
  ): Promise<TResult> {
    const provider = this.getProvider(providerId);
    if (!provider) {
      throw new Error(`Provider not found: ${providerId}`);
    }
    return provider.send(request) as Promise<TResult>;
  }

  // AlimTalk 전용 send 메서드
  async sendAlimTalk(
    providerId: string | undefined,
    request: AlimTalkRequest,
  ): Promise<AlimTalkResult> {
    const provider = this.getAlimTalkProvider(providerId);
    if (!provider) {
      throw new Error(`AlimTalk provider not found: ${providerId}`);
    }
    return provider.send(request);
  }

  // SMS 전용 send 메서드
  async sendSMS(
    providerId: string | undefined,
    request: SMSRequest,
  ): Promise<SMSResult> {
    const provider = this.getSMSProvider(providerId);
    if (!provider) {
      throw new Error(`SMS provider not found: ${providerId}`);
    }
    return provider.send(request);
  }

  // Type guard to check if a provider is an AlimTalk provider
  private isAlimTalkProvider(
    provider: BaseProvider,
  ): provider is AlimTalkProvider {
    return (
      provider.type === "messaging" &&
      "templates" in provider &&
      "channels" in provider &&
      "messaging" in provider &&
      "analytics" in provider &&
      "account" in provider
    );
  }

  // Type guard to check if a provider is an SMS provider
  private isSMSProvider(provider: BaseProvider): provider is SMSProvider {
    return (
      provider.type === "sms" && "sms" in provider && "account" in provider
    );
  }
}
