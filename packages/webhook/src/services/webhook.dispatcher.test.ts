import {
  afterEach,
  describe,
  expect,
  setSystemTime,
  spyOn,
  test,
} from "bun:test";
import { createHmac } from "node:crypto";
import { WebhookHostNotAllowedError } from "../runtime/errors";
import {
  type WebhookConfig,
  type WebhookEndpoint,
  type WebhookEvent,
  WebhookEventType,
} from "../types/webhook.types";
import {
  DefaultHttpClient,
  type HttpClient,
  WebhookDispatcher,
} from "./webhook.dispatcher";

class StubHttpClient implements HttpClient {
  readonly calls: RequestInit[] = [];

  constructor(private readonly respond: () => Response) {}

  async fetch(_url: string, options: RequestInit): Promise<Response> {
    this.calls.push(options);
    return this.respond();
  }
}

function expectedSignature(
  secret: string,
  timestamp: string,
  body: string,
): string {
  const digest = createHmac("sha256", secret)
    .update(`${timestamp}.${body}`)
    .digest("hex");
  return `sha256=${digest}`;
}

function toSeconds(date: Date): string {
  return Math.floor(date.getTime() / 1000).toString();
}

function createConfig(overrides: Partial<WebhookConfig> = {}): WebhookConfig {
  return {
    maxRetries: 3,
    retryDelayMs: 1,
    timeoutMs: 500,
    enableSecurity: false,
    enabledEvents: [WebhookEventType.MESSAGE_SENT],
    batchSize: 10,
    batchTimeoutMs: 50,
    ...overrides,
  };
}

function createEndpoint(
  overrides: Partial<WebhookEndpoint> = {},
): WebhookEndpoint {
  return {
    id: "endpoint_1",
    url: "https://example.com/webhook",
    active: true,
    events: [WebhookEventType.MESSAGE_SENT],
    createdAt: new Date(),
    updatedAt: new Date(),
    status: "active",
    ...overrides,
  };
}

function createEvent(): WebhookEvent {
  return {
    id: "evt_1",
    type: WebhookEventType.MESSAGE_SENT,
    timestamp: new Date(),
    data: { ok: true },
    metadata: {},
    version: "1.0",
  };
}

describe("WebhookDispatcher", () => {
  test("honors a per-endpoint maxRetries of 0", async () => {
    const client = new StubHttpClient(
      () => new Response("unavailable", { status: 503 }),
    );
    const dispatcher = new WebhookDispatcher(createConfig(), client);

    const delivery = await dispatcher.dispatch(
      createEvent(),
      createEndpoint({
        retryConfig: {
          maxRetries: 0,
          retryDelayMs: 1000,
          backoffMultiplier: 2,
        },
      }),
    );

    expect(client.calls.length).toBe(1);
    expect(delivery.status).toBe("failed");
  });

  test("lets a per-endpoint maxRetries above the global value retry network errors", async () => {
    let calls = 0;
    const client: HttpClient = {
      fetch: async () => {
        calls += 1;
        throw new Error("network connection reset");
      },
    };
    const dispatcher = new WebhookDispatcher(
      createConfig({ maxRetries: 1 }),
      client,
    );
    // Keep the test fast; delays are not what this checks.
    Object.assign(dispatcher, { sleep: async () => {} });

    const delivery = await dispatcher.dispatch(
      createEvent(),
      createEndpoint({
        retryConfig: {
          maxRetries: 3,
          retryDelayMs: 1000,
          backoffMultiplier: 1,
        },
      }),
    );

    expect(calls).toBe(4);
    expect(delivery.status).toBe("failed");
  });

  test("does not follow redirects", async () => {
    const client = new StubHttpClient(
      () =>
        new Response(null, {
          status: 302,
          headers: { location: "http://169.254.169.254/latest/meta-data" },
        }),
    );
    const dispatcher = new WebhookDispatcher(createConfig(), client);

    const delivery = await dispatcher.dispatch(createEvent(), createEndpoint());

    expect(client.calls[0]?.redirect).toBe("manual");
    expect(client.calls.length).toBe(1);
    expect(delivery.status).toBe("failed");
  });
});

