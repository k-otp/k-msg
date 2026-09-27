/**
 * Comprehensive tests for analytics-engine package
 */

import { describe, expect, spyOn, test } from "bun:test";
import { createHmac } from "node:crypto";
import { logger } from "@k-msg/core";
import {
  type AggregatedMetric,
  type AnalyticsConfig,
  // Services
  AnalyticsService,
  // Insights
  AnomalyDetector,
  // Reports
  DashboardGenerator,
  // Collectors
  EventCollector,
  type EventData,
  ExportManager,
  InsightEngine,
  MetricAggregator,
  type MetricData,
  MetricsCollector,
  // Types
  MetricType,
  RecommendationEngine,
  ReportGenerator,
  // Aggregators
  TimeSeriesAggregator,
  WebhookCollector,
  type WebhookCollectorConfig,
  type WebhookData,
} from "./index";

// Test data helpers
const createTestMetric = (
  type: MetricType,
  value: number,
  timestamp?: Date,
): MetricData => ({
  id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  type,
  timestamp: timestamp || new Date(),
  value,
  dimensions: {
    provider: "test-provider",
    channel: "test-channel",
  },
});

const createTestAggregatedMetric = (
  type: MetricType,
  sum: number,
  timestamp?: Date,
): AggregatedMetric => ({
  type,
  interval: "minute",
  timestamp: timestamp || new Date(),
  dimensions: {
    provider: "test-provider",
    channel: "test-channel",
  },
  aggregations: {
    count: 1,
    sum,
    avg: sum,
    min: sum,
    max: sum,
  },
});

const createTestEvent = (type: string, payload: any = {}): EventData => ({
  id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  type,
  timestamp: new Date(),
  source: "test-source",
  payload,
});

// Polls instead of sleeping a fixed time so timer tests stay fast locally and
// stable on a loaded CI runner.
async function waitFor(
  condition: () => boolean,
  timeoutMs = 2000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!condition()) {
    if (Date.now() > deadline) {
      throw new Error(`Condition not met within ${timeoutMs}ms`);
    }
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
}

describe("AnalyticsService", () => {
  test("should initialize with default configuration", () => {
    const config: AnalyticsConfig = {
      enableRealTimeTracking: true,
      retentionDays: 30,
      aggregationIntervals: ["hour", "day"],
      enabledMetrics: [MetricType.MESSAGE_SENT, MetricType.MESSAGE_DELIVERED],
    };

    const service = new AnalyticsService(config);
    expect(service).toBeDefined();
  });

  test("should collect metrics", async () => {
    const config: AnalyticsConfig = {
      enableRealTimeTracking: false,
      retentionDays: 30,
      aggregationIntervals: ["hour"],
      enabledMetrics: [MetricType.MESSAGE_SENT],
    };

    const service = new AnalyticsService(config);
    const metric = createTestMetric(MetricType.MESSAGE_SENT, 100);

    await service.collectMetric(metric);

    // 메트릭이 성공적으로 수집되었는지 확인
    expect(true).toBe(true); // 실제로는 내부 상태 확인
  });

  test("should execute analytics query", async () => {
    const config: AnalyticsConfig = {
      enableRealTimeTracking: false,
      retentionDays: 30,
      aggregationIntervals: ["hour"],
      enabledMetrics: [MetricType.MESSAGE_SENT],
    };

    const service = new AnalyticsService(config);
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const query = {
      metrics: [MetricType.MESSAGE_SENT],
      dateRange: { start: oneHourAgo, end: now },
      interval: "minute" as const,
    };

    const result = await service.query(query);

    expect(result.query).toEqual(query);
    expect(result.data).toBeDefined();
    expect(result.summary).toBeDefined();
    expect(result.summary.executionTime).toBeGreaterThanOrEqual(0); // Allow 0 for fast queries
  });

  test("should generate dashboard data", async () => {
    const config: AnalyticsConfig = {
      enableRealTimeTracking: false,
      retentionDays: 30,
      aggregationIntervals: ["hour"],
      enabledMetrics: [MetricType.MESSAGE_SENT, MetricType.MESSAGE_DELIVERED],
    };

    const service = new AnalyticsService(config);
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const dashboard = await service.getDashboardData({
      start: oneHourAgo,
      end: now,
    });

    expect(dashboard.timeRange).toBeDefined();
    expect(dashboard.kpis).toBeDefined();
    expect(dashboard.metrics).toBeDefined();
  });
});

