/**
 * Dashboard Report Generator
 * 실시간 대시보드 데이터 생성
 */

import type { 
  AggregatedMetric, 
  AnalyticsQuery, 
  AnalyticsResult,
  InsightData 
} from '../types/analytics.types';
import { MetricType } from '../types/analytics.types';

export interface DashboardConfig {
  refreshInterval: number; // ms
  timeRange: {
    default: string; // '1h', '1d', '1w', '1m'
    options: string[];
  };
  widgets: DashboardWidget[];
  filters: DashboardFilter[];
}

export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'gauge' | 'heatmap' | 'trend';
  title: string;
  description?: string;
  position: { x: number; y: number; width: number; height: number };
  query: AnalyticsQuery;
  visualization: VisualizationConfig;
  refreshInterval?: number;
}

export interface VisualizationConfig {
  chartType?: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
  aggregation?: 'sum' | 'avg' | 'min' | 'max' | 'count';
  groupBy?: string[];
  colors?: string[];
  yAxis?: { min?: number; max?: number; label?: string };
  xAxis?: { label?: string };
  showLegend?: boolean;
  showGrid?: boolean;
}

export interface DashboardFilter {
  id: string;
  name: string;
  type: 'select' | 'date' | 'range' | 'multi-select';
  field: string;
  options?: Array<{ value: string; label: string }>;
  defaultValue?: any;
}

export interface DashboardData {
  timestamp: Date;
  timeRange: { start: Date; end: Date };
  kpis: KPIData[];
  widgets: WidgetData[];
  insights: InsightData[];
  filters: Record<string, any>;
}

export interface KPIData {
  id: string;
  name: string;
  value: number;
  previousValue?: number;
  change?: number;
  changePercent?: number;
  trend: 'up' | 'down' | 'stable';
  unit?: string;
  target?: number;
  status: 'good' | 'warning' | 'critical';
}

export interface WidgetData {
  id: string;
  title: string;
  type: string;
  data: any;
  lastUpdated: Date;
  error?: string;
}

export class DashboardGenerator {
  private config: DashboardConfig;
  private dataCache: Map<string, { data: any; timestamp: Date }> = new Map();

  private defaultConfig: DashboardConfig = {
    refreshInterval: 30000, // 30초
    timeRange: {
      default: '1h',
      options: ['15m', '1h', '4h', '1d', '1w', '1m']
    },
    widgets: [],
    filters: [
      {
        id: 'provider',
        name: 'Provider',
        type: 'multi-select',
        field: 'provider',
        options: []
      },
      {
        id: 'channel',
        name: 'Channel',
        type: 'multi-select',
        field: 'channel',
        options: []
      }
    ]
  };

  constructor(config: Partial<DashboardConfig> = {}) {
    this.config = { ...this.defaultConfig, ...config };
    this.initializeDefaultWidgets();
  }

  /**
   * 대시보드 데이터 생성
   */
  async generateDashboard(
    timeRange: { start: Date; end: Date },
    filters: Record<string, any> = {},
    metrics: AggregatedMetric[] = []
  ): Promise<DashboardData> {
    const dashboard: DashboardData = {
      timestamp: new Date(),
      timeRange,
      kpis: [],
      widgets: [],
      insights: [],
      filters
    };

    try {
      // KPI 계산
      dashboard.kpis = await this.calculateKPIs(metrics, timeRange, filters);

      // 위젯 데이터 생성
      dashboard.widgets = await this.generateWidgetData(metrics, timeRange, filters);

      // 인사이트 생성 (외부에서 주입)
      dashboard.insights = [];

    } catch (error) {
      console.error('Dashboard generation failed:', error);
    }

    return dashboard;
  }

  /**
   * 실시간 대시보드 스트림
   */
  async *streamDashboard(
    timeRange: { start: Date; end: Date },
    filters: Record<string, any> = {}
  ): AsyncGenerator<DashboardData> {
    while (true) {
      const dashboard = await this.generateDashboard(timeRange, filters);
      yield dashboard;
      
      await new Promise(resolve => setTimeout(resolve, this.config.refreshInterval));
    }
  }

