import { defineCommand, defineGroup, option } from "@bunli/core";
import {
  KakaoChannelBindingResolver,
  KakaoChannelCapabilityService,
  KakaoChannelLifecycleService,
  type KakaoChannelListItem,
  type KakaoChannelRuntimeProvider,
} from "@k-msg/channel";
import type {
  TemplateContext,
  TemplateInspectionProvider,
  TemplateProvider,
  TemplateUpdateInput,
} from "@k-msg/core";
import {
  parseTemplateButtons,
  TemplateLifecycleService,
  validateTemplatePayload,
} from "@k-msg/template";
import { z } from "zod";
import { optConfig, optJson, optProvider } from "../cli/options";
import {
  CapabilityNotSupportedError,
  exitCodeForError,
  printError,
  shouldUseJsonOutput,
} from "../cli/utils";
import { loadKMsgConfig } from "../config/load";
import { saveKMsgConfig } from "../config/save";
import type { ProviderWithCapabilities } from "../providers/registry";
import {
  loadRuntime,
  type Runtime,
  resolveKakaoChannelSenderKey,
} from "../runtime";

function hasFunction(provider: ProviderWithCapabilities, key: string): boolean {
  if (!(key in provider)) {
    return false;
  }
  const value = provider[key as keyof ProviderWithCapabilities] as unknown;
  return typeof value === "function";
}

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
  if (candidates.length === 1) {
    const only = candidates[0];
    if (!only) {
      throw new Error("Invariant violation: expected exactly one candidate");
    }
    return only;
  }
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
  input: {
    providerId?: string;
    channelAlias?: string;
    senderKey?: string;
  },
): TemplateContext | undefined {
  const senderKey = resolveKakaoChannelSenderKey(runtime.config, {
    providerId: input.providerId,
    channelAlias: input.channelAlias,
    senderKey: input.senderKey,
  });
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

function createTemplateLifecycleService(
  provider: ProviderWithCapabilities,
): TemplateLifecycleService {
  return new TemplateLifecycleService(
    provider as unknown as TemplateProvider,
    hasFunction(provider, "requestTemplateInspection")
      ? (provider as unknown as TemplateInspectionProvider)
      : undefined,
  );
}

function createKakaoChannelBindingResolver(
  runtime: Runtime,
): KakaoChannelBindingResolver {
  return new KakaoChannelBindingResolver(runtime.config);
}

function createKakaoChannelLifecycleService(
  provider: ProviderWithCapabilities,
): KakaoChannelLifecycleService {
  return new KakaoChannelLifecycleService(
    provider as unknown as KakaoChannelRuntimeProvider,
    new KakaoChannelCapabilityService(),
  );
}

function pickKakaoChannelApiProvider(
  runtime: Runtime,
  providerId: string | undefined,
): ProviderWithCapabilities {
  const capabilityService = new KakaoChannelCapabilityService();

  if (providerId) {
    return requireProviderById(runtime, providerId);
  }

  const candidates = runtime.providers.filter((provider) => {
    const capability = capabilityService.resolve(
      provider as unknown as KakaoChannelRuntimeProvider,
    );
    return capability.mode === "api";
  });

  if (candidates.length === 1) {
    const only = candidates[0];
    if (!only) {
      throw new Error("Invariant violation: expected exactly one candidate");
    }
    return only;
  }

  if (candidates.length === 0) {
    throw new CapabilityNotSupportedError(
      "No configured provider supports kakao channel api",
    );
  }

  throw new Error(
    `Multiple providers support kakao channel api. Use --provider to pick one: ${candidates
      .map((candidate) => candidate.id)
      .join(", ")}`,
  );
}

function printKakaoChannelListItems(items: KakaoChannelListItem[]): void {
  if (items.length === 0) {
    console.log("(no channels)");
    return;
  }

  for (const item of items) {
    const senderKey = item.senderKey ?? "-";
    const plusId = item.plusId ? ` ${item.plusId}` : "";
    const alias = item.alias ? ` alias=${item.alias}` : "";
    console.log(
      `${senderKey}${plusId} provider=${item.providerId} source=${item.source}${alias}`,
    );
  }
}

function createRemovedChannelCommand(input: {
  name: string;
  replacement: string;
}) {
  return defineCommand({
    name: input.name,
    description: "Removed command",
    options: {
      config: optConfig,
      json: optJson,
    },
    handler: async ({ flags, context }) => {
      const asJson = shouldUseJsonOutput(flags.json, context);
      const error = new Error(
        `kakao channel ${input.name} was removed. Use: ${input.replacement}`,
      );
      printError(error, asJson);
      process.exitCode = 2;
    },
  });
}

const channelBindingListCmd = defineCommand({
  name: "list",
  description:
    "List resolved Kakao channel bindings from config/provider hints",
  options: {
    config: optConfig,
    json: optJson,
    provider: optProvider,
  },
  handler: async ({ flags, context }) => {
    const asJson = shouldUseJsonOutput(flags.json, context);
    try {
      const runtime = await loadRuntime(flags.config);
      const resolver = createKakaoChannelBindingResolver(runtime);
      const result = resolver.list({
        ...(flags.provider ? { providerId: flags.provider } : {}),
      });

      if (asJson) {
        console.log(JSON.stringify({ ok: true, result }, null, 2));
        return;
      }

      printKakaoChannelListItems(result);
    } catch (error) {
      printError(error, asJson);
      process.exitCode = exitCodeForError(error);
    }
  },
});

const channelBindingResolveCmd = defineCommand({
  name: "resolve",
  description: "Resolve Kakao channel binding with precedence rules",
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
  },
  handler: async ({ flags, context }) => {
    const asJson = shouldUseJsonOutput(flags.json, context);
    try {
      const runtime = await loadRuntime(flags.config);
      const resolver = createKakaoChannelBindingResolver(runtime);
      const resolved = resolver.resolve({
        ...(flags.provider ? { providerId: flags.provider } : {}),
        ...(flags.channel ? { channelAlias: flags.channel } : {}),
        ...(flags["sender-key"] ? { senderKey: flags["sender-key"] } : {}),
        ...(flags["plus-id"] ? { plusId: flags["plus-id"] } : {}),
        strictAlias:
          typeof flags.channel === "string" && flags.channel.trim().length > 0,
      });

      if (asJson) {
        console.log(JSON.stringify({ ok: true, result: resolved }, null, 2));
        return;
      }

      console.log(`providerId=${resolved.providerId ?? "-"}`);
      console.log(`providerType=${resolved.providerType ?? "-"}`);
      console.log(`senderKey=${resolved.senderKey ?? "-"}`);
      console.log(`plusId=${resolved.plusId ?? "-"}`);
      console.log(`providerIdSource=${resolved.providerIdSource}`);
      if (resolved.senderKeySource) {
        console.log(`senderKeySource=${resolved.senderKeySource}`);
      }
      if (resolved.plusIdSource) {
        console.log(`plusIdSource=${resolved.plusIdSource}`);
      }
    } catch (error) {
      printError(error, asJson);
      process.exitCode = exitCodeForError(error);
    }
  },
});

