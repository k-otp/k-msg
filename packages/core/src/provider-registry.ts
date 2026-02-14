/**
 * Provider Registry System
 * 프로바이더 등록, 관리, 팩토리 시스템
 */

import {
  type AdapterFactory,
  type BaseProvider,
  BaseProviderAdapter,
  type ProviderConfig,
  type ProviderFactoryConfig,
  type ProviderMetadata,
  type StandardRequest,
  type StandardResult,
} from "./types/index";
import { UniversalProvider } from "./universal-provider";

/**
 * 프로바이더 레지스트리
 * 모든 등록된 프로바이더와 어댑터 팩토리를 관리
 */
export class ProviderRegistry {
  private factories = new Map<string, AdapterFactory>();
  private providers = new Map<
    string,
    BaseProvider<StandardRequest, StandardResult>
  >();
  private metadata = new Map<string, ProviderMetadata>();
  private debug = false;

  /**
   * 어댑터 팩토리 등록
   */
  registerFactory(factory: AdapterFactory): void {
    const metadata = factory.getMetadata();
    this.factories.set(metadata.id, factory);
    this.metadata.set(metadata.id, metadata);

    if (this.debug) {
      console.log(`[ProviderRegistry] Registered factory: ${metadata.id}`);
    }
  }

  /**
   * 프로바이더 인스턴스 생성
   */
  createProvider(
    providerId: string,
    config: ProviderConfig,
  ): BaseProvider<StandardRequest, StandardResult> {
    const factory = this.factories.get(providerId);
    if (!factory) {
      throw new Error(`Provider factory not found: ${providerId}`);
    }

    if (!factory.supports(providerId)) {
      throw new Error(`Factory does not support provider: ${providerId}`);
    }

    const adapter = factory.create(config);
    const metadata = this.metadata.get(providerId)!;

    const provider = new UniversalProvider(adapter, {
      id: metadata.id,
      name: metadata.name,
      version: metadata.version,
    });

    // 생성된 프로바이더를 캐시
    this.providers.set(providerId, provider);

    if (this.debug) {
      console.log(`[ProviderRegistry] Created provider: ${providerId}`);
    }

    return provider;
  }

  /**
   * 등록된 프로바이더 인스턴스 반환
   */
  getProvider(
    providerId: string,
  ): BaseProvider<StandardRequest, StandardResult> | null {
    return this.providers.get(providerId) || null;
  }

  /**
   * 사용 가능한 프로바이더 목록
   */
  getAvailableProviders(): string[] {
    return Array.from(this.factories.keys());
  }

  /**
   * 프로바이더 메타데이터 조회
   */
  getProviderMetadata(providerId: string): ProviderMetadata | null {
    return this.metadata.get(providerId) || null;
  }

  /**
   * 모든 프로바이더 메타데이터 조회
   */
  getAllMetadata(): ProviderMetadata[] {
    return Array.from(this.metadata.values());
  }

  /**
   * 특정 기능을 지원하는 프로바이더 검색
   */
  findProvidersByFeature(feature: string): ProviderMetadata[] {
    return Array.from(this.metadata.values()).filter((metadata) =>
      metadata.supportedFeatures.includes(feature),
    );
  }

  /**
   * 프로바이더 등록 해제
   */
  unregisterProvider(providerId: string): boolean {
    const provider = this.providers.get(providerId);
    if (provider) {
      provider.destroy?.();
      this.providers.delete(providerId);
      this.factories.delete(providerId);
      this.metadata.delete(providerId);

      if (this.debug) {
        console.log(`[ProviderRegistry] Unregistered provider: ${providerId}`);
      }
      return true;
    }
    return false;
  }

  /**
   * 모든 프로바이더 등록 해제
   */
  clear(): void {
    for (const provider of this.providers.values()) {
      provider.destroy?.();
    }
    this.providers.clear();
    this.factories.clear();
    this.metadata.clear();

    if (this.debug) {
      console.log("[ProviderRegistry] Cleared all providers");
    }
  }

  /**
   * 레지스트리 상태 조회
   */
  getStatus() {
    return {
      registeredFactories: this.factories.size,
      activeProviders: this.providers.size,
      availableProviders: this.getAvailableProviders(),
      metadata: this.getAllMetadata(),
    };
  }

