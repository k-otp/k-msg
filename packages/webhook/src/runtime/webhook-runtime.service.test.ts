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

  constructor(private readonly status = 200) {}

  async fetch(url: string, options: RequestInit): Promise<Response> {
    this.calls.push({ url, options });
    return new Response(JSON.stringify({ ok: true }), {
      status: this.status,
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

  test("refuses endpoint changes once shutdown has started", async () => {
    const endpoint = await runtime.addEndpoint({
      url: "https://example.com/before-shutdown",
      active: true,
      events: [WebhookEventType.MESSAGE_SENT],
    });

    const stopping = runtime.shutdown();
    await expect(
      runtime.updateEndpoint(endpoint.id, { url: "https://example.com/late" }),
    ).rejects.toThrow("after shutdown() has started");
    await expect(runtime.removeEndpoint(endpoint.id)).rejects.toThrow(
      "after shutdown() has started",
    );
    await stopping;
  });

  test("finishes every endpoint change requested before shutdown", async () => {
    const existing = await runtime.addEndpoint({
      url: "https://example.com/existing",
      active: true,
      events: [WebhookEventType.MESSAGE_SENT],
    });
    const doomed = await runtime.addEndpoint({
      url: "https://example.com/doomed",
      active: true,
      events: [WebhookEventType.MESSAGE_SENT],
    });

    // Requested without awaiting, then shutdown() at once: each change is
    // queued when it is called, so none of them is refused.
    const added = runtime.addEndpoint({
      url: "https://example.com/added",
      active: true,
      events: [WebhookEventType.MESSAGE_SENT],
    });
    const batch = runtime.addEndpoints([
      {
        url: "https://example.com/batch-1",
        active: true,
        events: [WebhookEventType.MESSAGE_SENT],
      },
      {
        url: "https://example.com/batch-2",
        active: true,
        events: [WebhookEventType.MESSAGE_SENT],
      },
    ]);
    const updated = runtime.updateEndpoint(existing.id, {
      url: "https://example.com/updated",
    });
    const removed = runtime.removeEndpoint(doomed.id);
    const stopping = runtime.shutdown();

    await expect(added).resolves.toMatchObject({
      url: "https://example.com/added",
    });
    expect((await batch).map((endpoint) => endpoint.url)).toEqual([
      "https://example.com/batch-1",
      "https://example.com/batch-2",
    ]);
    await expect(updated).resolves.toMatchObject({
      url: "https://example.com/updated",
    });
    await expect(removed).resolves.toBeUndefined();
    await stopping;
  });

  test("rejects an invalid URL without waiting for queued endpoint writes", async () => {
    await expect(
      runtime.addEndpoint({
        url: "ftp://example.com/hook",
        active: true,
        events: [WebhookEventType.MESSAGE_SENT],
      }),
    ).rejects.toThrow();
    await expect(
      runtime.addEndpoints([
        {
          url: "https://example.com/fine",
          active: true,
          events: [WebhookEventType.MESSAGE_SENT],
        },
        {
          url: "ftp://example.com/hook",
          active: true,
          events: [WebhookEventType.MESSAGE_SENT],
        },
      ]),
    ).rejects.toThrow("Webhook endpoint 1 in the batch:");
    // The batch with an invalid URL added nothing.
    expect(await runtime.listEndpoints()).toEqual([]);
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

describe("WebhookRuntimeService message status events", () => {
  test.each([
    [WebhookEventType.MESSAGE_CANCELLED, "message.cancelled"],
    [WebhookEventType.MESSAGE_UNKNOWN, "message.unknown"],
  ])("delivers %s events", async (type, wireName) => {
    const client = new RecordingHttpClient();
    const runtime = new WebhookRuntimeService({
      delivery: { ...createConfig(), enabledEvents: [type] },
      httpClient: client,
      autoStart: false,
    });

    try {
      await runtime.addEndpoint({
        url: "https://example.com/statuses",
        active: true,
        events: [type],
      });

      const deliveries = await runtime.emitSync(createEvent(type));

      expect<string>(type).toBe(wireName);
      expect(deliveries.map((delivery) => delivery.status)).toEqual([
        "success",
      ]);
      expect(
        new Headers(client.calls[0]?.options.headers).get("X-Webhook-Event"),
      ).toBe(wireName);
    } finally {
      await runtime.shutdown();
    }
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
  test("flush sends one request per queued event and endpoint", async () => {
    const client = new RecordingHttpClient();
    const runtime = new WebhookRuntimeService({
      delivery: createConfig(),
      httpClient: client,
      autoStart: false,
    });

    try {
      await runtime.addEndpoints([
        {
          url: "https://example.com/a",
          active: true,
          events: [WebhookEventType.MESSAGE_SENT],
        },
        {
          url: "https://example.com/b",
          active: true,
          events: [WebhookEventType.MESSAGE_SENT],
        },
      ]);
      const events = [createEvent(), createEvent()];
      for (const event of events) {
        await runtime.emit(event);
      }

      await runtime.flush();

      const sent = client.calls.map(
        (call) => `${call.url} ${JSON.parse(String(call.options.body)).id}`,
      );
      expect(sent.sort()).toEqual(
        events
          .flatMap((event) => [
            `https://example.com/a ${event.id}`,
            `https://example.com/b ${event.id}`,
          ])
          .sort(),
      );
      const deliveries = await runtime.listDeliveries();
      expect(deliveries).toHaveLength(4);
      expect(
        deliveries.every((delivery) => delivery.status === "success"),
      ).toBe(true);
    } finally {
      await runtime.shutdown();
    }
  });

  test("flush records a 500 response as a failed delivery", async () => {
    const client = new RecordingHttpClient(500);
    const runtime = new WebhookRuntimeService({
      delivery: createConfig(),
      httpClient: client,
      autoStart: false,
    });

    try {
      await runtime.addEndpoint({
        url: "https://example.com/failing",
        active: true,
        events: [WebhookEventType.MESSAGE_SENT],
      });
      await runtime.emit(createEvent());

      await runtime.flush();

      expect(client.calls).toHaveLength(1);
      const [delivery] = await runtime.listDeliveries();
      expect(delivery?.status).toBe("failed");
      expect(delivery?.attempts[0]?.httpStatus).toBe(500);
    } finally {
      await runtime.shutdown();
    }
  });

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
