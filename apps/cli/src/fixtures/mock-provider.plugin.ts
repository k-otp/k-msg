import type {
  BaseProvider,
  ProviderHealthStatus,
  StandardRequest,
  StandardResult,
} from "@k-msg/core";

type FixtureConfig = {
  id?: string;
  name?: string;
};

export class FixtureProvider
  implements BaseProvider<StandardRequest, StandardResult>
{
  readonly id: string;
  readonly name: string;
  readonly type = "messaging" as const;
  readonly version = "1.0.0";

  constructor(config: FixtureConfig = {}) {
    this.id = config.id || "fixture";
    this.name = config.name || "Fixture Plugin Provider";
  }

  async healthCheck(): Promise<ProviderHealthStatus> {
    return { healthy: true, issues: [] };
  }

  async send<T extends StandardRequest = StandardRequest, R extends StandardResult = StandardResult>(
    request: T,
  ): Promise<R> {
    return {
      messageId: `fixture-${Date.now()}`,
      status: "SENT",
      provider: this.id,
      timestamp: new Date(),
      phoneNumber: request.phoneNumber,
      metadata: {
        channel: request.channel,
      },
    } as unknown as R;
  }
}
