import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { ConfigError, type Env, readConfig } from "./env";
import {
  ApiError,
  type AppEnv,
  errorBody,
  readJsonObject,
  requireApiToken,
} from "./http";
import { errorFields, log } from "./log";
import {
  isPlausibleJobId,
  parseIdempotencyKey,
  parseSendMessage,
} from "./validation";

// Wrangler needs the Durable Object class exported from the main module.
export { SendQueue } from "./send-queue";

const MAX_BODY_BYTES = 16 * 1024;

/** The one queue this Worker uses. Every route goes through this stub. */
function sendQueue(env: Env) {
  return env.SEND_QUEUE.getByName("default");
}

const app = new Hono<AppEnv>();

// Every request checks the configuration first, so a bad deploy fails with
// one logged message instead of halfway through a request.
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

app.post("/messages", async (c) => {
  const idempotencyKey = parseIdempotencyKey(c.req.header("Idempotency-Key"));
  const message = parseSendMessage(await readJsonObject(c.req));

  const result = await sendQueue(c.env).enqueue(idempotencyKey, message);
  if (result.outcome === "key_reused") {
    throw new ApiError(
      422,
      "IDEMPOTENCY_KEY_REUSED",
      "This Idempotency-Key was already used for a different message",
    );
  }

  const headers: Record<string, string> = {
    Location: `/messages/${result.jobId}`,
  };
  // A retry of an accepted request gets the same answer, marked as a replay.
  if (result.outcome === "replayed") headers["Idempotent-Replayed"] = "true";
  return c.json({ jobId: result.jobId }, 202, headers);
});

app.get("/messages/:jobId", async (c) => {
  const jobId = c.req.param("jobId");
  const job = isPlausibleJobId(jobId)
    ? await sendQueue(c.env).getJob(jobId)
    : null;
  if (job === null) {
    throw new ApiError(
      404,
      "NOT_FOUND",
      "No job has this id; finished jobs are deleted by the periodic cleanup",
    );
  }
  return c.json(job);
});

app.get("/queue/stats", async (c) => c.json(await sendQueue(c.env).stats()));

app.post("/queue/drain", async (c) => c.json(await sendQueue(c.env).drain()));

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
  if (isTransientDurableObjectError(error)) {
    log("warn", "queue unavailable", errorFields(error));
    // POST /messages is idempotent, so a client can safely retry.
    return c.json(
      errorBody("QUEUE_UNAVAILABLE", "The queue is busy; retry shortly"),
      503,
      { "Retry-After": "1" },
    );
  }
  log("error", "unhandled error", {
    method: c.req.method,
    path: c.req.path,
    ...errorFields(error),
  });
  return c.json(errorBody("INTERNAL_ERROR", "Internal server error"), 500);
});

// Durable Object calls that may succeed when retried fail with `retryable`
// or `overloaded` set on the error.
function isTransientDurableObjectError(error: Error): boolean {
  return (
    ("retryable" in error && error.retryable === true) ||
    ("overloaded" in error && error.overloaded === true)
  );
}

export default { fetch: app.fetch } satisfies ExportedHandler<Env>;
