import { z } from "zod/mini";

export interface AnalyticsConfig {
  enableRealTimeTracking: boolean;
  retentionDays: number;
  aggregationIntervals: ("minute" | "hour" | "day" | "week" | "month")[];
  enabledMetrics: MetricType[];
}

export enum MetricType {
  MESSAGE_SENT = "message_sent",
  MESSAGE_DELIVERED = "message_delivered",
  MESSAGE_FAILED = "message_failed",
  MESSAGE_CLICKED = "message_clicked",
  TEMPLATE_USAGE = "template_usage",
  PROVIDER_PERFORMANCE = "provider_performance",
  CHANNEL_USAGE = "channel_usage",
  ERROR_RATE = "error_rate",
  DELIVERY_RATE = "delivery_rate",
  CLICK_RATE = "click_rate",
}

export interface AggregatedMetric {
  type: MetricType;
  interval: "minute" | "hour" | "day" | "week" | "month";
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
  filters: Record<string, unknown>;
  metrics: ReportMetric[];
  generatedAt: Date;
  format: "json" | "csv" | "pdf";
}

export interface ReportMetric {
  type: MetricType;
  value: number;
  change?: number; // 이전 기간 대비 변화율
  trend?: "up" | "down" | "stable";
  breakdown?: Record<string, number>; // 세부 분석
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

const AnalyticsIntervalSchema = z.enum([
  "minute",
  "hour",
  "day",
  "week",
  "month",
]);

const AnalyticsDateRangeSchema = z.object({
  start: z.date(),
  end: z.date(),
});

const AnalyticsOrderBySchema = z.object({
  field: z.string(),
  direction: z.enum(["asc", "desc"]),
});

export const MetricDataSchema = z.object({
  id: z.string(),
  type: z.nativeEnum(MetricType),
  timestamp: z.date(),
  value: z.number(),
  dimensions: z.record(z.string(), z.string()),
  metadata: z.optional(z.record(z.string(), z.any())),
});

export const AnalyticsQuerySchema = z.object({
  metrics: z.array(z.nativeEnum(MetricType)),
  dateRange: AnalyticsDateRangeSchema,
  interval: z.optional(AnalyticsIntervalSchema),
  filters: z.optional(z.record(z.string(), z.any())),
  groupBy: z.optional(z.array(z.string())),
  orderBy: z.optional(z.array(AnalyticsOrderBySchema)),
  limit: z.optional(z.number().check(z.minimum(1), z.maximum(10000))),
  offset: z.optional(z.number().check(z.minimum(0))),
});

export const InsightDataSchema = z.object({
  id: z.string(),
  type: z.enum(["anomaly", "trend", "recommendation"]),
  title: z.string(),
  description: z.string(),
  severity: z.enum(["low", "medium", "high", "critical"]),
  metric: z.nativeEnum(MetricType),
  dimensions: z.record(z.string(), z.string()),
  value: z.number(),
  expectedValue: z.optional(z.number()),
  confidence: z.number().check(z.minimum(0), z.maximum(1)),
  actionable: z.boolean(),
  recommendations: z.optional(z.array(z.string())),
  detectedAt: z.date(),
});

export type MetricData = z.infer<typeof MetricDataSchema>;
export type AnalyticsQuery = z.infer<typeof AnalyticsQuerySchema>;
export type InsightData = z.infer<typeof InsightDataSchema>;

// Legacy alias exports kept stable while the schemas become the source of truth.
export type MetricDataType = MetricData;
export type AnalyticsQueryType = AnalyticsQuery;
export type InsightDataType = InsightData;
