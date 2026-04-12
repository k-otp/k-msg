import { describe, expect, test } from "bun:test";
import configGroup, { providerAddCmd } from "./config";

describe("config provider add TUI", () => {
  test("keeps alternate-buffer rendering enabled", () => {
    expect(typeof providerAddCmd.render).toBe("function");
    expect(providerAddCmd.tui?.renderer?.bufferMode).toBe("alternate");
  });

  test("config init keeps alternate-buffer rendering enabled", () => {
    const initCmd = configGroup.commands.find(
      (command) => command.name === "init",
    );
    expect(initCmd).toBeDefined();
    expect(typeof initCmd?.render).toBe("function");
    expect(initCmd?.tui?.renderer?.bufferMode).toBe("alternate");
  });
});