const channelBindingSetCmd = defineCommand({
  name: "set",
  description: "Set aliases.kakaoChannels.<alias> binding entry",
  options: {
    config: optConfig,
    json: optJson,
    alias: option(z.string().min(1), {
      description: "Alias key under aliases.kakaoChannels",
    }),
    provider: optProvider,
    "sender-key": option(z.string().optional(), {
      description: "Kakao channel senderKey",
    }),
    "plus-id": option(z.string().optional(), {
      description: "Kakao channel plusId",
    }),
    name: option(z.string().optional(), {
      description: "Channel name",
    }),
  },
  handler: async ({ flags, context }) => {
    const asJson = shouldUseJsonOutput(flags.json, context);
    try {
      const alias = flags.alias.trim();
      const raw = await loadKMsgConfig(flags.config);
      raw.config.aliases = raw.config.aliases || {};
      raw.config.aliases.kakaoChannels = raw.config.aliases.kakaoChannels || {};

      const existing = raw.config.aliases.kakaoChannels[alias];
      const providerId = flags.provider?.trim() || existing?.providerId?.trim();
      const senderKey =
        flags["sender-key"]?.trim() || existing?.senderKey?.trim();
      const plusId = flags["plus-id"]?.trim() || existing?.plusId?.trim();
      const name = flags.name?.trim() || existing?.name?.trim();

      if (!providerId) {
        throw new Error(
          "providerId is required (use --provider or ensure alias already exists)",
        );
      }
      if (!senderKey && !plusId) {
        throw new Error(
          "at least one of --sender-key or --plus-id is required for binding set",
        );
      }

      raw.config.aliases.kakaoChannels[alias] = {
        providerId,
        ...(senderKey ? { senderKey } : {}),
        ...(plusId ? { plusId } : {}),
        ...(name ? { name } : {}),
      };
      await saveKMsgConfig(raw.path, raw.config);

      if (asJson) {
        console.log(
          JSON.stringify(
            {
              ok: true,
              result: raw.config.aliases.kakaoChannels[alias],
            },
            null,
            2,
          ),
        );
        return;
      }

      console.log(`OK alias=${alias}`);
    } catch (error) {
      printError(error, asJson);
      process.exitCode = exitCodeForError(error);
    }
  },
});

