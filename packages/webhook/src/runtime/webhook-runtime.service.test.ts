import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import type { HttpClient } from "../services/webhook.dispatcher";
import {
  type WebhookConfig,
  type WebhookEvent,
  WebhookEventType,
} from "../types/webhook.types";
import { WebhookEndpointConflictError } from "./errors";
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

  test("addEndpoint rejects a URL that is already registered", async () => {
    const first = await runtime.addEndpoint({
      url: "https://example.com/once",
      active: true,
      events: [WebhookEventType.MESSAGE_SENT],
      secret: "whsec_first",
    });

    await expect(
      runtime.addEndpoint({
        url: "https://example.com/once",
        active: true,
        events: [WebhookEventType.MESSAGE_FAILED],
        secret: "whsec_second",
      }),
    ).rejects.toBeInstanceOf(WebhookEndpointConflictError);

    const endpoints = await runtime.listEndpoints();
    expect(endpoints.map((endpoint) => endpoint.id)).toEqual([first.id]);
    expect(endpoints[0]?.secret).toBe("whsec_first");
  });

  test("addEndpoints adds nothing when one input conflicts", async () => {
    const registered = await runtime.addEndpoint({
      url: "https://example.com/registered",
      active: true,
      events: [WebhookEventType.MESSAGE_SENT],
    });

    const error = await runtime
      .addEndpoints(
        ["https://example.com/new-1", "https://example.com/registered"].map(
          (url) => ({
            url,
            active: true,
            events: [WebhookEventType.MESSAGE_SENT],
          }),
        ),
      )
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(WebhookEndpointConflictError);
    expect(error).toMatchObject({ endpointId: registered.id });
    expect(
      (await runtime.listEndpoints()).map((endpoint) => endpoint.url),
    ).toEqual(["https://example.com/registered"]);
  });

  test("addEndpoints rejects a URL given twice as bad input, adding nothing", async () => {
    const error = await runtime
      .addEndpoints(
        ["https://example.com/twice", "https://example.com/twice"].map(
          (url) => ({
            url,
            active: true,
            events: [WebhookEventType.MESSAGE_SENT],
          }),
        ),
      )
      .catch((caught: unknown) => caught);

    // Not a conflict: nothing stored has the URL for error.endpointId to name.
    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(WebhookEndpointConflictError);
    expect(await runtime.listEndpoints()).toHaveLength(0);
  });

  test("addEndpoints removes what it added when a later write fails", async () => {
    const persistence = createInMemoryWebhookPersistence();
    const add = persistence.endpointStore.add.bind(persistence.endpointStore);
    let writes = 0;
    persistence.endpointStore.add = async (endpoint) => {
      writes += 1;
      if (writes === 2) throw new Error("store unavailable");
      await add(endpoint);
    };
    const batchRuntime = new WebhookRuntimeService({
      delivery: createConfig(),
      httpClient: client,
      persistence,
      autoStart: false,
    });
    const inputs = ["https://example.com/one", "https://example.com/two"].map(
      (url) => ({
        url,
        active: true,
        events: [WebhookEventType.MESSAGE_SENT],
      }),
    );

    await expect(batchRuntime.addEndpoints(inputs)).rejects.toThrow(
      "store unavailable",
    );
    expect(await batchRuntime.listEndpoints()).toHaveLength(0);

    // The same batch can simply be retried.
    await batchRuntime.addEndpoints(inputs);
    expect(await batchRuntime.listEndpoints()).toHaveLength(2);
  });

  test("of two batches racing for one URL, only one is stored", async () => {
    const batch = (prefix: string) =>
      [`https://example.com/${prefix}`, "https://example.com/shared"].map(
        (url) => ({
          url,
          active: true,
          events: [WebhookEventType.MESSAGE_SENT],
        }),
      );

    const results = await Promise.allSettled([
      runtime.addEndpoints(batch("a")),
      runtime.addEndpoints(batch("c")),
    ]);

    expect(results.map((result) => result.status).sort()).toEqual([
      "fulfilled",
      "rejected",
    ]);
    const winner = results.find((result) => result.status === "fulfilled");
    const stored = (await runtime.listEndpoints()).map((e) => e.url).sort();
    expect(stored).toEqual(
      winner?.status === "fulfilled"
        ? winner.value.map((endpoint) => endpoint.url).sort()
        : [],
    );
  });

  test("addEndpoints does not need to read stored secrets", async () => {
    const persistence = createInMemoryWebhookPersistence();
    const now = new Date();
    // A secret whose key is gone: reading it back fails in closed mode.
    await persistence.endpointStore.add({
      id: "old",
      url: "https://example.com/old",
      active: true,
      status: "active",
      events: [WebhookEventType.MESSAGE_SENT],
      secret: "enc:unreadable",
      createdAt: now,
      updatedAt: now,
    });
    const cryptoRuntime = new WebhookRuntimeService({
      delivery: createConfig(),
      httpClient: client,
      persistence,
      autoStart: false,
      fieldCrypto: {
        endpoint: {
          enabled: true,
          failMode: "closed",
          fields: { secret: "encrypt" },
          provider: {
            encrypt: async ({ value }) => ({ ciphertext: `enc:${value}` }),
            decrypt: async () => {
              throw new Error("key not found");
            },
            hash: async ({ value }) => `h:${value}`,
          },
        },
      },
    });

    await cryptoRuntime.addEndpoints([
      {
        url: "https://example.com/new",
        active: true,
        events: [WebhookEventType.MESSAGE_SENT],
      },
    ]);

    expect(
      (await persistence.endpointStore.list()).map((e) => e.url).sort(),
    ).toEqual(["https://example.com/new", "https://example.com/old"]);
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

describe("WebhookRuntimeService with enableSecurity", () => {
  function createSecureRuntime(
    overrides: Partial<WebhookConfig> = {},
  ): WebhookRuntimeService {
    return new WebhookRuntimeService({
      delivery: { ...createConfig(), enableSecurity: true, ...overrides },
      httpClient: new RecordingHttpClient(),
      autoStart: false,
    });
  }

  test("addEndpoint rejects an endpoint without a secret", async () => {
    const runtime = createSecureRuntime();

    try {
      await expect(
        runtime.addEndpoint({
          url: "https://example.com/unsigned",
          active: true,
          events: [WebhookEventType.MESSAGE_SENT],
        }),
      ).rejects.toThrow("needs a secret");
      expect(await runtime.listEndpoints()).toHaveLength(0);
    } finally {
      await runtime.shutdown();
    }
  });

  test("addEndpoints adds none of a batch when an active endpoint lacks a secret", async () => {
    const runtime = createSecureRuntime();

    try {
      await expect(
        runtime.addEndpoints([
          {
            url: "https://example.com/signed",
            active: true,
            events: [WebhookEventType.MESSAGE_SENT],
            secret: "whsec_signed",
          },
          {
            url: "https://example.com/unsigned",
            active: true,
            events: [WebhookEventType.MESSAGE_SENT],
          },
        ]),
      ).rejects.toThrow("Webhook endpoint 1 in the batch: An active webhook");
      expect(await runtime.listEndpoints()).toEqual([]);
    } finally {
      await runtime.shutdown();
    }
  });

  test("the secret error does not repeat the URL, which may hold a token", async () => {
    const runtime = createSecureRuntime();

    try {
      const error = await runtime
        .addEndpoint({
          url: "https://hooks.example.com/services/T0/B0/token-abc123",
          active: true,
          events: [WebhookEventType.MESSAGE_SENT],
        })
        .catch((caught: unknown) => caught);

      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain("needs a secret");
      expect((error as Error).message).not.toContain("token-abc123");
    } finally {
      await runtime.shutdown();
    }
  });

  test("an endpoint that receives nothing needs no secret", async () => {
    const persistence = createInMemoryWebhookPersistence();
    const now = new Date();
    // Stored before security was turned on.
    await persistence.endpointStore.add({
      id: "legacy",
      url: "https://example.com/legacy",
      active: true,
      status: "active",
      events: [WebhookEventType.MESSAGE_SENT],
      createdAt: now,
      updatedAt: now,
    });
    const runtime = new WebhookRuntimeService({
      delivery: { ...createConfig(), enableSecurity: true },
      httpClient: new RecordingHttpClient(),
      persistence,
      autoStart: false,
    });

    try {
      // Pausing stops the refused deliveries without deleting the endpoint.
      await runtime.updateEndpoint("legacy", { active: false });
      await runtime.updateEndpoint("legacy", { status: "suspended" });
      await runtime.addEndpoint({
        url: "https://example.com/paused",
        active: false,
        events: [WebhookEventType.MESSAGE_SENT],
      });

      await expect(
        runtime.updateEndpoint("legacy", { active: true, status: "active" }),
      ).rejects.toThrow("needs a secret");
      expect((await runtime.getEndpoint("legacy"))?.status).toBe("suspended");
    } finally {
      await runtime.shutdown();
    }
  });

  test("addEndpoint accepts an endpoint secret or a shared delivery.secretKey", async () => {
    const own = createSecureRuntime();
    const shared = createSecureRuntime({ secretKey: "whsec_shared" });

    try {
      await own.addEndpoint({
        url: "https://example.com/own",
        active: true,
        events: [WebhookEventType.MESSAGE_SENT],
        secret: "whsec_own",
      });
      await shared.addEndpoint({
        url: "https://example.com/shared",
        active: true,
        events: [WebhookEventType.MESSAGE_SENT],
      });

      expect(await own.listEndpoints()).toHaveLength(1);
      expect(await shared.listEndpoints()).toHaveLength(1);
    } finally {
      await own.shutdown();
      await shared.shutdown();
    }
  });

  test("updateEndpoint rejects removing the only secret", async () => {
    const runtime = createSecureRuntime();

    try {
      const endpoint = await runtime.addEndpoint({
        url: "https://example.com/rotating",
        active: true,
        events: [WebhookEventType.MESSAGE_SENT],
        secret: "whsec_own",
      });

      await expect(
        runtime.updateEndpoint(endpoint.id, { secret: "" }),
      ).rejects.toThrow("needs a secret");
      expect((await runtime.getEndpoint(endpoint.id))?.secret).toBe(
        "whsec_own",
      );
    } finally {
      await runtime.shutdown();
    }
  });

  test("probeEndpoint reports why an unsigned probe was not sent", async () => {
    const client = new RecordingHttpClient();
    const persistence = createInMemoryWebhookPersistence();
    const now = new Date();
    // Stored before security was turned on, so it never passed addEndpoint's check.
    await persistence.endpointStore.add({
      id: "legacy",
      url: "https://example.com/legacy",
      active: true,
      status: "active",
      events: [WebhookEventType.SYSTEM_MAINTENANCE],
      createdAt: now,
      updatedAt: now,
    });
    const runtime = new WebhookRuntimeService({
      delivery: { ...createConfig(), enableSecurity: true },
      httpClient: client,
      persistence,
      autoStart: false,
    });

    try {
      const result = await runtime.probeEndpoint("legacy");

      expect(result.success).toBe(false);
      expect(result.error).toContain("no signing secret");
      expect(client.calls.length).toBe(0);
    } finally {
      await runtime.shutdown();
    }
  });
});

// Tracks timers scheduled through the globals that are still pending: a
// timeout that has neither fired nor been cleared, or an uncleared interval.
function trackTimers(): { pending(): number; restore(): void } {
  const original = {
    setTimeout: globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout,
    setInterval: globalThis.setInterval,
    clearInterval: globalThis.clearInterval,
  };
  const live = new Set<unknown>();

  globalThis.setTimeout = ((
    handler: (...args: unknown[]) => void,
    ms?: number,
    ...args: unknown[]
  ) => {
    const id = original.setTimeout(
      (...callbackArgs: unknown[]) => {
        live.delete(id);
        handler(...callbackArgs);
      },
      ms,
      ...args,
    );
    live.add(id);
    return id;
  }) as unknown as typeof setTimeout;
  globalThis.setInterval = ((
    handler: (...args: unknown[]) => void,
    ms?: number,
    ...args: unknown[]
  ) => {
    const id = original.setInterval(handler, ms, ...args);
    live.add(id);
    return id;
  }) as unknown as typeof setInterval;
  globalThis.clearTimeout = ((id: Parameters<typeof clearTimeout>[0]) => {
    live.delete(id);
    original.clearTimeout(id);
  }) as typeof clearTimeout;
  globalThis.clearInterval = ((id: Parameters<typeof clearInterval>[0]) => {
    live.delete(id);
    original.clearInterval(id);
  }) as typeof clearInterval;

  return {
    pending: () => live.size,
    restore: () => {
      Object.assign(globalThis, original);
    },
  };
}

describe("WebhookRuntimeService batch timer", () => {
  let timers: ReturnType<typeof trackTimers>;
  let client: RecordingHttpClient;
  let runtime: WebhookRuntimeService;

  beforeEach(() => {
    timers = trackTimers();
    client = new RecordingHttpClient();
    runtime = new WebhookRuntimeService({
      delivery: { ...createConfig(), batchTimeoutMs: 20 },
      httpClient: client,
    });
  });

  afterEach(async () => {
    try {
      await runtime.shutdown();
    } finally {
      timers.restore();
    }
  });

  async function addEndpoint(): Promise<void> {
    await runtime.addEndpoint({
      url: "https://example.com/batched",
      active: true,
      events: [WebhookEventType.MESSAGE_SENT],
    });
  }

  test("starts no timer unless emit() queues an event", async () => {
    await addEndpoint();
    await runtime.emitSync(createEvent());

    expect(client.calls.length).toBe(1);
    expect(timers.pending()).toBe(0);
  });

  test("emit() sends the queue after batchTimeoutMs, then leaves no timer", async () => {
    await addEndpoint();

    await runtime.emit(createEvent());
    expect(timers.pending()).toBe(1);
    expect(client.calls.length).toBe(0);

    // Wait for the stored delivery, which the timer's batch writes last.
    const deadline = Date.now() + 2_000;
    while (
      (await runtime.listDeliveries()).length === 0 &&
      Date.now() < deadline
    ) {
      await Bun.sleep(5);
    }
    expect(client.calls.length).toBe(1);
    expect(timers.pending()).toBe(0);
  });

  test("flush() sends the queue and cancels the timer", async () => {
    await addEndpoint();
    await runtime.emit(createEvent());

    await runtime.flush();

    expect(client.calls.length).toBe(1);
    expect(timers.pending()).toBe(0);
  });

  test("emit() after shutdown() starts no timer", async () => {
    await addEndpoint();
    await runtime.shutdown();

    await runtime.emit(createEvent());

    expect(timers.pending()).toBe(0);
  });

  test("the emit() that fills a batch sends it and cancels the timer", async () => {
    // A timeout that cannot expire during the test.
    const filling = new WebhookRuntimeService({
      delivery: { ...createConfig(), batchSize: 2, batchTimeoutMs: 60_000 },
      httpClient: client,
    });

    try {
      await filling.addEndpoint({
        url: "https://example.com/filled",
        active: true,
        events: [WebhookEventType.MESSAGE_SENT],
      });
      await filling.emit(createEvent());
      expect(timers.pending()).toBe(1);

      // Resolves once the full batch has been sent.
      await filling.emit(createEvent());

      expect(client.calls.length).toBe(2);
      expect(timers.pending()).toBe(0);
    } finally {
      await filling.shutdown();
    }
  });
});

// Replaces setTimeout with timers that only run when the test fires them.
function manualTimers(): { fire(): void; pending(): number; restore(): void } {
  const original = {
    setTimeout: globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout,
  };
  const callbacks = new Map<number, () => void>();
  let nextId = 1;

  globalThis.setTimeout = ((handler: () => void) => {
    const id = nextId++;
    callbacks.set(id, handler);
    return id;
  }) as unknown as typeof setTimeout;
  globalThis.clearTimeout = ((id: number) => {
    callbacks.delete(id);
  }) as unknown as typeof clearTimeout;

  return {
    fire: () => {
      const due = [...callbacks.values()];
      callbacks.clear();
      for (const callback of due) callback();
    },
    pending: () => callbacks.size,
    restore: () => {
      Object.assign(globalThis, original);
    },
  };
}

// Holds every request at a gate until release(); later requests pass.
function gatedHttpClient(): {
  client: HttpClient;
  calls(): number;
  release(): void;
} {
  let calls = 0;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  return {
    client: {
      fetch: async () => {
        calls += 1;
        await gate;
        return new Response("ok");
      },
    },
    calls: () => calls,
    release: () => release(),
  };
}

async function withDeadline<T>(promise: Promise<T>): Promise<T> {
  return Promise.race([
    promise,
    Bun.sleep(2_000).then(() => {
      throw new Error("did not settle within 2 s");
    }),
  ]);
}

async function waitUntil(condition: () => boolean): Promise<void> {
  const deadline = Date.now() + 2_000;
  while (!condition() && Date.now() < deadline) {
    await Bun.sleep(1);
  }
}

describe("WebhookRuntimeService batches in flight", () => {
  test("a timer that fires during a batch sends the queue right after it", async () => {
    const clock = manualTimers();
    const http = gatedHttpClient();
    const runtime = new WebhookRuntimeService({
      delivery: createConfig(),
      httpClient: http.client,
    });

    try {
      await runtime.addEndpoint({
        url: "https://example.com/in-flight",
        active: true,
        events: [WebhookEventType.MESSAGE_SENT],
      });
      await runtime.emit(createEvent());
      clock.fire();
      await waitUntil(() => http.calls() === 1);

      // Queued while the first batch waits at the gate; its timer fires
      // before that batch finishes.
      await runtime.emit(createEvent());
      clock.fire();
      http.release();
      await waitUntil(() => http.calls() === 2);

      expect(http.calls()).toBe(2);
      expect(clock.pending()).toBe(0);
    } finally {
      http.release();
      clock.restore();
      await runtime.shutdown();
    }
  });

  test("a full batch queued during another one goes out right after it", async () => {
    const http = gatedHttpClient();
    const runtime = new WebhookRuntimeService({
      delivery: { ...createConfig(), batchSize: 2 },
      httpClient: http.client,
      autoStart: false,
    });
    await runtime.addEndpoint({
      url: "https://example.com/refill",
      active: true,
      events: [WebhookEventType.MESSAGE_SENT],
    });

    const first = Promise.all([
      runtime.emit(createEvent()),
      runtime.emit(createEvent()),
    ]);
    await waitUntil(() => http.calls() === 1);

    // Fills the next batch while the first is in flight. It does not wait
    // for a batch it did not start: that batch could be the caller.
    await withDeadline(
      Promise.all([runtime.emit(createEvent()), runtime.emit(createEvent())]),
    );
    expect(http.calls()).toBe(1);

    http.release();
    await first;
    // No flush() and no timer: the full batch follows the first.
    await waitUntil(() => http.calls() === 4);
    expect(http.calls()).toBe(4);
  });

  test("an emit() made while a batch is sent does not wait for that batch", async () => {
    const client = new RecordingHttpClient();
    const persistence = createInMemoryWebhookPersistence();
    const runtime = new WebhookRuntimeService({
      delivery: { ...createConfig(), batchSize: 1 },
      httpClient: client,
      persistence,
      autoStart: false,
    });
    const add = persistence.deliveryStore.add.bind(persistence.deliveryStore);
    let reentered = false;
    // A delivery store that emits an event of its own, from inside a batch.
    persistence.deliveryStore.add = async (delivery) => {
      await add(delivery);
      if (!reentered) {
        reentered = true;
        await runtime.emit(createEvent());
      }
    };
    await runtime.addEndpoint({
      url: "https://example.com/reentrant",
      active: true,
      events: [WebhookEventType.MESSAGE_SENT],
    });

    await withDeadline(runtime.emit(createEvent()));
    await withDeadline(runtime.flush());

    expect(client.calls.length).toBe(2);
  });

  test("a chained batch that fails is retried by the timer", async () => {
    const clock = manualTimers();
    const http = gatedHttpClient();
    const persistence = createInMemoryWebhookPersistence();
    const list = persistence.endpointStore.list.bind(persistence.endpointStore);
    let failList!: () => void;
    const listFails = new Promise<void>((resolve) => {
      failList = resolve;
    });
    let listCalls = 0;
    // The first batch looks up endpoints once per event (calls 1 and 2); the
    // chained batch's lookup (call 3) waits, then fails.
    persistence.endpointStore.list = async () => {
      listCalls += 1;
      if (listCalls !== 3) return list();
      await listFails;
      throw new Error("endpoint store unavailable");
    };
    const runtime = new WebhookRuntimeService({
      delivery: { ...createConfig(), batchSize: 2 },
      httpClient: http.client,
      persistence,
    });

    try {
      await runtime.addEndpoint({
        url: "https://example.com/chained",
        active: true,
        events: [WebhookEventType.MESSAGE_SENT],
      });
      const first = Promise.all([
        runtime.emit(createEvent()),
        runtime.emit(createEvent()),
      ]);
      await waitUntil(() => http.calls() === 1);
      await Promise.all([
        runtime.emit(createEvent()),
        runtime.emit(createEvent()),
      ]);

      http.release();
      // The emit() that started the first batch resumes after the chained
      // batch took the queue, finds it empty, and cancels the timer.
      await first;
      expect(clock.pending()).toBe(0);

      failList();
      await waitUntil(() => clock.pending() === 1);
      expect(clock.pending()).toBe(1);

      clock.fire();
      await waitUntil(() => http.calls() === 4);
      expect(http.calls()).toBe(4);
    } finally {
      failList();
      http.release();
      clock.restore();
      await runtime.shutdown();
    }
  });

  test("concurrent emits send every full batch without flush()", async () => {
    const client = new RecordingHttpClient();
    const runtime = new WebhookRuntimeService({
      delivery: { ...createConfig(), batchSize: 2 },
      httpClient: client,
      autoStart: false,
    });
    await runtime.addEndpoint({
      url: "https://example.com/concurrent",
      active: true,
      events: [WebhookEventType.MESSAGE_SENT],
    });

    await withDeadline(
      Promise.all(Array.from({ length: 6 }, () => runtime.emit(createEvent()))),
    );
    await waitUntil(() => client.calls.length === 6);

    expect(client.calls.length).toBe(6);
  });
});

// These runtimes use in-memory storage and autoStart: false, so they hold
// nothing that needs shutdown(). Skipping it keeps a broken batch size from
// hanging the test run in flush().
describe("WebhookRuntimeService batch settings", () => {
  test("emit() and flush() work without batchSize or batchTimeoutMs", async () => {
    const {
      batchSize: _size,
      batchTimeoutMs: _timeout,
      ...delivery
    } = createConfig();
    const client = new RecordingHttpClient();
    const runtime = new WebhookRuntimeService({
      delivery,
      httpClient: client,
      autoStart: false,
    });
    await runtime.addEndpoint({
      url: "https://example.com/defaults",
      active: true,
      events: [WebhookEventType.MESSAGE_SENT],
    });

    for (let index = 0; index < 12; index += 1) {
      await runtime.emit(createEvent());
    }
    // The tenth event fills a batch of the default size, which emit() sends.
    expect(client.calls.length).toBe(10);

    await runtime.flush();
    expect(client.calls.length).toBe(12);
  });

  test("a batchSize of Infinity sends the queue only on flush()", async () => {
    const client = new RecordingHttpClient();
    const runtime = new WebhookRuntimeService({
      delivery: { ...createConfig(), batchSize: Number.POSITIVE_INFINITY },
      httpClient: client,
      autoStart: false,
    });
    await runtime.addEndpoint({
      url: "https://example.com/unbounded",
      active: true,
      events: [WebhookEventType.MESSAGE_SENT],
    });

    for (let index = 0; index < 12; index += 1) {
      await runtime.emit(createEvent());
    }
    expect(client.calls.length).toBe(0);

    await runtime.flush();
    expect(client.calls.length).toBe(12);
  });

  test.each([0, -1, 0.5, Number.NaN])(
    "a batchSize of %p falls back to the default",
    async (batchSize) => {
      const client = new RecordingHttpClient();
      const runtime = new WebhookRuntimeService({
        delivery: { ...createConfig(), batchSize },
        httpClient: client,
        autoStart: false,
      });
      await runtime.addEndpoint({
        url: "https://example.com/invalid-size",
        active: true,
        events: [WebhookEventType.MESSAGE_SENT],
      });

      for (let index = 0; index < 10; index += 1) {
        await runtime.emit(createEvent());
      }

      expect(client.calls.length).toBe(10);
    },
  );
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

describe("WebhookRuntimeService probeEndpoint", () => {
  test.each([
    [503, 404, { success: false, httpStatus: 404, error: "HTTP 404" }],
    [503, 200, { success: true, httpStatus: 200, error: undefined }],
  ])(
    "probeEndpoint reports the last attempt after a %p then a %p",
    async (first, last, expected) => {
      const statuses = [first, last];
      const runtime = new WebhookRuntimeService({
        delivery: { ...createConfig(), maxRetries: 1, retryDelayMs: 1 },
        httpClient: {
          fetch: async () => new Response("", { status: statuses.shift() }),
        },
        autoStart: false,
      });

      try {
        const endpoint = await runtime.addEndpoint({
          url: "https://example.com/flaky",
          active: true,
          events: [WebhookEventType.SYSTEM_MAINTENANCE],
        });

        const result = await runtime.probeEndpoint(endpoint.id);

        expect(result.success).toBe(expected.success);
        expect(result.httpStatus).toBe(expected.httpStatus);
        if (expected.error === undefined) {
          expect(result.error).toBeUndefined();
        } else {
          expect(result.error).toStartWith(expected.error);
        }
      } finally {
        await runtime.shutdown();
      }
    },
  );
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
