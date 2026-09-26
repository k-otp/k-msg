import type { DeliveryTrackingService } from "@k-msg/messaging/tracking";
import { type Context, Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { ErrorUtils, type KMsgError, KMsgErrorCode } from "k-msg";
import { requireBearerToken } from "./auth";
import type { SendOutcome, ShippingNotifier } from "./notifier";
import {
  parseShippedBatch,
  parseShippedOrder,
  type ShippedOrder,
} from "./orders";
import { maskPhone } from "./phone";

const MAX_BATCH_SIZE = 100;

export interface AppOptions {
  apiToken: string;
  notifier: ShippingNotifier;
  tracking: DeliveryTrackingService;
}

export function createApp({ apiToken, notifier, tracking }: AppOptions): Hono {
  const app = new Hono();
  app.use(requireBearerToken(apiToken));
  app.use(
    bodyLimit({
      maxSize: 64 * 1024,
      onError: (c) =>
        c.json(
          errorBody("PAYLOAD_TOO_LARGE", "The request body is too large."),
          413,
        ),
    }),
  );

  app.post("/orders/:orderId/shipped", async (c) => {
    const body = await readJson(c);
    if (!body.ok) return invalidJson(c);
    const parsed = parseShippedOrder(c.req.param("orderId"), body.value);
    if (!parsed.ok) return invalidRequest(c, parsed.problems);

    const outcome = await notifier.notify(parsed.value);
    if (outcome.isFailure) {
      logFailure(parsed.value, outcome.error);
      const failure = describeFailure(outcome.error);
      return c.json(errorBody(failure.code, failure.message), failure.status);
    }
    return c.json({ messageId: outcome.value.messageId }, 202);
  });

  app.post("/orders/shipped/batch", async (c) => {
    const body = await readJson(c);
    if (!body.ok) return invalidJson(c);
    const parsed = parseShippedBatch(body.value, MAX_BATCH_SIZE);
    if (!parsed.ok) return invalidRequest(c, parsed.problems);

    const outcomes = await notifier.notifyAll(parsed.value);
    const results = parsed.value.map((order, index) =>
      describeOutcome(order, outcomes[index]),
    );
    const sent = results.filter((result) => result.ok).length;
    return c.json({
      total: results.length,
      sent,
      failed: results.length - sent,
      results,
    });
  });

  app.get("/notifications/:messageId", async (c) => {
    const record = await tracking.getRecord(c.req.param("messageId"));
    if (!record) {
      return c.json(
        errorBody("NOT_FOUND", "No notification has this id."),
        404,
      );
    }
    return c.json({
      messageId: record.messageId,
      type: record.type,
      to: maskPhone(record.to),
      status: record.status,
      requestedAt: record.requestedAt,
      statusUpdatedAt: record.statusUpdatedAt,
      deliveredAt: record.deliveredAt,
      failedAt: record.failedAt,
    });
  });

  app.notFound((c) => c.json(errorBody("NOT_FOUND", "Not found."), 404));
  app.onError((error, c) => {
    console.error("[http] unhandled error", error);
    return c.json(errorBody("INTERNAL_ERROR", "Internal server error."), 500);
  });
  return app;
}

function describeOutcome(order: ShippedOrder, outcome: SendOutcome) {
  if (outcome.isSuccess) {
    return {
      orderId: order.orderId,
      ok: true,
      messageId: outcome.value.messageId,
    } as const;
  }
  logFailure(order, outcome.error);
  const { code, message } = describeFailure(outcome.error);
  return {
    orderId: order.orderId,
    ok: false,
    error: { code, message },
  } as const;
}

// The provider's own error text stays in the server log; callers only learn
// whether retrying later can help.
function describeFailure(error: KMsgError) {
  if (error.code === KMsgErrorCode.RATE_LIMIT_EXCEEDED) {
    return {
      status: 429,
      code: "RATE_LIMITED",
      message: "The provider is rate limiting sends. Try again later.",
    } as const;
  }
  if (ErrorUtils.isRetryable(error)) {
    return {
      status: 503,
      code: "PROVIDER_UNAVAILABLE",
      message: "The notification could not be sent. Try again later.",
    } as const;
  }
  return {
    status: 502,
    code: "PROVIDER_ERROR",
    message: "The notification could not be sent.",
  } as const;
}

function logFailure(order: ShippedOrder, error: KMsgError): void {
  console.error(
    `[orders] ${order.orderId}: AlimTalk to ${maskPhone(order.phone)} failed: ${error.code} ${error.message}`,
  );
}

async function readJson(
  c: Context,
): Promise<{ ok: true; value: unknown } | { ok: false }> {
  try {
    return { ok: true, value: await c.req.json() };
  } catch {
    return { ok: false };
  }
}

function invalidJson(c: Context) {
  return c.json(
    errorBody("INVALID_JSON", "The request body must be JSON."),
    400,
  );
}

function invalidRequest(c: Context, problems: string[]) {
  const shown = problems.slice(0, 10).join("; ");
  return c.json(errorBody("INVALID_REQUEST", shown), 400);
}

function errorBody(code: string, message: string) {
  return { error: { code, message } };
}
