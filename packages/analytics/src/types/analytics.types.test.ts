import { describe, expect, test } from "bun:test";
import {
  AnalyticsQuerySchema,
  InsightDataSchema,
  MetricType,
} from "./analytics.types";

describe("analytics.types schema", () => {
  test("enforces query limit boundaries", () => {
    const base = {
      metrics: [MetricType.MESSAGE_SENT],
      dateRange: { start: new Date("2026-01-01"), end: new Date("2026-01-02") },
    };

    expect(AnalyticsQuerySchema.safeParse({ ...base, limit: 1 }).success).toBe(
      true,
    );
    expect(AnalyticsQuerySchema.safeParse({ ...base, limit: 0 }).success).toBe(
      false,
    );
    expect(
      AnalyticsQuerySchema.safeParse({ ...base, limit: 10001 }).success,
    ).toBe(false);
  });

  test("enforces confidence boundaries", () => {
    const base = {
      id: "insight-1",
      type: "anomaly" as const,
      title: "t",
      description: "d",
      severity: "low" as const,
      metric: MetricType.MESSAGE_SENT,
      dimensions: {},
      value: 1,
      actionable: true,
      detectedAt: new Date(),
    };

    expect(
      InsightDataSchema.safeParse({ ...base, confidence: 0.5 }).success,
    ).toBe(true);
    expect(
      InsightDataSchema.safeParse({ ...base, confidence: -0.1 }).success,
    ).toBe(false);
    expect(
      InsightDataSchema.safeParse({ ...base, confidence: 1.1 }).success,
    ).toBe(false);
  });
});
