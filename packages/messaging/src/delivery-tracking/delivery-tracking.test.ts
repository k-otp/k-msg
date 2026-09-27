import { describe, expect, spyOn, test } from "bun:test";
import {
  type DeliveryStatusQuery,
  type DeliveryStatusResult,
  fail,
  KMsgError,
  KMsgErrorCode,
  logger,
  ok,
  type Provider,
  type ProviderRequestContext,
  type SendInput,
} from "@k-msg/core";
import type { SQL } from "bun";
import { KMsg } from "../k-msg";
import { InMemoryMessageRepository } from "../test-utils/in-memory-message-repository";
import { createDeliveryTrackingHooks } from "./hooks";
import { type DeliveryStatusChange, DeliveryTrackingService } from "./service";
import type { DeliveryTrackingStore } from "./store.interface";
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

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitFor(condition: () => boolean, timeoutMs = 2000) {
  const deadline = Date.now() + timeoutMs;
  while (!condition()) {
    if (Date.now() > deadline) {
      throw new Error(`Condition not met within ${timeoutMs}ms`);
    }
    await wait(5);
  }
}

// Resolves when the signal aborts, or after `fallbackMs` for a query that was
// given no signal, so a test that expects cancellation fails instead of
// hanging where queries cannot be cancelled.
function untilAborted(signal: AbortSignal | undefined, fallbackMs: number) {
  return new Promise<void>((resolve) => {
    if (signal?.aborted) return resolve();
    const timer = setTimeout(resolve, fallbackMs);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}

function delivered(
  query: DeliveryStatusQuery,
  providerId = "mock",
): DeliveryStatusResult {
  return {
    providerId,
    providerMessageId: query.providerMessageId,
    status: "DELIVERED",
    statusCode: "OK",
  };
}

function cancelled(): KMsgError {
  return new KMsgError(KMsgErrorCode.REQUEST_ABORTED, "status query cancelled");
}

// A provider whose status queries the test answers through `query`.
function createQueryProvider(
  query: (
    query: DeliveryStatusQuery,
    context?: ProviderRequestContext,
  ) => Promise<DeliveryStatusResult | KMsgError>,
  id = "mock",
): Provider {
  return {
    id,
    name: id,
    supportedTypes: ["SMS"],
    healthCheck: async () => ({ healthy: true, issues: [] }),
    send: async (options) =>
      ok({
        messageId: options.messageId ?? "msg",
        providerId: id,
        status: "SENT",
        type: options.type,
        to: options.to,
      }),
    getDeliveryStatus: async (statusQuery, context) => {
      const answer = await query(statusQuery, context);
      return answer instanceof KMsgError ? fail(answer) : ok(answer);
    },
  };
}

function failedForNonKakaoUser(
  query: DeliveryStatusQuery,
): DeliveryStatusResult {
  return {
    providerId: "solapi",
    providerMessageId: query.providerMessageId,
    status: "FAILED",
    statusCode: "3104",
    statusMessage: "카카오톡 미사용자",
  };
}

async function recordAlimTalkWithFallback(
  service: DeliveryTrackingService,
  messageId: string,
): Promise<void> {
  await service.recordSend(
    {
      messageId,
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

async function recordSms(
  service: DeliveryTrackingService,
  messageId: string,
  requestedAt = Date.now(),
): Promise<void> {
  await service.recordSend(
    {
      messageId,
      options: { type: "SMS", to: "01012345678", text: "hi" },
      timestamp: requestedAt,
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

  test("runOnce stores the other updates when one fails, then reports it", async () => {
    class FailingStore extends InMemoryDeliveryTrackingStore {
      override async patch(
        messageId: string,
        patch: Parameters<InMemoryDeliveryTrackingStore["patch"]>[1],
      ): Promise<void> {
        if (messageId === "m2") {
          throw new Error("value too long for type character varying(64)");
        }
        await super.patch(messageId, patch);
      }
    }

    const provider = createMockProvider({ id: "mock", status: "DELIVERED" });
    const store = new FailingStore();
    const service = new DeliveryTrackingService({
      providers: [provider],
      store,
      polling: { initialDelayMs: 0, batchSize: 10, concurrency: 1 },
    });

    for (const messageId of ["m1", "m2", "m3"]) {
      await service.recordSend(
        {
          messageId,
          options: { type: "SMS", to: "01012345678", text: "hi" },
          timestamp: Date.now() - 1_000,
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

    const failure = await service.runOnce().then(
      () => undefined,
      (error: unknown) => error,
    );

    expect(failure).toBeInstanceOf(AggregateError);
    expect((failure as AggregateError).errors).toHaveLength(1);
    expect((failure as AggregateError).message).toContain("m2");
    expect((failure as AggregateError).message).toContain(
      "value too long for type character varying(64)",
    );
    expect((await service.getRecord("m1"))?.status).toBe("DELIVERED");
    expect((await service.getRecord("m2"))?.status).toBe("SENT");
    expect((await service.getRecord("m3"))?.status).toBe("DELIVERED");
  });

  test("runOnce moves a record whose update keeps failing along its backoff", async () => {
    // Rejects any update that stores a provider message, as a VARCHAR(64)
    // column does a longer one.
    class RejectingStore extends InMemoryDeliveryTrackingStore {
      override async patch(
        messageId: string,
        patch: Parameters<InMemoryDeliveryTrackingStore["patch"]>[1],
      ): Promise<void> {
        if (patch.providerStatusMessage !== undefined) {
          throw new Error("value too long for type character varying(64)");
        }
        await super.patch(messageId, patch);
      }
    }

    const provider: Provider = {
      ...createMockProvider({ id: "mock", status: "DELIVERED" }),
      getDeliveryStatus: async (query: DeliveryStatusQuery) =>
        ok({
          providerId: "mock",
          providerMessageId: query.providerMessageId,
          status: "DELIVERED",
          ...(query.providerMessageId === "p-bad"
            ? { statusMessage: "x".repeat(100) }
            : {}),
        }),
    };
    const store = new RejectingStore();
    const service = new DeliveryTrackingService({
      providers: [provider],
      store,
      polling: {
        initialDelayMs: 0,
        batchSize: 1,
        concurrency: 1,
        backoffMs: [60_000],
      },
    });

    // The bad record is older, so it comes first in the due list.
    for (const [messageId, age] of [
      ["bad", 2_000],
      ["good", 1_000],
    ] as const) {
      await service.recordSend(
        {
          messageId,
          options: { type: "SMS", to: "01012345678", text: "hi" },
          timestamp: Date.now() - age,
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

    await expect(service.runOnce()).rejects.toBeInstanceOf(AggregateError);
    const bad = await service.getRecord("bad");
    expect(bad?.status).toBe("SENT");
    expect(bad?.attemptCount).toBe(1);
    expect(bad?.nextCheckAt.getTime()).toBeGreaterThan(Date.now() + 50_000);

    // The next poll reaches the other record instead of the same one again.
    await service.runOnce();
    expect((await service.getRecord("good"))?.status).toBe("DELIVERED");
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
  test("leases MySQL rows inside a transaction", async () => {
    const statements: string[] = [];
    let transactions = 0;
    const runner = (where: string) => ({
      unsafe: async (statement: string) => {
        statements.push(`${where}: ${statement}`);
        return [];
      },
    });
    const sql = {
      options: { adapter: "mysql" },
      ...runner("pool"),
      begin: async (fn: (tx: unknown) => Promise<unknown>) => {
        transactions += 1;
        return await fn(runner("transaction"));
      },
    } as unknown as SQL;
    const store = new BunSqlDeliveryTrackingStore({
      sql,
      initializeSchema: false,
    });

    await store.leaseDue(new Date(), 10, new Date(Date.now() + 60_000));

    // The locking read holds its rows only inside a transaction.
    expect(transactions).toBe(1);
    expect(statements).toEqual([
      expect.stringMatching(/^transaction: SELECT .* FOR UPDATE$/),
    ]);
  });

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

// Runs in a separate Bun process with process.getBuiltinModule removed
// before the service loads, as in Workers without nodejs_compat.
const WITHOUT_ASYNC_CONTEXT = `
delete process.getBuiltinModule;
const { DeliveryTrackingService } = await import(process.env.SERVICE_URL);
const { InMemoryDeliveryTrackingStore } = await import(process.env.STORE_URL);
const { ok } = await import("@k-msg/core");

const provider = (statusFor) => ({
  id: "mock",
  name: "mock",
  supportedTypes: ["SMS"],
  healthCheck: async () => ({ healthy: true, issues: [] }),
  send: async () => ok({ messageId: "msg", providerId: "mock", status: "SENT", type: "SMS", to: "01012345678" }),
  getDeliveryStatus: async (query) =>
    ok({ providerId: "mock", providerMessageId: query.providerMessageId, status: statusFor(query.providerMessageId), statusCode: "OK" }),
});
const recordSent = (service, messageId) =>
  service.recordSend(
    { messageId, options: { type: "SMS", to: "01012345678", text: "hi" }, timestamp: Date.now() },
    { messageId, providerId: "mock", providerMessageId: "p-" + messageId, status: "SENT", type: "SMS", to: "01012345678" },
  );
const polling = { initialDelayMs: 0, intervalMs: 10, batchSize: 10, concurrency: 2, backoffMs: [0] };
const within = (promise, ms) =>
  Promise.race([promise.then(() => true), new Promise((resolve) => setTimeout(() => resolve(false), ms))]);
const results = {};

{
  let service;
  service = new DeliveryTrackingService({
    providers: [provider(() => "DELIVERED")],
    store: new InMemoryDeliveryTrackingStore(),
    polling,
    onStatusChange: async () => {
      await new Promise((resolve) => setTimeout(resolve, 1));
      await service.runOnce();
    },
  });
  await recordSent(service, "m1");
  results.callbackPollsAgain = await within(service.runOnce(), 1000);
}

{
  const statuses = { "p-m1": "DELIVERED", "p-m2": "SENT" };
  let release = () => {};
  const gate = new Promise((resolve) => { release = resolve; });
  let slowStarted = () => {};
  const started = new Promise((resolve) => { slowStarted = resolve; });
  const delivered = [];
  const service = new DeliveryTrackingService({
    providers: [provider((id) => statuses[id])],
    store: new InMemoryDeliveryTrackingStore(),
    polling,
    onStatusChange: async ({ record }) => {
      if (record.messageId === "m1") {
        slowStarted();
        await gate;
      }
      delivered.push(record.messageId);
    },
  });
  await recordSent(service, "m1");
  await recordSent(service, "m2");
  const first = service.runOnce();
  await started;
  statuses["p-m2"] = "DELIVERED";
  const finished = await within(service.runOnce(), 1000);
  results.otherCallerGetsItsChange = finished && delivered.includes("m2");
  release();
  await first;
}

{
  let first;
  let second;
  let arrived = 0;
  let bothArrived = () => {};
  const together = new Promise((resolve) => { bothArrived = resolve; });
  const arrive = async () => {
    arrived += 1;
    if (arrived === 2) bothArrived();
    await together;
  };
  first = new DeliveryTrackingService({
    providers: [provider(() => "DELIVERED")],
    store: new InMemoryDeliveryTrackingStore(),
    polling,
    onStatusChange: async () => { await arrive(); await second.runOnce(); },
  });
  second = new DeliveryTrackingService({
    providers: [provider(() => "DELIVERED")],
    store: new InMemoryDeliveryTrackingStore(),
    polling,
    onStatusChange: async () => { await arrive(); await first.runOnce(); },
  });
  await recordSent(first, "a1");
  await recordSent(second, "b1");
  results.servicesPollEachOther = await within(Promise.all([first.runOnce(), second.runOnce()]), 1000);
}

console.log(JSON.stringify(results));
`;

test("without AsyncLocalStorage, every caller waits for its changes and none deadlocks", async () => {
  const child = Bun.spawn([process.execPath, "-e", WITHOUT_ASYNC_CONTEXT], {
    cwd: new URL("../..", import.meta.url).pathname,
    env: {
      ...process.env,
      SERVICE_URL: new URL("./service.ts", import.meta.url).href,
      STORE_URL: new URL("./stores/memory.store.ts", import.meta.url).href,
    },
    stdout: "pipe",
    stderr: "pipe",
  });
  const [output, errors, exitCode] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ]);

  expect({ exitCode, errors }).toEqual({ exitCode: 0, errors: "" });
  expect(JSON.parse(output.trim().split("\n").at(-1) ?? "{}")).toEqual({
    callbackPollsAgain: true,
    otherCallerGetsItsChange: true,
    servicesPollEachOther: true,
  });
}, 15_000);

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

  test("lets callbacks of two services poll each other without deadlocking", async () => {
    let first: DeliveryTrackingService | undefined;
    let second: DeliveryTrackingService | undefined;
    const calls: string[] = [];
    first = new DeliveryTrackingService({
      providers: [createMockProvider({ id: "mock", status: "DELIVERED" })],
      store: new InMemoryDeliveryTrackingStore(),
      polling,
      onStatusChange: async () => {
        calls.push("first");
        await second?.runOnce();
      },
    });
    second = new DeliveryTrackingService({
      providers: [createMockProvider({ id: "mock", status: "DELIVERED" })],
      store: new InMemoryDeliveryTrackingStore(),
      polling,
      onStatusChange: async () => {
        calls.push("second");
        await first?.runOnce();
      },
    });
    await recordSent(first, "a1");
    await recordSent(second, "b1");

    const finished = await Promise.race([
      first.runOnce().then(() => true),
      new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 1000)),
    ]);

    expect(finished).toBe(true);
    expect(calls).toEqual(["first", "second"]);
  });

  test("lets callbacks of two services that run side by side poll each other", async () => {
    let first: DeliveryTrackingService | undefined;
    let second: DeliveryTrackingService | undefined;
    // Both callbacks start before either polls the other, so both services
    // are delivering at once rather than one inside the other.
    let started = 0;
    let bothStarted: () => void = () => {};
    const together = new Promise<void>((resolve) => {
      bothStarted = resolve;
    });
    const arrive = async () => {
      started += 1;
      if (started === 2) bothStarted();
      await together;
    };
    first = new DeliveryTrackingService({
      providers: [createMockProvider({ id: "mock", status: "DELIVERED" })],
      store: new InMemoryDeliveryTrackingStore(),
      polling,
      onStatusChange: async () => {
        await arrive();
        await second?.runOnce();
      },
    });
    second = new DeliveryTrackingService({
      providers: [createMockProvider({ id: "mock", status: "DELIVERED" })],
      store: new InMemoryDeliveryTrackingStore(),
      polling,
      onStatusChange: async () => {
        await arrive();
        await first?.runOnce();
      },
    });
    await recordSent(first, "a1");
    await recordSent(second, "b1");

    const finished = await Promise.race([
      Promise.all([first.runOnce(), second.runOnce()]).then(() => true),
      new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 1000)),
    ]);

    expect(finished).toBe(true);
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

describe("DeliveryTrackingService bounded polls", () => {
  test("forwards the caller's signal and fetch to each status query", async () => {
    const controller = new AbortController();
    const fetchImpl = async () => new Response("{}");
    const seen: Array<{ fetch: unknown; abortedWithCaller?: boolean }> = [];
    const provider = createQueryProvider(async (query, context) => {
      controller.abort();
      seen.push({
        fetch: context?.fetch,
        abortedWithCaller: context?.signal?.aborted,
      });
      return delivered(query);
    });
    const service = new DeliveryTrackingService({
      providers: [provider],
      polling: { initialDelayMs: 0 },
    });
    await recordSms(service, "m1");

    await service.runOnce({ signal: controller.signal, fetch: fetchImpl });

    expect(seen).toEqual([{ fetch: fetchImpl, abortedWithCaller: true }]);
  });

  test("stores what an aborted poll has and leaves the rest due", async () => {
    const controller = new AbortController();
    const queried: string[] = [];
    let cancelledOnce = false;
    const provider = createQueryProvider(async (query, context) => {
      queried.push(query.providerMessageId);
      if (query.providerMessageId === "p-m2" && !cancelledOnce) {
        cancelledOnce = true;
        controller.abort();
        await untilAborted(context?.signal, 200);
        if (context?.signal?.aborted) return cancelled();
      }
      return delivered(query);
    });
    const store = new InMemoryDeliveryTrackingStore();
    const service = new DeliveryTrackingService({
      providers: [provider],
      store,
      polling: { initialDelayMs: 0, concurrency: 1 },
    });
    const now = Date.now();
    await recordSms(service, "m1", now - 3000);
    await recordSms(service, "m2", now - 2000);
    await recordSms(service, "m3", now - 1000);

    await service.runOnce({ signal: controller.signal });

    // m1 was answered; m2's query was cancelled; m3 was never queried.
    expect(queried).toEqual(["p-m1", "p-m2"]);
    expect((await store.get("m1"))?.status).toBe("DELIVERED");
    for (const messageId of ["m2", "m3"]) {
      const record = await store.get(messageId);
      expect(record?.status).toBe("SENT");
      expect(record?.attemptCount).toBe(0);
      expect(record?.lastError).toBeUndefined();
      expect(record?.nextCheckAt.getTime()).toBeLessThanOrEqual(Date.now());
    }

    // The next poll takes them straight away.
    await service.runOnce();
    expect(queried).toEqual(["p-m1", "p-m2", "p-m2", "p-m3"]);
    expect((await store.get("m3"))?.status).toBe("DELIVERED");
  });

  test("does nothing with a signal that has already aborted", async () => {
    const queried: string[] = [];
    const provider = createQueryProvider(async (query) => {
      queried.push(query.providerMessageId);
      return delivered(query);
    });
    const service = new DeliveryTrackingService({
      providers: [provider],
      polling: { initialDelayMs: 0 },
    });
    await recordSms(service, "m1");

    await service.runOnce({ signal: AbortSignal.abort() });

    expect(queried).toEqual([]);
    expect((await service.getRecord("m1"))?.status).toBe("SENT");
  });

  test("returns from a poll it joined when its own signal aborts", async () => {
    let release!: () => void;
    const released = new Promise<void>((resolve) => {
      release = resolve;
    });
    let queries = 0;
    const provider = createQueryProvider(async (query) => {
      queries += 1;
      await released;
      return delivered(query);
    });
    const service = new DeliveryTrackingService({
      providers: [provider],
      polling: { initialDelayMs: 0 },
    });
    await recordSms(service, "m1");

    const first = service.runOnce();
    await waitFor(() => queries === 1);
    const controller = new AbortController();
    const second = service.runOnce({ signal: controller.signal });
    controller.abort();

    const outcome = await Promise.race([
      second.then(() => "returned"),
      wait(100).then(() => "still waiting"),
    ]);
    expect(outcome).toBe("returned");

    release();
    await first;
    expect((await service.getRecord("m1"))?.status).toBe("DELIVERED");
  });
});

describe("DeliveryTrackingService leases", () => {
  test("two services polling one store do not query the same record at once", async () => {
    let release!: () => void;
    const released = new Promise<void>((resolve) => {
      release = resolve;
    });
    const queriedByA: string[] = [];
    const queriedByB: string[] = [];
    const store = new InMemoryDeliveryTrackingStore();
    const a = new DeliveryTrackingService({
      providers: [
        createQueryProvider(async (query) => {
          queriedByA.push(query.providerMessageId);
          await released;
          return delivered(query);
        }),
      ],
      store,
      polling: { initialDelayMs: 0 },
    });
    const b = new DeliveryTrackingService({
      providers: [
        createQueryProvider(async (query) => {
          queriedByB.push(query.providerMessageId);
          return delivered(query);
        }),
      ],
      store,
      polling: { initialDelayMs: 0 },
    });
    await recordSms(a, "m1");

    const pollA = a.runOnce();
    await waitFor(() => queriedByA.length === 1);
    await b.runOnce();
    release();
    await pollA;

    expect(queriedByA).toEqual(["p-m1"]);
    expect(queriedByB).toEqual([]);
    expect((await store.get("m1"))?.status).toBe("DELIVERED");
  });

  test("a poll that outlived its lease leaves a lease another poll took", async () => {
    const store = new InMemoryDeliveryTrackingStore();
    const queried = { a: 0, b: 0, c: 0 };
    let releaseB!: () => void;
    const gateB = new Promise<void>((resolve) => {
      releaseB = resolve;
    });
    // A's lease runs out while its query hangs; B then leases the record.
    const a = new DeliveryTrackingService({
      providers: [
        createQueryProvider(async (_query, context) => {
          queried.a += 1;
          await untilAborted(context?.signal, 2000);
          return cancelled();
        }),
      ],
      store,
      polling: { initialDelayMs: 0, leaseMs: 20 },
    });
    const b = new DeliveryTrackingService({
      providers: [
        createQueryProvider(async (query) => {
          queried.b += 1;
          await gateB;
          return delivered(query);
        }),
      ],
      store,
      polling: { initialDelayMs: 0, leaseMs: 60_000 },
    });
    const c = new DeliveryTrackingService({
      providers: [
        createQueryProvider(async (query) => {
          queried.c += 1;
          return delivered(query);
        }),
      ],
      store,
      polling: { initialDelayMs: 0 },
    });
    await recordSms(a, "m1");

    const stopA = new AbortController();
    const pollA = a.runOnce({ signal: stopA.signal });
    await waitFor(() => queried.a === 1);
    await wait(40);
    const pollB = b.runOnce();
    await waitFor(() => queried.b === 1);

    // A gives back what it did not finish, but the record is B's now.
    stopA.abort();
    await pollA;
    await c.runOnce();
    expect(queried.c).toBe(0);

    releaseB();
    await pollB;
    expect((await store.get("m1"))?.status).toBe("DELIVERED");
  });

  test("a poll that ran past its lease does not overwrite a newer result", async () => {
    const store = new InMemoryDeliveryTrackingStore();
    let releaseA!: () => void;
    const gateA = new Promise<void>((resolve) => {
      releaseA = resolve;
    });
    let queriedByA = 0;
    const sent: string[] = [];
    const reported: string[] = [];
    const apiFailover = {
      sender: async (
        _input: unknown,
        context: { fallbackMessageId: string; fallbackType: "SMS" | "LMS" },
      ) => {
        sent.push(context.fallbackMessageId);
        return ok({
          messageId: context.fallbackMessageId,
          providerId: "sms",
          status: "SENT" as const,
          type: context.fallbackType,
          to: "01012345678",
        });
      },
    };
    // A's query answers FAILED only after its lease ran out and B stored
    // DELIVERED.
    const a = new DeliveryTrackingService({
      providers: [
        createQueryProvider(async (query) => {
          queriedByA += 1;
          await gateA;
          return failedForNonKakaoUser(query);
        }, "solapi"),
      ],
      store,
      polling: { initialDelayMs: 0, leaseMs: 20 },
      apiFailover,
      onStatusChange: ({ record }) => {
        reported.push(`a:${record.status}`);
      },
    });
    const b = new DeliveryTrackingService({
      providers: [
        createQueryProvider(
          async (query) => delivered(query, "solapi"),
          "solapi",
        ),
      ],
      store,
      polling: { initialDelayMs: 0 },
      apiFailover,
    });
    await recordAlimTalkWithFallback(a, "m1");

    const pollA = a.runOnce();
    await waitFor(() => queriedByA === 1);
    await wait(40);
    await b.runOnce();
    expect((await store.get("m1"))?.status).toBe("DELIVERED");

    releaseA();
    await pollA;

    expect((await store.get("m1"))?.status).toBe("DELIVERED");
    expect(sent).toEqual([]);
    expect(reported).toEqual([]);
  });

  test("a poll whose lease ran out before the store returned it queries nothing", async () => {
    const queried: string[] = [];
    // The store returns the records only after the poll's lease ran out.
    class SlowStore extends InMemoryDeliveryTrackingStore {
      slow = true;

      override async leaseDue(
        now: Date,
        limit: number,
        leaseUntil: Date,
      ): Promise<TrackingRecord[]> {
        const due = await super.leaseDue(now, limit, leaseUntil);
        if (this.slow) await wait(leaseUntil.getTime() - Date.now() + 5);
        return due;
      }
    }
    const store = new SlowStore();
    const service = new DeliveryTrackingService({
      providers: [
        createQueryProvider(async (query) => {
          queried.push(query.providerMessageId);
          return delivered(query);
        }),
      ],
      store,
      polling: { initialDelayMs: 0, leaseMs: 20 },
    });
    await recordSms(service, "m1");

    // Another poll may have leased the records by then.
    await expect(service.runOnce()).rejects.toThrow("lease ran out");
    expect(queried).toEqual([]);

    // They are due again at once.
    store.slow = false;
    await service.runOnce();
    expect(queried).toEqual(["p-m1"]);
    expect((await store.get("m1"))?.status).toBe("DELIVERED");
  });

  test("a failed status query ends the poll only after the others settle", async () => {
    const store = new InMemoryDeliveryTrackingStore();
    let releaseM2!: () => void;
    const gateM2 = new Promise<void>((resolve) => {
      releaseM2 = resolve;
    });
    const queried: string[] = [];
    const a = new DeliveryTrackingService({
      providers: [
        createQueryProvider(async (query) => {
          queried.push(`a:${query.providerMessageId}`);
          if (query.providerMessageId === "p-m1") {
            throw new Error("provider exploded");
          }
          await gateM2;
          return delivered(query);
        }),
      ],
      store,
      polling: { initialDelayMs: 0, concurrency: 2 },
    });
    const c = new DeliveryTrackingService({
      providers: [
        createQueryProvider(async (query) => {
          queried.push(`c:${query.providerMessageId}`);
          return delivered(query);
        }),
      ],
      store,
      polling: { initialDelayMs: 0 },
    });
    const now = Date.now();
    await recordSms(a, "m1", now - 2000);
    await recordSms(a, "m2", now - 1000);

    const pollA = a.runOnce();
    const failed = pollA.then(
      () => undefined,
      (error: unknown) => error,
    );
    await waitFor(() => queried.includes("a:p-m2"));
    // m2's query is still running, so A still holds its lease.
    await c.runOnce();
    expect(queried).not.toContain("c:p-m2");

    releaseM2();
    expect(await failed).toEqual(new Error("provider exploded"));
  });

  test("leaseMs: 0 turns leasing off", async () => {
    let release!: () => void;
    const released = new Promise<void>((resolve) => {
      release = resolve;
    });
    const queried: string[] = [];
    const store = new InMemoryDeliveryTrackingStore();
    const provider = createQueryProvider(async (query) => {
      queried.push(query.providerMessageId);
      if (queried.length === 1) await released;
      return delivered(query);
    });
    const polling = { initialDelayMs: 0, leaseMs: 0 };
    const a = new DeliveryTrackingService({
      providers: [provider],
      store,
      polling,
    });
    const b = new DeliveryTrackingService({
      providers: [provider],
      store,
      polling,
    });
    await recordSms(a, "m1");

    const pollA = a.runOnce();
    await waitFor(() => queried.length === 1);
    await b.runOnce();
    release();
    await pollA;

    expect(queried).toEqual(["p-m1", "p-m1"]);
  });
});

describe("DeliveryTrackingService shutdown", () => {
  test("close() cancels a fallback send in progress through the sender's signal", async () => {
    let sending = false;
    const service = new DeliveryTrackingService({
      providers: [
        createQueryProvider(
          async (query) => failedForNonKakaoUser(query),
          "solapi",
        ),
      ],
      polling: { initialDelayMs: 0 },
      apiFailover: {
        sender: async (_input, context) => {
          sending = true;
          await untilAborted(context.signal, 1000);
          return fail(cancelled());
        },
      },
    });
    await recordAlimTalkWithFallback(service, "m1");

    const poll = service.runOnce();
    await waitFor(() => sending);
    const outcome = await Promise.race([
      service.close().then(() => "closed"),
      wait(200).then(() => "still waiting"),
    ]);
    expect(outcome).toBe("closed");
    await poll;
  });

  test("a stopped poll leaves a failure that needs a fallback to the next poll", async () => {
    const stop = new AbortController();
    const sent: string[] = [];
    const store = new InMemoryDeliveryTrackingStore();
    const service = new DeliveryTrackingService({
      providers: [
        createQueryProvider(async (query) => {
          // The poll is stopped while this answer comes in.
          stop.abort();
          return failedForNonKakaoUser(query);
        }, "solapi"),
      ],
      store,
      polling: { initialDelayMs: 0 },
      apiFailover: {
        sender: async (_input, context) => {
          sent.push(context.originalMessageId);
          return ok({
            messageId: context.fallbackMessageId,
            providerId: "sms",
            status: "SENT",
            type: context.fallbackType,
            to: "01012345678",
          });
        },
      },
    });
    await recordAlimTalkWithFallback(service, "m1");

    await service.runOnce({ signal: stop.signal });

    // Storing FAILED without sending would lose the fallback: a failed
    // record is not polled again.
    expect(sent).toEqual([]);
    const held = await store.get("m1");
    expect(held?.status).toBe("SENT");
    expect(held?.nextCheckAt.getTime()).toBeLessThanOrEqual(Date.now());

    await service.runOnce();
    expect(sent).toEqual(["m1"]);
    expect((await store.get("m1"))?.status).toBe("FAILED");
  });

  test("a poll stopped as it starts a fallback puts the record back for the next poll", async () => {
    const stop = new AbortController();
    const sent: string[] = [];
    const reported: string[] = [];
    // The poll is stopped after it stored the failure, while it marks the
    // fallback as being attempted.
    class StoppingStore extends InMemoryDeliveryTrackingStore {
      override async patch(
        messageId: string,
        patch: Partial<TrackingRecord>,
      ): Promise<void> {
        await super.patch(messageId, patch);
        if (getFailoverMetadata(patch).apiAttempt) stop.abort();
      }
    }
    const store = new StoppingStore();
    const service = new DeliveryTrackingService({
      providers: [
        createQueryProvider(
          async (query) => failedForNonKakaoUser(query),
          "solapi",
        ),
      ],
      store,
      polling: { initialDelayMs: 0 },
      apiFailover: {
        sender: async (_input, context) => {
          sent.push(context.originalMessageId);
          return ok({
            messageId: context.fallbackMessageId,
            providerId: "sms",
            status: "SENT",
            type: context.fallbackType,
            to: "01012345678",
          });
        },
      },
      onStatusChange: ({ record }) => {
        reported.push(record.status);
      },
    });
    await recordAlimTalkWithFallback(service, "m1");
    const found = await store.get("m1");
    if (!found) throw new Error("m1 was not recorded");

    await service.runOnce({ signal: stop.signal });

    expect(sent).toEqual([]);
    expect(reported).toEqual([]);
    const putBack = await store.get("m1");
    expect(putBack).toEqual({ ...found, nextCheckAt: expect.any(Date) });
    expect(putBack?.nextCheckAt.getTime()).toBeLessThanOrEqual(Date.now());

    await service.runOnce();
    expect(sent).toEqual(["m1"]);
    expect(reported).toEqual(["FAILED"]);
  });

  test("close cancels a poll in progress and waits for it before closing the store", async () => {
    const events: string[] = [];
    class ObservedStore extends InMemoryDeliveryTrackingStore {
      override async patch(
        messageId: string,
        patch: Partial<TrackingRecord>,
      ): Promise<void> {
        events.push(`patch ${messageId}`);
        await super.patch(messageId, patch);
      }

      async close(): Promise<void> {
        events.push("close");
      }
    }
    const store = new ObservedStore();
    let queries = 0;
    const provider = createQueryProvider(async (query, context) => {
      queries += 1;
      await untilAborted(context?.signal, 200);
      return context?.signal?.aborted ? cancelled() : delivered(query);
    });
    const service = new DeliveryTrackingService({
      providers: [provider],
      store,
      polling: { initialDelayMs: 0 },
    });
    await recordSms(service, "m1");

    const poll = service.runOnce();
    await waitFor(() => queries === 1);
    await service.close();
    await poll;

    // Nothing wrote to the store after it was closed.
    expect(events.at(-1)).toBe("close");
    const record = await store.get("m1");
    expect(record?.status).toBe("SENT");
    expect(record?.nextCheckAt.getTime()).toBeLessThanOrEqual(Date.now());

    // A closed service does not poll again.
    await service.runOnce();
    expect(queries).toBe(1);
  });

  test("close waits for a poll still setting up the store", async () => {
    const events: string[] = [];
    let finishInit!: () => void;
    const initialized = new Promise<void>((resolve) => {
      finishInit = resolve;
    });
    const store: DeliveryTrackingStore = {
      init: async () => {
        events.push("init");
        await initialized;
        events.push("initialized");
      },
      upsert: async () => {},
      get: async () => undefined,
      listDue: async () => {
        events.push("listDue");
        return [];
      },
      patch: async () => {},
      close: async () => {
        events.push("close");
      },
    };
    const service = new DeliveryTrackingService({
      providers: [createMockProvider({ id: "mock", status: "DELIVERED" })],
      store,
    });

    const poll = service.runOnce();
    await waitFor(() => events.includes("init"));
    const closed = service.close();
    await wait(20);
    expect(events).toEqual(["init"]);

    finishInit();
    await closed;
    await poll;
    expect(events).toEqual(["init", "initialized", "close"]);
  });

  test("a closed service leaves its store alone", async () => {
    const calls: string[] = [];
    const store: DeliveryTrackingStore = {
      init: async () => {
        calls.push("init");
      },
      upsert: async () => {},
      get: async () => undefined,
      listDue: async () => {
        calls.push("listDue");
        return [];
      },
      patch: async () => {},
      close: async () => {
        calls.push("close");
      },
    };
    const service = new DeliveryTrackingService({
      providers: [createMockProvider({ id: "mock", status: "DELIVERED" })],
      store,
    });

    await service.close();
    await service.runOnce();
    service.start();
    service.stop();

    expect(calls).toEqual(["close"]);
  });

  test("logs a failed poll that the timer started and keeps polling", async () => {
    let polls = 0;
    const store: DeliveryTrackingStore = {
      init: async () => {},
      upsert: async () => {},
      get: async () => undefined,
      listDue: async () => {
        polls += 1;
        throw new Error("tracking store offline");
      },
      patch: async () => {},
    };
    const service = new DeliveryTrackingService({
      providers: [createMockProvider({ id: "mock", status: "DELIVERED" })],
      store,
      polling: { intervalMs: 5 },
    });
    const loggerError = spyOn(logger, "error").mockImplementation(() => {});

    try {
      service.start();
      await waitFor(() => polls >= 2);
      expect(loggerError).toHaveBeenCalled();
      expect(loggerError.mock.calls[0]?.[0]).toBe(
        "Delivery tracking poll failed",
      );
      expect(loggerError.mock.calls[0]?.[2]?.message).toBe(
        "tracking store offline",
      );
    } finally {
      service.stop();
      loggerError.mockRestore();
    }
  });

  test("logs a timer poll's failure once, however many ticks it outlasts", async () => {
    let release!: () => void;
    const released = new Promise<void>((resolve) => {
      release = resolve;
    });
    let polls = 0;
    const store: DeliveryTrackingStore = {
      init: async () => {},
      upsert: async () => {},
      get: async () => undefined,
      listDue: async () => {
        polls += 1;
        await released;
        throw new Error("tracking store offline");
      },
      patch: async () => {},
    };
    const service = new DeliveryTrackingService({
      providers: [createMockProvider({ id: "mock", status: "DELIVERED" })],
      store,
      polling: { intervalMs: 5 },
    });
    const loggerError = spyOn(logger, "error").mockImplementation(() => {});

    try {
      service.start();
      await waitFor(() => polls === 1);
      // The timer ticks about ten times while the poll hangs.
      await wait(50);
      service.stop();
      release();
      await waitFor(() => loggerError.mock.calls.length > 0);
      await wait(20);

      expect(polls).toBe(1);
      expect(loggerError).toHaveBeenCalledTimes(1);
    } finally {
      service.stop();
      loggerError.mockRestore();
    }
  });
});

describe("createDeliveryTrackingHooks errors", () => {
  class OfflineStore extends InMemoryDeliveryTrackingStore {
    override async upsert(): Promise<void> {
      throw new Error("tracking store offline");
    }
  }

  function smsProvider(outcome: "sent" | "rejected"): Provider {
    return {
      id: "sms",
      name: "SMS",
      supportedTypes: ["SMS"],
      healthCheck: async () => ({ healthy: true, issues: [] }),
      send: async (options) =>
        outcome === "sent"
          ? ok({
              messageId: options.messageId ?? "msg",
              providerId: "sms",
              providerMessageId: "p1",
              status: "SENT",
              type: options.type,
              to: options.to,
            })
          : fail(new KMsgError(KMsgErrorCode.PROVIDER_ERROR, "rejected")),
    };
  }

  test("report a send that could not be recorded to onRecordError, not onError", async () => {
    const provider = smsProvider("sent");
    const tracking = new DeliveryTrackingService({
      providers: [provider],
      store: new OfflineStore(),
    });
    const recordErrors: unknown[] = [];
    const sendErrors: unknown[] = [];
    const kmsg = new KMsg({
      providers: [provider],
      hooks: createDeliveryTrackingHooks(tracking, {
        onRecordError: (error, { context, result }) => {
          recordErrors.push({
            message: error instanceof Error ? error.message : error,
            messageId: context.messageId,
            providerMessageId: result.providerMessageId,
          });
        },
        onError: (error) => {
          sendErrors.push(error);
        },
      }),
    });

    const sent = await kmsg.send({
      messageId: "m1",
      to: "01012345678",
      text: "hi",
    });

    expect(sent.isSuccess).toBe(true);
    expect(recordErrors).toEqual([
      {
        message: "tracking store offline",
        messageId: "m1",
        providerMessageId: "p1",
      },
    ]);
    expect(sendErrors).toEqual([]);
  });

  test("pass a failed send to onError with its context", async () => {
    const provider = smsProvider("rejected");
    const tracking = new DeliveryTrackingService({ providers: [provider] });
    const sendErrors: Array<{ code: string; messageId: string }> = [];
    const kmsg = new KMsg({
      providers: [provider],
      hooks: createDeliveryTrackingHooks(tracking, {
        onError: (error, context) => {
          sendErrors.push({ code: error.code, messageId: context.messageId });
        },
      }),
    });

    await kmsg.send({ messageId: "m2", to: "01012345678", text: "hi" });

    expect(sendErrors).toEqual([
      { code: KMsgErrorCode.PROVIDER_ERROR, messageId: "m2" },
    ]);
  });

  test("send an unrecorded send to onHookError without onRecordError", async () => {
    const provider = smsProvider("sent");
    const tracking = new DeliveryTrackingService({
      providers: [provider],
      store: new OfflineStore(),
    });
    const hookErrors: unknown[] = [];
    const kmsg = new KMsg({
      providers: [provider],
      hooks: {
        ...createDeliveryTrackingHooks(tracking),
        onHookError: (error, { hook, context }) => {
          hookErrors.push({
            hook,
            messageId: context.messageId,
            message: error instanceof Error ? error.message : error,
          });
        },
      },
    });

    const sent = await kmsg.send({
      messageId: "m3",
      to: "01012345678",
      text: "hi",
    });

    expect(sent.isSuccess).toBe(true);
    expect(hookErrors).toEqual([
      { hook: "onSuccess", messageId: "m3", message: "tracking store offline" },
    ]);
  });

  test("still call onQueued when a queued send cannot be recorded", async () => {
    const provider = smsProvider("sent");
    const tracking = new DeliveryTrackingService({
      providers: [provider],
      store: new OfflineStore(),
    });
    const events: string[] = [];
    const kmsg = new KMsg({
      providers: [provider],
      persistence: { strategy: "queue", repo: new InMemoryMessageRepository() },
      hooks: createDeliveryTrackingHooks(tracking, {
        onRecordError: (_error, { context }) => {
          events.push(`record error ${context.messageId}`);
        },
        onQueued: () => {
          events.push("queued");
        },
      }),
    });

    await kmsg.send({ messageId: "m4", to: "01012345678", text: "hi" });

    expect(events).toEqual(["record error m4", "queued"]);
  });
});

describe("DeliveryTrackingStore leases", () => {
  type LeasingStore = DeliveryTrackingStore & {
    leaseDue?: (
      now: Date,
      limit: number,
      leaseUntil: Date,
    ) => Promise<TrackingRecord[] | undefined>;
    releaseLeases?: (
      messageIds: readonly string[],
      leaseUntil: Date,
      nextCheckAt: Date,
    ) => Promise<void>;
    patchLeased?: (
      messageId: string,
      leaseUntil: Date,
      patch: Partial<TrackingRecord>,
    ) => Promise<boolean>;
  };

  async function expectLeases(store: LeasingStore): Promise<void> {
    await store.init();
    const base = Date.now();
    const at = (offset: number) => new Date(base + offset);
    const rows: Array<[string, number, TrackingRecord["status"]]> = [
      ["m1", -3000, "SENT"],
      ["m2", -2000, "PENDING"],
      ["m3", -1000, "DELIVERED"],
      ["m4", 3_600_000, "SENT"],
    ];
    for (const [messageId, offset, status] of rows) {
      await store.upsert({
        messageId,
        providerId: "mock",
        providerMessageId: `p-${messageId}`,
        type: "SMS",
        to: "01012345678",
        requestedAt: at(-5000),
        status,
        statusUpdatedAt: at(-5000),
        attemptCount: 0,
        nextCheckAt: at(offset),
      });
    }
    const leaseUntil = at(300_000);
    const lease = (now: Date, limit: number, until = leaseUntil) => {
      if (!store.leaseDue) throw new Error("store cannot lease");
      return store.leaseDue(now, limit, until);
    };
    const ids = (records: TrackingRecord[]) =>
      records.map((record) => record.messageId).sort();

    // The oldest due record first, up to the limit.
    const first = await lease(at(0), 1);
    expect(ids(first ?? [])).toEqual(["m1"]);
    expect(first?.[0]?.nextCheckAt.getTime()).toBe(leaseUntil.getTime());
    expect((await store.get("m1"))?.nextCheckAt.getTime()).toBe(
      leaseUntil.getTime(),
    );

    // A result is stored only under the lease that holds the record.
    const patchLeased = (until: Date, patch: Partial<TrackingRecord>) => {
      if (!store.patchLeased) throw new Error("store cannot patch leases");
      return store.patchLeased("m1", until, patch);
    };
    expect(await patchLeased(at(1), { providerStatusCode: "late" })).toBe(
      false,
    );
    expect((await store.get("m1"))?.providerStatusCode).toBeUndefined();
    expect(
      await patchLeased(leaseUntil, {
        providerStatusCode: "held",
        nextCheckAt: leaseUntil,
      }),
    ).toBe(true);
    expect((await store.get("m1"))?.providerStatusCode).toBe("held");

    // A leased record is not due for anyone else; terminal and future ones
    // never are.
    expect(ids((await lease(at(0), 10)) ?? [])).toEqual(["m2"]);
    expect(await lease(at(0), 10)).toEqual([]);
    expect(await store.listDue(at(0), 10)).toEqual([]);

    // A lease is given back only by the lease that holds it.
    const release = (messageIds: string[], until: Date) => {
      if (!store.releaseLeases) throw new Error("store cannot release");
      return store.releaseLeases(messageIds, until, at(0));
    };
    await release(["m1", "m2"], at(1));
    expect(await store.listDue(at(0), 10)).toEqual([]);
    await release(["m1"], leaseUntil);
    expect(ids(await store.listDue(at(0), 10))).toEqual(["m1"]);

    // Once the lease runs out the records are due again.
    expect(ids((await lease(at(300_001), 10, at(600_000))) ?? [])).toEqual([
      "m1",
      "m2",
    ]);
  }

  test("InMemoryDeliveryTrackingStore", async () => {
    await expectLeases(new InMemoryDeliveryTrackingStore());
  });

  test("SqliteDeliveryTrackingStore", async () => {
    const store = new SqliteDeliveryTrackingStore({ dbPath: ":memory:" });
    try {
      await expectLeases(store);
    } finally {
      store.close();
    }
  });

  test("BunSqlDeliveryTrackingStore (sqlite)", async () => {
    const store = new BunSqlDeliveryTrackingStore({
      options: { adapter: "sqlite", filename: ":memory:" },
    });
    try {
      await expectLeases(store);
    } finally {
      await store.close();
    }
  });
});
