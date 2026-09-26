import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { ConfigError, type Env, readConfig } from "./env";
import {
  ApiError,
  type AppEnv,
  errorBody,
  readJsonObject,
  requireApiToken,
  sendFailure,
} from "./http";
import { errorFields, log } from "./log";
import { maskPhoneNumber } from "./providers";
import { openTrackingRuntime, toMessageStatus } from "./tracking";
import { parseMessageId, parseSendMessage } from "./validation";

const SEND_TIMEOUT_MS = 10_000;
const MAX_BODY_BYTES = 16 * 1024;

const app = new Hono<AppEnv>();

// Every request checks the configuration first, so a bad deploy fails with
// one logged message instead of halfway through a send.
app.use(async (c, next) => {
  c.set("config", readConfig(c.env));
  await next();
});

app.use(requireApiToken);

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

// A database client per request, closed after the response is sent.
app.use(async (c, next) => {
  const runtime = await openTrackingRuntime(c.var.config);
  c.set("runtime", runtime);
  try {
    await next();
  } finally {
    c.executionCtx.waitUntil(runtime.close());
  }
});

app.post("/messages", async (c) => {
  const input = parseSendMessage(await readJsonObject(c.req));
  const { config, runtime } = c.var;

  // The tracking hook records the send in Postgres before this resolves.
  const result = await runtime.kmsg.send(
    { to: input.to, text: input.text, from: config.senderNumber },
    { signal: AbortSignal.timeout(SEND_TIMEOUT_MS) },
  );
  if (result.isFailure) {
    const { error } = result;
    log("error", "send failed", {
      to: maskPhoneNumber(input.to),
      code: error.code,
      providerErrorCode: error.providerErrorCode ?? null,
      httpStatus: error.httpStatus ?? null,
      error: error.message,
    });
    throw sendFailure(error);
  }

  const { messageId, type, status } = result.value;
  log("info", "message sent", {
    messageId,
    to: maskPhoneNumber(input.to),
    providerId: result.value.providerId,
  });
  return c.json({ messageId, type, status }, 202, {
    Location: `/messages/${messageId}`,
  });
});

app.get("/messages/:messageId", async (c) => {
  const messageId = parseMessageId(c.req.param("messageId"));
  const record = await c.var.runtime.tracking.getRecord(messageId);
  if (record === undefined) {
    throw new ApiError(404, "NOT_FOUND", "No message has this id");
  }
  return c.json(toMessageStatus(record));
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

/** Polls the provider for messages that are due a status check. */
async function pollDeliveryStatuses(
  env: Env,
  ctx: ExecutionContext,
): Promise<void> {
  const runtime = await openTrackingRuntime(readConfig(env));
  try {
    await runtime.tracking.runOnce();
  } finally {
    ctx.waitUntil(runtime.close());
  }
}

export default {
  fetch: app.fetch,
  async scheduled(_controller, env, ctx) {
    try {
      await pollDeliveryStatuses(env, ctx);
    } catch (error) {
      log("error", "delivery status poll failed", errorFields(error));
      // Rethrown so the invocation is reported as failed.
      throw error;
    }
  },
} satisfies ExportedHandler<Env>;
