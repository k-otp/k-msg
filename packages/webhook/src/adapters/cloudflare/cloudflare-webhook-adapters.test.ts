import { Database } from "bun:sqlite";
import { afterEach, describe, expect, test } from "bun:test";
import { WebhookRuntimeService } from "../../runtime/webhook-runtime.service";
import type { HttpClient } from "../../services/webhook.dispatcher";
import {
  type WebhookConfig,
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
      let params: unknown[] = [];
      return {
        bind(...values: unknown[]) {
          params = values;
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
