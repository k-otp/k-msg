import { IWINVProvider } from "@k-msg/provider";
import express from "express";
import { KMsg } from "k-msg";

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isAdvancedSendInput(value) {
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

const app = express();
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "k-msg express node send-only",
    routes: ["POST /send", "POST /send/sms"],
  });
});

app.post("/send", async (req, res) => {
  if (!isAdvancedSendInput(req.body)) {
    return res.status(400).json({
      ok: false,
      message: "request body must be a JSON object or an array of JSON objects",
    });
  }

  if (Array.isArray(req.body)) {
    const result = await kmsg.send(req.body);
    return res.json({ ok: true, data: result });
  }

  const result = await kmsg.send(req.body);
  if (result.isFailure) {
    return res.status(400).json({ ok: false, error: result.error.toJSON() });
  }

  return res.json({ ok: true, data: result.value });
});

app.post("/send/sms", async (req, res) => {
  const result = await kmsg.send({
    to: req.body?.to,
    text: req.body?.text,
    from: req.body?.from,
  });

  if (result.isFailure) {
    return res.status(400).json({ ok: false, error: result.error.toJSON() });
  }

  return res.json({ ok: true, data: result.value });
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(
    `[k-msg] express node example running on http://127.0.0.1:${port}`,
  );
});
