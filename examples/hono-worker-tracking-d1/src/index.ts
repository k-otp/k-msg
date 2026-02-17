import { IWINVProvider } from "@k-msg/provider/iwinv";
import { Hono } from "hono";
import { KMsg } from "k-msg";
import { createD1DeliveryTrackingStore } from "k-msg/adapters/cloudflare";
import {
  createDeliveryTrackingHooks,
  DeliveryTrackingService,
} from "@k-msg/messaging/tracking";

type Env = {
  DB: D1Database;
  IWINV_API_KEY: string;
  IWINV_SMS_API_KEY?: string;
  IWINV_SMS_AUTH_KEY?: string;
  IWINV_SMS_SENDER_NUMBER?: string;
  TRACKING_ADMIN_TOKEN?: string;
};

type Runtime = {
  kmsg: KMsg;
  tracking: DeliveryTrackingService;
};

let runtimePromise: Promise<Runtime> | undefined;

function getRuntime(env: Env): Promise<Runtime> {
  if (!runtimePromise) {
    runtimePromise = buildRuntime(env);
  }
  return runtimePromise;
}

async function buildRuntime(env: Env): Promise<Runtime> {
  const providers = [
    new IWINVProvider({
      apiKey: env.IWINV_API_KEY,
      smsApiKey: env.IWINV_SMS_API_KEY,
      smsAuthKey: env.IWINV_SMS_AUTH_KEY,
      smsSenderNumber: env.IWINV_SMS_SENDER_NUMBER,
    }),
  ];

  const tracking = new DeliveryTrackingService({
    providers,
    store: createD1DeliveryTrackingStore(env.DB),
  });
  await tracking.init();

  const kmsg = new KMsg({
    providers,
    hooks: createDeliveryTrackingHooks(tracking),
  });

  return { kmsg, tracking };
}

const app = new Hono<{ Bindings: Env }>();

app.get("/", (c) =>
  c.json({
    ok: true,
    service: "k-msg tracking with d1",
    routes: [
      "POST /send/sms",
      "GET /tracking/:messageId",
      "POST /tracking/run-once",
    ],
  }),
);

app.post("/send/sms", async (c) => {
  const body = await c.req.json<{ to: string; text: string; from?: string }>();
  const runtime = await getRuntime(c.env);
  const result = await runtime.kmsg.send({
    to: body.to,
    text: body.text,
    from: body.from,
  });

  if (result.isFailure) {
    return c.json({ ok: false, error: result.error.toJSON() }, 400);
  }

  return c.json({ ok: true, data: result.value });
});

app.get("/tracking/:messageId", async (c) => {
  const runtime = await getRuntime(c.env);
  const record = await runtime.tracking.getRecord(c.req.param("messageId"));

  if (!record) {
    return c.json({ ok: false, message: "not found" }, 404);
  }

  return c.json({ ok: true, data: record });
});

app.post("/tracking/run-once", async (c) => {
  const authToken = c.req.header("x-admin-token");
  const requiredToken = c.env.TRACKING_ADMIN_TOKEN?.trim();

  if (requiredToken && authToken !== requiredToken) {
    return c.json({ ok: false, message: "unauthorized" }, 401);
  }

  const runtime = await getRuntime(c.env);
  await runtime.tracking.runOnce();
  return c.json({ ok: true });
});

export default {
  fetch: app.fetch,
};
