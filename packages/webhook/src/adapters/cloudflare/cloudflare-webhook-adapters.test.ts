import { Database, type SQLQueryBindings } from "bun:sqlite";
import { afterEach, describe, expect, test } from "bun:test";
import { WebhookRuntimeService } from "../../runtime/webhook-runtime.service";
import type { HttpClient } from "../../services/webhook.dispatcher";
import {
  type WebhookConfig,
  type WebhookDelivery,
  type WebhookEvent,
  WebhookEventType,
} from "../../types/webhook.types";
import type { D1DatabaseLike } from "./d1-client";
import { buildWebhookSchemaSql, createD1WebhookPersistence } from "./index";

class RecordingHttpClient implements HttpClient {
  readonly calls: Array<{ url: string; options: RequestInit }> = [];

  async fetch(url: string, options: RequestInit): Promise<Response> {
    this.calls.push({ url, options });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }
}

function createConfig(): WebhookConfig {
  return {
    maxRetries: 0,
    retryDelayMs: 10,
    timeoutMs: 500,
    enableSecurity: false,
    enabledEvents: [
      WebhookEventType.MESSAGE_SENT,
      WebhookEventType.SYSTEM_MAINTENANCE,
    ],
    batchSize: 10,
    batchTimeoutMs: 50,
  };
}

function createEvent(): WebhookEvent {
  return {
    id: `evt_${Date.now()}`,
    type: WebhookEventType.MESSAGE_SENT,
    timestamp: new Date(),
    data: { ok: true },
    metadata: {
      providerId: "provider-a",
    },
    version: "1.0",
  };
}

function createSqliteBackedD1(): { db: D1DatabaseLike; close: () => void } {
  const sqlite = new Database(":memory:");

  const db: D1DatabaseLike = {
    prepare(query: string) {
      let params: SQLQueryBindings[] = [];
      return {
        bind(...values: unknown[]) {
          params = values as SQLQueryBindings[];
          return this;
        },
        async first<T extends Record<string, unknown>>() {
          const statement = sqlite.query(query);
          const row = statement.get(...params) as T | null;
          return row ?? null;
        },
        async all<T extends Record<string, unknown>>() {
          const statement = sqlite.query(query);
          const rows = statement.all(...params) as T[];
          return { results: rows };
        },
        async run() {
          const statement = sqlite.query(query);
          statement.run(...params);
          return undefined;
        },
      };
    },
    async exec(query: string) {
      sqlite.exec(query);
      return undefined;
    },
  };

  return {
    db,
    close: () => sqlite.close(),
  };
}

describe("webhook cloudflare adapter", () => {
  const closers: Array<() => void> = [];

  afterEach(() => {
    while (closers.length > 0) {
      const close = closers.pop();
      if (close) {
        close();
      }
    }
  });

  test("buildWebhookSchemaSql renders endpoint and delivery tables", () => {
    const sql = buildWebhookSchemaSql({
      endpointTableName: "endpoints_custom",
      deliveryTableName: "deliveries_custom",
    }).join("\n");

    expect(sql).toContain("endpoints_custom");
    expect(sql).toContain("deliveries_custom");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS");
    expect(sql).toContain("ON deliveries_custom(created_at DESC, id DESC)");
  });

  test("D1 delivery store replaces a stored delivery by id", async () => {
    const sqliteD1 = createSqliteBackedD1();
    closers.push(sqliteD1.close);
    const { deliveryStore } = createD1WebhookPersistence(sqliteD1.db);
    const delivery: WebhookDelivery = {
      id: "d-1",
      endpointId: "ep-1",
      eventId: "evt-1",
      eventType: WebhookEventType.MESSAGE_SENT,
      url: "https://example.com/hook",
      httpMethod: "POST",
      headers: {},
      payload: "before",
      attempts: [],
      status: "success",
      createdAt: new Date(),
    };

    await deliveryStore.add(delivery);
    await deliveryStore.replace?.({ ...delivery, payload: "after" });

    const stored = await deliveryStore.list({ endpointId: "ep-1" });
    expect(stored.map((saved) => saved.payload)).toEqual(["after"]);
  });

  test("D1 delivery store pages newest first with the before cursor", async () => {
    const sqliteD1 = createSqliteBackedD1();
    closers.push(sqliteD1.close);
    const { deliveryStore } = createD1WebhookPersistence(sqliteD1.db);
    const createdAt = new Date(Date.UTC(2026, 0, 1));
    for (const id of ["d-1", "d-2", "d-3"]) {
      await deliveryStore.add({
        id,
        endpointId: "ep-1",
        eventId: `evt-${id}`,
        eventType: WebhookEventType.MESSAGE_SENT,
        url: "https://example.com/hook",
        httpMethod: "POST",
        headers: {},
        payload: id,
        attempts: [],
        status: "success",
        createdAt,
      });
    }

    const first = await deliveryStore.list({ limit: 2 });
    const last = first.at(-1);
    if (!last) throw new Error("first page is empty");
    const second = await deliveryStore.list({
      limit: 2,
      before: { createdAt: last.createdAt, id: last.id },
    });

    expect(first.map((delivery) => delivery.id)).toEqual(["d-3", "d-2"]);
    expect(second.map((delivery) => delivery.id)).toEqual(["d-1"]);
  });

  test("D1 persistence works with WebhookRuntimeService", async () => {
    const sqliteD1 = createSqliteBackedD1();
    closers.push(sqliteD1.close);

    const runtime = new WebhookRuntimeService({
      delivery: createConfig(),
      persistence: createD1WebhookPersistence(sqliteD1.db),
      security: {
        allowPrivateHosts: true,
      },
      httpClient: new RecordingHttpClient(),
    });

    try {
      const endpoint = await runtime.addEndpoint({
        url: "http://127.0.0.1:8787/receiver",
        active: true,
        events: [WebhookEventType.MESSAGE_SENT],
      });

      const listed = await runtime.listEndpoints();
      expect(listed.length).toBe(1);
      expect(listed[0]?.id).toBe(endpoint.id);

      const deliveries = await runtime.emitSync(createEvent());
      expect(deliveries.length).toBe(1);

      const saved = await runtime.listDeliveries({ endpointId: endpoint.id });
      expect(saved.length).toBe(1);
      expect(saved[0]?.endpointId).toBe(endpoint.id);
    } finally {
      await runtime.shutdown();
    }
  });
});
