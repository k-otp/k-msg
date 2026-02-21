import {
  type WebhookConfig,
  WebhookEventType,
  WebhookRuntimeService,
} from "@k-msg/webhook";
import { createD1WebhookPersistence } from "@k-msg/webhook/adapters/cloudflare";
import { Hono } from "hono";

type Bindings = {
  DB: D1Database;
};

type EndpointCreatePayload = {
  url?: string;
  name?: string;
  events?: string[];
  secret?: string;
};

type EmitPayload = {
  type?: string;
  messageId?: string;
  providerId?: string;
  channelId?: string;
  templateId?: string;
  payload?: Record<string, unknown>;
};

const webhookConfig: WebhookConfig = {
  maxRetries: 1,
  retryDelayMs: 500,
  timeoutMs: 5_000,
  enableSecurity: false,
  enabledEvents: [
    WebhookEventType.MESSAGE_SENT,
    WebhookEventType.MESSAGE_FAILED,
    WebhookEventType.SYSTEM_MAINTENANCE,
  ],
  batchSize: 20,
  batchTimeoutMs: 500,
};

const app = new Hono<{ Bindings: Bindings }>();

let runtimePromise: Promise<WebhookRuntimeService> | undefined;

function isWebhookEventType(value: string): value is WebhookEventType {
  return Object.values(WebhookEventType).includes(value as WebhookEventType);
}

function normalizeEvents(values: string[] | undefined): WebhookEventType[] {
  if (!values || values.length === 0) {
    return [WebhookEventType.MESSAGE_SENT, WebhookEventType.MESSAGE_FAILED];
  }

  const valid = values.filter((value): value is WebhookEventType =>
    isWebhookEventType(value),
  );

  return valid.length > 0 ? valid : [WebhookEventType.MESSAGE_SENT];
}

function getRuntime(env: Bindings): Promise<WebhookRuntimeService> {
  if (!runtimePromise) {
    const persistence = createD1WebhookPersistence(env.DB);
    runtimePromise = Promise.resolve(
      new WebhookRuntimeService({
        delivery: webhookConfig,
        persistence,
        security: {
          allowPrivateHosts: true,
          allowHttpForLocalhost: true,
        },
      }),
    ).catch((error) => {
      runtimePromise = undefined;
      throw error;
    });
  }

  return runtimePromise;
}

app.get("/", (c) => {
  return c.json({
    ok: true,
    service: "hono-worker-webhook-d1",
    routes: [
      "POST /webhook/endpoints",
      "GET /webhook/endpoints",
      "POST /webhook/events/emit",
      "POST /webhook/receiver/local",
    ],
  });
});

app.post("/webhook/endpoints", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as EndpointCreatePayload;

  if (!body.url || typeof body.url !== "string") {
    return c.json({ ok: false, error: "`url` is required" }, 400);
  }

  const runtime = await getRuntime(c.env);
  const endpoint = await runtime.addEndpoint({
    url: body.url,
    name: body.name,
    active: true,
    events: normalizeEvents(body.events),
    secret: body.secret,
  });

  return c.json({ ok: true, data: endpoint });
});

app.get("/webhook/endpoints", async (c) => {
  const runtime = await getRuntime(c.env);
  const endpoints = await runtime.listEndpoints();

  return c.json({ ok: true, data: endpoints });
});

app.post("/webhook/events/emit", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as EmitPayload;
  const runtime = await getRuntime(c.env);

  const type =
    typeof body.type === "string" && isWebhookEventType(body.type)
      ? body.type
      : WebhookEventType.MESSAGE_SENT;

  const eventId = body.messageId
    ? `evt_${body.messageId}`
    : `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const deliveries = await runtime.emitSync({
    id: eventId,
    type,
    timestamp: new Date(),
    data: body.payload ?? { message: "webhook event from example" },
    metadata: {
      messageId: body.messageId,
      providerId: body.providerId,
      channelId: body.channelId,
      templateId: body.templateId,
      correlationId: `corr_${Date.now()}`,
    },
    version: "1.0",
  });

  return c.json({
    ok: true,
    data: {
      count: deliveries.length,
      deliveries: deliveries.map((delivery) => ({
        id: delivery.id,
        endpointId: delivery.endpointId,
        status: delivery.status,
        createdAt: delivery.createdAt,
        completedAt: delivery.completedAt,
      })),
    },
  });
});

app.post("/webhook/receiver/local", async (c) => {
  const raw = await c.req.text();

  let parsed: unknown = raw;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // keep raw body
  }

  return c.json({
    ok: true,
    receivedAt: new Date().toISOString(),
    headers: Object.fromEntries(c.req.raw.headers.entries()),
    body: parsed,
  });
});

export default {
  fetch: app.fetch,
};
