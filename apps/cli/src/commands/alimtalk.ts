import type { MessageVariables, SendInput } from "@k-msg/core";
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
import {
  formatOnboardingCheckLines,
  runAlimTalkPreflight,
} from "../onboarding";
import {
  loadRuntime,
  resolveKakaoChannelPlusId,
  resolveKakaoChannelSenderKey,
} from "../runtime";
import {
  buildInteractiveAlimTalkInput,
  ensureInteractiveSendAllowed,
  pickAlimTalkProvider,
} from "./send-interactive";

function requireFlag(value: string | undefined, label: string): string {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }
  throw new Error(`${label} is required`);
}

function requireVariables(
  value: MessageVariables | undefined,
): MessageVariables {
  if (value !== undefined) {
    return value;
  }
  throw new Error("Variables JSON is required");
}

function buildFailoverInput(flags: {
  failover: boolean;
  fallbackChannel?: "sms" | "lms";
  fallbackContent?: string;
  fallbackTitle?: string;
}):
  | {
      enabled: true;
      fallbackChannel?: "sms" | "lms";
      fallbackContent?: string;
      fallbackTitle?: string;
    }
  | undefined {
  const { failover, fallbackChannel, fallbackContent, fallbackTitle } = flags;
  const enabled =
    failover ||
    fallbackChannel !== undefined ||
    fallbackContent !== undefined ||
    fallbackTitle !== undefined;
  if (!enabled) return undefined;

  return {
    enabled: true,
    ...(fallbackChannel ? { fallbackChannel } : {}),
    ...(typeof fallbackContent === "string" ? { fallbackContent } : {}),
    ...(typeof fallbackTitle === "string" ? { fallbackTitle } : {}),
  };
}