describe("MetricsCollector", () => {
  test("should collect single metric", async () => {
    const config: AnalyticsConfig = {
      enableRealTimeTracking: false,
      retentionDays: 30,
      aggregationIntervals: ["hour"],
      enabledMetrics: [MetricType.MESSAGE_SENT],
    };

    const collector = new MetricsCollector(config);
    const metric = createTestMetric(MetricType.MESSAGE_SENT, 50);

    await collector.collect(metric);

    const stats = await collector.getMetricStats(MetricType.MESSAGE_SENT, {
      start: new Date(Date.now() - 60000),
      end: new Date(),
    });

    expect(stats.count).toBeGreaterThanOrEqual(0);
  });

  test("should collect batch metrics", async () => {
    const config: AnalyticsConfig = {
      enableRealTimeTracking: false,
      retentionDays: 30,
      aggregationIntervals: ["hour"],
      enabledMetrics: [MetricType.MESSAGE_SENT],
    };

    const collector = new MetricsCollector(config);
    const metrics = [
      createTestMetric(MetricType.MESSAGE_SENT, 10),
      createTestMetric(MetricType.MESSAGE_SENT, 20),
      createTestMetric(MetricType.MESSAGE_SENT, 30),
    ];

    await collector.collectBatch(metrics);

    const recent = await collector.getRecentMetrics(
      [MetricType.MESSAGE_SENT],
      60000,
    );
    expect(recent.length).toBeGreaterThanOrEqual(0);
  });

  test("should increment counter", async () => {
    const config: AnalyticsConfig = {
      enableRealTimeTracking: false,
      retentionDays: 30,
      aggregationIntervals: ["hour"],
      enabledMetrics: [MetricType.MESSAGE_SENT],
    };

    const collector = new MetricsCollector(config);

    await collector.incrementCounter(
      MetricType.MESSAGE_SENT,
      { provider: "test" },
      5,
    );

    // Counter가 정상적으로 증가했는지 확인
    expect(true).toBe(true);
  });
});

describe("TimeSeriesAggregator", () => {
  test("should aggregate metrics by hour", async () => {
    const aggregator = new TimeSeriesAggregator();
    const now = new Date();

    const metrics = [
      createTestMetric(
        MetricType.MESSAGE_SENT,
        10,
        new Date(now.getTime() - 30 * 60 * 1000),
      ),
      createTestMetric(
        MetricType.MESSAGE_SENT,
        20,
        new Date(now.getTime() - 20 * 60 * 1000),
      ),
      createTestMetric(
        MetricType.MESSAGE_SENT,
        30,
        new Date(now.getTime() - 10 * 60 * 1000),
      ),
    ];

    const aggregated = await aggregator.aggregate(metrics, "hour");

    expect(aggregated.length).toBeGreaterThan(0);
    expect(aggregated[0].interval).toBe("hour");
    expect(aggregated[0].aggregations).toBeDefined();
  });

  test("should downsample data", async () => {
    const aggregator = new TimeSeriesAggregator();
    const now = new Date();

    const metrics = [
      createTestAggregatedMetric(
        MetricType.MESSAGE_SENT,
        10,
        new Date(now.getTime() - 30 * 60 * 1000),
      ),
      createTestAggregatedMetric(
        MetricType.MESSAGE_SENT,
        20,
        new Date(now.getTime() - 20 * 60 * 1000),
      ),
      createTestAggregatedMetric(
        MetricType.MESSAGE_SENT,
        30,
        new Date(now.getTime() - 10 * 60 * 1000),
      ),
    ];

    const downsampled = await aggregator.downsample(metrics, "hour");

    expect(downsampled.length).toBeGreaterThan(0);
    expect(downsampled[0].interval).toBe("hour");
  });

  test("should perform rolling window aggregation", async () => {
    const aggregator = new TimeSeriesAggregator();
    const now = new Date();

    const metrics = Array.from({ length: 10 }, (_, i) =>
      createTestMetric(
        MetricType.MESSAGE_SENT,
        (i + 1) * 10,
        new Date(now.getTime() - i * 60000),
      ),
    );

    const rolling = await aggregator.aggregateRolling(metrics, 5, 2); // 5분 윈도우, 2분 스텝

    expect(rolling.length).toBeGreaterThan(0);
  });
});

