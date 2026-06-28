import { describe, expect, test } from "bun:test";
import configGroup, {
  providerAddCmd,
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
});