describe("WebhookDispatcher signing", () => {
  afterEach(() => {
    setSystemTime();
  });

  test("signs each attempt with the time it is sent, not the event time", async () => {
    const happenedAt = new Date("2026-03-01T00:00:00.000Z");
    const firstSentAt = new Date("2026-03-01T01:00:00.000Z");
    const retriedAt = new Date("2026-03-01T01:07:00.000Z");
    setSystemTime(firstSentAt);

    let calls = 0;
    const client = new StubHttpClient(() => {
      calls += 1;
      return calls === 1
        ? new Response("unavailable", { status: 503 })
        : new Response("ok", { status: 200 });
    });
    const dispatcher = new WebhookDispatcher(
      createConfig({ enableSecurity: true, maxRetries: 1 }),
      client,
    );
    // The retry goes out seven minutes after the first attempt.
    Object.assign(dispatcher, {
      sleep: async () => {
        setSystemTime(retriedAt);
      },
    });

    const delivery = await dispatcher.dispatch(
      { ...createEvent(), timestamp: happenedAt },
      createEndpoint({ secret: "whsec_endpoint" }),
    );

    expect(delivery.status).toBe("success");
    expect(client.calls.length).toBe(2);
    const sent = client.calls.map((call) => new Headers(call.headers));
    expect(sent.map((headers) => headers.get("X-Webhook-Timestamp"))).toEqual([
      toSeconds(firstSentAt),
      toSeconds(retriedAt),
    ]);
    for (const headers of sent) {
      expect(headers.get("X-Webhook-Signature")).toBe(
        expectedSignature(
          "whsec_endpoint",
          headers.get("X-Webhook-Timestamp") ?? "",
          delivery.payload,
        ),
      );
    }
    expect(delivery.attempts.map((attempt) => attempt.timestamp)).toEqual([
      firstSentAt,
      retriedAt,
    ]);
    // The delivery keeps the headers of the request that went out last.
    expect(delivery.headers["X-Webhook-Timestamp"]).toBe(toSeconds(retriedAt));
  });

  test("signs with delivery.secretKey when the endpoint has no secret", async () => {
    const client = new StubHttpClient(() => new Response("ok"));
    const dispatcher = new WebhookDispatcher(
      createConfig({ enableSecurity: true, secretKey: "whsec_shared" }),
      client,
    );

    const delivery = await dispatcher.dispatch(createEvent(), createEndpoint());

    const headers = new Headers(client.calls[0]?.headers);
    expect(headers.get("X-Webhook-Signature")).toBe(
      expectedSignature(
        "whsec_shared",
        headers.get("X-Webhook-Timestamp") ?? "",
        delivery.payload,
      ),
    );
  });

  test.each([
    ["no secret", undefined],
    ["an empty secret", ""],
  ])(
    "refuses to send unsigned when enableSecurity is on and the endpoint has %s",
    async (_label, secret) => {
      const client = new StubHttpClient(() => new Response("ok"));
      const dispatcher = new WebhookDispatcher(
        createConfig({ enableSecurity: true }),
        client,
      );

      const delivery = await dispatcher.dispatch(
        createEvent(),
        createEndpoint({ secret }),
      );

      expect(client.calls.length).toBe(0);
      expect(delivery.status).toBe("failed");
      expect(delivery.attempts).toHaveLength(1);
      expect(delivery.attempts[0]?.httpStatus).toBeUndefined();
      expect(delivery.attempts[0]?.error).toContain("no signing secret");
    },
  );

  test("endpoint headers cannot replace or duplicate the protocol headers", async () => {
    const client = new StubHttpClient(() => new Response("ok"));
    const dispatcher = new WebhookDispatcher(
      createConfig({ enableSecurity: true }),
      client,
    );

    const delivery = await dispatcher.dispatch(
      createEvent(),
      createEndpoint({
        secret: "whsec_endpoint",
        headers: {
          "X-Webhook-Timestamp": "123",
          "x-webhook-signature": "sha256=forged",
          "x-webhook-id": "spoofed",
          "X-WEBHOOK-EVENT": "spoofed",
          "content-type": "application/json; charset=utf-8",
          Authorization: "Bearer receiver-token",
        },
      }),
    );

    const sent = new Headers(client.calls[0]?.headers);
    const timestamp = sent.get("X-Webhook-Timestamp") ?? "";
    expect(timestamp).toMatch(/^\d+$/);
    expect(sent.get("X-Webhook-Signature")).toBe(
      expectedSignature("whsec_endpoint", timestamp, delivery.payload),
    );
    expect(sent.get("X-Webhook-ID")).toBe("evt_1");
    expect(sent.get("X-Webhook-Event")).toBe(WebhookEventType.MESSAGE_SENT);
    // Other headers still come from the endpoint, once each.
    expect(sent.get("Content-Type")).toBe("application/json; charset=utf-8");
    expect(sent.get("Authorization")).toBe("Bearer receiver-token");
  });

  test("sends no signature when enableSecurity is off", async () => {
    const client = new StubHttpClient(() => new Response("ok"));
    const dispatcher = new WebhookDispatcher(createConfig(), client);

    await dispatcher.dispatch(
      createEvent(),
      createEndpoint({ secret: "whsec_endpoint" }),
    );

    const headers = new Headers(client.calls[0]?.headers);
    expect(headers.has("X-Webhook-Signature")).toBe(false);
    expect(headers.get("X-Webhook-Timestamp")).toMatch(/^\d+$/);
  });
});

