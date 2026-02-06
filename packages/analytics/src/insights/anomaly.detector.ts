/**
 * Anomaly Detector
 * 이상 징후 탐지 및 분석
 */

import type { MetricData, AggregatedMetric, InsightData } from '../types/analytics.types';
import { MetricType } from '../types/analytics.types';

export interface AnomalyDetectionConfig {
  algorithms: AnomalyAlgorithm[];
  sensitivity: 'low' | 'medium' | 'high';
  minDataPoints: number;
  confidenceThreshold: number; // 0-1
  enableSeasonalAdjustment: boolean;
}

export interface AnomalyAlgorithm {
  name: string;
  type: 'statistical' | 'ml' | 'rule-based';
  enabled: boolean;
  config: Record<string, any>;
}

export interface Anomaly {
  id: string;
  metricType: MetricType;
  timestamp: Date;
  value: number;
  expectedValue: number;
  deviation: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  algorithm: string;
  dimensions: Record<string, string>;
  context?: {
    trend: 'increasing' | 'decreasing' | 'stable';
    seasonality: boolean;
    historicalComparison: number;
  };
}

export class AnomalyDetector {
  private config: AnomalyDetectionConfig;
  private historicalData: Map<string, number[]> = new Map();
  private seasonalPatterns: Map<string, number[]> = new Map();
  private baselines: Map<string, { mean: number; stdDev: number; min: number; max: number }> = new Map();

  private defaultConfig: AnomalyDetectionConfig = {
    algorithms: [
      { name: 'zscore', type: 'statistical', enabled: true, config: { threshold: 3 } },
      { name: 'iqr', type: 'statistical', enabled: true, config: { multiplier: 1.5 } },
      { name: 'isolation', type: 'ml', enabled: false, config: { contamination: 0.1 } }
    ],
    sensitivity: 'medium',
    minDataPoints: 10,
    confidenceThreshold: 0.7,
    enableSeasonalAdjustment: true
  };

  constructor(config: Partial<AnomalyDetectionConfig> = {}) {
    this.config = { ...this.defaultConfig, ...config };
  }

  /**
   * 실시간 이상 탐지
   */
  async detectRealTimeAnomalies(metric: MetricData): Promise<Anomaly[]> {
    const key = this.getMetricKey(metric.type, metric.dimensions);
    const anomalies: Anomaly[] = [];

    // 히스토리 업데이트
    this.updateHistoricalData(key, metric.value);

    // 각 알고리즘으로 탐지
    for (const algorithm of this.config.algorithms) {
      if (!algorithm.enabled) continue;

      try {
        const anomaly = await this.runAlgorithm(metric, algorithm, key);
        if (anomaly && anomaly.confidence >= this.config.confidenceThreshold) {
          anomalies.push(anomaly);
        }
      } catch (error) {
        console.error(`Anomaly detection failed for algorithm ${algorithm.name}:`, error);
      }
    }

    return this.deduplicateAndRankAnomalies(anomalies);
  }

