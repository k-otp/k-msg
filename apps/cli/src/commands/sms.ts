import { defineCommand, option } from "@bunli/core";
import type { SendInput } from "k-msg";
import { z } from "zod";
import { optConfig, optJson, optProvider } from "../cli/options";
import { exitCodeForError, printError } from "../cli/utils";
import { loadRuntime } from "../runtime";

const sendCmd = defineCommand({
  name: "send",
  description: "Send SMS/LMS/MMS",
  options: {
    config: optConfig,
    json: optJson,
    provider: optProvider,
    to: option(z.string().min(1), { description: "Recipient phone number" }),
    text: option(z.string().min(1), { description: "Message text" }),
    from: option(z.string().optional(), { description: "Sender number" }),
    type: option(z.enum(["SMS", "LMS", "MMS"]).optional(), {
      description: "Force message type",
    }),
    "scheduled-at": option(z.coerce.date().optional(), {
      description: "Schedule time (ISO string)",
    }),
  },
  handler: async ({ flags }) => {
    try {
      const runtime = await loadRuntime(flags.config);
      const scheduledAt = flags["scheduled-at"];
      const input: SendInput =
        flags.type !== undefined
          ? {
              type: flags.type,
              to: flags.to,
              from: flags.from,
              text: flags.text,
              ...(flags.provider ? { providerId: flags.provider } : {}),
              ...(scheduledAt ? { options: { scheduledAt } } : {}),
            }
          : {
              to: flags.to,
              from: flags.from,
              text: flags.text,
              ...(flags.provider ? { providerId: flags.provider } : {}),
              ...(scheduledAt ? { options: { scheduledAt } } : {}),
            };

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

export default defineCommand({
  name: "sms",
  description: "SMS utilities",
  commands: [sendCmd],
  handler: async () => {
    console.log("Use a subcommand: send");
  },
});
