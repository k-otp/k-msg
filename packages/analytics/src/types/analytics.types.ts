import { z } from 'zod';

export interface AnalyticsConfig {
  enableRealTimeTracking: boolean;
  retentionDays: number;
  aggregationIntervals: ('minute' | 'hour' | 'day' | 'week' | 'month')[];
  enabledMetrics: MetricType[];
}

export enum MetricType {
  MESSAGE_SENT = 'message_sent',
  MESSAGE_DELIVERED = 'message_delivered',
  MESSAGE_FAILED = 'message_failed',
  MESSAGE_CLICKED = 'message_clicked',
  TEMPLATE_USAGE = 'template_usage',
  PROVIDER_PERFORMANCE = 'provider_performance',
  CHANNEL_USAGE = 'channel_usage',
  ERROR_RATE = 'error_rate',
  DELIVERY_RATE = 'delivery_rate',
  CLICK_RATE = 'click_rate'
}

export interface MetricData {
  id: string;
  type: MetricType;
  timestamp: Date;
  value: number;
  dimensions: Record<string, string>; // provider, channel, template_id 등
  metadata?: Record<string, any>;
}

export interface AggregatedMetric {
  type: MetricType;
  interval: 'minute' | 'hour' | 'day' | 'week' | 'month';
  timestamp: Date;
  dimensions: Record<string, string>;
  aggregations: {
    count: number;
    sum: number;
    avg: number;
    min: number;
    max: number;
  };
}

export interface AnalyticsReport {
  id: string;
  name: string;
  description?: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  filters: Record<string, any>;
  metrics: ReportMetric[];
  generatedAt: Date;
  format: 'json' | 'csv' | 'pdf';
}

export interface ReportMetric {
  type: MetricType;
  value: number;
  change?: number; // 이전 기간 대비 변화율
  trend?: 'up' | 'down' | 'stable';
  breakdown?: Record<string, number>; // 세부 분석
}

export interface InsightData {
  id: string;
  type: 'anomaly' | 'trend' | 'recommendation';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metric: MetricType;
  dimensions: Record<string, string>;
  value: number;
  expectedValue?: number;
  confidence: number; // 0-1
  actionable: boolean;
  recommendations?: string[];
  detectedAt: Date;
}

export interface AnalyticsQuery {
  metrics: MetricType[];
  dateRange: {
    start: Date;
    end: Date;
  };
  interval?: 'minute' | 'hour' | 'day' | 'week' | 'month';
  filters?: Record<string, any>;
  groupBy?: string[];
  orderBy?: { field: string; direction: 'asc' | 'desc' }[];
  limit?: number;
  offset?: number;
}

export interface AnalyticsResult {
  query: AnalyticsQuery;
  data: AggregatedMetric[];
  summary: {
    totalRecords: number;
    dateRange: { start: Date; end: Date };
    executionTime: number; // ms
  };
  insights?: InsightData[];
}

// Zod Schemas
export const MetricDataSchema = z.object({
  id: z.string(),
  type: z.nativeEnum(MetricType),
  timestamp: z.date(),
  value: z.number(),
  dimensions: z.record(z.string(), z.string()),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const AnalyticsQuerySchema = z.object({
  metrics: z.array(z.nativeEnum(MetricType)),
  dateRange: z.object({
    start: z.date(),
    end: z.date(),
  }),
  interval: z.enum(['minute', 'hour', 'day', 'week', 'month']).optional(),
  filters: z.record(z.string(), z.any()).optional(),
  groupBy: z.array(z.string()).optional(),
  orderBy: z.array(z.object({
    field: z.string(),
    direction: z.enum(['asc', 'desc']),
  })).optional(),
  limit: z.number().min(1).max(10000).optional(),
  offset: z.number().min(0).optional(),
});

export const InsightDataSchema = z.object({
  id: z.string(),
  type: z.enum(['anomaly', 'trend', 'recommendation']),
  title: z.string(),
  description: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  metric: z.nativeEnum(MetricType),
  dimensions: z.record(z.string(), z.string()),
  value: z.number(),
  expectedValue: z.number().optional(),
  confidence: z.number().min(0).max(1),
  actionable: z.boolean(),
  recommendations: z.array(z.string()).optional(),
  detectedAt: z.date(),
});

export type MetricDataType = z.infer<typeof MetricDataSchema>;
export type AnalyticsQueryType = z.infer<typeof AnalyticsQuerySchema>;
export type InsightDataType = z.infer<typeof InsightDataSchema>;