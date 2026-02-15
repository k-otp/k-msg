import { defineCommand, option } from "@bunli/core";
import type {
  KakaoChannelProvider,
  TemplateContext,
  TemplateInspectionProvider,
  TemplateProvider,
} from "k-msg";
import { z } from "zod";
import { loadKMsgConfig } from "../config/load";
import { saveKMsgConfig } from "../config/save";
import type { ProviderWithCapabilities } from "../providers/registry";
import { loadRuntime, resolveKakaoChannelSenderKey, type Runtime } from "../runtime";
import { optConfig, optJson, optProvider } from "../cli/options";
import {
  CapabilityNotSupportedError,
  exitCodeForError,
  parseJson,
  printError,
} from "../cli/utils";

function requireProviderById(
  runtime: Runtime,
  providerId: string,
): ProviderWithCapabilities {
  const found = runtime.providersById.get(providerId);
  if (!found) {
    throw new Error(`Unknown provider id: ${providerId}`);
  }
  return found;
}

function pickProvider(
  runtime: Runtime,
  providerId: string | undefined,
  predicate: (p: ProviderWithCapabilities) => boolean,
  capabilityLabel: string,
): ProviderWithCapabilities {
  if (providerId) {
    const p = requireProviderById(runtime, providerId);
    if (!predicate(p)) {
      throw new CapabilityNotSupportedError(
        `Provider '${providerId}' does not support ${capabilityLabel}`,
      );
    }
    return p;
  }

  const candidates = runtime.providers.filter((p) => predicate(p));
  if (candidates.length === 1) return candidates[0]!;
  if (candidates.length === 0) {
    throw new CapabilityNotSupportedError(
      `No configured provider supports ${capabilityLabel}`,
    );
  }
  throw new Error(
    `Multiple providers support ${capabilityLabel}. Use --provider to pick one: ${candidates
      .map((p) => p.id)
      .join(", ")}`,
  );
}

function resolveTemplateContextSenderKey(
  runtime: Runtime,
  input: { channelAlias?: string; senderKey?: string },
): TemplateContext | undefined {
  const senderKey = resolveKakaoChannelSenderKey(runtime.config, input);
  return senderKey ? { kakaoChannelSenderKey: senderKey } : undefined;
}

function resolveChannelAliasProviderId(
  runtime: Runtime,
  channelAlias: string | undefined,
): string | undefined {
  const alias = channelAlias?.trim();
  if (!alias) return undefined;
  return runtime.config.aliases?.kakaoChannels?.[alias]?.providerId;
}

function resolveTemplateProviderHint(
  runtime: Runtime,
  input: { channelAlias?: string },
): string | undefined {
  const explicit = resolveChannelAliasProviderId(runtime, input.channelAlias);
  if (explicit) return explicit;
  const fallback = resolveChannelAliasProviderId(
    runtime,
    runtime.config.defaults?.kakao?.channel,
  );
  return fallback;
}

const channelCategoriesCmd = defineCommand({
  name: "categories",
  description: "List Kakao channel categories (provider-dependent)",
  options: {
    config: optConfig,
    json: optJson,
    provider: optProvider,
  },
  handler: async ({ flags }) => {
    try {
      const runtime = await loadRuntime(flags.config);
      const provider = pickProvider(
        runtime,
        flags.provider,
        (p) => typeof (p as any).listKakaoChannelCategories === "function",
        "kakao channel categories",
      );

      const result = await (
        provider as unknown as KakaoChannelProvider
      ).listKakaoChannelCategories!.call(provider);
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

      for (const [label, items] of Object.entries(result.value)) {
        console.log(label);
        for (const item of items) {
          console.log(`  ${item.code} ${item.name}`);
        }
      }
    } catch (error) {
      printError(error, flags.json);
      process.exitCode = exitCodeForError(error);
    }
  },
});

