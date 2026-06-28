import { describe, expect, test } from "bun:test";
import { runCommand } from "./cli.shared";

describe("runCommand", () => {
  test("uses the provided env as the final child environment", async () => {
    const result = await runCommand(
      [
        process.execPath,
        "-e",
        "console.log(process.env.CODEX_THREAD_ID ?? 'missing')",
      ],
      {
        env: {
          HOME: process.env.HOME,
          PATH: process.env.PATH,
        },
      },
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe("missing");
  });
});
