/**
 * Metric Aggregator
 * 메트릭별 특화 집계 로직
 */

import type { AggregatedMetric, MetricData } from "../types/analytics.types";
import { MetricType } from "../types/analytics.types";

export interface AggregationRule {
  metricType: MetricType;
  aggregationType:
    | "sum"
    | "avg"
    | "min"
    | "max"
    | "count"
    | "rate"
    | "percentile";
  dimensions: string[];
  conditions?: Array<{
    field: string;
    operator: "equals" | "not_equals" | "gt" | "lt" | "contains";
    value: any;
  }>;
  percentile?: number; // percentile aggregation용
}

export interface AggregatorConfig {
  rules: AggregationRule[];
  batchSize: number;
  flushInterval: number; // ms
}

export class MetricAggregator {
  private config: AggregatorConfig;
  private buffer: Map<string, MetricData[]> = new Map();
  private aggregationCache: Map<string, AggregatedMetric[]> = new Map();

  constructor(config: AggregatorConfig) {
    this.config = config;
    this.startPeriodicFlush();
  }

  /**
   * 메트릭 추가 및 실시간 집계
   */
  async addMetric(metric: MetricData): Promise<void> {
    const bufferKey = this.getBufferKey(metric);

    if (!this.buffer.has(bufferKey)) {
      this.buffer.set(bufferKey, []);
    }

    this.buffer.get(bufferKey)!.push(metric);

    // 버퍼가 가득 찬 경우 즉시 집계
    if (this.buffer.get(bufferKey)!.length >= this.config.batchSize) {
      await this.flushBuffer(bufferKey);
    }
  }

  /**
   * 배치 메트릭 처리
   */
  async addMetrics(metrics: MetricData[]): Promise<void> {
    for (const metric of metrics) {
      await this.addMetric(metric);
    }
  }

  /**
   * 규칙 기반 집계 실행
   */
  async aggregateByRules(metrics: MetricData[]): Promise<AggregatedMetric[]> {
    const results: AggregatedMetric[] = [];

    for (const rule of this.config.rules) {
      const applicableMetrics = this.filterMetricsByRule(metrics, rule);
      if (applicableMetrics.length === 0) continue;

      const aggregated = await this.applyAggregationRule(
        applicableMetrics,
        rule,
      );
      results.push(...aggregated);
    }

    return results;
  }

  /**
   * 커스텀 집계 (동적 규칙)
   */
  async aggregateCustom(
    metrics: MetricData[],
    groupBy: string[],
    aggregationType: "sum" | "avg" | "min" | "max" | "count" | "rate",
    filters?: Record<string, any>,
  ): Promise<AggregatedMetric[]> {
    let filteredMetrics = metrics;

    // 필터 적용
    if (filters) {
      filteredMetrics = this.applyFilters(metrics, filters);
    }

    // 그룹화
    const grouped = this.groupMetrics(filteredMetrics, groupBy);
    const results: AggregatedMetric[] = [];

    for (const [groupKey, groupMetrics] of grouped.entries()) {
      const dimensions = JSON.parse(groupKey);
      const aggregated = await this.performAggregation(
        groupMetrics,
        aggregationType,
        dimensions,
      );
      results.push(...aggregated);
    }

    return results;
  }

  /**
   * 비율 계산 (예: 전환율, 오류율)
   */
  async calculateRates(
    numeratorMetrics: MetricData[],
    denominatorMetrics: MetricData[],
    groupBy: string[] = [],
  ): Promise<AggregatedMetric[]> {
    const numGrouped = this.groupMetrics(numeratorMetrics, groupBy);
    const denGrouped = this.groupMetrics(denominatorMetrics, groupBy);
    const rates: AggregatedMetric[] = [];

    for (const [groupKey, numMetrics] of numGrouped.entries()) {
      const denMetrics = denGrouped.get(groupKey) || [];
      const dimensions = JSON.parse(groupKey);

      const numSum = numMetrics.reduce((sum, m) => sum + m.value, 0);
      const denSum = denMetrics.reduce((sum, m) => sum + m.value, 0);
      const rate = denSum > 0 ? (numSum / denSum) * 100 : 0;

      // 최신 타임스탬프 사용
      const latestTimestamp = new Date(
        Math.max(
          ...numMetrics.map((m) => m.timestamp.getTime()),
          ...denMetrics.map((m) => m.timestamp.getTime()),
        ),
      );

      rates.push({
        type: numMetrics[0]?.type || MetricType.DELIVERY_RATE,
        interval: "minute",
        timestamp: latestTimestamp,
        dimensions,
        aggregations: {
          count: numMetrics.length + denMetrics.length,
          sum: rate,
          avg: rate,
          min: rate,
          max: rate,
        },
      });
    }

    return rates;
  }