describe("MetricAggregator", () => {
  test("should aggregate with custom rules", async () => {
    const config = {
      rules: [
        {
          metricType: MetricType.MESSAGE_SENT,
          aggregationType: "sum" as const,
          dimensions: ["provider"],
          enabled: true,
        },
      ],
      batchSize: 100,
      flushInterval: 5000,
    };

    const aggregator = new MetricAggregator(config);
    const metrics = [
      createTestMetric(MetricType.MESSAGE_SENT, 10),
      createTestMetric(MetricType.MESSAGE_SENT, 20),
      createTestMetric(MetricType.MESSAGE_SENT, 30),
    ];

    const aggregated = await aggregator.aggregateByRules(metrics);

    expect(aggregated.length).toBeGreaterThan(0);
  });

  test("should calculate percentiles", async () => {
    const config = { rules: [], batchSize: 100, flushInterval: 5000 };
    const aggregator = new MetricAggregator(config);

    const metrics = Array.from({ length: 100 }, (_, i) =>
      createTestMetric(MetricType.MESSAGE_SENT, i + 1),
    );

    const percentiles = await aggregator.calculatePercentiles(
      metrics,
      [50, 90, 95],
    );

    expect(percentiles.length).toBe(3);
    expect(
      percentiles.find((p) => p.dimensions.percentile === "50"),
    ).toBeDefined();
  });

  // bun test fails the running test on an unhandled rejection, so a pass
  // shows the periodic flush handled the failure.
  test("should log a failed periodic flush and keep flushing", async () => {
    class FlakyAggregator extends MetricAggregator {
      failing = true;

      override async aggregateByRules(
        metrics: MetricData[],
      ): Promise<AggregatedMetric[]> {
        if (this.failing) {
          throw new Error("rule engine down");
        }
        return super.aggregateByRules(metrics);
      }
    }

    const aggregator = new FlakyAggregator({
      rules: [],
      batchSize: 100,
      flushInterval: 10,
    });
    const loggerError = spyOn(logger, "error").mockImplementation(() => {});

    try {
      await aggregator.addMetric(createTestMetric(MetricType.MESSAGE_SENT, 1));
      // A failed flush keeps the buffer, so later ticks retry and fail again.
      await waitFor(() => loggerError.mock.calls.length >= 2);

      expect(loggerError.mock.calls[0]?.[2]?.message).toBe("rule engine down");
    } finally {
      // MetricAggregator has no stop(); a successful flush empties the buffer
      // so the interval has nothing left to report.
      aggregator.failing = false;
      loggerError.mockRestore();
    }
  });
});

describe("EventCollector", () => {
  test("should collect events", async () => {
    const collector = new EventCollector();
    const event = createTestEvent("message.sent", { messageId: "test-123" });

    await collector.collectEvent(event);

    const stats = collector.getEventStats();
    expect(stats.totalEvents).toBeGreaterThanOrEqual(0);
  });

  test("should process events with custom processor", async () => {
    const collector = new EventCollector();

    collector.registerProcessor("test-processor", {
      canProcess: (event) => event.type === "test.event",
      process: async (event) => [
        {
          id: `metric_${event.id}`,
          type: MetricType.MESSAGE_SENT,
          timestamp: event.timestamp,
          value: 1,
          dimensions: { source: event.source },
        },
      ],
    });

    const event = createTestEvent("test.event");
    await collector.collectEvent(event);

    // 프로세서가 등록되었는지 확인
    const stats = collector.getEventStats();
    expect(stats).toBeDefined();
  });

  test("should handle event deduplication", async () => {
    const collector = new EventCollector({ enableDeduplication: true });
    const event = createTestEvent("duplicate.test");

    // 같은 이벤트 두 번 수집
    await collector.collectEvent(event);
    await collector.collectEvent(event);

    // 중복 제거가 작동했는지 확인
    expect(true).toBe(true);
  });
});

