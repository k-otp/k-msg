import { logger } from "@k-msg/core";
import type {
  AnalyticsConfig,
  MetricData,
  MetricType,
} from "../types/analytics.types";

export class MetricsCollector {
  private config: AnalyticsConfig;
  private buffer: MetricData[] = [];
  private batchSize = 1000;
  private flushInterval = 5000; // 5초
  private storage: Map<string, MetricData[]> = new Map();

  constructor(config: AnalyticsConfig) {
    this.config = config;
    this.startBatchProcessor();
  }

  /**
   * 메트릭 수집
   */
  async collect(metric: MetricData): Promise<void> {
    // 메트릭 검증
    this.validateMetric(metric);

    // 버퍼에 추가
    this.buffer.push(metric);

    // 버퍼가 가득 찬 경우 즉시 플러시
    if (this.buffer.length >= this.batchSize) {
      await this.flush();
    }
  }

  /**
   * 여러 메트릭 일괄 수집
   */
  async collectBatch(metrics: MetricData[]): Promise<void> {
    for (const metric of metrics) {
      await this.collect(metric);
    }
  }

  /**
   * 최근 메트릭 조회
   */
  async getRecentMetrics(
    types: MetricType[],
    durationMs: number,
  ): Promise<MetricData[]> {
    const cutoff = new Date(Date.now() - durationMs);
    const recent: MetricData[] = [];

    for (const type of types) {
      const typeKey = type.toString();
      const metrics = this.storage.get(typeKey) || [];

      const recentMetrics = metrics.filter((m) => m.timestamp >= cutoff);
      recent.push(...recentMetrics);
    }

    return recent.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * 메트릭 통계 조회
   */
  async getMetricStats(
    type: MetricType,
    timeRange: { start: Date; end: Date },
  ) {
    const typeKey = type.toString();
    const metrics = this.storage.get(typeKey) || [];

    const filtered = metrics.filter(
      (m) => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end,
    );

    if (filtered.length === 0) {
      return {
        count: 0,
        sum: 0,
        avg: 0,
        min: 0,
        max: 0,
      };
    }

    const values = filtered.map((m) => m.value);
    const sum = values.reduce((acc, val) => acc + val, 0);

    return {
      count: filtered.length,
      sum,
      avg: sum / filtered.length,
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }

  /**
   * 메트릭 카운터 증가
   */
  async incrementCounter(
    type: MetricType,
    dimensions: Record<string, string>,
    value = 1,
  ): Promise<void> {
    const metric: MetricData = {
      id: this.generateMetricId(),
      type,
      timestamp: new Date(),
      value,
      dimensions,
    };

    await this.collect(metric);
  }

  /**
   * 메트릭 게이지 값 설정
   */
  async setGauge(
    type: MetricType,
    dimensions: Record<string, string>,
    value: number,
  ): Promise<void> {
    const metric: MetricData = {
      id: this.generateMetricId(),
      type,
      timestamp: new Date(),
      value,
      dimensions,
    };

    await this.collect(metric);
  }

  /**
   * 메트릭 히스토그램 기록
   */
  async recordHistogram(
    type: MetricType,
    dimensions: Record<string, string>,
    value: number,
  ): Promise<void> {
    const metric: MetricData = {
      id: this.generateMetricId(),
      type,
      timestamp: new Date(),
      value,
      dimensions,
      metadata: {
        metricClass: "histogram",
      },
    };

    await this.collect(metric);
  }

  /**
   * 메트릭 버퍼 플러시
   */
  async flush(): Promise<void> {
    if (this.buffer.length === 0) {
      return;
    }

    const metrics = [...this.buffer];
    this.buffer = [];

    try {
      await this.persistMetrics(metrics);
    } catch (error) {
      logger.error(
        "Failed to persist metrics",
        {},
        error instanceof Error ? error : new Error(String(error)),
      );
      // 실패한 메트릭을 다시 버퍼에 추가 (재시도 로직)
      this.buffer.unshift(...metrics);
      throw error;
    }
  }

  /**
   * 메트릭 정리 (보존 기간 초과)
   */
  async cleanup(): Promise<void> {
    const cutoff = new Date(
      Date.now() - this.config.retentionDays * 24 * 60 * 60 * 1000,
    );

    for (const [typeKey, metrics] of this.storage.entries()) {
      const filtered = metrics.filter((m) => m.timestamp >= cutoff);
      this.storage.set(typeKey, filtered);
    }
  }

  private validateMetric(metric: MetricData): void {
    if (!metric.id) {
      throw new Error("Metric ID is required");
    }

    if (!metric.type) {
      throw new Error("Metric type is required");
    }

    if (typeof metric.value !== "number" || isNaN(metric.value)) {
      throw new Error("Metric value must be a valid number");
    }

    if (!metric.timestamp || !(metric.timestamp instanceof Date)) {
      throw new Error("Invalid metric timestamp");
    }

    if (!metric.dimensions || typeof metric.dimensions !== "object") {
      throw new Error("Metric dimensions must be an object");
    }
  }

  private async persistMetrics(metrics: MetricData[]): Promise<void> {
    // 메트릭 타입별로 그룹화
    const grouped = new Map<string, MetricData[]>();

    for (const metric of metrics) {
      const typeKey = metric.type.toString();
      if (!grouped.has(typeKey)) {
        grouped.set(typeKey, []);
      }
      grouped.get(typeKey)!.push(metric);
    }

    // 각 타입별로 저장
    for (const [typeKey, typeMetrics] of grouped.entries()) {
      const existing = this.storage.get(typeKey) || [];
      existing.push(...typeMetrics);

      // 최신 순으로 정렬
      existing.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // 메모리 사용량 제한 (최근 10,000개만 유지)
      if (existing.length > 10000) {
        existing.splice(10000);
      }

      this.storage.set(typeKey, existing);
    }

    logger.info(`Persisted ${metrics.length} metrics`);
  }

  private startBatchProcessor(): void {
    setInterval(async () => {
      try {
        await this.flush();
      } catch (error) {
        logger.error(
          "Batch processing failed",
          {},
          error instanceof Error ? error : new Error(String(error)),
        );
      }
    }, this.flushInterval);

    // 정리 작업 (매일 1회)
    setInterval(
      async () => {
        try {
          await this.cleanup();
        } catch (error) {
          logger.error(
            "Cleanup failed",
            {},
            error instanceof Error ? error : new Error(String(error)),
          );
        }
      },
      24 * 60 * 60 * 1000,
    );
  }

  private generateMetricId(): string {
    return `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