  /**
   * 백분위수 계산
   */
  async calculatePercentiles(
    metrics: MetricData[],
    percentiles: number[],
    groupBy: string[] = [],
  ): Promise<AggregatedMetric[]> {
    const grouped = this.groupMetrics(metrics, groupBy);
    const results: AggregatedMetric[] = [];

    for (const [groupKey, groupMetrics] of grouped.entries()) {
      const dimensions = JSON.parse(groupKey);
      const values = groupMetrics.map((m) => m.value).sort((a, b) => a - b);

      for (const percentile of percentiles) {
        const value = this.calculatePercentile(values, percentile);

        results.push({
          type: groupMetrics[0].type,
          interval: "minute",
          timestamp: new Date(),
          dimensions: { ...dimensions, percentile: percentile.toString() },
          aggregations: {
            count: values.length,
            sum: value,
            avg: value,
            min: value,
            max: value,
          },
        });
      }
    }

    return results;
  }

  /**
   * 슬라이딩 윈도우 집계
   */
  async aggregateSlidingWindow(
    metrics: MetricData[],
    windowSizeMs: number,
    stepMs: number,
    aggregationType: "sum" | "avg" | "min" | "max" | "count",
  ): Promise<AggregatedMetric[]> {
    const sortedMetrics = [...metrics].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
    );
    if (sortedMetrics.length === 0) return [];

    const results: AggregatedMetric[] = [];
    const startTime = sortedMetrics[0].timestamp.getTime();
    const endTime = sortedMetrics[sortedMetrics.length - 1].timestamp.getTime();

    let currentTime = startTime;
    while (currentTime <= endTime) {
      const windowStart = new Date(currentTime);
      const windowEnd = new Date(currentTime + windowSizeMs);

      const windowMetrics = sortedMetrics.filter(
        (m) => m.timestamp >= windowStart && m.timestamp < windowEnd,
      );

      if (windowMetrics.length > 0) {
        const aggregated = await this.performAggregation(
          windowMetrics,
          aggregationType,
          {},
        );
        results.push(...aggregated);
      }

      currentTime += stepMs;
    }