describe("bounded responses and trusted hosts", () => {
  test("retains only a bounded prefix and cancels a streaming response", async () => {
    let cancelled = false;
    const client = new StubHttpClient(
      () =>
        new Response(
          new ReadableStream({
            pull(controller) {
              controller.enqueue(new TextEncoder().encode("abcdefgh"));
            },
            cancel() {
              cancelled = true;
            },
          }),
        ),
    );
    const d = new WebhookDispatcher(
      createConfig({ maxResponseBodyBytes: 5 }),
      client,
    );
    const delivery = await d.dispatch(createEvent(), createEndpoint());
    expect(delivery.status).toBe("success");
    expect(delivery.attempts[0]?.responseBody).toBe("abcde");
    expect(delivery.attempts[0]?.responseBodyTruncated).toBe(true);
    expect(cancelled).toBe(true);
  });
  test("can omit response content completely", async () => {
    const d = new WebhookDispatcher(
      createConfig({ maxResponseBodyBytes: 0 }),
      new StubHttpClient(() => new Response("secret")),
    );
    const delivery = await d.dispatch(createEvent(), createEndpoint());
    expect(delivery.attempts[0]?.responseBody).toBe("");
  });
  test("untrusted DNS hosts, literal private addresses and credentials fail before fetch", async () => {
    const client = new DefaultHttpClient(["example.com"]);
    await expect(
      client.fetch("https://untrusted.example/hook", {}),
    ).rejects.toThrow("not explicitly trusted");
    await expect(client.fetch("http://127.0.0.1/hook", {})).rejects.toThrow();
    await expect(
      client.fetch("https://user:pass@example.com/hook", {}),
    ).rejects.toThrow();
    expect(() => new DefaultHttpClient(["*.example.com"])).toThrow();
    expect(() => new DefaultHttpClient(["https://example.com"])).toThrow();
  });
});

test("trusted destinations use manual redirects; unlisted public literals are refused", async () => {
  const fetchMock = spyOn(globalThis, "fetch").mockResolvedValue(
    new Response("ok"),
  );
  try {
    const client = new DefaultHttpClient(["example.com"]);
    await client.fetch("https://example.com/hook", { redirect: "follow" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[1]?.redirect).toBe("manual");
    await expect(client.fetch("https://1.1.1.1/hook", {})).rejects.toThrow(
      "not explicitly trusted",
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  } finally {
    fetchMock.mockRestore();
  }
});

test("mutating the caller config cannot remove the validated response cap", async () => {
  const config = createConfig({ maxResponseBodyBytes: 4 });
  const d = new WebhookDispatcher(
    config,
    new StubHttpClient(() => new Response("123456789")),
  );
  config.maxResponseBodyBytes = Number.POSITIVE_INFINITY;
  const delivery = await d.dispatch(createEvent(), createEndpoint());
  expect(delivery.attempts[0]?.responseBody).toBe("1234");
});

describe("allowedHosts entries", () => {
  test("accept lowercase DNS names, punycode, public IPv4 and bracketed IPv6", () => {
    const client = new DefaultHttpClient([
      "Hooks.Example.com.",
      "xn--mnchen-3ya.de",
      "203.0.113.5",
      "[2001:db8::1]",
    ]);
    for (const url of [
      "https://hooks.example.com/a",
      "https://hooks.example.com./a",
      "https://HOOKS.example.com/a",
      "https://münchen.de/a",
      "https://203.0.113.5/a",
      "https://[2001:db8::1]/a",
    ]) {
      expect(client.assertAllowed(url).href).toBeTruthy();
    }
    expect(() => client.assertAllowed("https://other.example.com/a")).toThrow(
      WebhookHostNotAllowedError,
    );
  });

  test("refuse entries that could never match, with a message that says how to write them", () => {
    for (const entry of [
      "2001:db8::1", // IPv6 needs brackets
      "münchen.de", // IDN needs punycode
      "hooks.example.com:443",
      "hooks.example.com:8443",
      "hooks.example.com..", // two trailing dots never match
      "*.example.com",
      "https://hooks.example.com",
      "hooks.example.com/path",
      "user@hooks.example.com",
      "",
    ]) {
      expect(() => new DefaultHttpClient([entry])).toThrow(TypeError);
    }
    expect(() => new DefaultHttpClient(["2001:db8::1"])).toThrow(
      "brackets and internationalized names as punycode",
    );
  });

  test("trust a host on every port, not one destination", () => {
    const client = new DefaultHttpClient(["hooks.example.com"]);
    expect(client.assertAllowed("https://hooks.example.com:6379/x").port).toBe(
      "6379",
    );
  });
});
