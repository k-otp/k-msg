import type {
  AggregatedMetric,
  AnalyticsConfig,
  AnalyticsQuery,
  AnalyticsResult,
  InsightData,
  MetricData,
  MetricType,
} from "../types/analytics.types";
import { InsightEngine } from "./insight.engine";
import { MetricsCollector } from "./metrics.collector";
import { ReportGenerator } from "./report.generator";

export class AnalyticsService {
  private config: AnalyticsConfig;
  private metricsCollector: MetricsCollector;
  private reportGenerator: ReportGenerator;
  private insightEngine: InsightEngine;
  private metrics: Map<string, MetricData[]> = new Map();
  private aggregatedMetrics: Map<string, AggregatedMetric[]> = new Map();

  constructor(config: AnalyticsConfig) {
    this.config = config;
    this.metricsCollector = new MetricsCollector(config);
    this.reportGenerator = new ReportGenerator(config);
    this.insightEngine = new InsightEngine(config);

    // 주기적 집계 작업 시작
    this.startAggregationTasks();
  }

  /**
   * 메트릭 데이터 수집
   */
  async collectMetric(metric: MetricData): Promise<void> {
    if (!this.config.enabledMetrics.includes(metric.type)) {
      return;
    }

    await this.metricsCollector.collect(metric);

    // 실시간 추적이 활성화된 경우 즉시 처리
    if (this.config.enableRealTimeTracking) {
      await this.processRealTimeMetric(metric);
    }
  }

  /**
   * 분석 쿼리 실행
   */
  async query(query: AnalyticsQuery): Promise<AnalyticsResult> {
    const startTime = Date.now();

    // 쿼리 검증
    this.validateQuery(query);

    // 데이터 조회
    const data = await this.executeQuery(query);

    // 인사이트 생성 (옵션)
    const insights = await this.generateInsights(query, data);

    const executionTime = Date.now() - startTime;

    return {
      query,
      data,
      summary: {
        totalRecords: data.length,
        dateRange: query.dateRange,
        executionTime,
      },
      insights,
    };
  }

