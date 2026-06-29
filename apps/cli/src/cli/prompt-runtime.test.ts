import { describe, expect, test } from "bun:test";
import { EventEmitter } from "node:events";
import {
  createReadlinePromptWithInterface,
  PromptCancelledError,
} from "./prompt-runtime";

class FakeReadline extends EventEmitter {
  callback: ((answer: string) => void) | undefined;

  close(): void {}

  question(_query: string, callback: (answer: string) => void): void {
    this.callback = callback;
  }
}

describe("prompt runtime", () => {
  test("rejects text prompts when readline closes", async () => {
    const rl = new FakeReadline();
    const prompt = createReadlinePromptWithInterface(rl);

    const pending = prompt.text("Name");
    rl.emit("close");

    await expect(pending).rejects.toBeInstanceOf(PromptCancelledError);
  });

  test("rejects text prompts when readline receives SIGINT", async () => {
    const rl = new FakeReadline();
    const prompt = createReadlinePromptWithInterface(rl);

    const pending = prompt.text("Name");
    rl.emit("SIGINT");

    await expect(pending).rejects.toBeInstanceOf(PromptCancelledError);
  });

  test("renders select value metadata on a dedicated hint line", async () => {
    const rl = new FakeReadline();
    const lines: string[] = [];
    const prompt = createReadlinePromptWithInterface(rl, {
      printLine: (line) => lines.push(line),
    });

    const pending = prompt.select("Select provider type", {
      default: "mock",
      options: [
        {
          label: "Mock (local test)",
          value: "mock",
        },
        {
          hint: "senderKey=ALIGO_PROFILE | plusId=@brand-main",
          label: "main (Main)",
          value: "main",
        },
      ],
    });

    rl.callback?.("");

    await expect(pending).resolves.toBe("mock");
    expect(lines).toContain("  1. Mock (local test) (default)");
    expect(lines).toContain("     value: mock");
    expect(lines).not.toContain("  1. Mock (local test) [mock] (default)");
    expect(lines).toContain(
      "     senderKey=ALIGO_PROFILE | plusId=@brand-main | value: main",
    );
  });
});