  /**
   * 배치 이상 탐지
   */
  async detectBatchAnomalies(
    metrics: AggregatedMetric[],
    timeWindow?: { start: Date; end: Date }
  ): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];

    // 메트릭 타입별로 그룹화
    const groupedMetrics = this.groupMetricsByTypeAndDimensions(metrics);

    for (const [key, typeMetrics] of groupedMetrics.entries()) {
      const [metricType, dimensionsStr] = key.split('|');
      const dimensions = JSON.parse(dimensionsStr);

      // 시계열 데이터 준비
      const timeSeries = typeMetrics
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
        .map(m => ({ timestamp: m.timestamp, value: m.aggregations.avg }));

      if (timeSeries.length < this.config.minDataPoints) {
        continue;
      }

      // 계절성 조정
      let adjustedSeries = timeSeries;
      if (this.config.enableSeasonalAdjustment) {
        adjustedSeries = await this.adjustForSeasonality(timeSeries, key);
      }

      // 각 포인트에 대해 이상 탐지
      for (let i = Math.floor(adjustedSeries.length * 0.3); i < adjustedSeries.length; i++) {
        const point = adjustedSeries[i];
        const historicalWindow = adjustedSeries.slice(Math.max(0, i - 20), i);

        if (historicalWindow.length < this.config.minDataPoints) continue;

        const mockMetric: MetricData = {
          id: `batch_${i}`,
          type: metricType as MetricType,
          timestamp: point.timestamp,
          value: point.value,
          dimensions
        };

        const pointAnomalies = await this.detectRealTimeAnomalies(mockMetric);
        anomalies.push(...pointAnomalies);
      }
    }

    return this.deduplicateAndRankAnomalies(anomalies);
  }

  /**
   * 트렌드 변화 탐지
   */
  async detectTrendChanges(
    metrics: AggregatedMetric[],
    windowSize: number = 10
  ): Promise<InsightData[]> {
    const insights: InsightData[] = [];
    const groupedMetrics = this.groupMetricsByTypeAndDimensions(metrics);

    for (const [key, typeMetrics] of groupedMetrics.entries()) {
      const [metricType, dimensionsStr] = key.split('|');
      const dimensions = JSON.parse(dimensionsStr);

      const sortedMetrics = typeMetrics.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      
      if (sortedMetrics.length < windowSize * 2) continue;

      // 슬라이딩 윈도우로 트렌드 분석
      for (let i = windowSize; i < sortedMetrics.length - windowSize; i++) {
        const beforeWindow = sortedMetrics.slice(i - windowSize, i);
        const afterWindow = sortedMetrics.slice(i, i + windowSize);

        const beforeTrend = this.calculateTrend(beforeWindow.map(m => m.aggregations.avg));
        const afterTrend = this.calculateTrend(afterWindow.map(m => m.aggregations.avg));

        // 트렌드 변화 탐지
        const trendChange = Math.abs(afterTrend - beforeTrend);
        const significanceThreshold = this.getSensitivityThreshold('trend');

        if (trendChange > significanceThreshold) {
          insights.push({
            id: `trend_change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'trend',
            title: `Trend Change Detected in ${metricType}`,
            description: `Significant trend change from ${beforeTrend.toFixed(2)} to ${afterTrend.toFixed(2)}`,
            severity: this.calculateTrendSeverity(trendChange, significanceThreshold),
            metric: metricType as MetricType,
            dimensions,
            value: afterTrend,
            expectedValue: beforeTrend,
            confidence: Math.min(0.95, 0.5 + (trendChange / significanceThreshold) * 0.3),
            actionable: trendChange > significanceThreshold * 2,
            recommendations: this.generateTrendRecommendations(beforeTrend, afterTrend, metricType as MetricType),
            detectedAt: sortedMetrics[i].timestamp
          });
        }
      }
    }

    return insights;
  }

  /**
   * 베이스라인 업데이트
   */
  async updateBaselines(metrics: AggregatedMetric[]): Promise<void> {
    const groupedMetrics = this.groupMetricsByTypeAndDimensions(metrics);

    for (const [key, typeMetrics] of groupedMetrics.entries()) {
      const values = typeMetrics.map(m => m.aggregations.avg);
      
      if (values.length < this.config.minDataPoints) continue;

      const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
      const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      const min = Math.min(...values);
      const max = Math.max(...values);

      this.baselines.set(key, { mean, stdDev, min, max });
    }
  }

  private async runAlgorithm(
    metric: MetricData,
    algorithm: AnomalyAlgorithm,
    key: string
  ): Promise<Anomaly | null> {
    const historicalValues = this.historicalData.get(key) || [];
    
    if (historicalValues.length < this.config.minDataPoints) {
      return null;
    }

    switch (algorithm.name) {
      case 'zscore':
        return this.zScoreDetection(metric, historicalValues, algorithm.config, key);
      
      case 'iqr':
        return this.iqrDetection(metric, historicalValues, algorithm.config, key);
      
      case 'isolation':
        return this.isolationForestDetection(metric, historicalValues, algorithm.config, key);
      
      case 'threshold':
        return this.thresholdDetection(metric, algorithm.config, key);
      
      default:
        return null;
    }
  }

  private zScoreDetection(
    metric: MetricData,
    historicalValues: number[],
    config: any,
    key: string
  ): Anomaly | null {
    const mean = historicalValues.reduce((sum, v) => sum + v, 0) / historicalValues.length;
    const variance = historicalValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / historicalValues.length;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev === 0) return null;

    const zScore = Math.abs((metric.value - mean) / stdDev);
    const threshold = config.threshold || 3;

    if (zScore > threshold) {
      const severity = this.calculateSeverity(zScore, threshold);
      const confidence = Math.min(0.99, zScore / threshold * 0.8);

      return {
        id: `zscore_${metric.id}`,
        metricType: metric.type,
        timestamp: metric.timestamp,
        value: metric.value,
        expectedValue: mean,
        deviation: zScore,
        severity,
        confidence,
        algorithm: 'zscore',
        dimensions: metric.dimensions,
        context: {
          trend: this.detectTrend(historicalValues),
          seasonality: false,
          historicalComparison: ((metric.value - mean) / mean) * 100
        }
      };
    }

    return null;
  }

  private iqrDetection(
    metric: MetricData,
    historicalValues: number[],
    config: any,
    key: string
  ): Anomaly | null {
    const sortedValues = [...historicalValues].sort((a, b) => a - b);
    const q1Index = Math.floor(sortedValues.length * 0.25);
    const q3Index = Math.floor(sortedValues.length * 0.75);
    
    const q1 = sortedValues[q1Index];
    const q3 = sortedValues[q3Index];
    const iqr = q3 - q1;
    
    const multiplier = config.multiplier || 1.5;
    const lowerBound = q1 - multiplier * iqr;
    const upperBound = q3 + multiplier * iqr;

    if (metric.value < lowerBound || metric.value > upperBound) {
      const expectedValue = (q1 + q3) / 2;
      const deviation = Math.abs(metric.value - expectedValue) / iqr;
      const severity = this.calculateSeverity(deviation, multiplier);
      const confidence = Math.min(0.99, deviation / multiplier * 0.7);

      return {
        id: `iqr_${metric.id}`,
        metricType: metric.type,
        timestamp: metric.timestamp,
        value: metric.value,
        expectedValue,
        deviation,
        severity,
        confidence,
        algorithm: 'iqr',
        dimensions: metric.dimensions,
        context: {
          trend: this.detectTrend(historicalValues),
          seasonality: false,
          historicalComparison: ((metric.value - expectedValue) / expectedValue) * 100
        }
      };
    }

    return null;
  }

  private isolationForestDetection(
    metric: MetricData,
    historicalValues: number[],
    config: any,
    key: string
  ): Anomaly | null {
    // 간단한 Isolation Forest 구현 (실제로는 더 복잡한 ML 라이브러리 사용)
    const contamination = config.contamination || 0.1;
    const threshold = this.calculateIsolationThreshold(historicalValues, contamination);
    
    const anomalyScore = this.calculateIsolationScore(metric.value, historicalValues);
    
    if (anomalyScore > threshold) {
      const expectedValue = historicalValues.reduce((sum, v) => sum + v, 0) / historicalValues.length;
      const severity = this.calculateSeverity(anomalyScore, threshold);
      const confidence = Math.min(0.99, anomalyScore / threshold * 0.9);

      return {
        id: `isolation_${metric.id}`,
        metricType: metric.type,
        timestamp: metric.timestamp,
        value: metric.value,
        expectedValue,
        deviation: anomalyScore,
        severity,
        confidence,
        algorithm: 'isolation',
        dimensions: metric.dimensions
      };
    }

    return null;
  }

  private thresholdDetection(
    metric: MetricData,
    config: any,
    key: string
  ): Anomaly | null {
    const upperThreshold = config.upperThreshold;
    const lowerThreshold = config.lowerThreshold;

    if (upperThreshold !== undefined && metric.value > upperThreshold) {
      return {
        id: `threshold_upper_${metric.id}`,
        metricType: metric.type,
        timestamp: metric.timestamp,
        value: metric.value,
        expectedValue: upperThreshold,
        deviation: (metric.value - upperThreshold) / upperThreshold,
        severity: 'high',
        confidence: 1.0,
        algorithm: 'threshold',
        dimensions: metric.dimensions
      };
    }

    if (lowerThreshold !== undefined && metric.value < lowerThreshold) {
      return {
        id: `threshold_lower_${metric.id}`,
        metricType: metric.type,
        timestamp: metric.timestamp,
        value: metric.value,
        expectedValue: lowerThreshold,
        deviation: (lowerThreshold - metric.value) / lowerThreshold,
        severity: 'high',
        confidence: 1.0,
        algorithm: 'threshold',
        dimensions: metric.dimensions
      };
    }

    return null;
  }

  private calculateSeverity(deviation: number, threshold: number): 'low' | 'medium' | 'high' | 'critical' {
    const ratio = deviation / threshold;
    
    if (ratio > 3) return 'critical';
    if (ratio > 2) return 'high';
    if (ratio > 1.5) return 'medium';
    return 'low';
  }

  private calculateTrendSeverity(change: number, threshold: number): 'low' | 'medium' | 'high' | 'critical' {
    const ratio = change / threshold;
    
    if (ratio > 4) return 'critical';
    if (ratio > 3) return 'high';
    if (ratio > 2) return 'medium';
    return 'low';
  }

  private getMetricKey(type: MetricType, dimensions: Record<string, string>): string {
    return `${type}|${JSON.stringify(dimensions)}`;
  }

  private updateHistoricalData(key: string, value: number): void {
    const history = this.historicalData.get(key) || [];
    history.push(value);

    // 최근 100개만 유지
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }

    this.historicalData.set(key, history);
  }

  private groupMetricsByTypeAndDimensions(metrics: AggregatedMetric[]): Map<string, AggregatedMetric[]> {
    const grouped = new Map<string, AggregatedMetric[]>();

    for (const metric of metrics) {
      const key = `${metric.type}|${JSON.stringify(metric.dimensions)}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(metric);
    }

    return grouped;
  }

  private async adjustForSeasonality(
    timeSeries: { timestamp: Date; value: number }[],
    key: string
  ): Promise<{ timestamp: Date; value: number }[]> {
    // 간단한 계절성 조정 (이동평균 기반)
    const windowSize = Math.min(24, Math.floor(timeSeries.length / 4)); // 24시간 또는 1/4 길이
    
    if (windowSize < 3) return timeSeries;

    return timeSeries.map((point, index) => {
      const windowStart = Math.max(0, index - Math.floor(windowSize / 2));
      const windowEnd = Math.min(timeSeries.length, windowStart + windowSize);
      const window = timeSeries.slice(windowStart, windowEnd);
      
      const seasonalAvg = window.reduce((sum, p) => sum + p.value, 0) / window.length;
      const adjustedValue = point.value - seasonalAvg + timeSeries.reduce((sum, p) => sum + p.value, 0) / timeSeries.length;
      
      return {
        timestamp: point.timestamp,
        value: adjustedValue
      };
    });
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;

    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }

  private detectTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
    const trend = this.calculateTrend(values);
    const threshold = 0.1; // 임계값

    if (Math.abs(trend) < threshold) return 'stable';
    return trend > 0 ? 'increasing' : 'decreasing';
  }

  private getSensitivityThreshold(type: 'anomaly' | 'trend'): number {
    const baseThresholds = {
      anomaly: { low: 0.5, medium: 0.3, high: 0.1 },
      trend: { low: 2.0, medium: 1.0, high: 0.5 }
    };

    return baseThresholds[type][this.config.sensitivity];
  }

  private calculateIsolationThreshold(values: number[], contamination: number): number {
    // 간단한 임계값 계산 (실제로는 더 복잡한 ML 알고리즘 사용)
    const sorted = [...values].sort((a, b) => a - b);
    const cutoffIndex = Math.floor((1 - contamination) * sorted.length);
    return 0.6; // 간소화된 임계값
  }

  private calculateIsolationScore(value: number, historicalValues: number[]): number {
    // 간단한 isolation score 계산
    const mean = historicalValues.reduce((sum, v) => sum + v, 0) / historicalValues.length;
    const distances = historicalValues.map(v => Math.abs(v - value));
    const avgDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
    
    return avgDistance / (Math.abs(value - mean) + 1);
  }

  private deduplicateAndRankAnomalies(anomalies: Anomaly[]): Anomaly[] {
    // 중복 제거 및 신뢰도순 정렬
    const unique = new Map<string, Anomaly>();
    
    for (const anomaly of anomalies) {
      const key = `${anomaly.metricType}_${JSON.stringify(anomaly.dimensions)}_${anomaly.timestamp.toISOString()}`;
      
      if (!unique.has(key) || unique.get(key)!.confidence < anomaly.confidence) {
        unique.set(key, anomaly);
      }
    }

    return Array.from(unique.values()).sort((a, b) => b.confidence - a.confidence);
  }

  private generateTrendRecommendations(
    beforeTrend: number,
    afterTrend: number,
    metricType: MetricType
  ): string[] {
    const recommendations: string[] = [];
    const isIncreasing = afterTrend > beforeTrend;
    const change = Math.abs(afterTrend - beforeTrend);

    switch (metricType) {
      case MetricType.MESSAGE_FAILED:
        if (isIncreasing) {
          recommendations.push(
            'Investigate provider API issues',
            'Review recent template changes',
            'Check recipient data quality'
          );
        }
        break;
      
      case MetricType.DELIVERY_RATE:
        if (!isIncreasing) {
          recommendations.push(
            'Monitor provider performance',
            'Verify network connectivity',
            'Check for carrier-specific issues'
          );
        }
        break;
      
      case MetricType.MESSAGE_SENT:
        if (isIncreasing) {
          recommendations.push(
            'Monitor system capacity',
            'Prepare for increased load',
            'Check rate limiting settings'
          );
        } else {
          recommendations.push(
            'Investigate traffic decrease',
            'Check for system issues',
            'Review campaign status'
          );
        }
        break;
    }

    if (change > 2.0) {
      recommendations.push('Consider immediate investigation due to significant change');
    }

    return recommendations;
  }
}