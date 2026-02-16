import { describe, expect, test } from "bun:test";
import type { MessageType } from "@k-msg/core";
import { InMemoryDeliveryTrackingStore } from "@k-msg/messaging/tracking";
import { DeliveryTrackingAnalyticsService } from "./services/delivery-tracking.analytics";

describe("DeliveryTrackingAnalyticsService", () => {
  test("computes status breakdowns from delivery-tracking store (in-memory)", async () => {
    const store = new InMemoryDeliveryTrackingStore();
    await store.init();

    const start = new Date("2026-01-01T00:00:00.000Z");
    const end = new Date("2026-01-02T00:00:00.000Z");

    const mk = (params: {
      messageId: string;
      providerId: string;
      type: MessageType;
      status:
        | "PENDING"
        | "SENT"
        | "DELIVERED"
        | "FAILED"
        | "CANCELLED"
        | "UNKNOWN";
      requestedAt: Date;
    }) => ({
      messageId: params.messageId,
      providerId: params.providerId,
      providerMessageId: `p_${params.messageId}`,
      type: params.type,
      to: "01012345678",
      requestedAt: params.requestedAt,
      status: params.status,
      statusUpdatedAt: params.requestedAt,
      attemptCount: 0,
      nextCheckAt: params.requestedAt,
    });

    await store.upsert(
      mk({
        messageId: "m1",
        providerId: "solapi",
        type: "SMS",
        status: "DELIVERED",
        requestedAt: new Date("2026-01-01T12:00:00.000Z"),
      }),
    );
    await store.upsert(
      mk({
        messageId: "m2",
        providerId: "solapi",
        type: "SMS",
        status: "FAILED",
        requestedAt: new Date("2026-01-01T12:10:00.000Z"),
      }),
    );
    await store.upsert(
      mk({
        messageId: "m3",
        providerId: "iwinv",
        type: "ALIMTALK",
        status: "PENDING",
        requestedAt: new Date("2026-01-01T12:20:00.000Z"),
      }),
    );
    await store.upsert(
      mk({
        messageId: "m4",
        providerId: "solapi",
        type: "ALIMTALK",
        status: "DELIVERED",
        requestedAt: new Date("2026-01-01T12:30:00.000Z"),
      }),
    );

    const analytics = new DeliveryTrackingAnalyticsService({ store });
    const summary = await analytics.getSummary(
      { requestedAt: { start, end } },
      { includeByProviderId: true, includeByType: true },
    );

    expect(summary.total).toBe(4);
    expect(summary.byStatus.DELIVERED).toBe(2);
    expect(summary.byStatus.FAILED).toBe(1);
    expect(summary.byStatus.PENDING).toBe(1);

    expect(summary.rates.deliveredOfTotalPct).toBe(50);
    expect(summary.rates.failedOfTotalPct).toBe(25);
    expect(summary.rates.deliveredOfFinalizedPct).toBeCloseTo(66.666, 2);

    expect(summary.byProviderId?.solapi?.total).toBe(3);
    expect(summary.byProviderId?.solapi?.byStatus.DELIVERED).toBe(2);
    expect(summary.byProviderId?.solapi?.byStatus.FAILED).toBe(1);
    expect(summary.byProviderId?.iwinv?.total).toBe(1);

    expect(summary.byType?.SMS?.total).toBe(2);
    expect(summary.byType?.ALIMTALK?.total).toBe(2);
  });
});
