import type { 
  ProviderPlugin, 
  ProviderConfig, 
  PluginContext, 
  Logger,
  MetricsCollector,
  PluginStorage 
} from '../interfaces';
import { EventEmitter } from 'events';

export class PluginRegistry {
  private plugins = new Map<string, ProviderPlugin>();
  private instances = new Map<string, ProviderPlugin>();

  register(plugin: ProviderPlugin): void {
    const id = plugin.metadata.name.toLowerCase();
    
    if (this.plugins.has(id)) {
      throw new Error(`Plugin ${id} is already registered`);
    }
    
    this.plugins.set(id, plugin);
  }

  async create(
    pluginId: string, 
    config: ProviderConfig,
    options: {
      logger?: Logger;
      metrics?: MetricsCollector;
      storage?: PluginStorage;
    } = {}
  ): Promise<ProviderPlugin> {
    const plugin = this.plugins.get(pluginId.toLowerCase());
    
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    // 새 인스턴스 생성
    const PluginClass = plugin.constructor as new() => ProviderPlugin;
    const instance = new PluginClass();

    // 컨텍스트 생성
    const context: PluginContext = {
      config,
      logger: options.logger || new ConsoleLogger(),
      metrics: options.metrics || new NoOpMetricsCollector(),
      storage: options.storage || new MemoryStorage(),
      eventBus: new EventEmitter(),
    };

    // 초기화
    await instance.initialize(context);

    const instanceKey = `${pluginId}-${Date.now()}`;
    this.instances.set(instanceKey, instance);

    return instance;
  }

  async loadAndCreate(
    pluginId: string,
    config: ProviderConfig,
    options?: any
  ): Promise<ProviderPlugin> {
    // 동적 로딩 지원 (나중에 구현)
    return this.create(pluginId, config, options);
  }

  getSupportedTypes(): string[] {
    return Array.from(this.plugins.keys());
  }

  validateProviderConfig(type: string, config: ProviderConfig): boolean {
    const plugin = this.plugins.get(type.toLowerCase());
    if (!plugin) return false;

    // 기본 검증 로직
    return !!(config.apiUrl && config.apiKey);
  }

  async destroyAll(): Promise<void> {
    const destroyPromises = Array.from(this.instances.values()).map(
      instance => instance.destroy()
    );
    
    await Promise.all(destroyPromises);
    this.instances.clear();
  }
}

// 기본 구현체들
class ConsoleLogger implements Logger {
  info(message: string, ...args: any[]): void {
    console.log(`[INFO] ${message}`, ...args);
  }
  
  error(message: string, error?: any): void {
    console.error(`[ERROR] ${message}`, error);
  }
  
  debug(message: string, ...args: any[]): void {
    console.debug(`[DEBUG] ${message}`, ...args);
  }
  
  warn(message: string, ...args: any[]): void {
    console.warn(`[WARN] ${message}`, ...args);
  }
}

class NoOpMetricsCollector implements MetricsCollector {
  increment(_metric: string, _labels?: Record<string, string>): void {}
  histogram(_metric: string, _value: number, _labels?: Record<string, string>): void {}
  gauge(_metric: string, _value: number, _labels?: Record<string, string>): void {}
}

class MemoryStorage implements PluginStorage {
  private store = new Map<string, { value: any; expiry?: number }>();

  async get(key: string): Promise<any> {
    const item = this.store.get(key);
    
    if (!item) return undefined;
    
    if (item.expiry && Date.now() > item.expiry) {
      this.store.delete(key);
      return undefined;
    }
    
    return item.value;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    const expiry = ttl ? Date.now() + (ttl * 1000) : undefined;
    this.store.set(key, { value, expiry });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }
}