/**
 * Health check monitor with automatic recovery
 * Note: This is the resilience-layer health monitor.
 * For the main health check system, see ../health.ts
 */

export class HealthMonitor {
    private healthStatus: Map<string, boolean> = new Map();
    private lastCheck: Map<string, number> = new Map();
    private checkInterval: number;
    private intervalId?: NodeJS.Timeout;

    constructor(
        private services: Map<string, () => Promise<boolean>>,
        checkIntervalMs: number = 30000
    ) {
        this.checkInterval = checkIntervalMs;
    }

    start(): void {
        this.intervalId = setInterval(() => {
            this.checkAllServices();
        }, this.checkInterval);

        this.checkAllServices();
    }

    stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = undefined;
        }
    }

    private async checkAllServices(): Promise<void> {
        const checks = Array.from(this.services.entries()).map(
            async ([serviceName, healthCheck]) => {
                try {
                    const isHealthy = await healthCheck();
                    const wasHealthy = this.healthStatus.get(serviceName);

                    this.healthStatus.set(serviceName, isHealthy);
                    this.lastCheck.set(serviceName, Date.now());

                    if (wasHealthy !== undefined && wasHealthy !== isHealthy) {
                        console.log(`Service ${serviceName} status changed: ${wasHealthy ? 'healthy' : 'unhealthy'} -> ${isHealthy ? 'healthy' : 'unhealthy'}`);
                    }
                } catch (error) {
                    this.healthStatus.set(serviceName, false);
                    this.lastCheck.set(serviceName, Date.now());
                    console.error(`Health check failed for ${serviceName}:`, error);
                }
            }
        );

        await Promise.allSettled(checks);
    }

    getServiceHealth(serviceName: string): boolean | undefined {
        return this.healthStatus.get(serviceName);
    }

    getAllHealth(): Record<string, boolean> {
        return Object.fromEntries(this.healthStatus);
    }

    isServiceHealthy(serviceName: string): boolean {
        return this.healthStatus.get(serviceName) === true;
    }

    getLastCheckTime(serviceName: string): number | undefined {
        return this.lastCheck.get(serviceName);
    }
}
