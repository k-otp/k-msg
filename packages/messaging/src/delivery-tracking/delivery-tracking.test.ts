import { describe, expect, test } from "bun:test";
import { ok, type DeliveryStatusQuery, type Provider } from "@k-msg/core";
import { DeliveryTrackingService } from "./service";
import { InMemoryDeliveryTrackingStore } from "./stores/memory.store";
import { SqliteDeliveryTrackingStore } from "./stores/sqlite.store";
import { BunSqlDeliveryTrackingStore } from "./stores/bun-sql.store";

function createMockProvider(params: {
  id: string;
  status: "PENDING" | "SENT" | "DELIVERED" | "FAILED" | "CANCELLED" | "UNKNOWN";
}): Provider {
  return {
    id: params.id,
    name: "mock",
    supportedTypes: ["SMS"],
    healthCheck: async () => ({ healthy: true, issues: [] }),
    send: async () =>
      ok({
        messageId: "msg",
        providerId: params.id,
        status: "SENT",
        type: "SMS",
        to: "01012345678",
      }),
    getDeliveryStatus: async (query: DeliveryStatusQuery) =>
      ok({
        providerId: params.id,
        providerMessageId: query.providerMessageId,
        status: params.status,
        statusCode: "OK",
        raw: { providerMessageId: query.providerMessageId },
      }),
  };
}

describe("DeliveryTrackingService (InMemory)", () => {
  test("recordSend + runOnce updates status to DELIVERED", async () => {
    const provider = createMockProvider({ id: "mock", status: "DELIVERED" });
    const store = new InMemoryDeliveryTrackingStore();
    const service = new DeliveryTrackingService({
      providers: [provider],
      store,
      polling: { initialDelayMs: 0, intervalMs: 10, batchSize: 10, concurrency: 2 },
    });

    const now = Date.now();
    await service.recordSend(
      {
        messageId: "m1",
        options: { type: "SMS", to: "01012345678", text: "hi" },
        timestamp: now,
      },
      {
        messageId: "m1",
        providerId: "mock",
        providerMessageId: "p1",
        status: "SENT",
        type: "SMS",
        to: "01012345678",
      },
    );

    const before = await service.getRecord("m1");
    expect(before?.status).toBe("SENT");

    await service.runOnce();

    const after = await service.getRecord("m1");
    expect(after?.status).toBe("DELIVERED");
  });

  test("scheduled sends start as PENDING and delay polling until scheduledAt + grace", async () => {
    const provider = createMockProvider({ id: "mock", status: "DELIVERED" });
    const store = new InMemoryDeliveryTrackingStore();
    const service = new DeliveryTrackingService({
      providers: [provider],
      store,
      polling: { scheduledGraceMs: 1_000, initialDelayMs: 0 },
    });

    const scheduledAt = new Date(Date.now() + 5_000);
    await service.recordSend(
      {
        messageId: "m2",
        options: {
          type: "SMS",
          to: "01012345678",
          text: "hi",
          options: { scheduledAt },
        },
        timestamp: Date.now(),
      },
      {
        messageId: "m2",
        providerId: "mock",
        providerMessageId: "p2",
        status: "PENDING",
        type: "SMS",
        to: "01012345678",
      },
    );

    const record = await service.getRecord("m2");
    expect(record?.status).toBe("PENDING");
    expect(record?.nextCheckAt.getTime()).toBe(scheduledAt.getTime() + 1_000);
  });
});

describe("DeliveryTrackingStore (SQLite)", () => {
  test("upsert/get/listDue/patch works with :memory:", async () => {
    const store = new SqliteDeliveryTrackingStore({ dbPath: ":memory:" });
    await store.init();

    const now = new Date();
    await store.upsert({
      messageId: "m1",
      providerId: "mock",
      providerMessageId: "p1",
      type: "SMS",
      to: "01012345678",
      requestedAt: now,
      status: "SENT",
      statusUpdatedAt: now,
      attemptCount: 0,
      nextCheckAt: new Date(now.getTime() - 1),
    });

    const due = await store.listDue(new Date(), 10);
    expect(due).toHaveLength(1);

    await store.patch("m1", {
      status: "DELIVERED",
      statusUpdatedAt: new Date(),
      nextCheckAt: new Date(),
    });

    const record = await store.get("m1");
    expect(record?.status).toBe("DELIVERED");
  });
});

describe("DeliveryTrackingStore (Bun.SQL sqlite)", () => {
  test("upsert/get/listDue/patch works with adapter=sqlite", async () => {
    const store = new BunSqlDeliveryTrackingStore({
      options: { adapter: "sqlite", filename: ":memory:" },
    });
    await store.init();

    const now = new Date();
    await store.upsert({
      messageId: "m1",
      providerId: "mock",
      providerMessageId: "p1",
      type: "SMS",
      to: "01012345678",
      from: "01000000000",
      requestedAt: now,
      status: "SENT",
      statusUpdatedAt: now,
      attemptCount: 0,
      nextCheckAt: new Date(now.getTime() - 1),
      metadata: { foo: "bar" },
    });

    const due = await store.listDue(new Date(), 10);
    expect(due).toHaveLength(1);
    expect(due[0]?.from).toBe("01000000000");

    await store.patch("m1", {
      status: "DELIVERED",
      statusUpdatedAt: new Date(),
      nextCheckAt: new Date(),
    });

    const record = await store.get("m1");
    expect(record?.status).toBe("DELIVERED");

    await store.close();
  });
});