    return results;
  }

  /**
   * 메트릭 정규화
   */
  async normalizeMetrics(
    metrics: AggregatedMetric[],
    method: "minmax" | "zscore" | "robust",
  ): Promise<AggregatedMetric[]> {
    const byType = new Map<MetricType, AggregatedMetric[]>();

    // 타입별 그룹화
    for (const metric of metrics) {
      if (!byType.has(metric.type)) {
        byType.set(metric.type, []);
      }
      byType.get(metric.type)!.push(metric);
    }

    const normalized: AggregatedMetric[] = [];

    for (const [type, typeMetrics] of byType.entries()) {
      const values = typeMetrics.map((m) => m.aggregations.avg);
      let normalizedValues: number[];

      switch (method) {
        case "minmax":
          normalizedValues = this.minMaxNormalize(values);
          break;
        case "zscore":
          normalizedValues = this.zScoreNormalize(values);
          break;
        case "robust":
          normalizedValues = this.robustNormalize(values);
          break;
        default:
          normalizedValues = values;
      }

      for (let i = 0; i < typeMetrics.length; i++) {
        normalized.push({
          ...typeMetrics[i],
          aggregations: {
            ...typeMetrics[i].aggregations,
            avg: normalizedValues[i],
            sum: normalizedValues[i] * typeMetrics[i].aggregations.count,
          },
        });
      }
    }

    return normalized;
  }

  private getBufferKey(metric: MetricData): string {
    return `${metric.type}_${JSON.stringify(metric.dimensions)}`;
  }

  private async flushBuffer(bufferKey: string): Promise<void> {
    const metrics = this.buffer.get(bufferKey);
    if (!metrics || metrics.length === 0) return;

    // 집계 수행
    const aggregated = await this.aggregateByRules(metrics);

    // 캐시에 저장
    if (aggregated.length > 0) {
      const cacheKey = `${bufferKey}_${Date.now()}`;
      this.aggregationCache.set(cacheKey, aggregated);
    }

    // 버퍼 클리어
    this.buffer.set(bufferKey, []);
  }

  private filterMetricsByRule(
    metrics: MetricData[],
    rule: AggregationRule,
  ): MetricData[] {
    let filtered = metrics.filter((m) => m.type === rule.metricType);

    if (rule.conditions) {
      filtered = filtered.filter((metric) => {
        return rule.conditions!.every((condition) => {
          const value = this.getFieldValue(metric, condition.field);
          return this.evaluateCondition(
            value,
            condition.operator,
            condition.value,
          );
        });
      });
    }

    return filtered;
  }

  private async applyAggregationRule(
    metrics: MetricData[],
    rule: AggregationRule,
  ): Promise<AggregatedMetric[]> {
    const grouped = this.groupMetrics(metrics, rule.dimensions);
    const results: AggregatedMetric[] = [];

    for (const [groupKey, groupMetrics] of grouped.entries()) {
      const dimensions = JSON.parse(groupKey);

      if (rule.aggregationType === "percentile") {
        if (rule.percentile) {
          const values = groupMetrics.map((m) => m.value).sort((a, b) => a - b);
          const percentileValue = this.calculatePercentile(
            values,
            rule.percentile,
          );

          results.push({
            type: rule.metricType,
            interval: "minute",
            timestamp: new Date(),
            dimensions,
            aggregations: {
              count: values.length,
              sum: percentileValue,
              avg: percentileValue,
              min: percentileValue,
              max: percentileValue,
            },
          });
        }
        // Skip if percentile but no percentile value specified
      } else {
        const aggregated = await this.performAggregation(
          groupMetrics,
          rule.aggregationType,
          dimensions,
        );
        results.push(...aggregated);
      }
    }

    return results;
  }

  private groupMetrics(
    metrics: MetricData[],
    groupBy: string[],
  ): Map<string, MetricData[]> {
    const grouped = new Map<string, MetricData[]>();

    for (const metric of metrics) {
      const groupKey = this.createGroupKey(metric, groupBy);

      if (!grouped.has(groupKey)) {
        grouped.set(groupKey, []);
      }
      grouped.get(groupKey)!.push(metric);
    }

    return grouped;
  }

  private createGroupKey(metric: MetricData, groupBy: string[]): string {
    const groupDimensions: Record<string, string> = {};

    for (const field of groupBy) {
      groupDimensions[field] = this.getFieldValue(metric, field);
    }

    return JSON.stringify(groupDimensions);
  }

  private getFieldValue(metric: MetricData, field: string): string {
    if (field === "type") return metric.type.toString();
    if (field === "timestamp") return metric.timestamp.toISOString();
    return metric.dimensions[field] || "";
  }

  private evaluateCondition(
    value: any,
    operator: string,
    expected: any,
  ): boolean {
    switch (operator) {
      case "equals":
        return value === expected;
      case "not_equals":
        return value !== expected;
      case "gt":
        return Number(value) > Number(expected);
      case "lt":
        return Number(value) < Number(expected);
      case "contains":
        return String(value).includes(String(expected));
      default:
        return false;
    }
  }

  private async performAggregation(
    metrics: MetricData[],
    aggregationType: "sum" | "avg" | "min" | "max" | "count" | "rate",
    dimensions: Record<string, string>,
  ): Promise<AggregatedMetric[]> {
    if (metrics.length === 0) return [];

    const values = metrics.map((m) => m.value);
    let aggregatedValue: number;

    switch (aggregationType) {
      case "sum":
        aggregatedValue = values.reduce((sum, val) => sum + val, 0);
        break;
      case "avg":
        aggregatedValue =
          values.reduce((sum, val) => sum + val, 0) / values.length;
        break;
      case "min":
        aggregatedValue = Math.min(...values);
        break;
      case "max":
        aggregatedValue = Math.max(...values);
        break;
      case "count":
        aggregatedValue = values.length;
        break;
      case "rate":
        // 비율 계산은 별도 메서드에서 처리
        aggregatedValue = 0;
        break;
      default:
        aggregatedValue = 0;
    }

    return [
      {
        type: metrics[0].type,
        interval: "minute",
        timestamp: new Date(),
        dimensions,
        aggregations: {
          count: values.length,
          sum:
            aggregationType === "sum"
              ? aggregatedValue
              : values.reduce((sum, val) => sum + val, 0),
          avg: aggregationType === "avg" ? aggregatedValue : aggregatedValue,
          min: Math.min(...values),
          max: Math.max(...values),
        },
      },
    ];
  }

  private applyFilters(
    metrics: MetricData[],
    filters: Record<string, any>,
  ): MetricData[] {
    return metrics.filter((metric) => {
      return Object.entries(filters).every(([key, value]) => {
        const metricValue = this.getFieldValue(metric, key);
        return Array.isArray(value)
          ? value.includes(metricValue)
          : metricValue === value;
      });
    });
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;

    const index = (percentile / 100) * (values.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);

    if (lower === upper) {
      return values[lower];
    }

    const weight = index - lower;
    return values[lower] * (1 - weight) + values[upper] * weight;
  }

  private minMaxNormalize(values: number[]): number[] {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;

    return range === 0
      ? values.map(() => 0)
      : values.map((v) => (v - min) / range);
  }

  private zScoreNormalize(values: number[]): number[] {
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length,
    );

    return stdDev === 0
      ? values.map(() => 0)
      : values.map((v) => (v - mean) / stdDev);
  }

  private robustNormalize(values: number[]): number[] {
    const sorted = [...values].sort((a, b) => a - b);
    const median = this.calculatePercentile(sorted, 50);
    const mad = this.calculateMAD(sorted, median);

    return mad === 0
      ? values.map(() => 0)
      : values.map((v) => (v - median) / mad);
  }

  private calculateMAD(values: number[], median: number): number {
    const absDeviations = values.map((v) => Math.abs(v - median));
    return this.calculatePercentile(
      absDeviations.sort((a, b) => a - b),
      50,
    );
  }

  private startPeriodicFlush(): void {
    setInterval(async () => {
      for (const bufferKey of this.buffer.keys()) {
        await this.flushBuffer(bufferKey);
      }
    }, this.config.flushInterval);
  }
}
