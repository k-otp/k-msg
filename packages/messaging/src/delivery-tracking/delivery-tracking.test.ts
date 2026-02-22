import { describe, expect, test } from "bun:test";
import {
  type DeliveryStatusQuery,
  fail,
  KMsgError,
  KMsgErrorCode,
  ok,
  type Provider,
} from "@k-msg/core";
import { DeliveryTrackingService } from "./service";
import { BunSqlDeliveryTrackingStore } from "./stores/bun-sql.store";
import { InMemoryDeliveryTrackingStore } from "./stores/memory.store";
import { SqliteDeliveryTrackingStore } from "./stores/sqlite.store";

function createMockProvider(params: {
  id: string;
  status: "PENDING" | "SENT" | "DELIVERED" | "FAILED" | "CANCELLED" | "UNKNOWN";
  statusCode?: string;
  statusMessage?: string;
  raw?: unknown;
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
        ...(typeof params.statusCode === "string"
          ? { statusCode: params.statusCode }
          : { statusCode: "OK" }),
        ...(typeof params.statusMessage === "string"
          ? { statusMessage: params.statusMessage }
          : {}),
        raw: params.raw ?? { providerMessageId: query.providerMessageId },
      }),
  };
}

function getFailoverMetadata(
  record: { metadata?: Record<string, unknown> } | undefined,
): Record<string, unknown> {
  const metadata = record?.metadata;
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {};
  }
  const failover = (metadata as Record<string, unknown>).failover;
  if (!failover || typeof failover !== "object" || Array.isArray(failover)) {
    return {};
  }
  return failover as Record<string, unknown>;
}

