import { defineCommand, option } from "@bunli/core";
import type { MessageVariables, SendInput } from "k-msg";
import { z } from "zod";
import { optConfig, optJson, optProvider } from "../cli/options";
import {
  exitCodeForError,
  printError,
  printWarnings,
  shouldUseJsonOutput,
} from "../cli/utils";
import { loadRuntime, resolveKakaoChannelSenderKey } from "../runtime";

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
    vars: option(
      z
        .string()
        .min(1)
        .transform((value, ctx) => {
          try {
            return JSON.parse(value) as unknown;
          } catch (error) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Invalid JSON for vars: ${
                error instanceof Error ? error.message : String(error)
              }`,
            });
            return z.NEVER;
          }
        })
        .pipe(z.record(z.string(), z.unknown())),
      { description: "Variables as JSON object" },
    ),
    channel: option(z.string().optional(), {
      description: "Kakao channel alias (from config)",
    }),
    "sender-key": option(z.string().optional(), {
      description: "Kakao channel senderKey override",
    }),
    "scheduled-at": option(z.coerce.date().optional(), {
      description: "Schedule time (ISO string)",
    }),
    failover: option(z.coerce.boolean().default(false), {
      description:
        "Enable SMS/LMS failover when recipient is not a KakaoTalk user",
    }),
    "fallback-channel": option(z.enum(["sms", "lms"]).optional(), {
      description: "Fallback channel (sms|lms)",
    }),
    "fallback-content": option(z.string().optional(), {
      description: "Fallback SMS/LMS content",
    }),
    "fallback-title": option(z.string().optional(), {
      description: "Fallback LMS title",
    }),
  },
  handler: async ({ flags, context }) => {
    const asJson = shouldUseJsonOutput(flags.json, context);
    try {
      const runtime = await loadRuntime(flags.config);
      const scheduledAt = flags["scheduled-at"];
      const rawVars = flags.vars;
      const fallbackChannel = flags["fallback-channel"];
      const fallbackContent = flags["fallback-content"];
      const fallbackTitle = flags["fallback-title"];
      const failoverEnabled =
        flags.failover ||
        fallbackChannel !== undefined ||
        fallbackContent !== undefined ||
        fallbackTitle !== undefined;

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
        ...(failoverEnabled
          ? {
              failover: {
                enabled: true,
                ...(fallbackChannel ? { fallbackChannel } : {}),
                ...(typeof fallbackContent === "string"
                  ? { fallbackContent }
                  : {}),
                ...(typeof fallbackTitle === "string" ? { fallbackTitle } : {}),
              },
            }
          : {}),
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
        `OK ALIMTALK ${result.value.to} (${result.value.providerId})`,
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

export default defineCommand({
  name: "alimtalk",
  description: "AlimTalk utilities",
  commands: [sendCmd],
  handler: async () => {
    console.log("Use a subcommand: send");
  },
});