const channelListCmd = defineCommand({
  name: "list",
  description: "List Kakao channels",
  options: {
    config: optConfig,
    json: optJson,
    provider: optProvider,
    "plus-id": option(z.string().optional(), {
      description: "Filter by plusId",
    }),
    "sender-key": option(z.string().optional(), {
      description: "Filter by senderKey",
    }),
  },
  handler: async ({ flags }) => {
    try {
      const runtime = await loadRuntime(flags.config);
      const provider = pickProvider(
        runtime,
        flags.provider,
        (p) => typeof (p as any).listKakaoChannels === "function",
        "kakao channel list",
      );

      const result = await (
        provider as unknown as KakaoChannelProvider
      ).listKakaoChannels.call(provider, {
        plusId: flags["plus-id"],
        senderKey: flags["sender-key"],
      });
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

      if (result.value.length === 0) {
        console.log("(no channels)");
        return;
      }

      for (const ch of result.value) {
        console.log(`${ch.senderKey}${ch.plusId ? ` ${ch.plusId}` : ""}`);
      }
    } catch (error) {
      printError(error, flags.json);
      process.exitCode = exitCodeForError(error);
    }
  },
});

const channelAuthCmd = defineCommand({
  name: "auth",
  description: "Request Kakao channel auth number",
  options: {
    config: optConfig,
    json: optJson,
    provider: optProvider,
    "plus-id": option(z.string().min(1), {
      description: "Kakao plusId (@...)",
    }),
    phone: option(z.string().min(1), { description: "Phone number" }),
  },
  handler: async ({ flags }) => {
    try {
      const runtime = await loadRuntime(flags.config);
      const provider = pickProvider(
        runtime,
        flags.provider,
        (p) => typeof (p as any).requestKakaoChannelAuth === "function",
        "kakao channel auth",
      );

      const result = await (
        provider as unknown as KakaoChannelProvider
      ).requestKakaoChannelAuth!.call(provider, {
        plusId: flags["plus-id"],
        phoneNumber: flags.phone,
      });
      if (result.isFailure) {
        printError(result.error, flags.json);
        process.exitCode = exitCodeForError(result.error);
        return;
      }

      if (flags.json) {
        console.log(JSON.stringify({ ok: true }, null, 2));
        return;
      }
      console.log("OK");
    } catch (error) {
      printError(error, flags.json);
      process.exitCode = exitCodeForError(error);
    }
  },
});

const channelAddCmd = defineCommand({
  name: "add",
  description: "Add/register a Kakao channel",
  options: {
    config: optConfig,
    json: optJson,
    provider: optProvider,
    "plus-id": option(z.string().min(1), {
      description: "Kakao plusId (@...)",
    }),
    "auth-num": option(z.string().min(1), { description: "Auth number" }),
    phone: option(z.string().min(1), { description: "Phone number" }),
    "category-code": option(z.string().min(1), {
      description: "Category code",
    }),
    save: option(z.string().optional(), {
      description: "Save as aliases.kakaoChannels.<alias>",
    }),
  },
  handler: async ({ flags }) => {
    try {
      const runtime = await loadRuntime(flags.config);
      const provider = pickProvider(
        runtime,
        flags.provider,
        (p) => typeof (p as any).addKakaoChannel === "function",
        "kakao channel add",
      );

      const result = await (
        provider as unknown as KakaoChannelProvider
      ).addKakaoChannel!.call(provider, {
        plusId: flags["plus-id"],
        authNum: flags["auth-num"],
        phoneNumber: flags.phone,
        categoryCode: flags["category-code"],
      });
      if (result.isFailure) {
        printError(result.error, flags.json);
        process.exitCode = exitCodeForError(result.error);
        return;
      }

      if (flags.save && flags.save.trim().length > 0) {
        const raw = await loadKMsgConfig(flags.config);
        raw.config.aliases = raw.config.aliases || {};
        raw.config.aliases.kakaoChannels =
          raw.config.aliases.kakaoChannels || {};
        raw.config.aliases.kakaoChannels[flags.save] = {
          providerId: provider.id,
          plusId: result.value.plusId,
          senderKey: result.value.senderKey,
          ...(result.value.name ? { name: result.value.name } : {}),
        };
        await saveKMsgConfig(raw.path, raw.config);
      }

      if (flags.json) {
        console.log(
          JSON.stringify({ ok: true, result: result.value }, null, 2),
        );
        return;
      }

      console.log(`OK senderKey=${result.value.senderKey}`);
      if (flags.save) console.log(`saved=${flags.save}`);
    } catch (error) {
      printError(error, flags.json);
      process.exitCode = exitCodeForError(error);
    }
  },
});