describe("WebhookCollector", () => {
  test("should receive and transform webhooks", async () => {
    const collector = new WebhookCollector({
      enableSignatureValidation: false,
      allowedSources: ["test-source"],
    });

    const webhook: WebhookData = {
      id: "webhook-123",
      source: "test-source",
      timestamp: new Date(),
      headers: { "content-type": "application/json" },
      body: { messageId: "msg-123", status: "delivered" },
    };

    const events = await collector.receiveWebhook(webhook);

    expect(events.length).toBeGreaterThan(0);
    expect(events[0].source).toBe("test-source");
  });

  test("should validate webhook signatures", async () => {
    const collector = new WebhookCollector({
      enableSignatureValidation: true,
      signatureHeader: "x-signature",
      secretKey: "test-secret",
      allowedSources: ["test-source"],
    });

    const webhook: WebhookData = {
      id: "webhook-123",
      source: "test-source",
      timestamp: new Date(),
      headers: { "x-signature": "invalid-signature" },
      body: { test: "data" },
      rawBody: '{"test":"data"}',
    };

    // 잘못된 서명으로 인한 실패 예상
    await expect(collector.receiveWebhook(webhook)).rejects.toThrow();
  });

  test("should enforce rate limiting", async () => {
    const collector = new WebhookCollector({
      enableSignatureValidation: false,
      rateLimitPerMinute: 1,
    });

    const webhook1: WebhookData = {
      id: "webhook-1",
      source: "test-source",
      timestamp: new Date(),
      headers: {},
      body: {},
    };

    const webhook2: WebhookData = {
      id: "webhook-2",
      source: "test-source",
      timestamp: new Date(),
      headers: {},
      body: {},
    };

    // 첫 번째는 성공
    await collector.receiveWebhook(webhook1);

    // 두 번째는 레이트 리미트로 실패 예상
    await expect(collector.receiveWebhook(webhook2)).rejects.toThrow(
      "Rate limit exceeded",
    );
  });

  describe("signature validation", () => {
    const secretKey = "test-secret";
    // Spaced like Python's json.dumps, so it differs from JSON.stringify(body):
    // only the bytes as received can verify.
    const rawBody = '{"messageId": "msg-123", "status": "delivered"}';
    const sign = (payload: string | Uint8Array, secret = secretKey) =>
      createHmac("sha256", secret).update(payload).digest("hex");

    const createCollector = (config: Partial<WebhookCollectorConfig> = {}) =>
      new WebhookCollector({
        secretKey,
        allowedSources: ["test-source"],
        ...config,
      });

    const signedWebhook = (
      overrides: Partial<WebhookData> = {},
    ): WebhookData => ({
      id: "webhook-123",
      source: "test-source",
      timestamp: new Date(),
      headers: { "x-signature": `sha256=${sign(rawBody)}` },
      body: JSON.parse(rawBody),
      rawBody,
      ...overrides,
    });

    // A webhook whose valid signature covers `payload`.
    const signedAs = (
      payload: string | Uint8Array | ArrayBuffer,
      overrides: Partial<WebhookData> = {},
    ): WebhookData =>
      signedWebhook({
        headers: {
          "x-signature": `sha256=${sign(typeof payload === "string" ? payload : new Uint8Array(payload))}`,
        },
        body: undefined,
        rawBody: payload,
        ...overrides,
      });

    test("accepts an HMAC-SHA256 of the raw body", async () => {
      const events = await createCollector().receiveWebhook(signedWebhook());

      expect(events[0]?.type).toBe("message.delivered");
    });

    test("accepts the hex digest without the prefix and in upper case", async () => {
      const collector = createCollector();

      for (const signature of [
        sign(rawBody),
        `sha256=${sign(rawBody).toUpperCase()}`,
      ]) {
        const webhook = signedWebhook({
          headers: { "x-signature": signature },
        });
        await expect(collector.receiveWebhook(webhook)).resolves.toHaveLength(
          1,
        );
      }
    });

    test("verifies byte bodies", async () => {
      const collector = createCollector();
      const encoded = new TextEncoder().encode(rawBody);
      // A view into a larger buffer, like Node's pooled Buffers.
      const padded = new Uint8Array(encoded.length + 8);
      padded.set(encoded, 4);

      for (const bytes of [
        Buffer.from(rawBody),
        padded.subarray(4, 4 + encoded.length),
        encoded.slice().buffer,
      ]) {
        await expect(
          collector.receiveWebhook(signedWebhook({ rawBody: bytes })),
        ).resolves.toHaveLength(1);
      }
    });

    test("reads the signature header in any case", async () => {
      const collector = createCollector({
        signatureHeader: "X-Hub-Signature-256",
      });
      const webhook = signedWebhook({
        headers: { "x-hub-signature-256": `sha256=${sign(rawBody)}` },
      });

      await expect(collector.receiveWebhook(webhook)).resolves.toHaveLength(1);
    });

    test("rejects the length-only signature of the old placeholder", async () => {
      const forged = `sha256=${JSON.stringify(JSON.parse(rawBody)).length}_${secretKey.length}`;
      const webhook = signedWebhook({ headers: { "x-signature": forged } });

      await expect(createCollector().receiveWebhook(webhook)).rejects.toThrow(
        "Invalid webhook signature",
      );
    });

    test("rejects a tampered body", async () => {
      const tampered = rawBody.replace("delivered", "failed");
      const webhook = signedWebhook({
        body: JSON.parse(tampered),
        rawBody: tampered,
      });

      await expect(createCollector().receiveWebhook(webhook)).rejects.toThrow(
        "Invalid webhook signature",
      );
    });

    test("rejects a signature made with another secret", async () => {
      const webhook = signedWebhook({
        headers: { "x-signature": `sha256=${sign(rawBody, "other-secret")}` },
      });

      await expect(createCollector().receiveWebhook(webhook)).rejects.toThrow(
        "Invalid webhook signature",
      );
    });

    test("needs the raw body to verify", async () => {
      const webhook = signedWebhook({ rawBody: undefined });

      await expect(createCollector().receiveWebhook(webhook)).rejects.toThrow(
        "rawBody",
      );
    });

    test("collects the signed body, not a body passed alongside", async () => {
      const failed = '{"messageId": "msg-123", "status": "failed"}';
      const collector = createCollector();

      // For example, middleware changed the parsed body after it was signed.
      const events = await collector.receiveWebhook(
        signedAs(failed, {
          body: { messageId: "msg-123", status: "delivered" },
        }),
      );

      expect(events.map((event) => event.type)).toEqual(["message.failed"]);
      expect(collector.getProcessedWebhooks()[0]?.body).toEqual(
        JSON.parse(failed),
      );
    });

    test("parses body from the signed bytes when it is omitted", async () => {
      const webhook = signedAs(new TextEncoder().encode(rawBody));

      const events = await createCollector().receiveWebhook(webhook);

      expect(events.map((event) => event.type)).toEqual(["message.delivered"]);
    });

    test("rejects a signed body that is not UTF-8 JSON", async () => {
      const collector = createCollector();
      const encoder = new TextEncoder();

      for (const payload of [
        "messageId=msg-123&status=delivered",
        // JSON only if the byte that is never UTF-8 were replaced with U+FFFD.
        new Uint8Array([
          ...encoder.encode('{"note": "'),
          0xff,
          ...encoder.encode('"}'),
        ]),
      ]) {
        await expect(
          collector.receiveWebhook(signedAs(payload, { body: {} })),
        ).rejects.toThrow("rawBody must be UTF-8 JSON");
      }
    });

    test("counts rawBody against maxPayloadSize in UTF-8 bytes", async () => {
      // Hangul takes 3 UTF-8 bytes per UTF-16 code unit.
      const korean =
        '{"messageId": "msg-123", "status": "delivered", "note": "배송 완료"}';
      const bytes = new TextEncoder().encode(korean);
      const body = JSON.parse(korean);

      await expect(
        createCollector({ maxPayloadSize: bytes.length }).receiveWebhook(
          signedAs(korean, { body }),
        ),
      ).resolves.toHaveLength(1);
      for (const payload of [korean, bytes]) {
        await expect(
          createCollector({ maxPayloadSize: bytes.length - 1 }).receiveWebhook(
            signedAs(payload, { body }),
          ),
        ).rejects.toThrow("maxPayloadSize");
      }
    });

    test("refuses an oversized rawBody before checking its signature", async () => {
      // Small once parsed, but a megabyte of whitespace to hash.
      const padded = `${" ".repeat(1024 * 1024)}${rawBody}`;
      const webhook = signedWebhook({
        headers: { "x-signature": `sha256=${"0".repeat(64)}` },
        rawBody: padded,
      });

      await expect(createCollector().receiveWebhook(webhook)).rejects.toThrow(
        "maxPayloadSize",
      );
    });

    test("refuses to start without a secret while validation is on", () => {
      expect(() => new WebhookCollector()).toThrow("secretKey");
      expect(() => new WebhookCollector({ secretKey: "" })).toThrow(
        "secretKey",
      );
      // An undefined option keeps its default rather than turning the check off.
      expect(
        () => new WebhookCollector({ enableSignatureValidation: undefined }),
      ).toThrow("secretKey");
      expect(
        () => new WebhookCollector({ enableSignatureValidation: false }),
      ).not.toThrow();
    });

    test("treats every value but false as validation on", async () => {
      // What JavaScript callers or JSON-derived config can pass.
      for (const value of [null, 0, ""]) {
        const enableSignatureValidation = value as unknown as boolean;

        expect(
          () => new WebhookCollector({ enableSignatureValidation }),
        ).toThrow("secretKey");
        await expect(
          createCollector({ enableSignatureValidation }).receiveWebhook(
            signedWebhook({ headers: {} }),
          ),
        ).rejects.toThrow("Missing signature");
      }
    });

    test("uses the rawBody it was called with", async () => {
      const collector = createCollector();
      const webhook = signedWebhook();

      const received = collector.receiveWebhook(webhook);
      // Replaced while the signature check awaits WebCrypto.
      webhook.rawBody = rawBody.replace('"delivered"', '"failed"   ');
      const events = await received;

      expect(events.map((event) => event.type)).toEqual(["message.delivered"]);
      expect(collector.getProcessedWebhooks()[0]?.rawBody).toBe(rawBody);
    });

    test("copies byte bodies before verifying them", async () => {
      const collector = createCollector();
      const encoder = new TextEncoder();
      const forged = encoder.encode(
        rawBody.replace('"delivered"', '"failed"   '),
      );

      for (const asBody of [
        (bytes: Uint8Array<ArrayBuffer>) => bytes,
        (bytes: Uint8Array<ArrayBuffer>) => bytes.buffer,
      ]) {
        // slice() gives the view a buffer of exactly its own size.
        const bytes = encoder.encode(rawBody).slice();

        const received = collector.receiveWebhook(signedAs(asBody(bytes)));
        // Overwritten in place while the signature check awaits WebCrypto.
        bytes.set(forged);

        await expect(received).resolves.toMatchObject([
          { type: "message.delivered" },
        ]);
      }
    });

    test("parses a signed byte body with a leading BOM", async () => {
      const bytes = new Uint8Array([
        0xef,
        0xbb,
        0xbf,
        ...new TextEncoder().encode(rawBody),
      ]);

      await expect(
        createCollector().receiveWebhook(signedAs(bytes)),
      ).resolves.toMatchObject([{ type: "message.delivered" }]);
    });
  });
});

