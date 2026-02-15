import path from "node:path";
import { defineCommand, option } from "@bunli/core";
import type { SendInput } from "k-msg";
import { z } from "zod";
import { optConfig, optJson, optProvider } from "../cli/options";
import { exitCodeForError, printError } from "../cli/utils";
import { loadRuntime } from "../runtime";

const sendInputJsonSchema = z
  .string()
  .min(1)
  .transform((value, ctx) => {
    try {
      return JSON.parse(value) as unknown;
    } catch (error) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid JSON for SendInput: ${
          error instanceof Error ? error.message : String(error)
        }`,
      });
      return z.NEVER;
    }
  })
  .pipe(z.record(z.string(), z.unknown()));

async function readStdinText(): Promise<string> {
  // Bun exposes stdin as a BunFile.
  return await Bun.stdin.text();
}

export default defineCommand({
  name: "send",
  description: "Advanced send using raw SendInput JSON",
  options: {
    config: optConfig,
    json: optJson,
    provider: optProvider,
    input: option(sendInputJsonSchema.optional(), {
      description: "SendInput JSON string",
    }),
    file: option(
      z
        .string()
        .min(1)
        .transform((value) =>
          path.isAbsolute(value) ? value : path.resolve(value),
        )
        .optional(),
      {
        description: "Path to SendInput JSON file",
      },
    ),
    stdin: option(z.coerce.boolean().default(false), {
      description: "Read SendInput JSON from stdin",
    }),
  },
  handler: async ({ flags }) => {
    try {
      const runtime = await loadRuntime(flags.config);
      const modeCount =
        (flags.input !== undefined ? 1 : 0) +
        (typeof flags.file === "string" ? 1 : 0) +
        (flags.stdin ? 1 : 0);
      if (modeCount !== 1) {
        throw new Error("Use exactly one of --input, --file, or --stdin");
      }

      let inputRecord: Record<string, unknown>;

      if (flags.input !== undefined) {
        inputRecord = flags.input;
      } else if (typeof flags.file === "string") {
        const abs = flags.file;
        const file = Bun.file(abs);
        if (!(await file.exists())) {
          throw new Error(`File not found: ${abs}`);
        }
        inputRecord = sendInputJsonSchema.parse(await file.text());
      } else {
        inputRecord = sendInputJsonSchema.parse(await readStdinText());
      }

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
