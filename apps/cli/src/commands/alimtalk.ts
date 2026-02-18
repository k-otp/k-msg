import { defineCommand, option } from "@bunli/core";
import type { MessageVariables, SendInput } from "@k-msg/core";
import { z } from "zod";
import {
  optConfig,
  optJson,
  optProvider,
  strictBooleanFlagSchema,
} from "../cli/options";
import {
  CapabilityNotSupportedError,
  exitCodeForError,
  printError,
  printWarnings,
  shouldUseJsonOutput,
} from "../cli/utils";
import { runAlimTalkPreflight } from "../onboarding";
import {
  loadRuntime,
  type Runtime,
  resolveKakaoChannelPlusId,
  resolveKakaoChannelSenderKey,
} from "../runtime";

function pickAlimTalkProvider(
  runtime: Runtime,
  requestedProviderId?: string,
): Runtime["providers"][number] {
  if (requestedProviderId) {
    const provider = runtime.providersById.get(requestedProviderId);
    if (!provider) {
      throw new Error(`Unknown provider id: ${requestedProviderId}`);
    }
    if (!provider.supportedTypes.includes("ALIMTALK")) {
      throw new CapabilityNotSupportedError(
        `Provider '${requestedProviderId}' does not support ALIMTALK`,
      );
    }
    return provider;
  }

  const routeByType = runtime.config.routing?.byType?.ALIMTALK;
  if (Array.isArray(routeByType)) {
    const first = routeByType
      .map((id) => runtime.providersById.get(id))
      .find((provider) => provider?.supportedTypes.includes("ALIMTALK"));
    if (first) return first;
  } else if (typeof routeByType === "string" && routeByType.length > 0) {
    const provider = runtime.providersById.get(routeByType);
    if (provider?.supportedTypes.includes("ALIMTALK")) {
      return provider;
    }
  }

  const defaultProviderId = runtime.config.routing?.defaultProviderId;
  if (typeof defaultProviderId === "string" && defaultProviderId.length > 0) {
    const provider = runtime.providersById.get(defaultProviderId);
    if (provider?.supportedTypes.includes("ALIMTALK")) {
      return provider;
    }
  }

  const supported = runtime.providers.find((provider) =>
    provider.supportedTypes.includes("ALIMTALK"),
  );
  if (supported) return supported;

  throw new CapabilityNotSupportedError(
    "No configured provider supports ALIMTALK",
  );
}

const sendCmd = defineCommand({
  name: "send",
  description: "Send AlimTalk",
  options: {
    config: optConfig,
    json: optJson,
    provider: optProvider,
    to: option(z.string().min(1), { description: "Recipient phone number" }),
    from: option(z.string().optional(), { description: "Sender number" }),
    "template-id": option(z.string().min(1), {
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
        .pipe(z.record(z.string(), z.unknown())),
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
    failover: option(strictBooleanFlagSchema, {
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
      const plusId = resolveKakaoChannelPlusId(runtime.config, {
        channelAlias: flags.channel,
        plusId: flags["plus-id"],
      });
      const kakao = {
        ...(senderKey ? { profileId: senderKey } : {}),
        ...(plusId ? { plusId } : {}),
      };

      const input: SendInput = {
        type: "ALIMTALK",
        to: flags.to,
        from: flags.from,
        templateId: flags["template-id"],
        variables: rawVars as MessageVariables,
        ...(Object.keys(kakao).length > 0 ? { kakao } : {}),
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
    "template-id": option(z.string().min(1), {
      description: "Template ID to validate",
    }),
  },
  handler: async ({ flags, context }) => {
    const asJson = shouldUseJsonOutput(flags.json, context);
    try {
      const runtime = await loadRuntime(flags.config);
      const provider = pickAlimTalkProvider(runtime, flags.provider);
      const senderKey = resolveKakaoChannelSenderKey(runtime.config, {
        channelAlias: flags.channel,
        senderKey: flags["sender-key"],
      });
      const plusId = resolveKakaoChannelPlusId(runtime.config, {
        channelAlias: flags.channel,
        plusId: flags["plus-id"],
      });

      const preflight = await runAlimTalkPreflight({
        runtime,
        provider,
        senderKey,
        plusId,
        templateId: flags["template-id"],
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
        const marker =
          check.status === "pass"
            ? "PASS"
            : check.status === "fail"
              ? "FAIL"
              : "SKIP";
        console.log(
          `[${marker}] (${check.severity}) ${check.id}: ${check.message}`,
        );
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

export default defineCommand({
  name: "alimtalk",
  description: "AlimTalk utilities",
  commands: [sendCmd, preflightCmd],
  handler: async () => {
    console.log("Use a subcommand: send | preflight");
  },
});
