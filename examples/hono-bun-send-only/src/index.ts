import { IWINVProvider } from "@k-msg/provider";
import { Hono } from "hono";
import { KMsg } from "k-msg";

type AdvancedSendInput = Parameters<KMsg["send"]>[0];
type AdvancedSendBody = Record<string, unknown> | Record<string, unknown>[];

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isAdvancedSendInput(value: unknown): value is AdvancedSendBody {
  if (isRecord(value)) {
    return true;
  }

  return Array.isArray(value) && value.every((item) => isRecord(item));
}

const kmsg = new KMsg({
  providers: [
    new IWINVProvider({
      apiKey: getRequiredEnv("IWINV_API_KEY"),
      smsApiKey: process.env.IWINV_SMS_API_KEY,
      smsAuthKey: process.env.IWINV_SMS_AUTH_KEY,
      smsSenderNumber: process.env.IWINV_SMS_SENDER_NUMBER,
    }),
  ],
});

const app = new Hono();

app.get("/", (c) =>
  c.json({
    ok: true,
    service: "k-msg bun send-only",
    routes: ["POST /send", "POST /send/sms"],
  }),
);

app.post("/send", async (c) => {
  const body = await c.req.json<unknown>();
  if (!isAdvancedSendInput(body)) {
    return c.json(
      {
        ok: false,
        message:
          "request body must be a JSON object or an array of JSON objects",
      },
      400,
    );
  }

  if (Array.isArray(body)) {
    const result = await kmsg.send(body as unknown as AdvancedSendInput);
    return c.json({ ok: true, data: result });
  }

  const result = await kmsg.send(body as unknown as AdvancedSendInput);
  if (result.isFailure) {
    return c.json({ ok: false, error: result.error.toJSON() }, 400);
  }

  return c.json({ ok: true, data: result.value });
});

app.post("/send/sms", async (c) => {
  const body = await c.req.json<{ to: string; text: string; from?: string }>();
  const result = await kmsg.send({
    to: body.to,
    text: body.text,
    from: body.from,
  });

  if (result.isFailure) {
    return c.json({ ok: false, error: result.error.toJSON() }, 400);
  }

  return c.json({ ok: true, data: result.value });
});

const port = Number(process.env.PORT ?? 3001);
Bun.serve({
  port,
  fetch: app.fetch,
});

console.log(`[k-msg] bun example running on http://127.0.0.1:${port}`);
