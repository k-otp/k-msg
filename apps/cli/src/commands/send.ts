import { readFileSync } from "node:fs";
import path from "node:path";
import { defineCommand, option } from "@bunli/core";
import type { SendInput } from "k-msg";
import { z } from "zod";
import { loadRuntime } from "../runtime";
import { optConfig, optJson, optProvider } from "../cli/options";
import { exitCodeForError, parseJson, printError } from "../cli/utils";

async function readStdinText(): Promise<string> {
  return await new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", reject);
  });
}

export default defineCommand({
  name: "send",
  description: "Advanced send using raw SendInput JSON",
  options: {
    config: optConfig,
    json: optJson,
    provider: optProvider,
    input: option(z.string().optional(), {
      description: "SendInput JSON string",
    }),
    file: option(z.string().optional(), {
      description: "Path to SendInput JSON file",
    }),
    stdin: option(z.coerce.boolean().default(false), {
      description: "Read SendInput JSON from stdin",
    }),
  },
  handler: async ({ flags }) => {
    try {
      const runtime = loadRuntime(flags.config);
      const modeCount = [
        flags.input,
        flags.file,
        flags.stdin ? "stdin" : undefined,
      ].filter((v): v is string => typeof v === "string" && v.trim().length > 0)
        .length;
      if (modeCount !== 1) {
        throw new Error("Use exactly one of --input, --file, or --stdin");
      }

      const raw = (() => {
        if (typeof flags.input === "string") return flags.input;
        if (typeof flags.file === "string") {
          const abs = path.isAbsolute(flags.file)
            ? flags.file
            : path.resolve(process.cwd(), flags.file);
          return readFileSync(abs, "utf8");
        }
        return undefined;
      })();

      const text =
        raw !== undefined ? raw : flags.stdin ? await readStdinText() : "";

      const parsed = parseJson(text, "SendInput");
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("SendInput must be a JSON object");
      }

      const inputRecord = parsed as Record<string, unknown>;
      const input = (flags.provider
        ? { ...inputRecord, providerId: flags.provider }
        : inputRecord) as unknown as SendInput;

      const result = await runtime.kmsg.send(input);
      if (result.isFailure) {
        printError(result.error, flags.json);
        process.exitCode = exitCodeForError(result.error);
        return;
      }

      if (flags.json) {
        console.log(
          JSON.stringify({ ok: true, result: result.value }, null, 2),
        );
        return;
      }

      console.log(
        `OK ${result.value.type} ${result.value.to} (${result.value.providerId})`,
      );
      console.log(`messageId=${result.value.messageId}`);
      if (result.value.providerMessageId) {
        console.log(`providerMessageId=${result.value.providerMessageId}`);
      }
    } catch (error) {
      printError(error, flags.json);
      process.exitCode = exitCodeForError(error);
    }
  },
});
