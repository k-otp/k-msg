import type {
  KMsg,
  BaseProvider,
  Config,
  PlatformInfo,
  PlatformHealthStatus,
  MessageSendOptions,
  MessageSendResult
} from './types';

/**
 * Core AlimTalk Platform implementation
 */
export class AlimTalkPlatform implements KMsg {
  private providers = new Map<string, BaseProvider>();
  private config: Config;
  private defaultProvider?: string;

  constructor(config: Config) {
    this.config = config;
    this.defaultProvider = config.defaultProvider;
  }

  // Basic information
  getInfo(): PlatformInfo {
    return {
      version: '0.1.0',
      providers: Array.from(this.providers.keys()),
      features: this.config.features ? Object.keys(this.config.features).filter(k =>
        this.config.features[k as keyof typeof this.config.features]
      ) : []
    };
  }

  // Provider management with clean API
  registerProvider(provider: BaseProvider): void {
    this.providers.set(provider.id, provider);
  }

  getProvider(providerId: string): BaseProvider | null {
    return this.providers.get(providerId) || null;
  }

  listProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  getDefaultProvider(): BaseProvider | null {
    if (!this.defaultProvider) return null;
    return this.getProvider(this.defaultProvider);
  }

  // Health monitoring
  async healthCheck(): Promise<PlatformHealthStatus> {
    const providers: Record<string, boolean> = {};
    const issues: string[] = [];

    for (const [name, provider] of this.providers) {
      try {
        const health = await provider.healthCheck();
        providers[name] = health.healthy;
        if (!health.healthy) {
          issues.push(`${name}: ${health.issues?.join(', ') || 'Unknown issue'}`);
        }
      } catch (error) {
        providers[name] = false;
        issues.push(`${name}: ${error}`);
      }
    }

    const healthy = Object.values(providers).every(h => h);

    return {
      healthy,
      providers,
      issues
    };
  }

  // Clean messages interface
  get messages() {
    return {
      send: async (options: MessageSendOptions): Promise<MessageSendResult> => {
        const provider = this.getDefaultProvider();
        if (!provider) {
          throw new Error('No provider available for messaging');
        }

        const results = [];
        const summary = { total: options.recipients.length, sent: 0, failed: 0 };

        for (const recipient of options.recipients) {
          try {
            const mergedVariables = { ...options.variables, ...recipient.variables };
            const result = await provider.send({
              templateCode: options.templateId,
              phoneNumber: recipient.phoneNumber,
              variables: mergedVariables
            });

            // New BaseProvider returns result directly
            const typedResult = result as any; // Proper typing depends on TResult
            summary.sent++;
            results.push({
              messageId: typedResult.messageId,
              status: typedResult.status || 'sent',
              phoneNumber: recipient.phoneNumber
            });
          } catch (error) {
            summary.failed++;
            results.push({
              phoneNumber: recipient.phoneNumber,
              status: 'failed',
              error: { message: String(error) }
            });
          }
        }

        return { results, summary };
      },

      getStatus: async (messageId: string): Promise<string> => {
        const provider = this.getDefaultProvider();
        if (!provider) {
          throw new Error('No provider available');
        }

        // Most providers don't have direct status check, return placeholder
        return 'unknown';
      }
    };
  }

  // Provider-specific operations with cleaner API
  async templates(providerId?: string) {
    const provider = providerId ? this.getProvider(providerId) : this.getDefaultProvider();
    if (!provider) {
      throw new Error(`Provider ${providerId || 'default'} not found`);
    }

    return {
      list: async (page: number = 1, size: number = 15, filters?: any) => {
        throw new Error('Template operations not yet migrated to new provider interface');
      },

      create: async (name: string, content: string, category?: string, variables?: any[], buttons?: any[]) => {
        throw new Error('Template operations not yet migrated to new provider interface');
      },

      modify: async (templateCode: string, name: string, content: string, buttons?: any[]) => {
        throw new Error('Template operations not yet migrated to new provider interface');
      },

      delete: async (templateCode: string) => {
        throw new Error('Template operations not yet migrated to new provider interface');
      }
    };
  }

  async history(providerId?: string) {
    const provider = providerId ? this.getProvider(providerId) : this.getDefaultProvider();
    if (!provider) {
      throw new Error(`Provider ${providerId || 'default'} not found`);
    }

    return {
      list: async (page: number = 1, size: number = 15, filters?: any) => {
        throw new Error('History operations not yet migrated to new provider interface');
      },

      cancelReservation: async (messageId: string) => {
        throw new Error('History operations not yet migrated to new provider interface');
      }
    };
  }

  // Provider health with cleaner API
  async providerHealth(providerId: string) {
    const provider = this.getProvider(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    return await provider.healthCheck();
  }
}
