import {
  type WebhookEndpoint,
  WebhookEndpointConflictError,
} from "@k-msg/webhook";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { ConfigError, type Env, readConfig } from "./env";
import {
  ApiError,
  type AppEnv,
  errorBody,
  readJsonObject,
  requireAdmin,
  sendFailure,
} from "./http";
import { errorFields, log } from "./log";
import {
  createRuntime,
  type Runtime,
  sendStatusWebhook,
  toMessageStatus,
} from "./runtime";
import {
  parseEndpointRegistration,
  parseMessageId,
  parseReceivedEvent,
  parseSendMessage,
} from "./validation";
import {
  createWebhookRuntime,
  EVENT_ID_HEADER,
  generateEndpointSecret,
  normalizeEndpointUrl,
  SIGNATURE_HEADER,
  TIMESTAMP_HEADER,
  verifyWebhook,
} from "./webhooks";

const SEND_TIMEOUT_MS = 10_000;
const MAX_BODY_BYTES = 64 * 1024;

const app = new Hono<AppEnv>();

// Every request checks the configuration first, so a bad deploy fails with
// one logged message instead of halfway through a send.
app.use(async (c, next) => {
  c.set("config", readConfig(c.env));
  await next();
});

app.use(
  bodyLimit({
    maxSize: MAX_BODY_BYTES,
    onError: (c) =>
      c.json(
        errorBody(
          "PAYLOAD_TOO_LARGE",
          `The body exceeds ${MAX_BODY_BYTES} bytes`,
        ),
        413,
      ),
  }),
);

app.post("/messages", requireAdmin, async (c) => {
  const input = parseSendMessage(await readJsonObject(c.req));
  const config = c.var.config;
  const runtime = await createRuntime(config);

  // The tracking hook records the send in D1 before this resolves.
  const result = await runtime.kmsg.send(
    { to: input.to, text: input.text, from: config.senderNumber },
    { signal: AbortSignal.timeout(SEND_TIMEOUT_MS) },
  );
  if (result.isFailure) {
    const { error } = result;
    log("error", "send failed", {
      code: error.code,
      providerErrorCode: error.providerErrorCode ?? null,
      httpStatus: error.httpStatus ?? null,
      error: error.message,
    });
    throw sendFailure(error);
  }

  const { messageId, type, status } = result.value;
  // Tracking stores an accepted message with its status, usually SENT, and
  // the cron reports only later changes, so the first webhook goes from here.
  // waitUntil keeps the Worker alive for it without delaying the response.
  c.executionCtx.waitUntil(sendFirstWebhook(runtime, messageId));
  return c.json({ messageId, type, status }, 202, {
    Location: `/messages/${messageId}`,
  });
});

app.get("/messages/:messageId", requireAdmin, async (c) => {
  const messageId = parseMessageId(c.req.param("messageId"));
  const { tracking } = await createRuntime(c.var.config);
  const record = await tracking.getRecord(messageId);
  if (record === undefined) {
    throw new ApiError(404, "NOT_FOUND", "No message has this id");
  }
  return c.json(toMessageStatus(record));
});

app.post("/webhook-endpoints", requireAdmin, async (c) => {
  const input = parseEndpointRegistration(await readJsonObject(c.req));
  const config = c.var.config;

  let url: string;
  try {
    url = normalizeEndpointUrl(config, input.url);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid URL";
    throw new ApiError(400, "INVALID_WEBHOOK_URL", message);
  }

  const webhooks = createWebhookRuntime(config);
  const secret = generateEndpointSecret();
  let endpoint: WebhookEndpoint;
  try {
    endpoint = await webhooks.addEndpoint({
      id: crypto.randomUUID(),
      url,
      events: input.events,
      active: true,
      secret,
    });
  } catch (error) {
    // The unique url index refuses a registered URL in the insert itself,
    // so two registrations of one URL at the same moment cannot both win.
    if (
      error instanceof WebhookEndpointConflictError &&
      error.field === "url"
    ) {
      throw new ApiError(
        409,
        "ENDPOINT_EXISTS",
        "This URL is already registered",
      );
    }
    throw error;
  }

  // The only response that contains the secret; the receiver must keep it.
  return c.json(
    {
      id: endpoint.id,
      url: endpoint.url,
      events: endpoint.events,
      secret,
      createdAt: endpoint.createdAt.toISOString(),
    },
    201,
  );
});