  /**
   * 실시간 메트릭 스트림
   */
  async *streamMetrics(types: MetricType[]): AsyncGenerator<MetricData> {
    // 실시간 메트릭 스트림 구현
    while (true) {
      const metrics = await this.metricsCollector.getRecentMetrics(types, 1000); // 최근 1초
      for (const metric of metrics) {
        yield metric;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  /**
   * 대시보드 데이터 조회
   */
  async getDashboardData(timeRange: { start: Date; end: Date }) {
    const now = new Date();
    const previousPeriod = {
      start: new Date(
        timeRange.start.getTime() -
          (timeRange.end.getTime() - timeRange.start.getTime()),
      ),
      end: timeRange.start,
    };

    // 현재 기간 데이터
    const currentData = await this.query({
      metrics: this.config.enabledMetrics,
      dateRange: timeRange,
      interval: this.getOptimalInterval(timeRange),
      groupBy: ["provider", "channel"],
    });

    // 이전 기간 데이터 (비교용)
    const previousData = await this.query({
      metrics: this.config.enabledMetrics,
      dateRange: previousPeriod,
      interval: this.getOptimalInterval(timeRange),
      groupBy: ["provider", "channel"],
    });

    // KPI 계산
    const kpis = this.calculateKPIs(currentData.data, previousData.data);

    return {
      timeRange,
      kpis,
      metrics: currentData.data,
      insights: currentData.insights,
      trends: this.calculateTrends(currentData.data, previousData.data),
    };
  }

  /**
   * 이상 탐지
   */
  async detectAnomalies(
    metricType: MetricType,
    timeRange: { start: Date; end: Date },
  ): Promise<InsightData[]> {
    return this.insightEngine.detectAnomalies(metricType, timeRange);
  }

  private async processRealTimeMetric(metric: MetricData): Promise<void> {
    // 실시간 이상 탐지
    const anomalies = await this.insightEngine.detectRealTimeAnomalies(metric);

    if (anomalies.length > 0) {
      // 이상 상황 알림 (웹훅 등)
      await this.notifyAnomalies(anomalies);
    }
  }

  private validateQuery(query: AnalyticsQuery): void {
    if (query.dateRange.start >= query.dateRange.end) {
      throw new Error("Invalid date range: start must be before end");
    }

    const maxRangeMs = 90 * 24 * 60 * 60 * 1000; // 90일
    if (
      query.dateRange.end.getTime() - query.dateRange.start.getTime() >
      maxRangeMs
    ) {
      throw new Error("Date range too large: maximum 90 days");
    }

    if (query.limit && query.limit > 10000) {
      throw new Error("Limit too large: maximum 10000 records");
    }
  }

  private async executeQuery(
    query: AnalyticsQuery,
  ): Promise<AggregatedMetric[]> {
    // 실제 구현에서는 데이터베이스 쿼리를 실행
    // 여기서는 메모리 기반 구현 예시

    const interval = query.interval || this.getOptimalInterval(query.dateRange);
    const cacheKey = this.generateCacheKey(query);

    // 캐시된 데이터 확인
    if (this.aggregatedMetrics.has(cacheKey)) {
      return this.aggregatedMetrics.get(cacheKey)!;
    }

    // 집계 실행
    const aggregated = await this.performAggregation(query, interval);

    // 캐시 저장 (TTL 설정 필요)
    this.aggregatedMetrics.set(cacheKey, aggregated);

    return aggregated;
  }

  private async performAggregation(
    query: AnalyticsQuery,
    interval: string,
  ): Promise<AggregatedMetric[]> {
    // 집계 로직 구현
    // 실제로는 시계열 데이터베이스나 OLAP 엔진 사용
    return [];
  }

  private async generateInsights(
    query: AnalyticsQuery,
    data: AggregatedMetric[],
  ): Promise<InsightData[]> {
    return this.insightEngine.generateInsights(query, data);
  }

  private getOptimalInterval(dateRange: {
    start: Date;
    end: Date;
  }): "minute" | "hour" | "day" | "week" | "month" {
    const durationMs = dateRange.end.getTime() - dateRange.start.getTime();
    const durationDays = durationMs / (24 * 60 * 60 * 1000);

    if (durationDays <= 1) return "minute";
    if (durationDays <= 7) return "hour";
    if (durationDays <= 30) return "day";
    if (durationDays <= 90) return "week";
    return "month";
  }

  private calculateKPIs(
    current: AggregatedMetric[],
    previous: AggregatedMetric[],
  ) {
    // KPI 계산 로직
    return {
      totalMessages: this.sumMetrics(current, "message_sent"),
      deliveryRate: this.calculateRate(
        current,
        "message_delivered",
        "message_sent",
      ),
      errorRate: this.calculateRate(current, "message_failed", "message_sent"),
      clickRate: this.calculateRate(
        current,
        "message_clicked",
        "message_delivered",
      ),
    };
  }

  private calculateTrends(
    current: AggregatedMetric[],
    previous: AggregatedMetric[],
  ) {
    // 트렌드 계산 로직
    return {};
  }

  private sumMetrics(metrics: AggregatedMetric[], type: string): number {
    return metrics
      .filter((m) => m.type.toString() === type)
      .reduce((sum, m) => sum + m.aggregations.sum, 0);
  }

  private calculateRate(
    metrics: AggregatedMetric[],
    numerator: string,
    denominator: string,
  ): number {
    const num = this.sumMetrics(metrics, numerator);
    const den = this.sumMetrics(metrics, denominator);
    return den > 0 ? (num / den) * 100 : 0;
  }

  private generateCacheKey(query: AnalyticsQuery): string {
    return JSON.stringify({
      metrics: query.metrics.sort(),
      dateRange: query.dateRange,
      interval: query.interval,
      filters: query.filters,
      groupBy: query.groupBy?.sort(),
    });
  }

  private startAggregationTasks(): void {
    // 주기적 집계 작업 스케줄링
    for (const interval of this.config.aggregationIntervals) {
      this.scheduleAggregation(interval);
    }
  }

  private scheduleAggregation(interval: string): void {
    // 집계 작업 스케줄링 로직
    const scheduleMs = this.getScheduleInterval(interval);

    setInterval(async () => {
      try {
        await this.runAggregation(interval);
      } catch (error) {
        console.error(`Aggregation failed for interval ${interval}:`, error);
      }
    }, scheduleMs);
  }

  private getScheduleInterval(interval: string): number {
    switch (interval) {
      case "minute":
        return 60 * 1000;
      case "hour":
        return 60 * 60 * 1000;
      case "day":
        return 24 * 60 * 60 * 1000;
      case "week":
        return 7 * 24 * 60 * 60 * 1000;
      case "month":
        return 30 * 24 * 60 * 60 * 1000;
      default:
        return 60 * 60 * 1000;
    }
  }

  private async runAggregation(interval: string): Promise<void> {
    // 실제 집계 작업 실행
    console.log(`Running ${interval} aggregation...`);
  }

  private async notifyAnomalies(anomalies: InsightData[]): Promise<void> {
    // 이상 상황 알림 로직 (웹훅, 이메일 등)
    for (const anomaly of anomalies) {
      if (anomaly.severity === "critical" || anomaly.severity === "high") {
        console.warn("Anomaly detected:", anomaly);
        // 실제 알림 전송
      }
    }
  }
}