const channelBindingDeleteCmd = defineCommand({
  name: "delete",
  description: "Delete aliases.kakaoChannels.<alias> binding entry",
  options: {
    config: optConfig,
    json: optJson,
    alias: option(z.string().min(1), {
      description: "Alias key under aliases.kakaoChannels",
    }),
  },
  handler: async ({ flags, context }) => {
    const asJson = shouldUseJsonOutput(flags.json, context);
    try {
      const alias = flags.alias.trim();
      const raw = await loadKMsgConfig(flags.config);
      const aliases = raw.config.aliases?.kakaoChannels;
      if (!aliases || !aliases[alias]) {
        throw new Error(`kakao channel alias not found: ${alias}`);
      }

      delete aliases[alias];
      if (Object.keys(aliases).length === 0 && raw.config.aliases) {
        delete raw.config.aliases.kakaoChannels;
        if (Object.keys(raw.config.aliases).length === 0) {
          delete raw.config.aliases;
        }
      }

      await saveKMsgConfig(raw.path, raw.config);

      if (asJson) {
        console.log(JSON.stringify({ ok: true }, null, 2));
        return;
      }

      console.log(`OK alias=${alias}`);
    } catch (error) {
      printError(error, asJson);
      process.exitCode = exitCodeForError(error);
    }
  },
});

const channelBindingCmd = defineGroup({
  name: "binding",
  description: "Kakao channel binding management (config/provider-hint based)",
  commands: [
    channelBindingListCmd,
    channelBindingResolveCmd,
    channelBindingSetCmd,
    channelBindingDeleteCmd,
  ],
});

const channelApiCategoriesCmd = defineCommand({
  name: "categories",
  description: "List Kakao channel categories via provider API",
  options: {
    config: optConfig,
    json: optJson,
    provider: optProvider,
  },
  handler: async ({ flags, context }) => {
    const asJson = shouldUseJsonOutput(flags.json, context);
    try {
      const runtime = await loadRuntime(flags.config);
      const provider = pickKakaoChannelApiProvider(runtime, flags.provider);
      const service = createKakaoChannelLifecycleService(provider);
      const result = await service.categories();

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

      for (const [label, items] of Object.entries(result.value)) {
        console.log(label);
        for (const item of items) {
          console.log(`  ${item.code} ${item.name}`);
        }
      }
    } catch (error) {
      printError(error, asJson);
      process.exitCode = exitCodeForError(error);
    }
  },
});

const channelApiListCmd = defineCommand({
  name: "list",
  description: "List Kakao channels via provider API",
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
  handler: async ({ flags, context }) => {
    const asJson = shouldUseJsonOutput(flags.json, context);
    try {
      const runtime = await loadRuntime(flags.config);
      const provider = pickKakaoChannelApiProvider(runtime, flags.provider);
      const service = createKakaoChannelLifecycleService(provider);
      const result = await service.list({
        ...(flags["plus-id"] ? { plusId: flags["plus-id"] } : {}),
        ...(flags["sender-key"] ? { senderKey: flags["sender-key"] } : {}),
      });

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

      printKakaoChannelListItems(result.value);
    } catch (error) {
      printError(error, asJson);
      process.exitCode = exitCodeForError(error);
    }
  },
});