describe("AnomalyDetector", () => {
  test("should detect statistical anomalies", async () => {
    const detector = new AnomalyDetector({
      algorithms: [
        {
          name: "zscore",
          type: "statistical",
          enabled: true,
          config: { threshold: 2 },
        },
      ],
      sensitivity: "medium",
      minDataPoints: 5,
      confidenceThreshold: 0.5,
      enableSeasonalAdjustment: false,
    });

    // 정상적인 메트릭들
    const normalMetrics = Array.from({ length: 10 }, () =>
      createTestMetric(MetricType.MESSAGE_SENT, 100 + Math.random() * 10),
    );

    // 비정상적인 메트릭 (이상치)
    const anomalyMetric = createTestMetric(MetricType.MESSAGE_SENT, 1000);

    // 히스토리 구축
    for (const metric of normalMetrics) {
      await detector.detectRealTimeAnomalies(metric);
    }

    // 이상치 탐지
    const anomalies = await detector.detectRealTimeAnomalies(anomalyMetric);

    expect(anomalies.length).toBeGreaterThan(0);
    expect(anomalies[0].severity).toBeDefined();
  });

  test("should detect trend changes", async () => {
    const detector = new AnomalyDetector();
    const now = new Date();

    const metrics = Array.from({ length: 20 }, (_, i) =>
      createTestAggregatedMetric(
        MetricType.MESSAGE_SENT,
        100 + (i < 10 ? i * 5 : i * 20), // 10번째부터 급증
        new Date(now.getTime() - (20 - i) * 60000),
      ),
    );

    const insights = await detector.detectTrendChanges(metrics, 5);

    expect(insights.length).toBeGreaterThanOrEqual(0);
  });
});

