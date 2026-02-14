/**
 * Analytics Engine
 * 메시지 전송 통계 및 분석 기능 제공
 */

export type {
  AggregationOptions,
  AggregationRule,
  AggregatorConfig,
  TimeWindow,
} from "./aggregators/index";
// 집계 컴포넌트
export { MetricAggregator, TimeSeriesAggregator } from "./aggregators/index";
export type {
  EventCollectorConfig,
  EventData,
  EventProcessor,
  WebhookCollectorConfig,
  WebhookData,
} from "./collectors/index";
// 수집 컴포넌트
export { EventCollector, WebhookCollector } from "./collectors/index";
export type {
  Anomaly,
  AnomalyAlgorithm,
  AnomalyDetectionConfig,
  Recommendation,
  RecommendationConfig,
  RecommendationRule,
} from "./insights/index";
// 인사이트 컴포넌트
export { AnomalyDetector, RecommendationEngine } from "./insights/index";
export type {
  DashboardConfig,
  DashboardData,
  DashboardWidget,
  ExportConfig,
  ExportFormat,
  ExportResult,
  KPIData,
  WidgetData,
} from "./reports/index";
// 보고서 컴포넌트
export { DashboardGenerator, ExportManager } from "./reports/index";
// 핵심 서비스
export { AnalyticsService } from "./services/analytics.service";
export { InsightEngine } from "./services/insight.engine";
export { MetricsCollector } from "./services/metrics.collector";
export { ReportGenerator } from "./services/report.generator";

// 타입 정의
export type {
  AggregatedMetric,
  AnalyticsConfig,
  AnalyticsQuery,
  AnalyticsReport,
  AnalyticsResult,
  InsightData,
  MetricData,
  ReportMetric,
} from "./types/analytics.types";

// Enum 정의
export { MetricType } from "./types/analytics.types";
