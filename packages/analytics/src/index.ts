/**
 * Analytics Engine
 * 메시지 전송 통계 및 분석 기능 제공
 */

// 핵심 서비스
export { AnalyticsService } from './services/analytics.service';
export { MetricsCollector } from './services/metrics.collector';
export { ReportGenerator } from './services/report.generator';
export { InsightEngine } from './services/insight.engine';

// 집계 컴포넌트
export { TimeSeriesAggregator, MetricAggregator } from './aggregators/index';
export type { TimeWindow, AggregationOptions, AggregationRule, AggregatorConfig } from './aggregators/index';

// 수집 컴포넌트
export { EventCollector, WebhookCollector } from './collectors/index';
export type { 
  EventData, 
  EventCollectorConfig, 
  EventProcessor,
  WebhookData,
  WebhookCollectorConfig
} from './collectors/index';

// 인사이트 컴포넌트
export { AnomalyDetector, RecommendationEngine } from './insights/index';
export type {
  AnomalyDetectionConfig,
  AnomalyAlgorithm,
  Anomaly,
  RecommendationConfig,
  Recommendation,
  RecommendationRule
} from './insights/index';

// 보고서 컴포넌트
export { DashboardGenerator, ExportManager } from './reports/index';
export type {
  DashboardConfig,
  DashboardWidget,
  DashboardData,
  KPIData,
  WidgetData,
  ExportConfig,
  ExportFormat,
  ExportResult
} from './reports/index';

// 타입 정의
export type {
  AnalyticsConfig,
  MetricData,
  AnalyticsReport,
  InsightData,
  AggregatedMetric,
  AnalyticsQuery,
  AnalyticsResult,
  ReportMetric
} from './types/analytics.types';

// Enum 정의
export { MetricType } from './types/analytics.types';