// A sample receiver, so local development can show a signed delivery end to
// end. Register your own service's HTTPS URL in production; without
// WEBHOOK_RECEIVER_SECRET this route answers 404.
app.post("/webhooks/receiver", async (c) => {
  const secret = c.var.config.webhookReceiverSecret;
  if (secret === undefined) throw new ApiError(404, "NOT_FOUND", "Not found");

  // Verify the exact bytes that were signed before parsing them.
  const body = await c.req.text();
  const verification = verifyWebhook({
    body,
    signature: c.req.header(SIGNATURE_HEADER),
    timestamp: c.req.header(TIMESTAMP_HEADER),
    secret,
  });
  if (!verification.ok) {
    log("warn", "webhook rejected", {
      reason: verification.code,
      eventId: c.req.header(EVENT_ID_HEADER) ?? null,
    });
    throw new ApiError(401, verification.code, verification.message);
  }

  const event = parseReceivedEvent(body);

  // A status webhook can arrive more than once, and a repeat carries a fresh
  // timestamp, so skip event ids already processed. The id comes from the
  // signed body; the X-Webhook-ID header is not signed. A real receiver
  // records the id in the same transaction as its own changes.
  const { meta } = await c.var.config.db
    .prepare(
      "INSERT INTO sample_receiver_events (event_id, received_at) VALUES (?, ?) ON CONFLICT (event_id) DO NOTHING",
    )
    .bind(event.id, Date.now())
    .run();
  if (meta.changes === 0) {
    log("info", "duplicate webhook skipped", { eventId: event.id });
    return c.body(null, 204);
  }

  log("info", "webhook received", {
    eventId: event.id,
    type: event.type,
    messageId: event.messageId,
    status: event.status,
  });
  return c.body(null, 204);
});

app.notFound((c) => c.json(errorBody("NOT_FOUND", "Not found"), 404));

app.onError((error, c) => {
  if (error instanceof ApiError) {
    return c.json(
      errorBody(error.code, error.message),
      error.status,
      error.headers,
    );
  }
  if (error instanceof ConfigError) {
    log("error", "invalid configuration", { issues: error.issues });
    return c.json(
      errorBody(
        "CONFIGURATION_ERROR",
        "The service is misconfigured; see the Worker logs",
      ),
      500,
    );
  }
  log("error", "unhandled error", {
    method: c.req.method,
    path: c.req.path,
    ...errorFields(error),
  });
  return c.json(errorBody("INTERNAL_ERROR", "Internal server error"), 500);
});

async function sendFirstWebhook(
  { tracking, webhooks }: Runtime,
  messageId: string,
): Promise<void> {
  try {
    const record = await tracking.getRecord(messageId);
    // Missing when the tracking hook failed, which it has logged.
    if (record === undefined) return;
    await sendStatusWebhook(webhooks, record, null);
  } catch (error) {
    log("error", "status webhook failed", { messageId, ...errorFields(error) });
  }
}

/** Polls due messages and sends a webhook for each status that changed. */
async function pollDeliveryStatuses(env: Env): Promise<void> {
  const { tracking } = await createRuntime(readConfig(env));
  await tracking.runOnce();
}

export default {
  fetch: app.fetch,
  scheduled(_controller, env, ctx) {
    ctx.waitUntil(
      pollDeliveryStatuses(env).catch((error: unknown) => {
        log("error", "delivery status poll failed", errorFields(error));
        // Rethrown so the invocation is reported as failed.
        throw error;
      }),
    );
  },
} satisfies ExportedHandler<Env>;
