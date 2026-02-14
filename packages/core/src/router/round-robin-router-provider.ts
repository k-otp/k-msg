import type {
  BaseProvider,
  ProviderHealthStatus,
  StandardRequest,
  StandardResult,
} from "../types/index";

/**
 * Round-robin router provider that forwards requests to upstream providers.
 * Useful for simple load distribution or provider rotation strategies.
 */
export class RoundRobinRouterProvider
  implements BaseProvider<StandardRequest, StandardResult>
{
  readonly id: string;
  readonly name: string;
  readonly type = "messaging" as const;
  readonly version = "1.0.0";

  private readonly providers: BaseProvider<StandardRequest, StandardResult>[];
  private idx = 0;

  constructor(params: {
    id: string;
    name?: string;
    providers: BaseProvider<StandardRequest, StandardResult>[];
  }) {
    this.id = params.id;
    this.name =
      params.name ||
      `RoundRobinRouter(${params.providers.map((p) => p.id).join(",")})`;
    this.providers = params.providers;
  }

  async healthCheck(): Promise<ProviderHealthStatus> {
    const results = await Promise.allSettled(
      this.providers.map(async (provider) => ({
        id: provider.id,
        name: provider.name,
        health: await provider.healthCheck(),
      })),
    );

    const issues: string[] = [];
    let anyHealthy = false;
    const data: Record<string, unknown> = {};

    for (const result of results) {
      if (result.status === "rejected") {
        issues.push(`Health check failed: ${String(result.reason)}`);
        continue;
      }

      const entry = result.value;
      data[entry.id] = entry.health;
      if (!entry.health.healthy) {
        issues.push(`${entry.id}: ${entry.health.issues.join(", ")}`);
      } else {
        anyHealthy = true;
      }
    }

    return {
      healthy: anyHealthy,
      issues,
      data,
    };
  }

  async send<
    T extends StandardRequest = StandardRequest,
    R extends StandardResult = StandardResult,
  >(request: T): Promise<R> {
    if (this.providers.length === 0) {
      throw new Error("Router provider has no upstream providers");
    }

    const provider = this.providers[this.idx % this.providers.length];
    if (!provider) {
      throw new Error("Router provider has no upstream providers");
    }
    this.idx = (this.idx + 1) % this.providers.length;
    return provider.send(request) as Promise<R>;
  }
}
