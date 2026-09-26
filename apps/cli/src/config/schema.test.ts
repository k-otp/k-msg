import { describe, expect, test } from "bun:test";
import { kMsgCliConfigSchema } from "./schema";

function parseIwinvConfig(config: Record<string, unknown>) {
  return kMsgCliConfigSchema.safeParse({
    version: 1,
    providers: [{ type: "iwinv", id: "iwinv", config }],
  });
}

describe("provider config schema", () => {
  test.each([
    ["the AlimTalk apiKey", { apiKey: "env:IWINV_API_KEY" }],
    [
      "both SMS keys",
      {
        smsApiKey: "env:IWINV_SMS_API_KEY",
        smsAuthKey: "env:IWINV_SMS_AUTH_KEY",
      },
    ],
  ])("accepts an IWINV config with %s", (_label, config) => {
    expect(parseIwinvConfig(config).success).toBe(true);
  });

  test.each([
    ["no credentials", {}],
    ["a single SMS key", { smsApiKey: "env:IWINV_SMS_API_KEY" }],
  ])("rejects an IWINV config with %s", (_label, config) => {
    // IWINVProvider needs apiKey or both SMS keys, so validation must not
    // accept a config the provider cannot be created from.
    const result = parseIwinvConfig(config);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("apiKey");
    }
  });
});
