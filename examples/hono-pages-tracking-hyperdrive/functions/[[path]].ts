import {
  createDeliveryTrackingHooks,
  DeliveryTrackingService,
} from "@k-msg/messaging/tracking";
import { IWINVProvider } from "@k-msg/provider/iwinv";
import { Hono } from "hono";
import { KMsg, type SendInput } from "k-msg";
import {
  createCloudflareSqlClient,
  HyperdriveDeliveryTrackingStore,
} from "k-msg/adapters/cloudflare";
// NOTE: this example uses postgres.js for Hyperdrive and needs `nodejs_compat`.
import postgres from "postgres";

type Bindings = {
  HYPERDRIVE: Hyperdrive;
  IWINV_API_KEY: string;
  IWINV_SMS_API_KEY?: string;
  IWINV_SMS_AUTH_KEY?: string;
  IWINV_SMS_SENDER_NUMBER?: string;
  INTERNAL_CRON_TOKEN: string;
};

type MessagingApp = {
  send: KMsg["send"];
  getRecord: DeliveryTrackingService["getRecord"];
  runTrackingOnce: DeliveryTrackingService["runOnce"];
};

type SendPayload = SendInput | SendInput[];

let appPromise: Promise<MessagingApp> | undefined;

function getMessagingApp(env: Bindings): Promise<MessagingApp> {
  if (!appPromise) {
    appPromise = buildMessagingApp(env).catch((error) => {
      appPromise = undefined;
      throw error;
    });
  }
  return appPromise;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSendPayload(value: unknown): value is SendPayload {
  if (isRecord(value)) {
    return true;
  }

  return Array.isArray(value) && value.every((item) => isRecord(item));
}

async function buildMessagingApp(env: Bindings): Promise<MessagingApp> {
  const postgresClient = postgres(env.HYPERDRIVE.connectionString, {
    max: 1,
    prepare: false,
  });

  const sqlClient = createCloudflareSqlClient({
    dialect: "postgres",
    query: async <T = Record<string, unknown>>(
      statement: string,
      params: readonly unknown[] = [],
    ) => {
      const rows = await postgresClient.unsafe(statement, params as never[]);
      return {
        rows: rows as unknown as T[],
      };
    },
    close: async () => {
      await postgresClient.end({ timeout: 1 });
    },
  });

  const store = new HyperdriveDeliveryTrackingStore(sqlClient);

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
    store,
  });
  await tracking.init();

  const kmsg = new KMsg({
    providers,
    hooks: createDeliveryTrackingHooks(tracking),
  });

  return {
    send: kmsg.send.bind(kmsg),
    getRecord: tracking.getRecord.bind(tracking),
    runTrackingOnce: tracking.runOnce.bind(tracking),
  };
}

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", (c) =>
  c.json({
    ok: true,
    service: "k-msg tracking with hyperdrive",
    routes: [
      "POST /send",
      "POST /send/sms",
      "GET /tracking/:messageId",
      "POST /internal/tracking/run-once",
    ],
  }),
);

app.post("/send", async (c) => {
  const body = await c.req.json<unknown>();
  if (!isSendPayload(body)) {
    return c.json(
      {
        ok: false,
        message:
          "request body must be a JSON object or an array of JSON objects",
      },
      400,
    );
  }

  const svc = await getMessagingApp(c.env);
  if (Array.isArray(body)) {
    const result = await svc.send(body);
    return c.json({ ok: true, data: result });
  }

  const result = await svc.send(body);

  if (result.isFailure) {
    return c.json({ ok: false, error: result.error.toJSON() }, 400);
  }

  return c.json({ ok: true, data: result.value });
});

app.post("/send/sms", async (c) => {
  const body = await c.req.json<{ to: string; text: string; from?: string }>();
  const svc = await getMessagingApp(c.env);
  const result = await svc.send({
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
  const svc = await getMessagingApp(c.env);
  const record = await svc.getRecord(c.req.param("messageId"));

  if (!record) {
    return c.json({ ok: false, message: "not found" }, 404);
  }

  return c.json({ ok: true, data: record });
});

app.post("/internal/tracking/run-once", async (c) => {
  const requiredToken = c.env.INTERNAL_CRON_TOKEN?.trim();
  if (!requiredToken) {
    return c.text("server misconfigured: INTERNAL_CRON_TOKEN is required", 500);
  }

  if (c.req.header("x-cron-token") !== requiredToken) {
    return c.text("unauthorized", 401);
  }

  const svc = await getMessagingApp(c.env);
  await svc.runTrackingOnce();

  return c.json({ ok: true });
});

export const onRequest: PagesFunction<Bindings> = (context) =>
  app.fetch(context.request, context.env);