describe("DeliveryTrackingService (InMemory)", () => {
  test("recordSend + runOnce updates status to DELIVERED", async () => {
    const provider = createMockProvider({ id: "mock", status: "DELIVERED" });
    const store = new InMemoryDeliveryTrackingStore();
    const service = new DeliveryTrackingService({
      providers: [provider],
      store,
      polling: {
        initialDelayMs: 0,
        intervalMs: 10,
        batchSize: 10,
        concurrency: 2,
      },
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
    expect(after?.providerStatusCode).toBe("OK");
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

  test("scheduled sends do not timeout before scheduledAt + grace", async () => {
    const provider = createMockProvider({ id: "mock", status: "DELIVERED" });
    const store = new InMemoryDeliveryTrackingStore();
    const service = new DeliveryTrackingService({
      providers: [provider],
      store,
      polling: { scheduledGraceMs: 1_000, maxTrackingDurationMs: 1_000 },
    });

    const scheduledAt = new Date(Date.now() + 20_000);
    await service.recordSend(
      {
        messageId: "m3",
        options: {
          type: "SMS",
          to: "01012345678",
          text: "hi",
          options: { scheduledAt },
        },
        timestamp: Date.now() - 30_000,
      },
      {
        messageId: "m3",
        providerId: "mock",
        providerMessageId: "p3",
        status: "PENDING",
        type: "SMS",
        to: "01012345678",
      },
    );

    await service.runOnce();

    const record = await service.getRecord("m3");
    expect(record?.status).toBe("PENDING");
    expect(record?.lastError).toBeUndefined();
    expect(record?.nextCheckAt.getTime()).toBe(scheduledAt.getTime() + 1_000);
  });
});

describe("DeliveryTrackingService API failover", () => {
  test("attempts API failover once for solapi 3104/3107 failures", async () => {
    for (const statusCode of ["3104", "3107"]) {
      const provider = createMockProvider({
        id: "solapi",
        status: "FAILED",
        statusCode,
        statusMessage: "카카오톡 미사용자",
      });
      const store = new InMemoryDeliveryTrackingStore();
      const senderCalls: Array<{ input: unknown; context: unknown }> = [];
      const service = new DeliveryTrackingService({
        providers: [provider],
        store,
        polling: {
          initialDelayMs: 0,
          intervalMs: 10,
          batchSize: 10,
          concurrency: 2,
        },
        apiFailover: {
          sender: async (input, context) => {
            senderCalls.push({ input, context });
            return ok({
              messageId: "fallback-1",
              providerId: "sms-provider",
              status: "SENT",
              type: "SMS",
              to: "01012345678",
            });
          },
        },
      });

      await service.recordSend(
        {
          messageId: `m-failover-${statusCode}`,
          options: {
            type: "ALIMTALK",
            to: "01012345678",
            from: "01000000000",
            templateId: "TPL_1",
            variables: { code: "1234" },
            failover: {
              enabled: true,
              fallbackChannel: "sms",
              fallbackContent: "fallback body",
            },
          },
          timestamp: Date.now(),
        },
        {
          messageId: `m-failover-${statusCode}`,
          providerId: "solapi",
          providerMessageId: `p-${statusCode}`,
          status: "SENT",
          type: "ALIMTALK",
          to: "01012345678",
          warnings: [
            {
              code: "FAILOVER_PARTIAL_PROVIDER",
              message: "partial",
            },
          ],
        },
      );

      await service.runOnce();
      await service.runOnce();

      expect(senderCalls).toHaveLength(1);
      const senderInput = senderCalls[0]?.input as Record<string, unknown>;
      expect(senderInput.type).toBe("SMS");
      expect(senderInput.messageId).toBe(
        `m-failover-${statusCode}:api-fallback`,
      );

      const record = await service.getRecord(`m-failover-${statusCode}`);
      const failover = getFailoverMetadata(record);
      const apiAttempt = failover.apiAttempt as Record<string, unknown>;
      expect(apiAttempt.attempted).toBe(true);
      expect(apiAttempt.outcome).toBe("sent");
      expect(apiAttempt.fallbackProviderId).toBe("sms-provider");
    }
  });

  test("matches iwinv non-kakao-user message keywords", async () => {
    const provider = createMockProvider({
      id: "iwinv",
      status: "FAILED",
      statusCode: "ERR",
      statusMessage: "카카오 미사용 대상",
    });
    const store = new InMemoryDeliveryTrackingStore();
    let senderCallCount = 0;
    const service = new DeliveryTrackingService({
      providers: [provider],
      store,
      polling: { initialDelayMs: 0 },
      apiFailover: {
        sender: async () => {
          senderCallCount += 1;
          return ok({
            messageId: "fallback-iwinv",
            providerId: "sms-provider",
            status: "SENT",
            type: "SMS",
            to: "01012345678",
          });
        },
      },
    });

    await service.recordSend(
      {
        messageId: "m-iwinv",
        options: {
          type: "ALIMTALK",
          to: "01012345678",
          templateId: "TPL_1",
          variables: { code: "1234" },
          failover: {
            enabled: true,
            fallbackContent: "fallback body",
          },
        },
        timestamp: Date.now(),
      },
      {
        messageId: "m-iwinv",
        providerId: "iwinv",
        providerMessageId: "p-iwinv",
        status: "SENT",
        type: "ALIMTALK",
        to: "01012345678",
        warnings: [
          {
            code: "FAILOVER_PARTIAL_PROVIDER",
            message: "partial",
          },
        ],
      },
    );

    await service.runOnce();
    expect(senderCallCount).toBe(1);
  });

  test("skips API failover when fallbackContent is missing", async () => {
    const provider = createMockProvider({
      id: "solapi",
      status: "FAILED",
      statusCode: "3104",
      statusMessage: "카카오톡 미사용자",
    });
    const store = new InMemoryDeliveryTrackingStore();
    let senderCalled = false;
    const service = new DeliveryTrackingService({
      providers: [provider],
      store,
      polling: { initialDelayMs: 0 },
      apiFailover: {
        sender: async () => {
          senderCalled = true;
          return ok({
            messageId: "fallback-never",
            providerId: "sms-provider",
            status: "SENT",
            type: "SMS",
            to: "01012345678",
          });
        },
      },
    });

    await service.recordSend(
      {
        messageId: "m-missing-content",
        options: {
          type: "ALIMTALK",
          to: "01012345678",
          templateId: "TPL_1",
          variables: { code: "1234" },
          failover: { enabled: true },
        },
        timestamp: Date.now(),
      },
      {
        messageId: "m-missing-content",
        providerId: "solapi",
        providerMessageId: "p-missing-content",
        status: "SENT",
        type: "ALIMTALK",
        to: "01012345678",
        warnings: [
          {
            code: "FAILOVER_PARTIAL_PROVIDER",
            message: "partial",
          },
        ],
      },
    );

    await service.runOnce();
    expect(senderCalled).toBe(false);

    const record = await service.getRecord("m-missing-content");
    const failover = getFailoverMetadata(record);
    const apiAttempt = failover.apiAttempt as Record<string, unknown>;
    expect(apiAttempt.outcome).toBe("skipped");
    expect(apiAttempt.warningCode).toBe("FALLBACK_CONTENT_MISSING");
  });

  test("uses custom classifyNonKakaoUser callback when provided", async () => {
    const provider = createMockProvider({
      id: "custom-provider",
      status: "FAILED",
      statusCode: "9999",
      statusMessage: "no match",
    });
    const store = new InMemoryDeliveryTrackingStore();
    let classifyCallCount = 0;
    let senderCallCount = 0;
    const service = new DeliveryTrackingService({
      providers: [provider],
      store,
      polling: { initialDelayMs: 0 },
      apiFailover: {
        sender: async () => {
          senderCallCount += 1;
          return ok({
            messageId: "fallback-custom",
            providerId: "sms-provider",
            status: "SENT",
            type: "SMS",
            to: "01012345678",
          });
        },
        classifyNonKakaoUser: () => {
          classifyCallCount += 1;
          return true;
        },
      },
    });

    await service.recordSend(
      {
        messageId: "m-custom-classifier",
        options: {
          type: "ALIMTALK",
          to: "01012345678",
          templateId: "TPL_1",
          variables: { code: "1234" },
          failover: { enabled: true, fallbackContent: "fallback body" },
        },
        timestamp: Date.now(),
      },
      {
        messageId: "m-custom-classifier",
        providerId: "custom-provider",
        providerMessageId: "p-custom-classifier",
        status: "SENT",
        type: "ALIMTALK",
        to: "01012345678",
        warnings: [
          {
            code: "FAILOVER_UNSUPPORTED_PROVIDER",
            message: "unsupported",
          },
        ],
      },
    );

    await service.runOnce();
    expect(classifyCallCount).toBe(1);
    expect(senderCallCount).toBe(1);
  });

  test("records sender failure details in metadata", async () => {
    const provider = createMockProvider({
      id: "solapi",
      status: "FAILED",
      statusCode: "3104",
      statusMessage: "카카오톡 미사용자",
    });
    const store = new InMemoryDeliveryTrackingStore();
    const service = new DeliveryTrackingService({
      providers: [provider],
      store,
      polling: { initialDelayMs: 0 },
      apiFailover: {
        sender: async () =>
          fail(
            new KMsgError(KMsgErrorCode.PROVIDER_ERROR, "SMS fallback failed"),
          ),
      },
    });

    await service.recordSend(
      {
        messageId: "m-fallback-failed",
        options: {
          type: "ALIMTALK",
          to: "01012345678",
          templateId: "TPL_1",
          variables: { code: "1234" },
          failover: {
            enabled: true,
            fallbackChannel: "lms",
            fallbackContent: "fallback body",
            fallbackTitle: "fallback title",
          },
        },
        timestamp: Date.now(),
      },
      {
        messageId: "m-fallback-failed",
        providerId: "solapi",
        providerMessageId: "p-fallback-failed",
        status: "SENT",
        type: "ALIMTALK",
        to: "01012345678",
        warnings: [
          {
            code: "FAILOVER_PARTIAL_PROVIDER",
            message: "partial",
          },
        ],
      },
    );

    await service.runOnce();

    const record = await service.getRecord("m-fallback-failed");
    const failover = getFailoverMetadata(record);
    const apiAttempt = failover.apiAttempt as Record<string, unknown>;
    expect(apiAttempt.outcome).toBe("failed");
    expect(apiAttempt.errorCode).toBe("PROVIDER_ERROR");
    expect(apiAttempt.errorMessage).toBe("SMS fallback failed");
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
      providerStatusCode: "2000",
      providerStatusMessage: "queued",
      sentAt: now,
      statusUpdatedAt: now,
      attemptCount: 0,
      nextCheckAt: new Date(now.getTime() - 1),
    });

    const due = await store.listDue(new Date(), 10);
    expect(due).toHaveLength(1);

    const list = await store.listRecords({
      limit: 10,
      providerId: "mock",
      requestedAtFrom: new Date(now.getTime() - 10),
      requestedAtTo: new Date(now.getTime() + 10),
    });
    expect(list).toHaveLength(1);

    const count = await store.countRecords({
      providerId: "mock",
      requestedAtFrom: new Date(now.getTime() - 10),
      requestedAtTo: new Date(now.getTime() + 10),
    });
    expect(count).toBe(1);

    const byStatus = await store.countBy({ providerId: "mock" }, ["status"]);
    expect(byStatus).toEqual([{ key: { status: "SENT" }, count: 1 }]);

    await store.patch("m1", {
      status: "DELIVERED",
      statusUpdatedAt: new Date(),
      nextCheckAt: new Date(),
    });

    const record = await store.get("m1");
    expect(record?.status).toBe("DELIVERED");
    expect(record?.providerStatusCode).toBe("2000");
  });

  test("storeRaw defaults to false and can be enabled", async () => {
    const now = new Date();

    const defaultStore = new SqliteDeliveryTrackingStore({
      dbPath: ":memory:",
    });
    await defaultStore.upsert({
      messageId: "sqlite-no-raw",
      providerId: "mock",
      providerMessageId: "p-no-raw",
      type: "SMS",
      to: "01012345678",
      requestedAt: now,
      status: "SENT",
      statusUpdatedAt: now,
      attemptCount: 0,
      nextCheckAt: now,
      raw: { kept: false },
    });

    const withoutRaw = await defaultStore.get("sqlite-no-raw");
    expect(withoutRaw?.raw).toBeUndefined();
    await defaultStore.close();

    const rawStore = new SqliteDeliveryTrackingStore({
      dbPath: ":memory:",
      storeRaw: true,
    });
    await rawStore.upsert({
      messageId: "sqlite-with-raw",
      providerId: "mock",
      providerMessageId: "p-with-raw",
      type: "SMS",
      to: "01012345678",
      requestedAt: now,
      status: "SENT",
      statusUpdatedAt: now,
      attemptCount: 0,
      nextCheckAt: now,
      raw: { kept: true },
    });

    const withRaw = await rawStore.get("sqlite-with-raw");
    expect(withRaw?.raw).toEqual({ kept: true });
    await rawStore.close();
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
      providerStatusCode: "2000",
      providerStatusMessage: "queued",
      sentAt: now,
      statusUpdatedAt: now,
      attemptCount: 0,
      nextCheckAt: new Date(now.getTime() - 1),
      metadata: { foo: "bar" },
    });

    const due = await store.listDue(new Date(), 10);
    expect(due).toHaveLength(1);
    expect(due[0]?.from).toBe("01000000000");

    const list = await store.listRecords({
      limit: 10,
      providerId: "mock",
      requestedAtFrom: new Date(now.getTime() - 10),
      requestedAtTo: new Date(now.getTime() + 10),
    });
    expect(list).toHaveLength(1);

    const count = await store.countRecords({
      providerId: "mock",
      requestedAtFrom: new Date(now.getTime() - 10),
      requestedAtTo: new Date(now.getTime() + 10),
    });
    expect(count).toBe(1);

    const byStatus = await store.countBy({ providerId: "mock" }, ["status"]);
    expect(byStatus).toEqual([{ key: { status: "SENT" }, count: 1 }]);

    await store.patch("m1", {
      status: "DELIVERED",
      statusUpdatedAt: new Date(),
      nextCheckAt: new Date(),
    });

    const record = await store.get("m1");
    expect(record?.status).toBe("DELIVERED");
    expect(record?.providerStatusCode).toBe("2000");

    await store.close();
  });

  test("storeRaw defaults to false and can be enabled", async () => {
    const now = new Date();

    const defaultStore = new BunSqlDeliveryTrackingStore({
      options: { adapter: "sqlite", filename: ":memory:" },
    });
    await defaultStore.upsert({
      messageId: "bun-no-raw",
      providerId: "mock",
      providerMessageId: "p-no-raw",
      type: "SMS",
      to: "01012345678",
      requestedAt: now,
      status: "SENT",
      statusUpdatedAt: now,
      attemptCount: 0,
      nextCheckAt: now,
      raw: { kept: false },
    });

    const withoutRaw = await defaultStore.get("bun-no-raw");
    expect(withoutRaw?.raw).toBeUndefined();
    await defaultStore.close();

    const rawStore = new BunSqlDeliveryTrackingStore({
      options: { adapter: "sqlite", filename: ":memory:" },
      storeRaw: true,
    });
    await rawStore.upsert({
      messageId: "bun-with-raw",
      providerId: "mock",
      providerMessageId: "p-with-raw",
      type: "SMS",
      to: "01012345678",
      requestedAt: now,
      status: "SENT",
      statusUpdatedAt: now,
      attemptCount: 0,
      nextCheckAt: now,
      raw: { kept: true },
    });

    const withRaw = await rawStore.get("bun-with-raw");
    expect(withRaw?.raw).toEqual({ kept: true });
    await rawStore.close();
  });
});
