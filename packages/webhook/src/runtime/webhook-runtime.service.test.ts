import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import type { HttpClient } from "../services/webhook.dispatcher";
import {
  type WebhookConfig,
  type WebhookEvent,
  WebhookEventType,
} from "../types/webhook.types";
import { createInMemoryWebhookPersistence } from "./persistence";
import { WebhookRuntimeService } from "./webhook-runtime.service";

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
      WebhookEventType.MESSAGE_FAILED,
      WebhookEventType.SYSTEM_MAINTENANCE,
    ],
    batchSize: 10,
    batchTimeoutMs: 50,
  };
}

function createEvent(
  type: WebhookEventType = WebhookEventType.MESSAGE_SENT,
): WebhookEvent {
  return {
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    timestamp: new Date(),
    data: { ok: true },
    metadata: {},
    version: "1.0",
  };
}

describe("WebhookRuntimeService", () => {
  let runtime: WebhookRuntimeService;
  let client: RecordingHttpClient;

  beforeEach(() => {
    client = new RecordingHttpClient();
    runtime = new WebhookRuntimeService({
      delivery: createConfig(),
      httpClient: client,
    });
  });

  afterEach(async () => {
    await runtime.shutdown();
  });

  test("addEndpoint does not auto-probe", async () => {
    await runtime.addEndpoint({
      url: "https://example.com/webhook",
      active: true,
      events: [WebhookEventType.MESSAGE_SENT],
    });

    expect(client.calls.length).toBe(0);
  });

  test("probeEndpoint sends an explicit probe request", async () => {
    const endpoint = await runtime.addEndpoint({
      url: "https://example.com/probe",
      active: true,
      events: [WebhookEventType.SYSTEM_MAINTENANCE],
    });

    const result = await runtime.probeEndpoint(endpoint.id);

    expect(result.success).toBe(true);
    expect(result.endpointId).toBe(endpoint.id);
    expect(client.calls.length).toBe(1);
  });

  test("metadata filters are fail-close", async () => {
    const filtered = await runtime.addEndpoint({
      url: "https://example.com/filtered",
      active: true,
      events: [WebhookEventType.MESSAGE_SENT],
      filters: {
        providerId: ["provider-a"],
      },
    });

    const open = await runtime.addEndpoint({
      url: "https://example.com/open",
      active: true,
      events: [WebhookEventType.MESSAGE_SENT],
    });

    const deliveries = await runtime.emitSync(createEvent());

    expect(deliveries.length).toBe(1);
    expect(deliveries[0]?.endpointId).toBe(open.id);
    expect(deliveries[0]?.endpointId).not.toBe(filtered.id);
  });

  test("emit + flush persists deliveries", async () => {
    const endpoint = await runtime.addEndpoint({
      url: "https://example.com/batch",
      active: true,
      events: [WebhookEventType.MESSAGE_SENT],
    });

    await runtime.emit(createEvent());
    await runtime.flush();

    const deliveries = await runtime.listDeliveries({
      endpointId: endpoint.id,
    });
    expect(deliveries.length).toBe(1);
    expect(deliveries[0]?.endpointId).toBe(endpoint.id);
  });
});

class SlowHttpClient implements HttpClient {
  readonly calls: string[] = [];

  async fetch(url: string): Promise<Response> {
    this.calls.push(url);
    await Bun.sleep(150);
    return new Response("ok", { status: 200 });
  }
}

describe("WebhookRuntimeService batching", () => {
  test("flush waits for a batch the interval already started", async () => {
    const client = new SlowHttpClient();
    const runtime = new WebhookRuntimeService({
      delivery: { ...createConfig(), batchSize: 2, batchTimeoutMs: 20 },
      httpClient: client,
    });

    try {
      await runtime.addEndpoint({
        url: "https://example.com/slow",
        active: true,
        events: [WebhookEventType.MESSAGE_SENT],
      });
      await runtime.emit(createEvent());
      // Let the interval start dispatching the first event.
      await Bun.sleep(60);
      await runtime.emit(createEvent());

      await runtime.flush();

      expect(client.calls.length).toBe(2);
      expect((await runtime.listDeliveries()).length).toBe(2);
    } finally {
      await runtime.shutdown();
    }
  });

  test("a failed batch re-queues only the events it did not dispatch", async () => {
    const persistence = createInMemoryWebhookPersistence();
    const listEndpoints = persistence.endpointStore.list.bind(
      persistence.endpointStore,
    );
    let listCalls = 0;
    persistence.endpointStore.list = async () => {
      listCalls += 1;
      if (listCalls === 2) {
        throw new Error("endpoint store unavailable");
      }
      return listEndpoints();
    };

    const client = new RecordingHttpClient();
    const runtime = new WebhookRuntimeService({
      delivery: createConfig(),
      httpClient: client,
      persistence,
      autoStart: false,
    });

    try {
      await runtime.addEndpoint({
        url: "https://example.com/requeue",
        active: true,
        events: [WebhookEventType.MESSAGE_SENT],
      });
      await runtime.emit(createEvent());
      await runtime.emit(createEvent());
      listCalls = 0;

      await expect(runtime.flush()).rejects.toThrow(
        "endpoint store unavailable",
      );
      expect(client.calls.length).toBe(1);

      await runtime.flush();
      expect(client.calls.length).toBe(2);
    } finally {
      await runtime.shutdown();
    }
  });
});