const channelCmd = defineCommand({
  name: "channel",
  description: "Kakao channel management",
  commands: [
    channelCategoriesCmd,
    channelListCmd,
    channelAuthCmd,
    channelAddCmd,
  ],
  handler: async () => {
    console.log("Use a subcommand: categories | list | auth | add");
  },
});

const templateListCmd = defineCommand({
  name: "list",
  description: "List Kakao templates",
  options: {
    config: optConfig,
    json: optJson,
    provider: optProvider,
    status: option(z.string().optional(), {
      description: "Filter by status (provider-dependent)",
    }),
    channel: option(z.string().optional(), {
      description: "Kakao channel alias (from config)",
    }),
    "sender-key": option(z.string().optional(), {
      description: "Kakao channel senderKey override",
    }),
  },
  handler: async ({ flags }) => {
    try {
      const runtime = await loadRuntime(flags.config);
      const providerHint = resolveTemplateProviderHint(runtime, {
        channelAlias: flags.channel,
      });
      const provider = pickProvider(
        runtime,
        flags.provider ?? providerHint,
        (p) => typeof (p as any).listTemplates === "function",
        "kakao template list",
      );

      const ctx = resolveTemplateContextSenderKey(runtime, {
        channelAlias: flags.channel,
        senderKey: flags["sender-key"],
      });

      const result = await (
        provider as unknown as TemplateProvider
      ).listTemplates.call(
        provider,
        flags.status ? { status: flags.status } : undefined,
        ctx,
      );
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

      if (result.value.length === 0) {
        console.log("(no templates)");
        return;
      }
      for (const t of result.value) {
        console.log(`${t.code} ${t.status} ${t.name}`);
      }
    } catch (error) {
      printError(error, flags.json);
      process.exitCode = exitCodeForError(error);
    }
  },
});

const templateGetCmd = defineCommand({
  name: "get",
  description: "Get a Kakao template",
  options: {
    config: optConfig,
    json: optJson,
    provider: optProvider,
    "template-code": option(z.string().min(1), {
      description: "Template code",
    }),
    channel: option(z.string().optional(), {
      description: "Kakao channel alias (from config)",
    }),
    "sender-key": option(z.string().optional(), {
      description: "Kakao channel senderKey override",
    }),
  },
  handler: async ({ flags }) => {
    try {
      const runtime = await loadRuntime(flags.config);
      const providerHint = resolveTemplateProviderHint(runtime, {
        channelAlias: flags.channel,
      });
      const provider = pickProvider(
        runtime,
        flags.provider ?? providerHint,
        (p) => typeof (p as any).getTemplate === "function",
        "kakao template get",
      );

      const ctx = resolveTemplateContextSenderKey(runtime, {
        channelAlias: flags.channel,
        senderKey: flags["sender-key"],
      });

      const result = await (
        provider as unknown as TemplateProvider
      ).getTemplate.call(provider, flags["template-code"], ctx);
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

      console.log(result.value.code);
      console.log(result.value.content);
    } catch (error) {
      printError(error, flags.json);
      process.exitCode = exitCodeForError(error);
    }
  },
});

