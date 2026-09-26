import { afterEach, describe, expect, setSystemTime, test } from "bun:test";
import { createHmac } from "node:crypto";
import {
  type WebhookConfig,
  type WebhookEndpoint,
  type WebhookEvent,
  WebhookEventType,
} from "../types/webhook.types";
import { type HttpClient, WebhookDispatcher } from "./webhook.dispatcher";

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
