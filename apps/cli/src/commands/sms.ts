import type { SendInput } from "@k-msg/core";
import { z } from "zod";
import { defineCommand, defineGroup, option } from "../cli/command-contract";
import {
  booleanFlagOption,
  optConfig,
  optJson,
  optProvider,
  strictBooleanFlagSchema,
} from "../cli/options";
import { isPromptCancelledError } from "../cli/prompt";
import {
  exitCodeForError,
  printError,
  printWarnings,
  shouldUseJsonOutput,
} from "../cli/utils";
import { loadRuntime } from "../runtime";
import {
  buildInteractiveSmsInput,
  ensureInteractiveSendAllowed,
} from "./send-interactive";

function requireFlag(value: string | undefined, label: string): string {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }
  throw new Error(`${label} is required`);
}

const sendCmd = defineCommand({
  name: "send",
  description: "Send SMS/LMS/MMS",
  options: {
    config: optConfig,
    json: optJson,
    provider: optProvider,
    interactive: booleanFlagOption(strictBooleanFlagSchema, {
      description:
        "Prompt for missing send fields in an interactive terminal (boolean: --interactive, --interactive true|false, --no-interactive; default: false)",
    }),
    to: option(z.string().min(1).optional(), {
      description: "Recipient phone number",
    }),
    text: option(z.string().min(1).optional(), {
      description: "Message text",
    }),
    from: option(z.string().optional(), { description: "Sender number" }),
    type: option(z.enum(["SMS", "LMS", "MMS"]).optional(), {
      description: "Force message type",
    }),
    "scheduled-at": option(z.coerce.date().optional(), {
      description: "Schedule time (ISO string)",
    }),
  },
  handler: async ({ flags, context, prompt, terminal }) => {
    const asJson = flags.interactive
      ? false
      : shouldUseJsonOutput(flags.json, context);
    try {
      ensureInteractiveSendAllowed({
        commandPath: "k-msg sms send",
        interactive: flags.interactive,
        json: flags.json,
        terminal,
      });

      const runtime = await loadRuntime(flags.config);
      const scheduledAt = flags["scheduled-at"];
      const input: SendInput = flags.interactive
        ? await buildInteractiveSmsInput({
            draft: {
              from: flags.from,
              provider: flags.provider,
              scheduledAt,
              text: flags.text,
              to: flags.to,
            },
            prompt,
            runtime,
          })
        : flags.type !== undefined
          ? {
              type: flags.type,
              to: requireFlag(flags.to, "Recipient phone number"),
              from: flags.from,
              text: requireFlag(flags.text, "Message text"),
              ...(flags.provider ? { providerId: flags.provider } : {}),
              ...(scheduledAt ? { options: { scheduledAt } } : {}),
            }
          : {
              to: requireFlag(flags.to, "Recipient phone number"),
              from: flags.from,
              text: requireFlag(flags.text, "Message text"),
              ...(flags.provider ? { providerId: flags.provider } : {}),
              ...(scheduledAt ? { options: { scheduledAt } } : {}),
            };

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
      if (isPromptCancelledError(error)) {
        console.error("Prompt cancelled.");
        process.exitCode = 2;
        return;
      }
      printError(error, asJson);
      process.exitCode = exitCodeForError(error);
    }
  },
});

export default defineGroup({
  name: "sms",
  description: "SMS utilities",
  commands: [sendCmd],
});
