import type {
  AggregatedMetric,
  AnalyticsConfig,
  AnalyticsQuery,
  InsightData,
  MetricData,
} from "../types/analytics.types";
import { MetricType } from "../types/analytics.types";

export class InsightEngine {
  private config: AnalyticsConfig;
  private anomalyThresholds: Map<
    MetricType,
    { min: number; max: number; stdDev: number }
  > = new Map();
  private historicalData: Map<MetricType, number[]> = new Map();

  constructor(config: AnalyticsConfig) {
    this.config = config;
    this.initializeBaselines();
  }

  /**
   * 실시간 이상 탐지
   */
  async detectRealTimeAnomalies(metric: MetricData): Promise<InsightData[]> {
    const insights: InsightData[] = [];
    const threshold = this.anomalyThresholds.get(metric.type);

    if (!threshold) {
      return insights;
    }

    // 통계적 이상 탐지
    if (metric.value > threshold.max || metric.value < threshold.min) {
      insights.push({
        id: `anomaly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: "anomaly",
        title: `${metric.type} Anomaly Detected`,
        description: `Value ${metric.value} is outside normal range [${threshold.min}, ${threshold.max}]`,
        severity: this.calculateSeverity(metric.value, threshold),
        metric: metric.type,
        dimensions: metric.dimensions,
        value: metric.value,
        expectedValue: (threshold.min + threshold.max) / 2,
        confidence: this.calculateConfidence(metric.value, threshold),
        actionable: true,
        recommendations: this.generateRecommendations(metric),
        detectedAt: new Date(),
      });
    }

    // 급격한 변화 탐지
    const recentTrend = await this.detectTrendChange(metric);
    if (recentTrend) {
      insights.push(recentTrend);
    }

    return insights;
  }

  /**
   * 시계열 이상 탐지
   */
  async detectAnomalies(
    metricType: MetricType,
    timeRange: { start: Date; end: Date },
  ): Promise<InsightData[]> {
    const insights: InsightData[] = [];

    // 계절성 이상 탐지
    const seasonalAnomalies = await this.detectSeasonalAnomalies(
      metricType,
      timeRange,
    );
    insights.push(...seasonalAnomalies);

    // 패턴 이상 탐지
    const patternAnomalies = await this.detectPatternAnomalies(
      metricType,
      timeRange,
    );
    insights.push(...patternAnomalies);

    // 임계값 기반 이상 탐지
    const thresholdAnomalies = await this.detectThresholdAnomalies(
      metricType,
      timeRange,
    );
    insights.push(...thresholdAnomalies);

    return insights;
  }

  /**
   * 인사이트 생성
   */
  async generateInsights(
    query: AnalyticsQuery,
    data: AggregatedMetric[],
  ): Promise<InsightData[]> {
    const insights: InsightData[] = [];

    // 성능 인사이트
    const performanceInsights = await this.generatePerformanceInsights(data);
    insights.push(...performanceInsights);

    // 트렌드 인사이트
    const trendInsights = await this.generateTrendInsights(data);
    insights.push(...trendInsights);

    // 비교 인사이트
    const comparisonInsights = await this.generateComparisonInsights(data);
    insights.push(...comparisonInsights);

    // 추천 인사이트
    const recommendationInsights =
      await this.generateRecommendationInsights(data);
    insights.push(...recommendationInsights);

    return insights.sort((a, b) => {
      // 심각도 순으로 정렬
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  /**
   * 트렌드 예측
   */
  async predictTrends(
    metricType: MetricType,
    forecastDays: number,
  ): Promise<{ date: Date; predicted: number; confidence: number }[]> {
    // 간단한 선형 회귀 기반 예측
    const historical = this.historicalData.get(metricType) || [];
    if (historical.length < 7) {
      return []; // 최소 7일 데이터 필요
    }

    const predictions = [];
    const lastValue = historical[historical.length - 1];
    const trend = this.calculateTrend(historical);

    for (let i = 1; i <= forecastDays; i++) {
      const predictedValue = lastValue + trend * i;
      const confidence = Math.max(0.1, 1 - i * 0.1); // 시간이 지날수록 신뢰도 감소

      predictions.push({
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
        predicted: Math.max(0, predictedValue),
        confidence,
      });
    }

    return predictions;
  }

  private async initializeBaselines(): Promise<void> {
    // 초기 임계값 설정 (실제로는 과거 데이터 기반으로 계산)
    this.anomalyThresholds.set(MetricType.MESSAGE_SENT, {
      min: 0,
      max: 10000,
      stdDev: 500,
    });
    this.anomalyThresholds.set(MetricType.MESSAGE_DELIVERED, {
      min: 0,
      max: 10000,
      stdDev: 500,
    });
    this.anomalyThresholds.set(MetricType.MESSAGE_FAILED, {
      min: 0,
      max: 1000,
      stdDev: 100,
    });
    this.anomalyThresholds.set(MetricType.DELIVERY_RATE, {
      min: 85,
      max: 99,
      stdDev: 5,
    });
    this.anomalyThresholds.set(MetricType.ERROR_RATE, {
      min: 0,
      max: 15,
      stdDev: 3,
    });
  }

  private async detectTrendChange(
    metric: MetricData,
  ): Promise<InsightData | null> {
    const history = this.historicalData.get(metric.type) || [];
    history.push(metric.value);

    // 최근 5개 데이터만 유지
    if (history.length > 5) {
      history.shift();
    }

    this.historicalData.set(metric.type, history);

    if (history.length < 3) {
      return null; // 트렌드 분석에 충분한 데이터 없음
    }

    // 급격한 증가/감소 탐지
    const recentChange =
      (history[history.length - 1] - history[history.length - 2]) /
      history[history.length - 2];

    if (Math.abs(recentChange) > 0.5) {
      // 50% 이상 변화
      return {
        id: `trend_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: "trend",
        title: `Sudden ${recentChange > 0 ? "Increase" : "Decrease"} in ${metric.type}`,
        description: `${metric.type} changed by ${(recentChange * 100).toFixed(1)}% in the last period`,
        severity: Math.abs(recentChange) > 0.8 ? "high" : "medium",
        metric: metric.type,
        dimensions: metric.dimensions,
        value: metric.value,
        expectedValue: history[history.length - 2],
        confidence: 0.8,
        actionable: true,
        recommendations: [
          `Monitor ${metric.type} closely`,
          "Check for system changes or external factors",
        ],
        detectedAt: new Date(),
      };
    }

    return null;
  }

  private async detectSeasonalAnomalies(
    metricType: MetricType,
    timeRange: { start: Date; end: Date },
  ): Promise<InsightData[]> {
    // 계절성 패턴 분석 (요일별, 시간대별 등)
    const insights: InsightData[] = [];

    // 예시: 주말에 비해 평일 트래픽이 비정상적으로 낮은 경우
    const isWeekend =
      timeRange.start.getDay() === 0 || timeRange.start.getDay() === 6;
    const currentHour = timeRange.start.getHours();

    // 비즈니스 시간 외 높은 트래픽 탐지
    if (!isWeekend && (currentHour < 6 || currentHour > 22)) {
      // 실제로는 해당 시간대의 메트릭 값을 확인
      insights.push({
        id: `seasonal_${Date.now()}`,
        type: "anomaly",
        title: "Unusual Activity During Off-Hours",
        description: `High ${metricType} activity detected during off-business hours`,
        severity: "medium",
        metric: metricType,
        dimensions: { timeframe: "off_hours" },
        value: 0, // 실제 값으로 대체
        confidence: 0.7,
        actionable: true,
        recommendations: [
          "Check for automated systems or bulk operations",
          "Verify if this is expected behavior",
        ],
        detectedAt: new Date(),
      });
    }

    return insights;
  }

  private async detectPatternAnomalies(
    metricType: MetricType,
    timeRange: { start: Date; end: Date },
  ): Promise<InsightData[]> {
    // 패턴 변화 탐지 (예: 평소와 다른 발송 패턴)
    return [];
  }

  private async detectThresholdAnomalies(
    metricType: MetricType,
    timeRange: { start: Date; end: Date },
  ): Promise<InsightData[]> {
    // 정적 임계값 기반 이상 탐지
    return [];
  }

  private async generatePerformanceInsights(
    data: AggregatedMetric[],
  ): Promise<InsightData[]> {
    const insights: InsightData[] = [];

    // 배송률이 낮은 경우
    const deliveryMetrics = data.filter(
      (d) => d.type === MetricType.DELIVERY_RATE,
    );
    for (const metric of deliveryMetrics) {
      if (metric.aggregations.avg < 90) {
        insights.push({
          id: `performance_delivery_${Date.now()}`,
          type: "recommendation",
          title: "Low Delivery Rate Detected",
          description: `Delivery rate of ${metric.aggregations.avg.toFixed(1)}% is below optimal threshold`,
          severity: metric.aggregations.avg < 80 ? "high" : "medium",
          metric: MetricType.DELIVERY_RATE,
          dimensions: metric.dimensions,
          value: metric.aggregations.avg,
          expectedValue: 95,
          confidence: 0.9,
          actionable: true,
          recommendations: [
            "Check provider API status",
            "Review template approval status",
            "Verify recipient phone numbers",
            "Consider switching to backup provider",
          ],
          detectedAt: new Date(),
        });
      }
    }

    return insights;
  }

  private async generateTrendInsights(
    data: AggregatedMetric[],
  ): Promise<InsightData[]> {
    const insights: InsightData[] = [];

    // 증가/감소 트렌드 분석
    const sentMetrics = data
      .filter((d) => d.type === MetricType.MESSAGE_SENT)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    if (sentMetrics.length >= 3) {
      const trend = this.calculateTrend(
        sentMetrics.map((m) => m.aggregations.sum),
      );

      if (Math.abs(trend) > 100) {
        // 일일 100개 이상 변화
        insights.push({
          id: `trend_sent_${Date.now()}`,
          type: "trend",
          title: `${trend > 0 ? "Increasing" : "Decreasing"} Message Volume`,
          description: `Message volume is ${trend > 0 ? "increasing" : "decreasing"} by approximately ${Math.abs(trend).toFixed(0)} messages per day`,
          severity: "low",
          metric: MetricType.MESSAGE_SENT,
          dimensions: {},
          value: sentMetrics[sentMetrics.length - 1].aggregations.sum,
          confidence: 0.7,
          actionable: trend < -500, // 급격한 감소시에만 액션 필요
          recommendations:
            trend < -500
              ? [
                  "Investigate cause of volume decrease",
                  "Check for system issues or campaign changes",
                ]
              : undefined,
          detectedAt: new Date(),
        });
      }
    }

    return insights;
  }

  private async generateComparisonInsights(
    data: AggregatedMetric[],
  ): Promise<InsightData[]> {
    const insights: InsightData[] = [];

    // 프로바이더별 성능 비교
    const providerPerformance = new Map<
      string,
      { delivered: number; sent: number }
    >();

    for (const metric of data) {
      const provider = metric.dimensions.provider;
      if (!provider) continue;

      if (!providerPerformance.has(provider)) {
        providerPerformance.set(provider, { delivered: 0, sent: 0 });
      }

      const stats = providerPerformance.get(provider)!;
      if (metric.type === MetricType.MESSAGE_SENT) {
        stats.sent += metric.aggregations.sum;
      } else if (metric.type === MetricType.MESSAGE_DELIVERED) {
        stats.delivered += metric.aggregations.sum;
      }
    }

    // 프로바이더별 성능 차이 분석
    const providers = Array.from(providerPerformance.entries());
    if (providers.length > 1) {
      const rates = providers.map(([provider, stats]) => ({
        provider,
        rate: stats.sent > 0 ? (stats.delivered / stats.sent) * 100 : 0,
        volume: stats.sent,
      }));

      const avgRate = rates.reduce((sum, r) => sum + r.rate, 0) / rates.length;
      const underperforming = rates.filter((r) => r.rate < avgRate - 10); // 평균보다 10% 낮은 프로바이더

      for (const provider of underperforming) {
        insights.push({
          id: `comparison_provider_${provider.provider}_${Date.now()}`,
          type: "recommendation",
          title: `Provider ${provider.provider} Underperforming`,
          description: `${provider.provider} delivery rate (${provider.rate.toFixed(1)}%) is significantly below average (${avgRate.toFixed(1)}%)`,
          severity: provider.rate < avgRate - 20 ? "high" : "medium",
          metric: MetricType.PROVIDER_PERFORMANCE,
          dimensions: { provider: provider.provider },
          value: provider.rate,
          expectedValue: avgRate,
          confidence: 0.8,
          actionable: true,
          recommendations: [
            `Contact ${provider.provider} support team`,
            "Consider reducing traffic to this provider",
            "Check provider-specific settings and configurations",
          ],
          detectedAt: new Date(),
        });
      }
    }

    return insights;
  }

  private async generateRecommendationInsights(
    data: AggregatedMetric[],
  ): Promise<InsightData[]> {
    const insights: InsightData[] = [];

    // 비용 최적화 추천
    const channelUsage = new Map<string, number>();
    for (const metric of data) {
      if (metric.type === MetricType.CHANNEL_USAGE) {
        const channel = metric.dimensions.channel;
        if (channel) {
          channelUsage.set(
            channel,
            (channelUsage.get(channel) || 0) + metric.aggregations.sum,
          );
        }
      }
    }

    const totalUsage = Array.from(channelUsage.values()).reduce(
      (sum, usage) => sum + usage,
      0,
    );
    if (totalUsage > 0) {
      const smsUsage = channelUsage.get("sms") || 0;
      const alimtalkUsage = channelUsage.get("alimtalk") || 0;

      // SMS 사용률이 높은 경우 알림톡 전환 추천
      if (smsUsage / totalUsage > 0.3 && alimtalkUsage > 0) {
        insights.push({
          id: `recommendation_channel_${Date.now()}`,
          type: "recommendation",
          title: "Consider Switching to AlimTalk",
          description: `${((smsUsage / totalUsage) * 100).toFixed(1)}% of messages are sent via SMS. AlimTalk could reduce costs`,
          severity: "low",
          metric: MetricType.CHANNEL_USAGE,
          dimensions: { optimization: "cost" },
          value: smsUsage,
          confidence: 0.8,
          actionable: true,
          recommendations: [
            "Evaluate message types suitable for AlimTalk conversion",
            "Create AlimTalk templates for common SMS use cases",
            "Implement fallback logic for failed AlimTalk messages",
          ],
          detectedAt: new Date(),
        });
      }
    }

    return insights;
  }

  private calculateSeverity(
    value: number,
    threshold: { min: number; max: number; stdDev: number },
  ): "low" | "medium" | "high" | "critical" {
    const distance = Math.min(
      Math.abs(value - threshold.min) / threshold.stdDev,
      Math.abs(value - threshold.max) / threshold.stdDev,
    );

    if (distance > 3) return "critical";
    if (distance > 2) return "high";
    if (distance > 1) return "medium";
    return "low";
  }

  private calculateConfidence(
    value: number,
    threshold: { min: number; max: number; stdDev: number },
  ): number {
    const distance = Math.min(
      Math.abs(value - threshold.min) / threshold.stdDev,
      Math.abs(value - threshold.max) / threshold.stdDev,
    );

    return Math.min(0.99, 0.5 + distance * 0.15);
  }

  private generateRecommendations(metric: MetricData): string[] {
    const recommendations: string[] = [];

    switch (metric.type) {
      case MetricType.MESSAGE_FAILED:
        recommendations.push(
          "Check provider API status and connectivity",
          "Verify template approval status",
          "Validate recipient phone numbers",
          "Review message content for compliance",
        );
        break;
      case MetricType.DELIVERY_RATE:
        recommendations.push(
          "Monitor provider performance metrics",
          "Check for network connectivity issues",
          "Verify recipient opt-in status",
        );
        break;
      case MetricType.ERROR_RATE:
        recommendations.push(
          "Investigate error patterns and root causes",
          "Implement retry mechanisms for transient failures",
          "Consider switching to backup provider",
        );
        break;
      default:
        recommendations.push(
          "Monitor the metric closely",
          "Investigate potential causes",
          "Check system health and performance",
        );
    }

    return recommendations;
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;

    // 간단한 선형 회귀
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
  }
}
