import assert from "node:assert/strict";
import { test } from "node:test";
import { loadConfig } from "./env.ts";

const SECRET = "test-secret-with-at-least-32-bytes!";

function load(env: Record<string, string>) {
  return loadConfig({ OTP_SECRET: SECRET, ...env });
}

test("the mock provider needs only OTP_SECRET", () => {
  const config = load({});
  assert.equal(config.provider.name, "mock");
  assert.equal(config.maxSendsPerHour, 1000);
  assert.equal(config.trustProxy, undefined);
});

test("every problem is reported at once", () => {
  assert.throws(
    () =>
      loadConfig({
        KMSG_PROVIDER: "solapi",
        OTP_MAX_SENDS_PER_HOUR: "0",
      }),
    (error: Error) =>
      [
        "SOLAPI_API_KEY is required",
        "KMSG_SENDER_NUMBER is required",
        "OTP_SECRET must be at least 32 bytes",
        "OTP_MAX_SENDS_PER_HOUR must be a positive integer",
      ].every((problem) => error.message.includes(problem)),
  );
});

test("TRUST_PROXY takes a hop count, or addresses, subnets and presets", () => {
  assert.equal(load({ TRUST_PROXY: "1" }).trustProxy, 1);
  assert.equal(load({ TRUST_PROXY: "false" }).trustProxy, undefined);
  assert.equal(
    load({ TRUST_PROXY: "loopback, 10.0.0.0/8, fd00::/8" }).trustProxy,
    "loopback,10.0.0.0/8,fd00::/8",
  );
});

test("TRUST_PROXY refuses true and anything Express could not parse", () => {
  assert.throws(() => load({ TRUST_PROXY: "true" }), /TRUST_PROXY=true/);
  for (const value of ["banana", "10.0.0.999", "10.0.0.0/33", "10.0.0.0/8/1"]) {
    assert.throws(
      () => load({ TRUST_PROXY: value }),
      /TRUST_PROXY must be/,
      value,
    );
  }
});