const channelApiAuthCmd = defineCommand({
  name: "auth",
  description: "Request Kakao channel auth number via provider API",
  options: {
    config: optConfig,
    json: optJson,
    provider: optProvider,
    "plus-id": option(z.string().min(1), {
      description: "Kakao plusId (@...)",
    }),
    phone: option(z.string().min(1), { description: "Phone number" }),
  },
  handler: async ({ flags, context }) => {
    const asJson = shouldUseJsonOutput(flags.json, context);
    try {
      const runtime = await loadRuntime(flags.config);
      const provider = pickKakaoChannelApiProvider(runtime, flags.provider);
      const service = createKakaoChannelLifecycleService(provider);
      const result = await service.auth({
        plusId: flags["plus-id"],
        phoneNumber: flags.phone,
      });

      if (result.isFailure) {
        printError(result.error, asJson);
        process.exitCode = exitCodeForError(result.error);
        return;
      }

      if (asJson) {
        console.log(JSON.stringify({ ok: true }, null, 2));
        return;
      }
      console.log("OK");
    } catch (error) {
      printError(error, asJson);
      process.exitCode = exitCodeForError(error);
    }
  },
});

const channelApiAddCmd = defineCommand({
  name: "add",
  description: "Add/register a Kakao channel via provider API",
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
  handler: async ({ flags, context }) => {
    const asJson = shouldUseJsonOutput(flags.json, context);
    try {
      const runtime = await loadRuntime(flags.config);
      const provider = pickKakaoChannelApiProvider(runtime, flags.provider);
      const service = createKakaoChannelLifecycleService(provider);
      const result = await service.add({
        plusId: flags["plus-id"],
        authNum: flags["auth-num"],
        phoneNumber: flags.phone,
        categoryCode: flags["category-code"],
      });

      if (result.isFailure) {
        printError(result.error, asJson);
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
          ...(result.value.plusId ? { plusId: result.value.plusId } : {}),
          senderKey: result.value.senderKey,
          ...(result.value.name ? { name: result.value.name } : {}),
        };
        await saveKMsgConfig(raw.path, raw.config);
      }

      if (asJson) {
        console.log(
          JSON.stringify({ ok: true, result: result.value }, null, 2),
        );
        return;
      }

      console.log(`OK senderKey=${result.value.senderKey}`);
      if (flags.save) console.log(`saved=${flags.save}`);
    } catch (error) {
      printError(error, asJson);
      process.exitCode = exitCodeForError(error);
    }
  },
});

const channelApiCmd = defineGroup({
  name: "api",
  description:
    "Kakao channel provider API operations (api-mode providers only)",
  commands: [
    channelApiCategoriesCmd,
    channelApiListCmd,
    channelApiAuthCmd,
    channelApiAddCmd,
  ],
});

const removedChannelCategoriesCmd = createRemovedChannelCommand({
  name: "categories",
  replacement: "k-msg kakao channel api categories",
});
const removedChannelListCmd = createRemovedChannelCommand({
  name: "list",
  replacement:
    "k-msg kakao channel binding list OR k-msg kakao channel api list",
});
const removedChannelAuthCmd = createRemovedChannelCommand({
  name: "auth",
  replacement: "k-msg kakao channel api auth",
});
const removedChannelAddCmd = createRemovedChannelCommand({
  name: "add",
  replacement: "k-msg kakao channel api add",
});

