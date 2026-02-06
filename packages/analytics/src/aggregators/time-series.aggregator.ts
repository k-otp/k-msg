/**
 * Time Series Data Aggregator
 * 시계열 데이터 집계 및 다운샘플링
 */

import type { MetricData, AggregatedMetric, MetricType } from '../types/analytics.types';

export interface TimeWindow {
  start: Date;
  end: Date;
  interval: 'minute' | 'hour' | 'day' | 'week' | 'month';
}

export interface AggregationOptions {
  fillGaps: boolean;
  fillValue: number;
  timezone?: string;
}

export class TimeSeriesAggregator {
  private timezone: string;

  constructor(timezone = 'UTC') {
    this.timezone = timezone;
  }

  /**
   * 시계열 데이터를 지정된 간격으로 집계
   */
  async aggregate(
    metrics: MetricData[],
    interval: 'minute' | 'hour' | 'day' | 'week' | 'month',
    options: AggregationOptions = { fillGaps: false, fillValue: 0 }
  ): Promise<AggregatedMetric[]> {
    if (metrics.length === 0) {
      return [];
    }

    // 메트릭 타입별로 그룹화
    const groupedByType = this.groupByType(metrics);
    const aggregated: AggregatedMetric[] = [];

    for (const [type, typeMetrics] of groupedByType.entries()) {
      // 차원별로 그룹화
      const groupedByDimensions = this.groupByDimensions(typeMetrics);

      for (const [dimensionKey, dimensionMetrics] of groupedByDimensions.entries()) {
        const typeAggregated = await this.aggregateByInterval(
          dimensionMetrics,
          type,
          interval,
          JSON.parse(dimensionKey),
          options
        );
        aggregated.push(...typeAggregated);
      }
    }

    return aggregated.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * 롤링 윈도우 집계
   */
  async aggregateRolling(
    metrics: MetricData[],
    windowSize: number, // 분 단위
    step: number = windowSize // 분 단위
  ): Promise<AggregatedMetric[]> {
    if (metrics.length === 0) {
      return [];
    }

    const sortedMetrics = [...metrics].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const startTime = sortedMetrics[0].timestamp;
    const endTime = sortedMetrics[sortedMetrics.length - 1].timestamp;
    
    const aggregated: AggregatedMetric[] = [];
    const windowMs = windowSize * 60 * 1000;
    const stepMs = step * 60 * 1000;

    let currentTime = startTime.getTime();
    const endTimeMs = endTime.getTime();

    while (currentTime <= endTimeMs) {
      const windowStart = new Date(currentTime);
      const windowEnd = new Date(currentTime + windowMs);

      const windowMetrics = sortedMetrics.filter(m => 
        m.timestamp >= windowStart && m.timestamp < windowEnd
      );

      if (windowMetrics.length > 0) {
        const windowAggregated = await this.aggregateWindow(windowMetrics, windowStart);
        aggregated.push(...windowAggregated);
      }

      currentTime += stepMs;
    }

    return aggregated;
  }

  /**
   * 계절성 분해 (간단한 이동평균 기반)
   */
  async decomposeSeasonality(
    metrics: AggregatedMetric[],
    seasonLength: number = 24 // 시간 단위 (일별 패턴의 경우)
  ): Promise<{
    trend: AggregatedMetric[];
    seasonal: AggregatedMetric[];
    residual: AggregatedMetric[];
  }> {
    if (metrics.length < seasonLength * 2) {
      return { trend: [], seasonal: [], residual: [] };
    }

    const sortedMetrics = [...metrics].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    // 트렌드 계산 (이동평균)
    const trend = this.calculateMovingAverage(sortedMetrics, seasonLength);
    
    // 계절성 계산
    const seasonal = this.calculateSeasonalComponent(sortedMetrics, trend, seasonLength);
    
    // 잔차 계산
    const residual = this.calculateResidual(sortedMetrics, trend, seasonal);

    return { trend, seasonal, residual };
  }

  /**
   * 다운샘플링 (고해상도 → 저해상도)
   */
  async downsample(
    metrics: AggregatedMetric[],
    targetInterval: 'minute' | 'hour' | 'day' | 'week' | 'month'
  ): Promise<AggregatedMetric[]> {
    const groupedByTime = this.groupByTimeInterval(metrics, targetInterval);
    const downsampled: AggregatedMetric[] = [];

    for (const [timeKey, timeMetrics] of groupedByTime.entries()) {
      const timestamp = new Date(timeKey);
      
      // 메트릭 타입과 차원별로 그룹화
      const grouped = new Map<string, Map<string, AggregatedMetric[]>>();
      
      for (const metric of timeMetrics) {
        const typeKey = metric.type.toString();
        const dimensionKey = JSON.stringify(metric.dimensions);
        
        if (!grouped.has(typeKey)) {
          grouped.set(typeKey, new Map());
        }
        if (!grouped.get(typeKey)!.has(dimensionKey)) {
          grouped.get(typeKey)!.set(dimensionKey, []);
        }
        
        grouped.get(typeKey)!.get(dimensionKey)!.push(metric);
      }

      // 각 그룹별로 집계
      for (const [typeKey, typeGroups] of grouped.entries()) {
        for (const [dimensionKey, dimensionMetrics] of typeGroups.entries()) {
          const aggregations = this.calculateAggregations(dimensionMetrics.map(m => m.aggregations.sum));
          
          downsampled.push({
            type: dimensionMetrics[0].type,
            interval: targetInterval,
            timestamp,
            dimensions: JSON.parse(dimensionKey),
            aggregations
          });
        }
      }
    }

    return downsampled.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  private groupByType(metrics: MetricData[]): Map<MetricType, MetricData[]> {
    const grouped = new Map<MetricType, MetricData[]>();
    
    for (const metric of metrics) {
      if (!grouped.has(metric.type)) {
        grouped.set(metric.type, []);
      }
      grouped.get(metric.type)!.push(metric);
    }
    
    return grouped;
  }

  private groupByDimensions(metrics: MetricData[]): Map<string, MetricData[]> {
    const grouped = new Map<string, MetricData[]>();
    
    for (const metric of metrics) {
      const key = JSON.stringify(metric.dimensions);
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(metric);
    }
    
    return grouped;
  }

  private async aggregateByInterval(
    metrics: MetricData[],
    type: MetricType,
    interval: 'minute' | 'hour' | 'day' | 'week' | 'month',
    dimensions: Record<string, string>,
    options: AggregationOptions
  ): Promise<AggregatedMetric[]> {
    const grouped = this.groupByTimeInterval(metrics, interval);
    const aggregated: AggregatedMetric[] = [];

    // 시간 간격 채우기 (옵션이 활성화된 경우)
    if (options.fillGaps && grouped.size > 0) {
      const timeKeys = Array.from(grouped.keys()).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
      const filledGroups = this.fillTimeGaps(timeKeys, interval, options.fillValue);
      
      for (const [timeKey, defaultValue] of filledGroups.entries()) {
        if (!grouped.has(timeKey)) {
          grouped.set(timeKey, [{
            id: `filled_${Date.now()}`,
            type,
            timestamp: new Date(timeKey),
            value: defaultValue,
            dimensions
          }]);
        }
      }
    }

    for (const [timeKey, timeMetrics] of grouped.entries()) {
      const timestamp = new Date(timeKey);
      const values = timeMetrics.map(m => m.value);
      const aggregations = this.calculateAggregations(values);

      aggregated.push({
        type,
        interval,
        timestamp,
        dimensions,
        aggregations
      });
    }

    return aggregated;
  }

  private groupByTimeInterval(
    metrics: (MetricData | AggregatedMetric)[],
    interval: 'minute' | 'hour' | 'day' | 'week' | 'month'
  ): Map<string, any[]> {
    const grouped = new Map<string, any[]>();

    for (const metric of metrics) {
      const timeKey = this.getTimeIntervalKey(metric.timestamp, interval);
      if (!grouped.has(timeKey)) {
        grouped.set(timeKey, []);
      }
      grouped.get(timeKey)!.push(metric);
    }

    return grouped;
  }

  private getTimeIntervalKey(timestamp: Date, interval: 'minute' | 'hour' | 'day' | 'week' | 'month'): string {
    const date = new Date(timestamp);

    switch (interval) {
      case 'minute':
        date.setSeconds(0, 0);
        break;
      case 'hour':
        date.setMinutes(0, 0, 0);
        break;
      case 'day':
        date.setHours(0, 0, 0, 0);
        break;
      case 'week':
        const dayOfWeek = date.getDay();
        const diff = date.getDate() - dayOfWeek;
        date.setDate(diff);
        date.setHours(0, 0, 0, 0);
        break;
      case 'month':
        date.setDate(1);
        date.setHours(0, 0, 0, 0);
        break;
    }

    return date.toISOString();
  }

  private fillTimeGaps(
    timeKeys: string[],
    interval: 'minute' | 'hour' | 'day' | 'week' | 'month',
    fillValue: number
  ): Map<string, number> {
    const filled = new Map<string, number>();
    
    if (timeKeys.length < 2) {
      return filled;
    }

    const start = new Date(timeKeys[0]);
    const end = new Date(timeKeys[timeKeys.length - 1]);
    
    let current = new Date(start);
    
    while (current <= end) {
      const key = current.toISOString();
      filled.set(key, fillValue);
      
      // 다음 간격으로 이동
      switch (interval) {
        case 'minute':
          current.setMinutes(current.getMinutes() + 1);
          break;
        case 'hour':
          current.setHours(current.getHours() + 1);
          break;
        case 'day':
          current.setDate(current.getDate() + 1);
          break;
        case 'week':
          current.setDate(current.getDate() + 7);
          break;
        case 'month':
          current.setMonth(current.getMonth() + 1);
          break;
      }
    }

    return filled;
  }

  private calculateAggregations(values: number[]) {
    if (values.length === 0) {
      return { count: 0, sum: 0, avg: 0, min: 0, max: 0 };
    }

    const sum = values.reduce((acc, val) => acc + val, 0);
    const count = values.length;
    const avg = sum / count;
    const min = Math.min(...values);
    const max = Math.max(...values);

    return { count, sum, avg, min, max };
  }

  private async aggregateWindow(metrics: MetricData[], windowStart: Date): Promise<AggregatedMetric[]> {
    const grouped = this.groupByType(metrics);
    const aggregated: AggregatedMetric[] = [];

    for (const [type, typeMetrics] of grouped.entries()) {
      const dimensionGroups = this.groupByDimensions(typeMetrics);
      
      for (const [dimensionKey, dimensionMetrics] of dimensionGroups.entries()) {
        const values = dimensionMetrics.map(m => m.value);
        const aggregations = this.calculateAggregations(values);
        
        aggregated.push({
          type,
          interval: 'minute', // 롤링 윈도우는 분 단위로 처리
          timestamp: windowStart,
          dimensions: JSON.parse(dimensionKey),
          aggregations
        });
      }
    }

    return aggregated;
  }

  private calculateMovingAverage(metrics: AggregatedMetric[], windowSize: number): AggregatedMetric[] {
    const trend: AggregatedMetric[] = [];
    
    for (let i = Math.floor(windowSize / 2); i < metrics.length - Math.floor(windowSize / 2); i++) {
      const window = metrics.slice(i - Math.floor(windowSize / 2), i + Math.floor(windowSize / 2) + 1);
      const avgValue = window.reduce((sum, m) => sum + m.aggregations.avg, 0) / window.length;
      
      trend.push({
        ...metrics[i],
        aggregations: {
          ...metrics[i].aggregations,
          avg: avgValue,
          sum: avgValue * metrics[i].aggregations.count
        }
      });
    }
    
    return trend;
  }

  private calculateSeasonalComponent(
    metrics: AggregatedMetric[],
    trend: AggregatedMetric[],
    seasonLength: number
  ): AggregatedMetric[] {
    const seasonal: AggregatedMetric[] = [];
    const seasonalPattern = new Array(seasonLength).fill(0);
    const seasonalCounts = new Array(seasonLength).fill(0);
    
    // 계절성 패턴 계산
    for (let i = 0; i < metrics.length; i++) {
      const seasonIndex = i % seasonLength;
      const trendValue = trend.find(t => t.timestamp.getTime() === metrics[i].timestamp.getTime());
      
      if (trendValue) {
        seasonalPattern[seasonIndex] += metrics[i].aggregations.avg - trendValue.aggregations.avg;
        seasonalCounts[seasonIndex]++;
      }
    }
    
    // 평균 계산
    for (let i = 0; i < seasonLength; i++) {
      if (seasonalCounts[i] > 0) {
        seasonalPattern[i] /= seasonalCounts[i];
      }
    }
    
    // 계절성 컴포넌트 생성
    for (let i = 0; i < metrics.length; i++) {
      const seasonIndex = i % seasonLength;
      seasonal.push({
        ...metrics[i],
        aggregations: {
          ...metrics[i].aggregations,
          avg: seasonalPattern[seasonIndex],
          sum: seasonalPattern[seasonIndex] * metrics[i].aggregations.count
        }
      });
    }
    
    return seasonal;
  }

  private calculateResidual(
    original: AggregatedMetric[],
    trend: AggregatedMetric[],
    seasonal: AggregatedMetric[]
  ): AggregatedMetric[] {
    const residual: AggregatedMetric[] = [];
    
    for (let i = 0; i < original.length; i++) {
      const trendValue = trend.find(t => t.timestamp.getTime() === original[i].timestamp.getTime());
      const seasonalValue = seasonal[i];
      
      let residualValue = original[i].aggregations.avg;
      if (trendValue) {
        residualValue -= trendValue.aggregations.avg;
      }
      if (seasonalValue) {
        residualValue -= seasonalValue.aggregations.avg;
      }
      
      residual.push({
        ...original[i],
        aggregations: {
          ...original[i].aggregations,
          avg: residualValue,
          sum: residualValue * original[i].aggregations.count
        }
      });
    }
    
    return residual;
  }
}