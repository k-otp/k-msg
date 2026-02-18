import { IWINVProvider } from "@k-msg/provider/iwinv";
import { Hono } from "hono";
import { KMsg, type SendInput } from "k-msg";

type Bindings = {
  IWINV_API_KEY: string;
  IWINV_SMS_API_KEY?: string;
  IWINV_SMS_AUTH_KEY?: string;
  IWINV_SMS_SENDER_NUMBER?: string;
};

type PagesContext = {
  request: Request;
  env: Bindings;
  waitUntil: ExecutionContext["waitUntil"];
  passThroughOnException: ExecutionContext["passThroughOnException"];
};

type SendPayload = SendInput | SendInput[];

const app = new Hono<{ Bindings: Bindings }>();

let kmsgPromise: Promise<KMsg> | undefined;

function getKMsg(env: Bindings): Promise<KMsg> {
  if (!kmsgPromise) {
    kmsgPromise = Promise.resolve(
      new KMsg({
        providers: [
          new IWINVProvider({
            apiKey: env.IWINV_API_KEY,
            smsApiKey: env.IWINV_SMS_API_KEY,
            smsAuthKey: env.IWINV_SMS_AUTH_KEY,
            smsSenderNumber: env.IWINV_SMS_SENDER_NUMBER,
          }),
        ],
      }),
    ).catch((error) => {
      kmsgPromise = undefined;
      throw error;
    });
  }
  return kmsgPromise;
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

app.get("/", (c) =>
  c.json({
    ok: true,
    service: "k-msg send-only",
    routes: ["POST /send", "POST /send/sms"],
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

  const kmsg = await getKMsg(c.env);
  if (Array.isArray(body)) {
    const result = await kmsg.send(body);
    return c.json({ ok: true, data: result });
  }

  const result = await kmsg.send(body);

  if (result.isFailure) {
    return c.json({ ok: false, error: result.error.toJSON() }, 400);
  }

  return c.json({ ok: true, data: result.value });
});

app.post("/send/sms", async (c) => {
  const { to, text, from } = await c.req.json<{
    to: string;
    text: string;
    from?: string;
  }>();

  const kmsg = await getKMsg(c.env);
  const result = await kmsg.send({ to, text, from });

  if (result.isFailure) {
    return c.json({ ok: false, error: result.error.toJSON() }, 400);
  }

  return c.json({ ok: true, data: result.value });
});

export const onRequest = (context: PagesContext) =>
  app.fetch(context.request, context.env, context);