const sendCmd = defineCommand({
  name: "send",
  description: "Send AlimTalk",
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
    from: option(z.string().optional(), { description: "Sender number" }),
    "template-id": option(z.string().min(1).optional(), {
      description: "Template ID",
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
        .pipe(z.record(z.string(), z.unknown()))
        .optional(),
      { description: "Variables as JSON object" },
    ),
    channel: option(z.string().optional(), {
      description: "Kakao channel alias (from config)",
    }),
    "sender-key": option(z.string().optional(), {
      description: "Kakao channel senderKey override",
    }),
    "plus-id": option(z.string().optional(), {
      description: "Kakao channel plusId override",
    }),
    "scheduled-at": option(z.coerce.date().optional(), {
      description: "Schedule time (ISO string)",
    }),
    failover: booleanFlagOption(strictBooleanFlagSchema, {
      description:
        "Enable SMS/LMS failover when recipient is not a KakaoTalk user (boolean: --failover, --failover true|false, --no-failover; default: false)",
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
  handler: async ({ flags, context, prompt, terminal }) => {
    const asJson = flags.interactive
      ? false
      : shouldUseJsonOutput(flags.json, context);
    try {
      ensureInteractiveSendAllowed({
        commandPath: "k-msg alimtalk send",
        interactive: flags.interactive,
        json: flags.json,
        terminal,
      });

      const runtime = await loadRuntime(flags.config);
      const scheduledAt = flags["scheduled-at"];
      const failover = buildFailoverInput({
        failover: flags.failover,
        fallbackChannel: flags["fallback-channel"],
        fallbackContent: flags["fallback-content"],
        fallbackTitle: flags["fallback-title"],
      });
      const input: SendInput = flags.interactive
        ? {
            type: "ALIMTALK",
            ...(await buildInteractiveAlimTalkInput({
              draft: {
                channel: flags.channel,
                failover,
                from: flags.from,
                plusId: flags["plus-id"],
                provider: flags.provider,
                scheduledAt,
                senderKey: flags["sender-key"],
                templateId: flags["template-id"],
                to: flags.to,
                vars: flags.vars as MessageVariables | undefined,
              },
              prompt,
              runtime,
            })),
          }
        : (() => {
            const resolvedProvider = pickAlimTalkProvider(
              runtime,
              flags.provider,
            );

            const senderKey = resolveKakaoChannelSenderKey(runtime.config, {
              providerId: resolvedProvider.id,
              channelAlias: flags.channel,
              senderKey: flags["sender-key"],
              strictAlias:
                typeof flags.channel === "string" &&
                flags.channel.trim().length > 0,
            });
            const plusId = resolveKakaoChannelPlusId(runtime.config, {
              providerId: resolvedProvider.id,
              channelAlias: flags.channel,
              plusId: flags["plus-id"],
              strictAlias:
                typeof flags.channel === "string" &&
                flags.channel.trim().length > 0,
            });
            const kakao = {
              ...(senderKey ? { profileId: senderKey } : {}),
              ...(plusId ? { plusId } : {}),
            };

            return {
              type: "ALIMTALK",
              to: requireFlag(flags.to, "Recipient phone number"),
              from: flags.from,
              templateId: requireFlag(flags["template-id"], "Template ID"),
              variables: requireVariables(
                flags.vars as MessageVariables | undefined,
              ),
              ...(Object.keys(kakao).length > 0 ? { kakao } : {}),
              ...(flags.provider ? { providerId: flags.provider } : {}),
              ...(scheduledAt ? { options: { scheduledAt } } : {}),
              ...(failover ? { failover } : {}),
            };
          })();

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

const preflightCmd = defineCommand({
  name: "preflight",
  description: "Run ALIMTALK onboarding preflight checks",
  options: {
    config: optConfig,
    json: optJson,
    provider: optProvider,
    channel: option(z.string().optional(), {
      description: "Kakao channel alias (from config)",
    }),
    "sender-key": option(z.string().optional(), {
      description: "Kakao channel senderKey override",
    }),
    "plus-id": option(z.string().optional(), {
      description: "Kakao channel plusId override",
    }),
    "template-id": option(z.string().min(1).optional(), {
      description: "Template ID to validate (required)",
    }),
  },
  handler: async ({ flags, context }) => {
    const asJson = shouldUseJsonOutput(flags.json, context);
    try {
      const templateId = flags["template-id"];
      if (typeof templateId !== "string" || templateId.trim().length === 0) {
        throw new Error(
          "--template-id is required (pass a Kakao template code)",
        );
      }

      const runtime = await loadRuntime(flags.config);
      const provider = pickAlimTalkProvider(runtime, flags.provider);
      const senderKey = resolveKakaoChannelSenderKey(runtime.config, {
        providerId: provider.id,
        channelAlias: flags.channel,
        senderKey: flags["sender-key"],
        strictAlias:
          typeof flags.channel === "string" && flags.channel.trim().length > 0,
      });
      const plusId = resolveKakaoChannelPlusId(runtime.config, {
        providerId: provider.id,
        channelAlias: flags.channel,
        plusId: flags["plus-id"],
        strictAlias:
          typeof flags.channel === "string" && flags.channel.trim().length > 0,
      });

      const preflight = await runAlimTalkPreflight({
        runtime,
        provider,
        senderKey,
        plusId,
        templateId,
      });

      if (asJson) {
        console.log(
          JSON.stringify({ ok: preflight.ok, result: preflight }, null, 2),
        );
        if (!preflight.ok) process.exitCode = 2;
        return;
      }

      console.log(
        `${preflight.ok ? "OK" : "FAIL"} preflight (${preflight.providerId})`,
      );
      if (preflight.spec) {
        console.log(
          `policy: plusId=${preflight.spec.plusIdPolicy}, inference=${preflight.spec.plusIdInference}`,
        );
      }
      if (preflight.inferredPlusId) {
        console.log(`inferredPlusId=${preflight.inferredPlusId}`);
      }
      for (const check of preflight.checks) {
        for (const line of formatOnboardingCheckLines(check)) {
          console.log(line);
        }
      }

      if (!preflight.ok) {
        process.exitCode = 2;
      }
    } catch (error) {
      printError(error, asJson);
      process.exitCode = exitCodeForError(error);
    }
  },
});

export default defineGroup({
  name: "alimtalk",
  description: "AlimTalk utilities",
  commands: [sendCmd, preflightCmd],
});