const templateCreateCmd = defineCommand({
  name: "create",
  description: "Create a Kakao template",
  options: {
    config: optConfig,
    json: optJson,
    provider: optProvider,
    name: option(z.string().min(1), { description: "Template name" }),
    content: option(z.string().min(1), { description: "Template content" }),
    buttons: option(z.string().optional(), {
      description: "Buttons as JSON array",
    }),
    channel: option(z.string().optional(), {
      description: "Kakao channel alias (from config)",
    }),
    "sender-key": option(z.string().optional(), {
      description: "Kakao channel senderKey override",
    }),
    save: option(z.string().optional(), {
      description: "Save as aliases.templates.<alias>",
    }),
  },
  handler: async ({ flags }) => {
    try {
      const runtime = await loadRuntime(flags.config);
      const providerHint = resolveTemplateProviderHint(runtime, {
        channelAlias: flags.channel,
      });
      const provider = pickProvider(
        runtime,
        flags.provider ?? providerHint,
        (p) => typeof (p as any).createTemplate === "function",
        "kakao template create",
      );

      const ctx = resolveTemplateContextSenderKey(runtime, {
        channelAlias: flags.channel,
        senderKey: flags["sender-key"],
      });

      const buttons =
        typeof flags.buttons === "string" && flags.buttons.trim().length > 0
          ? (() => {
            const parsed = parseJson(flags.buttons, "buttons");
            if (!Array.isArray(parsed)) {
              throw new Error("buttons must be a JSON array");
            }
            return parsed as unknown[];
          })()
          : undefined;

      const result = await (
        provider as unknown as TemplateProvider
      ).createTemplate.call(
        provider,
        {
          name: flags.name,
          content: flags.content,
          ...(buttons ? { buttons } : {}),
        },
        ctx,
      );
      if (result.isFailure) {
        printError(result.error, flags.json);
        process.exitCode = exitCodeForError(result.error);
        return;
      }

      if (flags.save && flags.save.trim().length > 0) {
        const raw = await loadKMsgConfig(flags.config);
        raw.config.aliases = raw.config.aliases || {};
        raw.config.aliases.templates = raw.config.aliases.templates || {};
        raw.config.aliases.templates[flags.save] = {
          providerId: provider.id,
          templateCode: result.value.code,
          ...(flags.channel ? { kakaoChannel: flags.channel } : {}),
        };
        await saveKMsgConfig(raw.path, raw.config);
      }

      if (flags.json) {
        console.log(
          JSON.stringify({ ok: true, result: result.value }, null, 2),
        );
        return;
      }

      console.log(`OK templateCode=${result.value.code}`);
      if (flags.save) console.log(`saved=${flags.save}`);
    } catch (error) {
      printError(error, flags.json);
      process.exitCode = exitCodeForError(error);
    }
  },
});

const templateUpdateCmd = defineCommand({
  name: "update",
  description: "Update a Kakao template",
  options: {
    config: optConfig,
    json: optJson,
    provider: optProvider,
    "template-code": option(z.string().min(1), {
      description: "Template code",
    }),
    name: option(z.string().optional(), { description: "New template name" }),
    content: option(z.string().optional(), {
      description: "New template content",
    }),
    buttons: option(z.string().optional(), {
      description: "Buttons as JSON array",
    }),
    channel: option(z.string().optional(), {
      description: "Kakao channel alias (from config)",
    }),
    "sender-key": option(z.string().optional(), {
      description: "Kakao channel senderKey override",
    }),
  },
  handler: async ({ flags }) => {
    try {
      const runtime = await loadRuntime(flags.config);
      const providerHint = resolveTemplateProviderHint(runtime, {
        channelAlias: flags.channel,
      });
      const provider = pickProvider(
        runtime,
        flags.provider ?? providerHint,
        (p) => typeof (p as any).updateTemplate === "function",
        "kakao template update",
      );

      const ctx = resolveTemplateContextSenderKey(runtime, {
        channelAlias: flags.channel,
        senderKey: flags["sender-key"],
      });

      const patch: Record<string, unknown> = {};
      if (typeof flags.name === "string") patch.name = flags.name;
      if (typeof flags.content === "string") patch.content = flags.content;
      if (
        typeof flags.buttons === "string" &&
        flags.buttons.trim().length > 0
      ) {
        const parsed = parseJson(flags.buttons, "buttons");
        if (!Array.isArray(parsed)) {
          throw new Error("buttons must be a JSON array");
        }
        patch.buttons = parsed;
      }

      const result = await (
        provider as unknown as TemplateProvider
      ).updateTemplate.call(
        provider,
        flags["template-code"],
        patch as any,
        ctx,
      );
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

      console.log(`OK templateCode=${result.value.code}`);
    } catch (error) {
      printError(error, flags.json);
      process.exitCode = exitCodeForError(error);
    }
  },
});