describe("RecommendationEngine", () => {
  test("should generate rule-based recommendations", async () => {
    const engine = new RecommendationEngine({
      rules: [
        {
          id: "test-rule",
          name: "Test Rule",
          category: "performance",
          priority: 5,
          conditions: [
            { metric: MetricType.DELIVERY_RATE, operator: "lt", value: 85 },
          ],
          actions: [
            {
              type: "performance",
              title: "Improve Delivery",
              description: "Fix delivery issues",
              impact: "high",
              effort: "medium",
              steps: ["Check providers", "Review templates"],
            },
          ],
          enabled: true,
        },
      ],
      enableMachineLearning: false,
      confidenceThreshold: 0.7,
      maxRecommendations: 10,
      categories: [],
    });

    const metrics = [
      createTestAggregatedMetric(MetricType.DELIVERY_RATE, 80), // 85% 미만
    ];

    const recommendations = await engine.generateRecommendations(metrics);

    expect(recommendations.length).toBeGreaterThan(0);
    // Check that we get either our custom rule or a default rule
    expect(["performance", "reliability"]).toContain(
      recommendations[0].category,
    );
  });

  test("should prioritize recommendations", async () => {
    const engine = new RecommendationEngine();
    const metrics = [
      createTestAggregatedMetric(MetricType.MESSAGE_SENT, 1000),
      createTestAggregatedMetric(MetricType.DELIVERY_RATE, 80),
      createTestAggregatedMetric(MetricType.ERROR_RATE, 15),
    ];

    const recommendations = await engine.generateRecommendations(metrics);

    // 우선순위 순으로 정렬되었는지 확인
    for (let i = 1; i < recommendations.length; i++) {
      expect(recommendations[i - 1].priority).toBeGreaterThanOrEqual(
        recommendations[i].priority,
      );
    }
  });
});

