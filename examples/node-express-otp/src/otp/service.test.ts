import assert from "node:assert/strict";
import { test } from "node:test";
import { MockProvider } from "@k-msg/provider";
import { KMsg } from "k-msg";
import { OtpService } from "./service.ts";
import { InMemoryOtpStore } from "./store.ts";

const PHONE = "01012345678";

function setup() {
  const provider = new MockProvider();
  const otp = new OtpService({
    kmsg: new KMsg({ providers: [provider] }),
    store: new InMemoryOtpStore(),
    secret: "test-secret-with-at-least-32-bytes!",
    senderNumber: undefined,
  });
  // The mock records what it sent, which stands in for reading the phone.
  const sentCode = () => {
    const last = provider.getHistory().at(-1);
    const text = last !== undefined && "text" in last ? last.text : "";
    const code = /\d{6}/.exec(text)?.[0];
    assert.ok(code, "no code was sent");
    return code;
  };
  return { provider, otp, sentCode };
}

const wrong = (code: string) => (code === "000000" ? "111111" : "000000");

test("a code verifies once", async () => {
  const { otp, sentCode } = setup();
  assert.equal((await otp.request(PHONE)).status, "sent");
  const code = sentCode();

  assert.equal(await otp.verify(PHONE, code), "verified");
  assert.equal(await otp.verify(PHONE, code), "invalid_code");
});

test("five wrong codes lock the challenge", async () => {
  const { otp, sentCode } = setup();
  await otp.request(PHONE);
  const code = sentCode();

  for (let attempt = 1; attempt < 5; attempt++) {
    assert.equal(await otp.verify(PHONE, wrong(code)), "invalid_code");
  }
  assert.equal(await otp.verify(PHONE, wrong(code)), "too_many_attempts");
  assert.equal(await otp.verify(PHONE, code), "too_many_attempts");
});

test("a second request within the cooldown is rate limited", async () => {
  const { otp } = setup();
  await otp.request(PHONE);

  const result = await otp.request(PHONE);
  assert.equal(result.status, "rate_limited");
  assert.ok(result.status === "rate_limited" && result.retryAfterSeconds <= 60);
});

test("a provider failure is reported, not thrown", async () => {
  const { provider, otp } = setup();
  provider.mockFailure(1);

  const result = await otp.request(PHONE);
  assert.equal(result.status, "send_failed");
});
