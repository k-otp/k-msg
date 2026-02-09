export interface HealthStatus {
  healthy: boolean;
  timestamp: Date;
  uptime: number;
  version?: string;
  services?: Record<string, ServiceHealth>;
  metrics?: Record<string, any>;
}

export interface ServiceHealth {
  healthy: boolean;
  latency?: number;
  error?: string;
  lastCheck?: Date;
}

export interface HealthCheckConfig {
  timeout?: number;
  interval?: number;
  retries?: number;
  includeMetrics?: boolean;
}

export class HealthChecker {
  private startTime = Date.now();
  private services = new Map<string, () => Promise<ServiceHealth>>();
  private lastCheck = new Map<string, ServiceHealth>();

  constructor(private config: HealthCheckConfig = {}) {}

  registerService(name: string, checkFn: () => Promise<ServiceHealth>): void {
    this.services.set(name, checkFn);
  }

  async checkHealth(): Promise<HealthStatus> {
    const start = Date.now();
    const services: Record<string, ServiceHealth> = {};
    let overallHealthy = true;

    for (const [name, checkFn] of this.services) {
      try {
        const serviceHealth = await Promise.race([
          checkFn(),
          this.timeoutPromise<ServiceHealth>(this.config.timeout || 5000)
        ]);

        services[name] = {
          ...serviceHealth,
          lastCheck: new Date(),
          latency: Date.now() - start
        };

        this.lastCheck.set(name, services[name]);

        if (!serviceHealth.healthy) {
          overallHealthy = false;
        }
      } catch (error) {
        const serviceHealth: ServiceHealth = {
          healthy: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          lastCheck: new Date(),
          latency: Date.now() - start
        };

        services[name] = serviceHealth;
        this.lastCheck.set(name, serviceHealth);
        overallHealthy = false;
      }
    }

    return {
      healthy: overallHealthy,
      timestamp: new Date(),
      uptime: Date.now() - this.startTime,
      services,
      ...(this.config.includeMetrics && {
        metrics: {
          totalServices: this.services.size,
          healthyServices: Object.values(services).filter(s => s.healthy).length,
          averageLatency: this.calculateAverageLatency(services)
        }
      })
    };
  }

  getLastKnownStatus(): HealthStatus {
    const services: Record<string, ServiceHealth> = {};
    let overallHealthy = true;

    for (const [name, health] of this.lastCheck) {
      services[name] = health;
      if (!health.healthy) {
        overallHealthy = false;
      }
    }

    return {
      healthy: overallHealthy,
      timestamp: new Date(),
      uptime: Date.now() - this.startTime,
      services
    };
  }

  private async timeoutPromise<T>(ms: number): Promise<T> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Health check timeout after ${ms}ms`)), ms);
    });
  }

  private calculateAverageLatency(services: Record<string, ServiceHealth>): number {
    const latencies = Object.values(services)
      .map(s => s.latency)
      .filter((l): l is number => typeof l === 'number');

    return latencies.length > 0
      ? latencies.reduce((a, b) => a + b, 0) / latencies.length
      : 0;
  }
}

export class SimpleHealthChecker {
  static database(): () => Promise<ServiceHealth> {
    return async () => {
      return { healthy: true };
    };
  }

  static external(url: string, timeout = 5000): () => Promise<ServiceHealth> {
    return async () => {
      const start = Date.now();
      try {
        const response = await fetch(url, {
          signal: AbortSignal.timeout(timeout)
        });

        return {
          healthy: response.ok,
          latency: Date.now() - start,
          ...(response.ok ? {} : { error: `HTTP ${response.status}` })
        };
      } catch (error) {
        return {
          healthy: false,
          latency: Date.now() - start,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    };
  }

  static memory(maxUsageMB = 500): () => Promise<ServiceHealth> {
    return async () => {
      const usage = process.memoryUsage();
      const usedMB = usage.heapUsed / 1024 / 1024;

      return {
        healthy: usedMB < maxUsageMB,
        ...(usedMB >= maxUsageMB ? { error: `Memory usage ${usedMB.toFixed(1)}MB exceeds limit ${maxUsageMB}MB` } : {})
      };
    };
  }
}