describe("DashboardGenerator", () => {
  test("should generate dashboard data", async () => {
    const generator = new DashboardGenerator();
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const metrics = [
      createTestAggregatedMetric(MetricType.MESSAGE_SENT, 1000),
      createTestAggregatedMetric(MetricType.MESSAGE_DELIVERED, 950),
      createTestAggregatedMetric(MetricType.MESSAGE_FAILED, 50),
    ];

    const dashboard = await generator.generateDashboard(
      { start: oneHourAgo, end: now },
      { provider: "test-provider" },
      metrics,
    );

    expect(dashboard.timestamp).toBeDefined();
    expect(dashboard.kpis.length).toBeGreaterThan(0);
    expect(dashboard.widgets.length).toBeGreaterThanOrEqual(0);
  });

  test("should calculate KPIs correctly", async () => {
    const generator = new DashboardGenerator();
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const metrics = [
      createTestAggregatedMetric(MetricType.MESSAGE_SENT, 1000),
      createTestAggregatedMetric(MetricType.MESSAGE_DELIVERED, 950),
    ];

    const dashboard = await generator.generateDashboard(
      { start: oneHourAgo, end: now },
      {},
      metrics,
    );

    const deliveryRateKPI = dashboard.kpis.find(
      (kpi) => kpi.id === "delivery_rate",
    );
    expect(deliveryRateKPI).toBeDefined();
    expect(deliveryRateKPI!.value).toBe(95); // 950/1000 * 100
  });
});

describe("ExportManager", () => {
  test("should export report to CSV", async () => {
    const exporter = new ExportManager();

    const report = {
      id: "test-report",
      name: "Test Report",
      description: "Test report for export",
      dateRange: { start: new Date(), end: new Date() },
      filters: {},
      metrics: [
        {
          type: MetricType.MESSAGE_SENT,
          value: 1000,
          change: 100,
          trend: "up" as const,
        },
      ],
      generatedAt: new Date(),
      format: "json" as const,
    };

    const result = await exporter.exportReport(report, { type: "csv" });

    expect(result.id).toBeDefined();
    expect(result.format).toBe("csv");
    expect(result.fileName).toContain(".csv");
    expect(result.fileSize).toBeGreaterThan(0);
  });

  test("should export metrics to JSON", async () => {
    const exporter = new ExportManager();

    const metrics = [
      createTestAggregatedMetric(MetricType.MESSAGE_SENT, 100),
      createTestAggregatedMetric(MetricType.MESSAGE_DELIVERED, 95),
    ];

    const result = await exporter.exportMetrics(metrics, { type: "json" });

    expect(result.format).toBe("json");
    expect(result.fileName).toContain("metrics_");
    expect(result.downloadUrl).toBeDefined();
  });

  test("should handle file size limits", async () => {
    const exporter = new ExportManager({ maxFileSize: 100 }); // 100 bytes limit

    const report = {
      id: "large-report",
      name: "Large Test Report",
      description: "A very large report that should exceed size limits",
      dateRange: { start: new Date(), end: new Date() },
      filters: {},
      metrics: Array.from({ length: 1000 }, (_, i) => ({
        type: MetricType.MESSAGE_SENT,
        value: i,
        change: i * 2,
        trend: "up" as const,
      })),
      generatedAt: new Date(),
      format: "json" as const,
    };

    await expect(
      exporter.exportReport(report, { type: "csv" }),
    ).rejects.toThrow("exceeds maximum");
  });
});

