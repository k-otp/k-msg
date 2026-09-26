import { describe, expect, test } from "bun:test";
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
