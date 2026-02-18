import path from "node:path";
import { defineCommand, option } from "@bunli/core";
import type { SendInput } from "@k-msg/core";
import { z } from "zod";
import { optConfig, optJson, optProvider } from "../cli/options";
import {
  exitCodeForError,
  printError,
  printWarnings,
  shouldUseJsonOutput,
} from "../cli/utils";
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
  .pipe(
    z.union([
      z.record(z.string(), z.unknown()),
      z.array(z.record(z.string(), z.unknown())),
    ]),
  );

async function readStdinText(): Promise<string> {
  // Bun exposes stdin as a BunFile.
  return await Bun.stdin.text();
}

export default defineCommand({
  name: "send",
  description: "Advanced send using raw SendInput JSON object/array",
  options: {
    config: optConfig,
    json: optJson,
    provider: optProvider,
    "dry-run": option(z.coerce.boolean().default(false), {
      description: "Validate raw JSON and preview only (no provider send)",
    }),
    input: option(sendInputJsonSchema.optional(), {
      description: "Raw SendInput JSON object/array string",
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
        description: "Path to raw SendInput JSON object/array file",
      },
    ),
    stdin: option(z.coerce.boolean().default(false), {
      description: "Read raw SendInput JSON object/array from stdin",
    }),
  },
  handler: async ({ flags, context }) => {
    const asJson = shouldUseJsonOutput(flags.json, context);
    try {
      const modeCount =
        (flags.input !== undefined ? 1 : 0) +
        (typeof flags.file === "string" ? 1 : 0) +
        (flags.stdin ? 1 : 0);
      if (modeCount !== 1) {
        throw new Error("Use exactly one of --input, --file, or --stdin");
      }

      let inputRecord: Record<string, unknown> | Array<Record<string, unknown>>;

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

      if (Array.isArray(inputRecord)) {
        const input = (flags.provider
          ? inputRecord.map((item) => ({ ...item, providerId: flags.provider }))
          : inputRecord) as unknown as SendInput[];

        if (flags["dry-run"]) {
          const items = input.map((item, index) => {
            const raw = item as unknown as Record<string, unknown>;
            return {
              index,
              type:
                typeof raw.type === "string" && raw.type.length > 0
                  ? raw.type
                  : "SMS",
              to: typeof raw.to === "string" ? raw.to : null,
              providerId:
                typeof raw.providerId === "string" ? raw.providerId : null,
              messageId:
                typeof raw.messageId === "string" ? raw.messageId : null,
            };
          });

          if (asJson) {
            console.log(
              JSON.stringify(
                {
                  ok: true,
                  dryRun: true,
                  summary: {
                    batch: true,
                    total: items.length,
                    providerOverride: flags.provider ?? null,
                  },
                  items,
                },
                null,
                2,
              ),
            );
            return;
          }

          console.log("DRY RUN - no messages were sent");
          console.log(
            `Preview: batch ${items.length} item(s)${flags.provider ? `, provider override ${flags.provider}` : ""}`,
          );
          for (const item of items) {
            const providerLabel = item.providerId ?? "-";
            const messageLabel = item.messageId ?? "-";
            console.log(
              `[${item.index}] ${item.type} to=${item.to ?? "-"} providerId=${providerLabel} messageId=${messageLabel}`,
            );
          }
          return;
        }

        const runtime = await loadRuntime(flags.config);

        const batch = await runtime.kmsg.send(input);

        if (asJson) {
          console.log(
            JSON.stringify(
              {
                ok: true,
                batch: {
                  total: batch.total,
                  results: batch.results,
                },
              },
              null,
              2,
            ),
          );
          return;
        }

        const success = batch.results.filter((item) => item.isSuccess).length;
        const fail = batch.results.length - success;
        console.log(
          `Batch Sent: Total ${batch.total}, Success ${success}, Fail ${fail}`,
        );

        if (fail > 0) {
          const rawItems = input as unknown as Array<Record<string, unknown>>;
          batch.results.forEach((item, index) => {
            if (item.isFailure) {
              const raw = rawItems[index] ?? {};
              const providerId =
                typeof raw.providerId === "string" && raw.providerId.length > 0
                  ? raw.providerId
                  : "-";
              const messageId =
                typeof raw.messageId === "string" && raw.messageId.length > 0
                  ? raw.messageId
                  : "-";
              console.log(
                `FAIL [${index}] providerId=${providerId} messageId=${messageId} ${item.error.code}: ${item.error.message}`,
              );
            }
          });
        }
        return;
      }

      const input = (flags.provider
        ? { ...inputRecord, providerId: flags.provider }
        : inputRecord) as unknown as SendInput;

      if (flags["dry-run"]) {
        const raw = input as unknown as Record<string, unknown>;
        const item = {
          index: 0,
          type:
            typeof raw.type === "string" && raw.type.length > 0
              ? raw.type
              : "SMS",
          to: typeof raw.to === "string" ? raw.to : null,
          providerId:
            typeof raw.providerId === "string" ? raw.providerId : null,
          messageId: typeof raw.messageId === "string" ? raw.messageId : null,
        };

        if (asJson) {
          console.log(
            JSON.stringify(
              {
                ok: true,
                dryRun: true,
                summary: {
                  batch: false,
                  total: 1,
                  providerOverride: flags.provider ?? null,
                },
                items: [item],
              },
              null,
              2,
            ),
          );
          return;
        }

        console.log("DRY RUN - no message was sent");
        console.log(
          `Preview: single ${item.type} to=${item.to ?? "-"} providerId=${item.providerId ?? "-"} messageId=${item.messageId ?? "-"}`,
        );
        return;
      }

      const runtime = await loadRuntime(flags.config);

      const result = await runtime.kmsg.send(input);
      if (result.isFailure) {
        printError(result.error, asJson);
        process.exitCode = exitCodeForError(result.error);
        return;
      }

      if (asJson) {
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
      printWarnings(result.value.warnings);
    } catch (error) {
      printError(error, asJson);
      process.exitCode = exitCodeForError(error);
    }
  },
});