  /**
   * 특정 위젯 데이터 업데이트
   */
  async updateWidget(
    widgetId: string,
    metrics: AggregatedMetric[],
    timeRange: { start: Date; end: Date },
    filters: Record<string, any> = {}
  ): Promise<WidgetData | null> {
    const widget = this.config.widgets.find(w => w.id === widgetId);
    if (!widget) return null;

    try {
      const data = await this.generateWidgetData([widget], metrics, timeRange, filters);
      return data[0] || null;
    } catch (error) {
      return {
        id: widgetId,
        title: widget.title,
        type: widget.type,
        data: null,
        lastUpdated: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 대시보드 구성 업데이트
   */
  updateConfig(config: Partial<DashboardConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 위젯 추가
   */
  addWidget(widget: DashboardWidget): void {
    this.config.widgets.push(widget);
  }

  /**
   * 위젯 제거
   */
  removeWidget(widgetId: string): boolean {
    const index = this.config.widgets.findIndex(w => w.id === widgetId);
    if (index >= 0) {
      this.config.widgets.splice(index, 1);
      return true;
    }
    return false;
  }

  private async calculateKPIs(
    metrics: AggregatedMetric[],
    timeRange: { start: Date; end: Date },
    filters: Record<string, any>
  ): Promise<KPIData[]> {
    const kpis: KPIData[] = [];

    // 이전 기간 데이터 계산을 위한 시간 범위
    const duration = timeRange.end.getTime() - timeRange.start.getTime();
    const previousTimeRange = {
      start: new Date(timeRange.start.getTime() - duration),
      end: timeRange.start
    };

    // 메시지 전송량 KPI
    const sentMetrics = this.filterMetrics(metrics, MetricType.MESSAGE_SENT, filters);
    const totalSent = sentMetrics.reduce((sum, m) => sum + m.aggregations.sum, 0);
    const previousSent = this.calculatePreviousPeriodValue(sentMetrics, previousTimeRange);
    
    kpis.push({
      id: 'total_sent',
      name: 'Total Messages Sent',
      value: totalSent,
      previousValue: previousSent,
      change: totalSent - previousSent,
      changePercent: previousSent > 0 ? ((totalSent - previousSent) / previousSent) * 100 : 0,
      trend: totalSent > previousSent ? 'up' : totalSent < previousSent ? 'down' : 'stable',
      unit: 'messages',
      status: 'good'
    });

    // 전달률 KPI
    const deliveredMetrics = this.filterMetrics(metrics, MetricType.MESSAGE_DELIVERED, filters);
    const totalDelivered = deliveredMetrics.reduce((sum, m) => sum + m.aggregations.sum, 0);
    const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
    
    kpis.push({
      id: 'delivery_rate',
      name: 'Delivery Rate',
      value: deliveryRate,
      trend: deliveryRate >= 95 ? 'up' : deliveryRate >= 90 ? 'stable' : 'down',
      unit: '%',
      target: 95,
      status: deliveryRate >= 95 ? 'good' : deliveryRate >= 85 ? 'warning' : 'critical'
    });

    // 오류율 KPI
    const failedMetrics = this.filterMetrics(metrics, MetricType.MESSAGE_FAILED, filters);
    const totalFailed = failedMetrics.reduce((sum, m) => sum + m.aggregations.sum, 0);
    const errorRate = totalSent > 0 ? (totalFailed / totalSent) * 100 : 0;
    
    kpis.push({
      id: 'error_rate',
      name: 'Error Rate',
      value: errorRate,
      trend: errorRate <= 5 ? 'down' : errorRate <= 10 ? 'stable' : 'up',
      unit: '%',
      target: 5,
      status: errorRate <= 5 ? 'good' : errorRate <= 15 ? 'warning' : 'critical'
    });

    // 클릭률 KPI (전달된 메시지 기준)
    const clickedMetrics = this.filterMetrics(metrics, MetricType.MESSAGE_CLICKED, filters);
    const totalClicked = clickedMetrics.reduce((sum, m) => sum + m.aggregations.sum, 0);
    const clickRate = totalDelivered > 0 ? (totalClicked / totalDelivered) * 100 : 0;
    
    kpis.push({
      id: 'click_rate',
      name: 'Click Rate',
      value: clickRate,
      trend: 'stable',
      unit: '%',
      status: 'good'
    });

    return kpis;
  }

  private async generateWidgetData(
    metrics: AggregatedMetric[],
    timeRange: { start: Date; end: Date },
    filters: Record<string, any>
  ): Promise<WidgetData[]>;
  private async generateWidgetData(
    widgets: DashboardWidget[],
    metrics: AggregatedMetric[],
    timeRange: { start: Date; end: Date },
    filters: Record<string, any>
  ): Promise<WidgetData[]>;
  private async generateWidgetData(...args: any[]): Promise<WidgetData[]> {
    let widgets: DashboardWidget[];
    let metrics: AggregatedMetric[];
    let timeRange: { start: Date; end: Date };
    let filters: Record<string, any>;

    if (args.length === 3) {
      // 첫 번째 오버로드
      [metrics, timeRange, filters] = args;
      widgets = this.config.widgets;
    } else {
      // 두 번째 오버로드
      [widgets, metrics, timeRange, filters] = args;
    }

    const widgetData: WidgetData[] = [];

    for (const widget of widgets) {
      try {
        const data = await this.generateSingleWidgetData(widget, metrics, timeRange, filters);
        widgetData.push({
          id: widget.id,
          title: widget.title,
          type: widget.type,
          data,
          lastUpdated: new Date()
        });
      } catch (error) {
        widgetData.push({
          id: widget.id,
          title: widget.title,
          type: widget.type,
          data: null,
          lastUpdated: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return widgetData;
  }

  private async generateSingleWidgetData(
    widget: DashboardWidget,
    metrics: AggregatedMetric[],
    timeRange: { start: Date; end: Date },
    filters: Record<string, any>
  ): Promise<any> {
    // 캐시 확인
    const cacheKey = `${widget.id}_${JSON.stringify(filters)}_${timeRange.start.getTime()}_${timeRange.end.getTime()}`;
    const cached = this.dataCache.get(cacheKey);
    const cacheExpiration = widget.refreshInterval || this.config.refreshInterval;
    
    if (cached && (Date.now() - cached.timestamp.getTime()) < cacheExpiration) {
      return cached.data;
    }

    // 메트릭 필터링
    const filteredMetrics = this.applyQueryFilters(metrics, widget.query, filters);

    let data: any;

    switch (widget.type) {
      case 'metric':
        data = this.generateMetricWidgetData(filteredMetrics, widget.visualization);
        break;
      case 'chart':
        data = this.generateChartWidgetData(filteredMetrics, widget.visualization);
        break;
      case 'table':
        data = this.generateTableWidgetData(filteredMetrics, widget.visualization);
        break;
      case 'gauge':
        data = this.generateGaugeWidgetData(filteredMetrics, widget.visualization);
        break;
      case 'heatmap':
        data = this.generateHeatmapWidgetData(filteredMetrics, widget.visualization);
        break;
      case 'trend':
        data = this.generateTrendWidgetData(filteredMetrics, widget.visualization);
        break;
      default:
        data = null;
    }

    // 캐시 저장
    this.dataCache.set(cacheKey, { data, timestamp: new Date() });

    return data;
  }

  private generateMetricWidgetData(metrics: AggregatedMetric[], config: VisualizationConfig): any {
    const aggregation = config.aggregation || 'sum';
    let value = 0;

    switch (aggregation) {
      case 'sum':
        value = metrics.reduce((sum, m) => sum + m.aggregations.sum, 0);
        break;
      case 'avg':
        value = metrics.reduce((sum, m) => sum + m.aggregations.avg, 0) / Math.max(metrics.length, 1);
        break;
      case 'min':
        value = Math.min(...metrics.map(m => m.aggregations.min));
        break;
      case 'max':
        value = Math.max(...metrics.map(m => m.aggregations.max));
        break;
      case 'count':
        value = metrics.length;
        break;
    }

    return {
      value: isFinite(value) ? value : 0,
      formatted: this.formatValue(value, config),
      timestamp: new Date()
    };
  }

  private generateChartWidgetData(metrics: AggregatedMetric[], config: VisualizationConfig): any {
    const chartType = config.chartType || 'line';
    
    if (config.groupBy && config.groupBy.length > 0) {
      return this.generateGroupedChartData(metrics, config);
    }

    // 시계열 데이터
    const sortedMetrics = metrics.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    const data = sortedMetrics.map(metric => ({
      x: metric.timestamp,
      y: this.getAggregatedValue(metric, config.aggregation || 'avg'),
      label: metric.timestamp.toISOString()
    }));

    return {
      type: chartType,
      data: [{
        name: 'Series 1',
        data,
        color: config.colors?.[0] || '#3b82f6'
      }],
      options: {
        xAxis: config.xAxis,
        yAxis: config.yAxis,
        showLegend: config.showLegend ?? true,
        showGrid: config.showGrid ?? true
      }
    };
  }

  private generateGroupedChartData(metrics: AggregatedMetric[], config: VisualizationConfig): any {
    const groupBy = config.groupBy![0]; // 첫 번째 그룹화 필드 사용
    const grouped = new Map<string, AggregatedMetric[]>();

    for (const metric of metrics) {
      const key = metric.dimensions[groupBy] || 'Unknown';
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(metric);
    }

    const series = Array.from(grouped.entries()).map(([name, groupMetrics], index) => ({
      name,
      data: groupMetrics
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
        .map(m => ({
          x: m.timestamp,
          y: this.getAggregatedValue(m, config.aggregation || 'avg')
        })),
      color: config.colors?.[index % (config.colors?.length || 1)] || this.getDefaultColor(index)
    }));

    return {
      type: config.chartType || 'line',
      data: series,
      options: {
        xAxis: config.xAxis,
        yAxis: config.yAxis,
        showLegend: config.showLegend ?? true,
        showGrid: config.showGrid ?? true
      }
    };
  }

  private generateTableWidgetData(metrics: AggregatedMetric[], config: VisualizationConfig): any {
    const groupBy = config.groupBy || ['provider', 'channel'];
    const grouped = new Map<string, AggregatedMetric[]>();

    for (const metric of metrics) {
      const key = groupBy.map(field => metric.dimensions[field] || 'Unknown').join('|');
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(metric);
    }

    const columns = [
      ...groupBy.map(field => ({ key: field, title: field.charAt(0).toUpperCase() + field.slice(1) })),
      { key: 'count', title: 'Count' },
      { key: 'sum', title: 'Sum' },
      { key: 'avg', title: 'Average' }
    ];

    const rows = Array.from(grouped.entries()).map(([key, groupMetrics]) => {
      const dimensions = key.split('|');
      const row: any = {};
      
      groupBy.forEach((field, index) => {
        row[field] = dimensions[index];
      });

      row.count = groupMetrics.length;
      row.sum = groupMetrics.reduce((sum, m) => sum + m.aggregations.sum, 0);
      row.avg = groupMetrics.reduce((sum, m) => sum + m.aggregations.avg, 0) / groupMetrics.length;

      return row;
    });

    return {
      columns,
      rows: rows.sort((a, b) => b.sum - a.sum) // 합계 기준 내림차순 정렬
    };
  }

  private generateGaugeWidgetData(metrics: AggregatedMetric[], config: VisualizationConfig): any {
    const value = this.generateMetricWidgetData(metrics, config).value;
    
    return {
      value,
      min: config.yAxis?.min || 0,
      max: config.yAxis?.max || 100,
      thresholds: [
        { value: 25, color: '#ef4444' },
        { value: 50, color: '#f59e0b' },
        { value: 75, color: '#10b981' },
        { value: 100, color: '#3b82f6' }
      ]
    };
  }

  private generateHeatmapWidgetData(metrics: AggregatedMetric[], config: VisualizationConfig): any {
    // 시간별 히트맵 데이터 생성 (시간 x 요일)
    const heatmapData: Array<{ x: number; y: number; value: number }> = [];
    
    for (const metric of metrics) {
      const hour = metric.timestamp.getHours();
      const dayOfWeek = metric.timestamp.getDay();
      
      heatmapData.push({
        x: hour,
        y: dayOfWeek,
        value: this.getAggregatedValue(metric, config.aggregation || 'sum')
      });
    }

    return {
      data: heatmapData,
      xLabels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
      yLabels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    };
  }

  private generateTrendWidgetData(metrics: AggregatedMetric[], config: VisualizationConfig): any {
    const sortedMetrics = metrics.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    if (sortedMetrics.length < 2) {
      return { trend: 'stable', change: 0, changePercent: 0 };
    }

    const values = sortedMetrics.map(m => this.getAggregatedValue(m, config.aggregation || 'avg'));
    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    
    const change = lastValue - firstValue;
    const changePercent = firstValue !== 0 ? (change / firstValue) * 100 : 0;
    
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (Math.abs(changePercent) > 5) {
      trend = changePercent > 0 ? 'up' : 'down';
    }

    return {
      trend,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      values: values.slice(-10), // 최근 10개 값
      sparkline: values.map((value, index) => ({ x: index, y: value }))
    };
  }

  private filterMetrics(
    metrics: AggregatedMetric[],
    type: MetricType,
    filters: Record<string, any>
  ): AggregatedMetric[] {
    return metrics.filter(metric => {
      if (metric.type !== type) return false;
      
      for (const [key, value] of Object.entries(filters)) {
        if (Array.isArray(value)) {
          if (!value.includes(metric.dimensions[key])) return false;
        } else if (value && metric.dimensions[key] !== value) {
          return false;
        }
      }
      
      return true;
    });
  }

  private applyQueryFilters(
    metrics: AggregatedMetric[],
    query: AnalyticsQuery,
    filters: Record<string, any>
  ): AggregatedMetric[] {
    let filteredMetrics = metrics;

    // 메트릭 타입 필터
    if (query.metrics && query.metrics.length > 0) {
      filteredMetrics = filteredMetrics.filter(m => query.metrics.includes(m.type));
    }

    // 시간 범위 필터
    if (query.dateRange) {
      filteredMetrics = filteredMetrics.filter(m => 
        m.timestamp >= query.dateRange.start && m.timestamp <= query.dateRange.end
      );
    }

    // 추가 필터 적용
    const combinedFilters = { ...query.filters, ...filters };
    for (const [key, value] of Object.entries(combinedFilters)) {
      if (value === undefined || value === null) continue;
      
      filteredMetrics = filteredMetrics.filter(m => {
        if (Array.isArray(value)) {
          return value.includes(m.dimensions[key]);
        }
        return m.dimensions[key] === value;
      });
    }

    return filteredMetrics;
  }

  private calculatePreviousPeriodValue(
    metrics: AggregatedMetric[],
    previousTimeRange: { start: Date; end: Date }
  ): number {
    // 이전 기간 데이터는 실제로는 별도로 조회해야 함
    // 여기서는 현재 데이터의 평균값으로 추정
    const currentValue = metrics.reduce((sum, m) => sum + m.aggregations.sum, 0);
    return currentValue * 0.9; // 10% 감소로 가정
  }

  private getAggregatedValue(metric: AggregatedMetric, aggregation: string): number {
    switch (aggregation) {
      case 'sum': return metric.aggregations.sum;
      case 'avg': return metric.aggregations.avg;
      case 'min': return metric.aggregations.min;
      case 'max': return metric.aggregations.max;
      case 'count': return metric.aggregations.count;
      default: return metric.aggregations.avg;
    }
  }

  private formatValue(value: number, config: VisualizationConfig): string {
    if (!isFinite(value)) return '0';
    
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    
    return value.toFixed(0);
  }

  private getDefaultColor(index: number): string {
    const colors = [
      '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
      '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'
    ];
    return colors[index % colors.length];
  }

  private initializeDefaultWidgets(): void {
    this.config.widgets = [
      {
        id: 'messages_sent_chart',
        type: 'chart',
        title: 'Messages Sent Over Time',
        position: { x: 0, y: 0, width: 6, height: 4 },
        query: {
          metrics: [MetricType.MESSAGE_SENT],
          dateRange: { start: new Date(), end: new Date() },
          interval: 'hour'
        },
        visualization: {
          chartType: 'line',
          aggregation: 'sum',
          showGrid: true
        }
      },
      {
        id: 'delivery_rate_gauge',
        type: 'gauge',
        title: 'Delivery Rate',
        position: { x: 6, y: 0, width: 3, height: 4 },
        query: {
          metrics: [MetricType.DELIVERY_RATE],
          dateRange: { start: new Date(), end: new Date() }
        },
        visualization: {
          aggregation: 'avg',
          yAxis: { min: 0, max: 100 }
        }
      },
      {
        id: 'provider_performance_table',
        type: 'table',
        title: 'Provider Performance',
        position: { x: 0, y: 4, width: 12, height: 4 },
        query: {
          metrics: [MetricType.MESSAGE_SENT, MetricType.MESSAGE_DELIVERED, MetricType.MESSAGE_FAILED],
          dateRange: { start: new Date(), end: new Date() }
        },
        visualization: {
          groupBy: ['provider'],
          aggregation: 'sum'
        }
      }
    ];
  }
}