  /**
   * 프로바이더 헬스체크 실행
   */
  async healthCheck(): Promise<Record<string, any>> {
    const results: Record<string, any> = {};

    for (const [providerId, provider] of this.providers.entries()) {
      try {
        results[providerId] = await provider.healthCheck();
      } catch (error) {
        results[providerId] = {
          healthy: false,
          issues: [
            `Health check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          ],
        };
      }
    }

    return results;
  }

  /**
   * 디버그 모드 설정
   */
  setDebug(enabled: boolean): void {
    this.debug = enabled;
  }
}

/**
 * 글로벌 프로바이더 레지스트리 인스턴스
 */
export const globalProviderRegistry = new ProviderRegistry();

/**
 * 설정 기반 프로바이더 팩토리
 */
export class ConfigBasedProviderFactory {
  constructor(
    private registry: ProviderRegistry,
    private config: ProviderFactoryConfig,
  ) {}

  /**
   * 설정에서 프로바이더 생성
   */
  createFromConfig(
    providerId: string,
  ): BaseProvider<StandardRequest, StandardResult> {
    const providerConfig = this.config.providers[providerId];
    if (!providerConfig) {
      throw new Error(`Provider configuration not found: ${providerId}`);
    }

    return this.registry.createProvider(providerId, providerConfig);
  }

  /**
   * 모든 설정된 프로바이더 생성
   */
  createAllFromConfig(): Record<
    string,
    BaseProvider<StandardRequest, StandardResult>
  > {
    const providers: Record<
      string,
      BaseProvider<StandardRequest, StandardResult>
    > = {};

    for (const [providerId, config] of Object.entries(this.config.providers)) {
      try {
        providers[providerId] = this.registry.createProvider(
          providerId,
          config,
        );
      } catch (error) {
        console.error(`Failed to create provider ${providerId}:`, error);
      }
    }

    return providers;
  }
}

/**
 * 플러그인 기반 프로바이더 로더
 */
export class ProviderPluginLoader {
  constructor(private registry: ProviderRegistry) {}

  /**
   * 플러그인 모듈 동적 로딩
   */
  async loadPlugin(pluginPath: string): Promise<void> {
    try {
      const module = await import(pluginPath);
      const factory = module.default || module;

      if (!this.isValidFactory(factory)) {
        throw new Error(
          "Invalid factory: must implement AdapterFactory interface",
        );
      }

      this.registry.registerFactory(factory);
    } catch (error) {
      throw new Error(
        `Failed to load plugin ${pluginPath}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * 여러 플러그인 배치 로딩
   */
  async loadPlugins(pluginPaths: string[]): Promise<void> {
    const results = await Promise.allSettled(
      pluginPaths.map((path) => this.loadPlugin(path)),
    );

    const failures = results
      .map((result, index) => ({ result, path: pluginPaths[index] }))
      .filter(({ result }) => result.status === "rejected")
      .map(({ result, path }) => ({
        path,
        error: (result as PromiseRejectedResult).reason,
      }));

    if (failures.length > 0) {
      console.warn("Some plugins failed to load:", failures);
    }
  }

  /**
   * 팩토리 인터페이스 검증
   */
  private isValidFactory(factory: any): factory is AdapterFactory {
    return (
      factory &&
      typeof factory.create === "function" &&
      typeof factory.supports === "function" &&
      typeof factory.getMetadata === "function"
    );
  }
}

/**
 * 프로바이더 헬스 모니터
 * HealthChecker를 활용하여 프로바이더들의 헬스 상태를 모니터링
 */
export class ProviderHealthMonitor {
  private checker: import("./health").HealthChecker;
  private intervalId?: NodeJS.Timeout;
  private registeredServices = new Set<string>();

  constructor(
    private registry: ProviderRegistry,
    private interval = 60000, // 1분
  ) {
    // Lazily import to avoid circular dependency issue
    const { HealthChecker } = require("./health");
    this.checker = new HealthChecker({ timeout: 5000, includeMetrics: true });
  }

  /**
   * 헬스 모니터링 시작
   */
  start(): void {
    this.stop();
    this.syncProviders();

    this.intervalId = setInterval(async () => {
      try {
        this.syncProviders();
        const result = await this.checker.checkHealth();
        if (!result.healthy && result.services) {
          for (const [name, health] of Object.entries(result.services)) {
            if (!health.healthy) {
              console.warn(`Provider ${name} is unhealthy:`, health.error);
            }
          }
        }
      } catch (error) {
        console.error("Health monitoring failed:", error);
      }
    }, this.interval);
  }

  /**
   * 헬스 모니터링 중지
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.checker.clearServices();
    this.registeredServices.clear();
  }

  /**
   * 레지스트리의 프로바이더를 HealthChecker에 동기화
   */
  private syncProviders(): void {
    const activeServices = new Set<string>();
    const providers = this.registry.getAvailableProviders();

    for (const providerId of providers) {
      const provider = this.registry.getProvider(providerId);
      if (provider) {
        activeServices.add(providerId);
        this.checker.registerService(providerId, async () => {
          const health = await provider.healthCheck();
          return {
            healthy: health.healthy,
            ...(health.issues.length > 0
              ? { error: health.issues.join(", ") }
              : {}),
            latency: health.latency,
          };
        });
        this.registeredServices.add(providerId);
      }
    }

    for (const providerId of Array.from(this.registeredServices)) {
      if (!activeServices.has(providerId)) {
        this.checker.unregisterService(providerId);
        this.registeredServices.delete(providerId);
      }
    }
  }

  /**
   * 현재 헬스 상태 조회
   */
  async checkNow() {
    this.syncProviders();
    return this.checker.checkHealth();
  }
}