const templateDeleteCmd = defineCommand({
  name: "delete",
  description: "Delete a Kakao template",
  options: {
    config: optConfig,
    json: optJson,
    provider: optProvider,
    "template-code": option(z.string().min(1), {
      description: "Template code",
    }),
    channel: option(z.string().optional(), {
      description: "Kakao channel alias (from config)",
    }),
    "sender-key": option(z.string().optional(), {
      description: "Kakao channel senderKey override",
    }),
  },
  handler: async ({ flags }) => {
    try {
      const runtime = await loadRuntime(flags.config);
      const providerHint = resolveTemplateProviderHint(runtime, {
        channelAlias: flags.channel,
      });
      const provider = pickProvider(
        runtime,
        flags.provider ?? providerHint,
        (p) => typeof (p as any).deleteTemplate === "function",
        "kakao template delete",
      );

      const ctx = resolveTemplateContextSenderKey(runtime, {
        channelAlias: flags.channel,
        senderKey: flags["sender-key"],
      });

      const result = await (
        provider as unknown as TemplateProvider
      ).deleteTemplate.call(provider, flags["template-code"], ctx);
      if (result.isFailure) {
        printError(result.error, flags.json);
        process.exitCode = exitCodeForError(result.error);
        return;
      }

      if (flags.json) {
        console.log(JSON.stringify({ ok: true }, null, 2));
        return;
      }
      console.log("OK");
    } catch (error) {
      printError(error, flags.json);
      process.exitCode = exitCodeForError(error);
    }
  },
});

const templateRequestCmd = defineCommand({
  name: "request",
  description: "Request template inspection (provider-dependent)",
  options: {
    config: optConfig,
    json: optJson,
    provider: optProvider,
    "template-code": option(z.string().min(1), {
      description: "Template code",
    }),
    channel: option(z.string().optional(), {
      description: "Kakao channel alias (from config)",
    }),
    "sender-key": option(z.string().optional(), {
      description: "Kakao channel senderKey override",
    }),
  },
  handler: async ({ flags }) => {
    try {
      const runtime = await loadRuntime(flags.config);
      const providerHint = resolveTemplateProviderHint(runtime, {
        channelAlias: flags.channel,
      });
      const provider = pickProvider(
        runtime,
        flags.provider ?? providerHint,
        (p) => typeof (p as any).requestTemplateInspection === "function",
        "kakao template inspection request",
      );

      const ctx = resolveTemplateContextSenderKey(runtime, {
        channelAlias: flags.channel,
        senderKey: flags["sender-key"],
      });

      const result = await (
        provider as unknown as TemplateInspectionProvider
      ).requestTemplateInspection.call(provider, flags["template-code"], ctx);
      if (result.isFailure) {
        printError(result.error, flags.json);
        process.exitCode = exitCodeForError(result.error);
        return;
      }

      if (flags.json) {
        console.log(JSON.stringify({ ok: true }, null, 2));
        return;
      }
      console.log("OK");
    } catch (error) {
      printError(error, flags.json);
      process.exitCode = exitCodeForError(error);
    }
  },
});

const templateCmd = defineCommand({
  name: "template",
  description: "Kakao template management",
  commands: [
    templateListCmd,
    templateGetCmd,
    templateCreateCmd,
    templateUpdateCmd,
    templateDeleteCmd,
    templateRequestCmd,
  ],
  handler: async () => {
    console.log(
      "Use a subcommand: list | get | create | update | delete | request",
    );
  },
});

export default defineCommand({
  name: "kakao",
  description: "Kakao channel/template management",
  commands: [channelCmd, templateCmd],
  handler: async () => {
    console.log("Use a subcommand: channel | template");
  },
});