const channelCmd = defineGroup({
  name: "channel",
  description: "Kakao channel management",
  commands: [
    channelBindingCmd,
    channelApiCmd,
    removedChannelCategoriesCmd,
    removedChannelListCmd,
    removedChannelAuthCmd,
    removedChannelAddCmd,
  ],
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
  handler: async ({ flags, context }) => {
    const asJson = shouldUseJsonOutput(flags.json, context);
    try {
      const runtime = await loadRuntime(flags.config);
      const providerHint = resolveTemplateProviderHint(runtime, {
        channelAlias: flags.channel,
      });
      const provider = pickProvider(
        runtime,
        flags.provider ?? providerHint,
        (p) => hasFunction(p, "listTemplates"),
        "kakao template list",
      );
      const templateService = createTemplateLifecycleService(provider);

      const ctx = resolveTemplateContextSenderKey(runtime, {
        providerId: provider.id,
        channelAlias: flags.channel,
        senderKey: flags["sender-key"],
      });

      const result = await templateService.list(
        flags.status ? { status: flags.status } : undefined,
        ctx,
      );
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

      if (result.value.length === 0) {
        console.log("(no templates)");
        return;
      }
      for (const t of result.value) {
        console.log(`${t.code} ${t.status} ${t.name}`);
      }
    } catch (error) {
      printError(error, asJson);
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
    "template-id": option(z.string().min(1), {
      description: "Template ID",
    }),
    channel: option(z.string().optional(), {
      description: "Kakao channel alias (from config)",
    }),
    "sender-key": option(z.string().optional(), {
      description: "Kakao channel senderKey override",
    }),
  },
  handler: async ({ flags, context }) => {
    const asJson = shouldUseJsonOutput(flags.json, context);
    try {
      const runtime = await loadRuntime(flags.config);
      const providerHint = resolveTemplateProviderHint(runtime, {
        channelAlias: flags.channel,
      });
      const provider = pickProvider(
        runtime,
        flags.provider ?? providerHint,
        (p) => hasFunction(p, "getTemplate"),
        "kakao template get",
      );
      const templateService = createTemplateLifecycleService(provider);

      const ctx = resolveTemplateContextSenderKey(runtime, {
        providerId: provider.id,
        channelAlias: flags.channel,
        senderKey: flags["sender-key"],
      });

      const result = await templateService.get(flags["template-id"], ctx);
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

      console.log(result.value.code);
      console.log(result.value.content);
    } catch (error) {
      printError(error, asJson);
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
  handler: async ({ flags, context }) => {
    const asJson = shouldUseJsonOutput(flags.json, context);
    try {
      const runtime = await loadRuntime(flags.config);
      const providerHint = resolveTemplateProviderHint(runtime, {
        channelAlias: flags.channel,
      });
      const provider = pickProvider(
        runtime,
        flags.provider ?? providerHint,
        (p) => hasFunction(p, "createTemplate"),
        "kakao template create",
      );
      const templateService = createTemplateLifecycleService(provider);

      const ctx = resolveTemplateContextSenderKey(runtime, {
        providerId: provider.id,
        channelAlias: flags.channel,
        senderKey: flags["sender-key"],
      });

      const parsedButtons = parseTemplateButtons(flags.buttons);
      if (parsedButtons.isFailure) {
        throw parsedButtons.error;
      }

      const payloadValidation = validateTemplatePayload(
        {
          name: flags.name,
          content: flags.content,
          buttons: parsedButtons.value,
        },
        {
          requireName: true,
          requireContent: true,
        },
      );
      if (payloadValidation.isFailure) {
        throw payloadValidation.error;
      }

      const result = await templateService.create(
        {
          name: payloadValidation.value.name ?? flags.name,
          content: payloadValidation.value.content ?? flags.content,
          ...(payloadValidation.value.buttons
            ? { buttons: payloadValidation.value.buttons }
            : {}),
        },
        ctx,
      );
      if (result.isFailure) {
        printError(result.error, asJson);
        process.exitCode = exitCodeForError(result.error);
        return;
      }

      if (flags.save && flags.save.trim().length > 0) {
        const raw = await loadKMsgConfig(flags.config);
        raw.config.aliases = raw.config.aliases || {};
        raw.config.aliases.templates = raw.config.aliases.templates || {};
        raw.config.aliases.templates[flags.save] = {
          providerId: provider.id,
          templateId: result.value.code,
          ...(flags.channel ? { kakaoChannel: flags.channel } : {}),
        };
        await saveKMsgConfig(raw.path, raw.config);
      }

      if (asJson) {
        console.log(
          JSON.stringify({ ok: true, result: result.value }, null, 2),
        );
        return;
      }

      console.log(`OK templateId=${result.value.code}`);
      if (flags.save) console.log(`saved=${flags.save}`);
    } catch (error) {
      printError(error, asJson);
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
    "template-id": option(z.string().min(1), {
      description: "Template ID",
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
  handler: async ({ flags, context }) => {
    const asJson = shouldUseJsonOutput(flags.json, context);
    try {
      const runtime = await loadRuntime(flags.config);
      const providerHint = resolveTemplateProviderHint(runtime, {
        channelAlias: flags.channel,
      });
      const provider = pickProvider(
        runtime,
        flags.provider ?? providerHint,
        (p) => hasFunction(p, "updateTemplate"),
        "kakao template update",
      );
      const templateService = createTemplateLifecycleService(provider);

      const ctx = resolveTemplateContextSenderKey(runtime, {
        providerId: provider.id,
        channelAlias: flags.channel,
        senderKey: flags["sender-key"],
      });

      const patch: TemplateUpdateInput = {};
      const parsedButtons = parseTemplateButtons(flags.buttons);
      if (parsedButtons.isFailure) {
        throw parsedButtons.error;
      }

      const payloadValidation = validateTemplatePayload(
        {
          name: flags.name,
          content: flags.content,
          buttons: parsedButtons.value,
        },
        {
          requireName: false,
          requireContent: false,
        },
      );
      if (payloadValidation.isFailure) {
        throw payloadValidation.error;
      }

      if (payloadValidation.value.name !== undefined) {
        patch.name = payloadValidation.value.name;
      }
      if (payloadValidation.value.content !== undefined) {
        patch.content = payloadValidation.value.content;
      }
      if (parsedButtons.value !== undefined) {
        patch.buttons = parsedButtons.value;
      }

      const result = await templateService.update(
        flags["template-id"],
        patch,
        ctx,
      );
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

      console.log(`OK templateId=${result.value.code}`);
    } catch (error) {
      printError(error, asJson);
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
    "template-id": option(z.string().min(1), {
      description: "Template ID",
    }),
    channel: option(z.string().optional(), {
      description: "Kakao channel alias (from config)",
    }),
    "sender-key": option(z.string().optional(), {
      description: "Kakao channel senderKey override",
    }),
  },
  handler: async ({ flags, context }) => {
    const asJson = shouldUseJsonOutput(flags.json, context);
    try {
      const runtime = await loadRuntime(flags.config);
      const providerHint = resolveTemplateProviderHint(runtime, {
        channelAlias: flags.channel,
      });
      const provider = pickProvider(
        runtime,
        flags.provider ?? providerHint,
        (p) => hasFunction(p, "deleteTemplate"),
        "kakao template delete",
      );
      const templateService = createTemplateLifecycleService(provider);

      const ctx = resolveTemplateContextSenderKey(runtime, {
        providerId: provider.id,
        channelAlias: flags.channel,
        senderKey: flags["sender-key"],
      });

      const result = await templateService.delete(flags["template-id"], ctx);
      if (result.isFailure) {
        printError(result.error, asJson);
        process.exitCode = exitCodeForError(result.error);
        return;
      }

      if (asJson) {
        console.log(JSON.stringify({ ok: true }, null, 2));
        return;
      }
      console.log("OK");
    } catch (error) {
      printError(error, asJson);
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
    "template-id": option(z.string().min(1), {
      description: "Template ID",
    }),
    channel: option(z.string().optional(), {
      description: "Kakao channel alias (from config)",
    }),
    "sender-key": option(z.string().optional(), {
      description: "Kakao channel senderKey override",
    }),
  },
  handler: async ({ flags, context }) => {
    const asJson = shouldUseJsonOutput(flags.json, context);
    try {
      const runtime = await loadRuntime(flags.config);
      const providerHint = resolveTemplateProviderHint(runtime, {
        channelAlias: flags.channel,
      });
      const provider = pickProvider(
        runtime,
        flags.provider ?? providerHint,
        (p) => hasFunction(p, "requestTemplateInspection"),
        "kakao template inspection request",
      );
      const templateService = createTemplateLifecycleService(provider);

      const ctx = resolveTemplateContextSenderKey(runtime, {
        providerId: provider.id,
        channelAlias: flags.channel,
        senderKey: flags["sender-key"],
      });

      const result = await templateService.requestInspection(
        flags["template-id"],
        ctx,
      );
      if (result.isFailure) {
        printError(result.error, asJson);
        process.exitCode = exitCodeForError(result.error);
        return;
      }

      if (asJson) {
        console.log(JSON.stringify({ ok: true }, null, 2));
        return;
      }
      console.log("OK");
    } catch (error) {
      printError(error, asJson);
      process.exitCode = exitCodeForError(error);
    }
  },
});

const templateCmd = defineGroup({
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
});

export default defineGroup({
  name: "kakao",
  description: "Kakao channel/template management",
  commands: [channelCmd, templateCmd],
});