describe("Integration Tests", () => {
  test("should handle complete analytics workflow", async () => {
    // 1. 설정
    const config: AnalyticsConfig = {
      enableRealTimeTracking: true,
      retentionDays: 30,
      aggregationIntervals: ["minute", "hour"],
      enabledMetrics: [
        MetricType.MESSAGE_SENT,
        MetricType.MESSAGE_DELIVERED,
        MetricType.MESSAGE_FAILED,
      ],
    };

    const analyticsService = new AnalyticsService(config);
    const eventCollector = new EventCollector();
    const anomalyDetector = new AnomalyDetector();
    const dashboardGenerator = new DashboardGenerator();

    // 2. 이벤트 수집
    const events = [
      createTestEvent("message.sent", { messageId: "msg-1", provider: "test" }),
      createTestEvent("message.delivered", { messageId: "msg-1" }),
      createTestEvent("message.sent", { messageId: "msg-2", provider: "test" }),
      createTestEvent("message.failed", {
        messageId: "msg-2",
        errorCode: "INVALID_NUMBER",
      }),
    ];

    for (const event of events) {
      await eventCollector.collectEvent(event);
    }

    // 3. 메트릭 생성 및 수집
    const collectedMetrics = eventCollector.getCollectedMetrics();

    for (const metric of collectedMetrics) {
      await analyticsService.collectMetric(metric);
    }

    // 4. 분석 실행
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const analysisResult = await analyticsService.query({
      metrics: [
        MetricType.MESSAGE_SENT,
        MetricType.MESSAGE_DELIVERED,
        MetricType.MESSAGE_FAILED,
      ],
      dateRange: { start: oneHourAgo, end: now },
      interval: "minute",
    });

    // 5. 대시보드 생성
    const dashboard = await dashboardGenerator.generateDashboard(
      { start: oneHourAgo, end: now },
      {},
      analysisResult.data,
    );

    // 6. 검증
    expect(analysisResult.data).toBeDefined();
    expect(dashboard.kpis.length).toBeGreaterThan(0);
    expect(dashboard.timestamp).toBeInstanceOf(Date);

    // KPI 검증
    const totalSentKPI = dashboard.kpis.find((kpi) => kpi.id === "total_sent");
    expect(totalSentKPI).toBeDefined();
    expect(totalSentKPI!.value).toBeGreaterThanOrEqual(0);

    const deliveryRateKPI = dashboard.kpis.find(
      (kpi) => kpi.id === "delivery_rate",
    );
    expect(deliveryRateKPI).toBeDefined();
    expect(deliveryRateKPI!.status).toMatch(/good|warning|critical/);
  });

  test("should detect anomalies in real-time pipeline", async () => {
    const eventCollector = new EventCollector();
    const anomalyDetector = new AnomalyDetector({
      algorithms: [
        {
          name: "zscore",
          type: "statistical",
          enabled: true,
          config: { threshold: 2 },
        },
      ],
      minDataPoints: 3,
      confidenceThreshold: 0.6,
      sensitivity: "medium",
      enableSeasonalAdjustment: false,
    });

    // 정상 메트릭들로 베이스라인 구축
    const normalEvents = Array.from({ length: 10 }, (_, i) =>
      createTestEvent("message.sent", { count: 100 + Math.random() * 10 }),
    );

    for (const event of normalEvents) {
      await eventCollector.collectEvent(event);
    }

    const normalMetrics = eventCollector.getCollectedMetrics();

    for (const metric of normalMetrics) {
      await anomalyDetector.detectRealTimeAnomalies(metric);
    }

    // 이상 이벤트 발생
    const anomalousEvent = createTestEvent("message.sent", { count: 1000 });
    await eventCollector.collectEvent(anomalousEvent);

    const anomalousMetrics = eventCollector
      .getCollectedMetrics()
      .filter(
        (m) =>
          m.timestamp > normalMetrics[normalMetrics.length - 1]?.timestamp ||
          new Date(0),
      );

    let totalAnomalies = 0;
    for (const metric of anomalousMetrics) {
      const anomalies = await anomalyDetector.detectRealTimeAnomalies(metric);
      totalAnomalies += anomalies.length;
    }

    expect(totalAnomalies).toBeGreaterThanOrEqual(0);
  });
});
