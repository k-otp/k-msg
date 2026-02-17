import { IWINVProvider } from "@k-msg/provider/iwinv";
import { Hono } from "hono";
import { KMsg } from "k-msg";

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

type AdvancedSendInput = Parameters<KMsg["send"]>[0];

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

async function sendWithKMsg(c: { env: Bindings }, input: AdvancedSendInput) {
  const kmsg = await getKMsg(c.env);
  return await kmsg.send(input);
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
  if (!isRecord(body)) {
    return c.json(
      { ok: false, message: "request body must be a JSON object" },
      400,
    );
  }

  const result = await sendWithKMsg(c, body as AdvancedSendInput);

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

  const result = await sendWithKMsg(c, { to, text, from });

  if (result.isFailure) {
    return c.json({ ok: false, error: result.error.toJSON() }, 400);
  }

  return c.json({ ok: true, data: result.value });
});

export const onRequest = (context: PagesContext) =>
  app.fetch(context.request, context.env, context);
