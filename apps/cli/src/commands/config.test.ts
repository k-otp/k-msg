import { describe, expect, test } from "bun:test";
import configGroup, {
  providerAddCmd,
  routingSeedTypesFor,
  shouldDefaultNewProviderAsDefault,
} from "./config";

describe("config command contract", () => {
  test("keeps config init on the prompt-driven handler path only", () => {
    const initCmd = configGroup.commands.find(
      (command) => command.name === "init",
    );

    expect(initCmd).toBeDefined();
    expect("render" in (initCmd as object)).toBe(false);
    expect("tui" in (initCmd as object)).toBe(false);
  });

  test("keeps config provider add on the prompt-driven handler path only", () => {
    expect("render" in (providerAddCmd as object)).toBe(false);
    expect("tui" in (providerAddCmd as object)).toBe(false);
  });

  test("defaults the new provider as default only when it is the first provider", () => {
    expect(shouldDefaultNewProviderAsDefault(0)).toBe(true);
    expect(shouldDefaultNewProviderAsDefault(1)).toBe(false);
    expect(shouldDefaultNewProviderAsDefault(2)).toBe(false);
  });

  test("seeds routing for an IWINV entry from the credentials it has", () => {
    const iwinv = (config: Record<string, string>) =>
      routingSeedTypesFor({ type: "iwinv", id: "iwinv", config });

    // An SMS-only entry must not become an ALIMTALK route: KMsg would pick it
    // for AlimTalk and fail instead of using another provider.
    expect(
      iwinv({
        smsApiKey: "env:IWINV_SMS_API_KEY",
        smsAuthKey: "env:IWINV_SMS_AUTH_KEY",
      }),
    ).toEqual(["SMS", "LMS", "MMS"]);
    expect(iwinv({ apiKey: "env:IWINV_API_KEY" })).toEqual(["ALIMTALK"]);
    expect(
      iwinv({
        apiKey: "env:IWINV_API_KEY",
        smsApiKey: "env:IWINV_SMS_API_KEY",
        smsAuthKey: "env:IWINV_SMS_AUTH_KEY",
      }),
    ).toEqual(["ALIMTALK", "SMS", "LMS", "MMS"]);
    expect(
      routingSeedTypesFor({ type: "aligo", id: "aligo", config: {} }),
    ).toEqual(["ALIMTALK", "FRIENDTALK", "SMS", "LMS", "MMS"]);
  });
});
