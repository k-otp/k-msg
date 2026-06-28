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
});
