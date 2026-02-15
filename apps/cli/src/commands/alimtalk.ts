import { defineCommand, option } from "@bunli/core";
import type { MessageVariables, SendInput } from "k-msg";
import { z } from "zod";
import { loadRuntime, resolveKakaoChannelSenderKey } from "../runtime";
import { optConfig, optJson, optProvider } from "../cli/options";
import { exitCodeForError, parseIsoDate, parseJson, printError } from "../cli/utils";

const sendCmd = defineCommand({
  name: "send",
  description: "Send AlimTalk",
  options: {
    config: optConfig,
    json: optJson,
    provider: optProvider,
    to: option(z.string().min(1), { description: "Recipient phone number" }),
    from: option(z.string().optional(), { description: "Sender number" }),
    "template-code": option(z.string().min(1), {
      description: "Template code",
    }),
    vars: option(z.string().min(1), { description: "Variables as JSON" }),
    channel: option(z.string().optional(), {
      description: "Kakao channel alias (from config)",
    }),
    "sender-key": option(z.string().optional(), {
      description: "Kakao channel senderKey override",
    }),
    "scheduled-at": option(z.string().optional(), {
      description: "Schedule time (ISO string)",
    }),
  },
  handler: async ({ flags }) => {
    try {
      const runtime = await loadRuntime(flags.config);
      const scheduledAt = parseIsoDate(flags["scheduled-at"], "scheduled-at");
      const rawVars = parseJson(flags.vars, "vars");
      if (!rawVars || typeof rawVars !== "object" || Array.isArray(rawVars)) {
        throw new Error("vars must be a JSON object");
      }

      const senderKey = resolveKakaoChannelSenderKey(runtime.config, {
        channelAlias: flags.channel,
        senderKey: flags["sender-key"],
      });

      const input: SendInput = {
        type: "ALIMTALK",
        to: flags.to,
        from: flags.from,
        templateCode: flags["template-code"],
        variables: rawVars as MessageVariables,
        ...(senderKey ? { kakao: { profileId: senderKey } } : {}),
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
        `OK ALIMTALK ${result.value.to} (${result.value.providerId})`,
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
  name: "alimtalk",
  description: "AlimTalk utilities",
  commands: [sendCmd],
  handler: async () => {
    console.log("Use a subcommand: send");
  },
});
