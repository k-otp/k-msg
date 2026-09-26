import { describe, expect, spyOn, test } from "bun:test";
import {
  type DeliveryStatusQuery,
  fail,
  KMsgError,
  KMsgErrorCode,
  ok,
  type Provider,
  type SendInput,
} from "@k-msg/core";
import { type DeliveryStatusChange, DeliveryTrackingService } from "./service";
import { BunSqlDeliveryTrackingStore } from "./stores/bun-sql.store";
import { InMemoryDeliveryTrackingStore } from "./stores/memory.store";
import { SqliteDeliveryTrackingStore } from "./stores/sqlite.store";
import type { TrackingRecord } from "./types";

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

  test("sends a long API fallback as LMS unless a channel was chosen", async () => {
    const provider = createMockProvider({
      id: "solapi",
      status: "FAILED",
      statusCode: "3104",
      statusMessage: "카카오톡 미사용자",
    });
    const sent: Array<{ input: SendInput; fallbackType: string }> = [];
    const service = new DeliveryTrackingService({
      providers: [provider],
      polling: { initialDelayMs: 0 },
      apiFailover: {
        sender: async (input, context) => {
          sent.push({ input, fallbackType: context.fallbackType });
          return ok({
            messageId: context.fallbackMessageId,
            providerId: "sms-provider",
            status: "SENT",
            type: context.fallbackType,
            to: "01012345678",
          });
        },
      },
    });

    const cases = {
      short: { enabled: true, fallbackContent: "a".repeat(90) },
      long: {
        enabled: true,
        fallbackTitle: "Notice",
        fallbackContent: "가".repeat(46),
      },
      chosen: {
        enabled: true,
        fallbackChannel: "sms" as const,
        fallbackContent: "가".repeat(46),
      },
    };
    for (const [messageId, failover] of Object.entries(cases)) {
      await service.recordSend(
        {
          messageId,
          options: {
            type: "ALIMTALK",
            to: "01012345678",
            templateId: "TPL_1",
            variables: {},
            failover,
          },
          timestamp: Date.now(),
        },
        {
          messageId,
          providerId: "solapi",
          providerMessageId: `p-${messageId}`,
          status: "SENT",
          type: "ALIMTALK",
          to: "01012345678",
          warnings: [{ code: "FAILOVER_PARTIAL_PROVIDER", message: "partial" }],
        },
      );
    }

    await service.runOnce();

    const byMessage = new Map(
      sent.map((entry) => [entry.input.messageId, entry]),
    );
    expect(byMessage.get("short:api-fallback")?.fallbackType).toBe("SMS");
    expect(byMessage.get("long:api-fallback")?.fallbackType).toBe("LMS");
    expect(byMessage.get("long:api-fallback")?.input).toMatchObject({
      type: "LMS",
      subject: "Notice",
    });
    expect(byMessage.get("chosen:api-fallback")?.fallbackType).toBe("SMS");
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

describe("DeliveryTrackingService onStatusChange", () => {
  async function recordSent(
    service: DeliveryTrackingService,
    messageId: string,
  ): Promise<void> {
    await service.recordSend(
      {
        messageId,
        options: { type: "SMS", to: "01012345678", text: "hi" },
        timestamp: Date.now(),
      },
      {
        messageId,
        providerId: "mock",
        providerMessageId: `p-${messageId}`,
        status: "SENT",
        type: "SMS",
        to: "01012345678",
      },
    );
  }

  const polling = {
    initialDelayMs: 0,
    intervalMs: 10,
    batchSize: 10,
    concurrency: 2,
  };

  test("reports each stored status change once", async () => {
    const changes: DeliveryStatusChange[] = [];
    const service = new DeliveryTrackingService({
      providers: [createMockProvider({ id: "mock", status: "DELIVERED" })],
      store: new InMemoryDeliveryTrackingStore(),
      polling,
      onStatusChange: (change) => {
        changes.push(change);
      },
    });
    await recordSent(service, "m1");

    await service.runOnce();
    await service.runOnce();

    expect(changes).toHaveLength(1);
    expect(changes[0]?.previousStatus).toBe("SENT");
    expect(changes[0]?.record).toMatchObject({
      messageId: "m1",
      status: "DELIVERED",
    });
  });

  test("does not report a poll that keeps the status", async () => {
    const changes: DeliveryStatusChange[] = [];
    const service = new DeliveryTrackingService({
      providers: [createMockProvider({ id: "mock", status: "SENT" })],
      store: new InMemoryDeliveryTrackingStore(),
      polling,
      onStatusChange: (change) => {
        changes.push(change);
      },
    });
    await recordSent(service, "m1");

    await service.runOnce();

    expect(changes).toHaveLength(0);
  });

  test("keeps polling when the callback throws and reports the error", async () => {
    const reported: Array<{ error: unknown; messageId: string }> = [];
    const service = new DeliveryTrackingService({
      providers: [createMockProvider({ id: "mock", status: "DELIVERED" })],
      store: new InMemoryDeliveryTrackingStore(),
      polling,
      onStatusChange: ({ record }) => {
        if (record.messageId === "m1") throw new Error("webhook down");
      },
      onStatusChangeError: (error, change) => {
        reported.push({ error, messageId: change.record.messageId });
      },
    });
    await recordSent(service, "m1");
    await recordSent(service, "m2");

    await service.runOnce();

    expect((await service.getRecord("m1"))?.status).toBe("DELIVERED");
    expect((await service.getRecord("m2"))?.status).toBe("DELIVERED");
    expect(reported).toHaveLength(1);
    expect(reported[0]?.messageId).toBe("m1");
    expect(String(reported[0]?.error)).toContain("webhook down");
  });

  test("falls back to console.error, and survives a throwing console", async () => {
    const logged: unknown[][] = [];
    const service = new DeliveryTrackingService({
      providers: [createMockProvider({ id: "mock", status: "DELIVERED" })],
      store: new InMemoryDeliveryTrackingStore(),
      polling,
      onStatusChange: () => {
        throw new Error("webhook down");
      },
      onStatusChangeError: () => {
        throw new Error("reporter down");
      },
    });
    await recordSent(service, "m1");
    await recordSent(service, "m2");

    const consoleError = spyOn(console, "error").mockImplementation(
      (...args: unknown[]) => {
        logged.push(args);
        throw new Error("log shim down");
      },
    );
    try {
      await service.runOnce();
    } finally {
      consoleError.mockRestore();
    }

    // Both records are stored even though every reporter threw.
    expect((await service.getRecord("m1"))?.status).toBe("DELIVERED");
    expect((await service.getRecord("m2"))?.status).toBe("DELIVERED");
    const messages = logged.map((args) => String(args[0]));
    expect(messages.some((m) => m.includes("onStatusChangeError threw"))).toBe(
      true,
    );
    expect(messages.some((m) => m.includes("onStatusChange threw"))).toBe(true);
  });

  test("lets the callback poll again without deadlocking", async () => {
    let service: DeliveryTrackingService | undefined;
    let nested = 0;
    service = new DeliveryTrackingService({
      providers: [createMockProvider({ id: "mock", status: "DELIVERED" })],
      store: new InMemoryDeliveryTrackingStore(),
      polling,
      onStatusChange: async () => {
        nested += 1;
        await service?.runOnce();
      },
    });
    await recordSent(service, "m1");

    const finished = await Promise.race([
      service.runOnce().then(() => true),
      new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 1000)),
    ]);

    expect(finished).toBe(true);
    expect(nested).toBe(1);
  });

  test("lets the callback poll again after other awaits without deadlocking", async () => {
    let service: DeliveryTrackingService | undefined;
    let nested = 0;
    service = new DeliveryTrackingService({
      providers: [createMockProvider({ id: "mock", status: "DELIVERED" })],
      store: new InMemoryDeliveryTrackingStore(),
      polling,
      onStatusChange: async () => {
        nested += 1;
        await new Promise((resolve) => setTimeout(resolve, 1));
        await Promise.resolve();
        await service?.runOnce();
      },
    });
    await recordSent(service, "m1");

    const finished = await Promise.race([
      service.runOnce().then(() => true),
      new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 1000)),
    ]);

    expect(finished).toBe(true);
    expect(nested).toBe(1);
  });

  test("reports the record as stored, without fields the store dropped", async () => {
    const store = new InMemoryDeliveryTrackingStore();
    // Like a SQL store with storeRaw off: raw provider payloads are not kept.
    const withoutRaw = Object.assign(Object.create(store), {
      patch: (messageId: string, patch: Record<string, unknown>) => {
        const { raw: _raw, ...kept } = patch;
        return store.patch(messageId, kept);
      },
    }) as InMemoryDeliveryTrackingStore;
    const changes: DeliveryStatusChange[] = [];
    const service = new DeliveryTrackingService({
      providers: [
        createMockProvider({
          id: "mock",
          status: "DELIVERED",
          raw: { secret: "provider payload" },
        }),
      ],
      store: withoutRaw,
      polling,
      onStatusChange: (change) => {
        changes.push(change);
      },
    });
    await recordSent(service, "m1");

    await service.runOnce();

    expect(changes).toHaveLength(1);
    expect(changes[0]?.record.status).toBe("DELIVERED");
    expect(changes[0]?.record.raw).toBeUndefined();
  });

  test("a caller that joins a poll also waits for its notifications", async () => {
    const provider = createMockProvider({ id: "mock", status: "DELIVERED" });
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const slow: Provider = {
      ...provider,
      getDeliveryStatus: async (query) => {
        await gate;
        return (await provider.getDeliveryStatus?.(query)) ?? ok(null);
      },
    };
    let notified = false;
    const service = new DeliveryTrackingService({
      providers: [slow],
      store: new InMemoryDeliveryTrackingStore(),
      polling,
      onStatusChange: async () => {
        // Slow enough that a caller not waiting for it would finish first.
        await new Promise((resolve) => setTimeout(resolve, 20));
        notified = true;
      },
    });
    await recordSent(service, "m1");

    const started = service.runOnce();
    await new Promise((resolve) => setTimeout(resolve, 10));
    const joined = service.runOnce().then(() => notified);
    release();

    expect(await joined).toBe(true);
    await started;
  });

  async function failedAlimtalkService(options: {
    store: InMemoryDeliveryTrackingStore;
    changes: DeliveryStatusChange[];
    onFallback: () => void;
    raw?: unknown;
  }): Promise<DeliveryTrackingService> {
    const service = new DeliveryTrackingService({
      providers: [
        createMockProvider({
          id: "iwinv",
          status: "FAILED",
          statusCode: "ERR",
          statusMessage: "카카오 미사용 대상",
          raw: options.raw ?? { payload: "kept out of callbacks" },
        }),
      ],
      store: options.store,
      polling,
      apiFailover: {
        sender: async () => {
          options.onFallback();
          return ok({
            messageId: "fallback-1",
            providerId: "sms-provider",
            status: "SENT",
            type: "SMS",
            to: "01012345678",
          });
        },
      },
      onStatusChange: (change) => {
        options.changes.push(change);
      },
    });
    await service.recordSend(
      {
        messageId: "m-at",
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
        messageId: "m-at",
        providerId: "iwinv",
        providerMessageId: "p-at",
        status: "SENT",
        type: "ALIMTALK",
        to: "01012345678",
        warnings: [{ code: "FAILOVER_PARTIAL_PROVIDER", message: "partial" }],
      },
    );
    return service;
  }

  test("reports the record with the failover the poll already attempted", async () => {
    const changes: DeliveryStatusChange[] = [];
    const service = await failedAlimtalkService({
      store: new InMemoryDeliveryTrackingStore(),
      changes,
      onFallback: () => {},
    });

    await service.runOnce();

    expect(changes).toHaveLength(1);
    const apiAttempt = getFailoverMetadata(changes[0]?.record).apiAttempt as
      | Record<string, unknown>
      | undefined;
    expect(apiAttempt?.attempted).toBe(true);
  });

  test("still fails over and reports a change it cannot read back", async () => {
    const store = new InMemoryDeliveryTrackingStore();
    let failReads = false;
    const flaky = Object.assign(Object.create(store), {
      get: async (messageId: string) => {
        if (failReads) throw new Error("store unavailable");
        return store.get(messageId);
      },
    }) as InMemoryDeliveryTrackingStore;
    const changes: DeliveryStatusChange[] = [];
    let fallbacks = 0;
    const service = await failedAlimtalkService({
      store: flaky,
      changes,
      onFallback: () => {
        fallbacks += 1;
      },
    });

    failReads = true;
    const consoleError = spyOn(console, "error").mockImplementation(() => {});
    try {
      await service.runOnce();
    } finally {
      consoleError.mockRestore();
    }

    expect(fallbacks).toBe(1);
    expect(changes).toHaveLength(1);
    expect(changes[0]?.record.status).toBe("FAILED");
    expect(changes[0]?.record.raw).toBeUndefined();
  });

  test("delivers a later poll's change after a slow earlier callback, and waits for it", async () => {
    let status: "PENDING" | "DELIVERED" = "PENDING";
    const base = createMockProvider({ id: "mock", status: "PENDING" });
    const provider: Provider = {
      ...base,
      getDeliveryStatus: async (query) =>
        ok({
          providerId: "mock",
          providerMessageId: query.providerMessageId,
          status,
          statusCode: "OK",
        }),
    };
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const delivered: string[] = [];
    const service = new DeliveryTrackingService({
      providers: [provider],
      store: new InMemoryDeliveryTrackingStore(),
      polling: { ...polling, backoffMs: [0] },
      onStatusChange: async ({ record }) => {
        if (record.status === "PENDING") await gate;
        delivered.push(record.status);
      },
    });
    await recordSent(service, "m1");

    const first = service.runOnce();
    await new Promise((resolve) => setTimeout(resolve, 10));
    status = "DELIVERED";
    // Not called from a callback, so it waits for its own change, which is
    // delivered after the slow callback.
    let secondDone = false;
    const second = service.runOnce().then(() => {
      secondDone = true;
    });
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(secondDone).toBe(false);
    release();
    await Promise.all([first, second]);

    expect(delivered).toEqual(["PENDING", "DELIVERED"]);
  });

  test("gives callbacks a copy they can change without touching the store", async () => {
    const changes: DeliveryStatusChange[] = [];
    const service = await failedAlimtalkService({
      store: new InMemoryDeliveryTrackingStore(),
      changes,
      onFallback: () => {},
    });

    await service.runOnce();
    const failover = getFailoverMetadata(changes[0]?.record);
    (failover.apiAttempt as Record<string, unknown>).attempted = false;

    const stored = await service.getRecord("m-at");
    const apiAttempt = getFailoverMetadata(stored).apiAttempt as
      | Record<string, unknown>
      | undefined;
    expect(apiAttempt?.attempted).toBe(true);
  });

  test("reports each change as its own poll stored it", async () => {
    let status: "PENDING" | "SENT" | "DELIVERED" = "PENDING";
    const base = createMockProvider({ id: "mock", status: "PENDING" });
    const provider: Provider = {
      ...base,
      getDeliveryStatus: async (query) =>
        ok({
          providerId: "mock",
          providerMessageId: query.providerMessageId,
          status,
          statusCode: "OK",
        }),
    };
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const reported: string[] = [];
    const service = new DeliveryTrackingService({
      providers: [provider],
      store: new InMemoryDeliveryTrackingStore(),
      polling: { ...polling, backoffMs: [0] },
      onStatusChange: async ({ record, previousStatus }) => {
        if (reported.length === 0) await gate;
        reported.push(`${previousStatus}->${record.status}`);
      },
    });
    await recordSent(service, "m1");

    // Each later poll finishes while the first callback waits, and resolves
    // only after its own change is reported.
    const pause = () => new Promise((resolve) => setTimeout(resolve, 10));
    const first = service.runOnce();
    await pause();
    status = "SENT";
    const second = service.runOnce();
    await pause();
    status = "DELIVERED";
    const third = service.runOnce();
    await pause();
    release();
    await Promise.all([first, second, third]);

    expect(reported).toEqual([
      "SENT->PENDING",
      "PENDING->SENT",
      "SENT->DELIVERED",
    ]);
  });

  test("reads each snapshot before another poll can change the record", async () => {
    let status: "PENDING" | "DELIVERED" = "PENDING";
    const base = createMockProvider({ id: "mock", status: "PENDING" });
    const provider: Provider = {
      ...base,
      getDeliveryStatus: async (query) =>
        ok({
          providerId: "mock",
          providerMessageId: query.providerMessageId,
          status,
          statusCode: "OK",
        }),
    };
    const store = new InMemoryDeliveryTrackingStore();
    const reported: string[] = [];
    const service = new DeliveryTrackingService({
      providers: [provider],
      store,
      polling: { ...polling, backoffMs: [0] },
      onStatusChange: ({ record, previousStatus }) => {
        reported.push(`${previousStatus}->${record.status}`);
      },
    });
    await recordSent(service, "m1");

    // Hold the first poll's snapshot read until a second poll has had its
    // chance to run.
    let readStarted: () => void = () => {};
    const reading = new Promise<void>((resolve) => {
      readStarted = resolve;
    });
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const get = store.get.bind(store);
    let held = false;
    store.get = async (messageId) => {
      if (!held) {
        held = true;
        readStarted();
        await gate;
      }
      return get(messageId);
    };

    const first = service.runOnce();
    await reading;
    status = "DELIVERED";
    // Joins the first poll instead of polling while its snapshot is pending.
    const second = service.runOnce();
    await new Promise((resolve) => setTimeout(resolve, 10));
    release();
    await Promise.all([first, second]);
    await service.runOnce();

    expect(reported).toEqual(["SENT->PENDING", "PENDING->DELIVERED"]);
  });

  test("gives callbacks their own raw data even when it cannot be cloned", async () => {
    const changes: DeliveryStatusChange[] = [];
    const service = await failedAlimtalkService({
      store: new InMemoryDeliveryTrackingStore(),
      changes,
      onFallback: () => {},
      raw: { parse: () => "not cloneable", nested: { value: 1 } },
    });

    await service.runOnce();
    const raw = changes[0]?.record.raw as { nested: { value: number } };
    // Copied through JSON, which leaves the function out.
    expect(raw).toEqual({ nested: { value: 1 } });
    raw.nested.value = 2;

    const stored = await service.getRecord("m-at");
    const storedRaw = stored?.raw as { nested: { value: number } };
    expect(storedRaw.nested.value).toBe(1);
  });

  test("reports a change and keeps polling when a store returns an uncloneable field", async () => {
    let status: "PENDING" | "DELIVERED" = "PENDING";
    const base = createMockProvider({ id: "mock", status: "PENDING" });
    const provider: Provider = {
      ...base,
      getDeliveryStatus: async (query) =>
        ok({
          providerId: "mock",
          providerMessageId: query.providerMessageId,
          status,
          statusCode: "OK",
        }),
    };
    // A custom store that hands back a field structuredClone rejects.
    const store = new InMemoryDeliveryTrackingStore();
    const odd = (record: TrackingRecord): TrackingRecord => ({
      ...record,
      providerStatusMessage: (() => "odd") as unknown as string,
    });
    const get = store.get.bind(store);
    store.get = async (messageId) => {
      const record = await get(messageId);
      return record && odd(record);
    };
    const listDue = store.listDue.bind(store);
    store.listDue = async (now, limit) => (await listDue(now, limit)).map(odd);
    const reported: string[] = [];
    const service = new DeliveryTrackingService({
      providers: [provider],
      store,
      polling: { ...polling, backoffMs: [0] },
      onStatusChange: ({ record, previousStatus }) => {
        reported.push(`${previousStatus}->${record.status}`);
      },
    });
    await recordSent(service, "m1");

    await service.runOnce();
    status = "DELIVERED";
    await service.runOnce();

    expect(reported).toEqual(["SENT->PENDING", "PENDING->DELIVERED"]);
  });

  test("copies metadata deeply even when raw data cannot be cloned", async () => {
    const changes: DeliveryStatusChange[] = [];
    const service = await failedAlimtalkService({
      store: new InMemoryDeliveryTrackingStore(),
      changes,
      onFallback: () => {},
      raw: { parse: () => "not cloneable" },
    });

    await service.runOnce();
    const failover = getFailoverMetadata(changes[0]?.record);
    (failover.apiAttempt as Record<string, unknown>).attempted = false;

    const stored = await service.getRecord("m-at");
    const apiAttempt = getFailoverMetadata(stored).apiAttempt as
      | Record<string, unknown>
      | undefined;
    expect(apiAttempt?.attempted).toBe(true);
  });
});
