import { defineCommand, defineGroup, option } from "@bunli/core";
import type { MessageType } from "@k-msg/core";
import {
  type ProviderConfigFieldSpec,
  type ProviderTypeWithConfig,
  providerCliMetadata,
  providerConfigFieldSpecs,
} from "@k-msg/provider";
import { z } from "zod";
import { optConfig, optJson, strictBooleanFlagSchema } from "../cli/options";
import {
  isPromptCancelledError,
  type PromptApi,
  promptConfirm,
  promptSelect,
  promptText,
} from "../cli/prompt";
import { shouldUseJsonOutput } from "../cli/utils";
import { CONFIG_SCHEMA_LATEST_URL } from "../config/constants";
import { loadKMsgConfig, resolveConfigPathForWrite } from "../config/load";
import { saveKMsgConfig } from "../config/save";
import { type KMsgCliConfig, providerTypeSchema } from "../config/schema";

type ProviderEntry = KMsgCliConfig["providers"][number];
type ProviderType = ProviderTypeWithConfig;
const providerTypes = Object.keys(providerCliMetadata) as ProviderType[];

interface PlaintextCredentialLocation {
  providerId: string;
  keyPath: string;
}

function canPromptInTerminal(terminal: {
  isInteractive: boolean;
  isCI: boolean;
}): boolean {
  return terminal.isInteractive && !terminal.isCI;
}

function reportPromptCancellation(): void {
  console.error("Prompt cancelled.");
}

function parseProviderType(
  input: string | undefined,
): ProviderType | undefined {
  if (typeof input !== "string") return undefined;
  const parsed = providerTypeSchema.safeParse(input.trim().toLowerCase());
  return parsed.success ? (parsed.data as ProviderType) : undefined;
}

function createConfigSkeleton(): KMsgCliConfig {
  return {
    $schema: CONFIG_SCHEMA_LATEST_URL,
    version: 1,
    providers: [],
  };
}

function providerFieldEntries(
  type: ProviderType,
): Array<[string, ProviderConfigFieldSpec]> {
  return Object.entries(providerConfigFieldSpecs[type]) as Array<
    [string, ProviderConfigFieldSpec]
  >;
}

function buildProviderConfigWithDefaults(
  type: ProviderType,
): Record<string, string> {
  const config: Record<string, string> = {};
  for (const [key, fieldSpec] of providerFieldEntries(type)) {
    if (typeof fieldSpec.defaultValue === "string") {
      config[key] = fieldSpec.defaultValue;
    }
  }
  return config;
}

function supportsRoutingSeedType(
  type: ProviderType,
  messageType: MessageType,
): boolean {
  return providerCliMetadata[type].routingSeedTypes.includes(messageType);
}

function collectRoutingSeedTypes(providers: ProviderEntry[]): MessageType[] {
  const types = new Set<MessageType>();
  for (const provider of providers) {
    for (const messageType of providerCliMetadata[provider.type]
      .routingSeedTypes) {
      types.add(messageType);
    }
  }
  return [...types];
}

function buildFullTemplateRoutingByType(
  providers: ProviderEntry[],
): Record<string, string[]> {
  const byType: Record<string, string[]> = {};
  const allMessageTypes = collectRoutingSeedTypes(providers);

  for (const messageType of allMessageTypes) {
    const ids = providers
      .filter((provider) => supportsRoutingSeedType(provider.type, messageType))
      .map((provider) => provider.id);
    if (ids.length > 0) {
      byType[messageType] = ids;
    }
  }

  return byType;
}

function resolveDefaultProviderId(
  providers: ProviderEntry[],
): string | undefined {
  return (
    providers.find((provider) => provider.type === "mock")?.id ??
    providers[0]?.id
  );
}

function resolvePrimaryKakaoProviderId(
  providers: ProviderEntry[],
): string | undefined {
  const preferred = providers.find(
    (provider) =>
      provider.type !== "mock" &&
      supportsRoutingSeedType(provider.type, "ALIMTALK") &&
      providerCliMetadata[provider.type].defaultKakaoSenderKey !== undefined,
  );
  if (preferred) return preferred.id;

  const fallbackWithSenderKey = providers.find(
    (provider) =>
      supportsRoutingSeedType(provider.type, "ALIMTALK") &&
      providerCliMetadata[provider.type].defaultKakaoSenderKey !== undefined,
  );
  if (fallbackWithSenderKey) return fallbackWithSenderKey.id;

  return providers.find((provider) =>
    supportsRoutingSeedType(provider.type, "ALIMTALK"),
  )?.id;
}

function createFullTemplateConfig(): KMsgCliConfig {
  const providers: ProviderEntry[] = providerTypes.map((type) => ({
    type,
    id: type,
    config: buildProviderConfigWithDefaults(type),
  }));

  const defaultProviderId = resolveDefaultProviderId(providers);
  const primaryKakaoProviderId = resolvePrimaryKakaoProviderId(providers);
  const primaryKakaoProviderType = providers.find(
    (provider) => provider.id === primaryKakaoProviderId,
  )?.type;
  const primaryKakaoSenderKey =
    primaryKakaoProviderType &&
    providerCliMetadata[primaryKakaoProviderType].defaultKakaoSenderKey;

  return {
    $schema: CONFIG_SCHEMA_LATEST_URL,
    version: 1,
    providers,
    routing: {
      ...(defaultProviderId ? { defaultProviderId } : {}),
      strategy: "first",
      byType: buildFullTemplateRoutingByType(providers),
    },
    defaults: {
      sms: { autoLmsBytes: 90 },
      kakao: { channel: "main", plusId: "@your_channel" },
    },
    aliases: {
      kakaoChannels: {
        main: {
          providerId: primaryKakaoProviderId ?? defaultProviderId ?? "mock",
          plusId: "@your_channel",
          ...(primaryKakaoSenderKey
            ? { senderKey: primaryKakaoSenderKey }
            : {}),
          name: "Main Channel",
        },
      },
    },
    onboarding: {
      manualChecks: {
        iwinv: {
          channel_registered_in_console: {
            done: false,
            note: "Set true after Kakao channel onboarding is completed in IWINV console.",
          },
        },
      },
    },
  };
}

function routeAsList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === "string");
  }
  if (typeof value === "string" && value.trim().length > 0) {
    return [value.trim()];
  }
  return [];
}

function getSenderKeyHintByProviderType(
  type: ProviderType,
): string | undefined {
  return providerCliMetadata[type].defaultKakaoSenderKey;
}

function ensureSchemaField(config: KMsgCliConfig): void {
  if (!config.$schema || config.$schema.trim().length === 0) {
    config.$schema = CONFIG_SCHEMA_LATEST_URL;
  }
}

function ensureRoutingExists(
  config: KMsgCliConfig,
): asserts config is KMsgCliConfig & {
  routing: NonNullable<KMsgCliConfig["routing"]> & {
    byType: NonNullable<NonNullable<KMsgCliConfig["routing"]>["byType"]>;
  };
} {
  if (!config.routing) {
    config.routing = {
      strategy: "first",
      byType: {},
    };
  }
  if (!config.routing.strategy) {
    config.routing.strategy = "first";
  }
  if (!config.routing.byType) {
    config.routing.byType = {};
  }
}

function setRoutingByType(
  config: KMsgCliConfig,
  type: MessageType,
  ids: string[],
): void {
  ensureRoutingExists(config);
  const deduped = Array.from(new Set(ids));
  if (deduped.length === 0) return;
  config.routing.byType[type] = deduped;
}

function addProviderToRouting(
  config: KMsgCliConfig,
  provider: ProviderEntry,
): void {
  ensureRoutingExists(config);
  for (const messageType of providerCliMetadata[provider.type]
    .routingSeedTypes) {
    const current = routeAsList(config.routing.byType[messageType]);
    if (!current.includes(provider.id)) {
      current.push(provider.id);
    }
    setRoutingByType(config, messageType, current);
  }
}

function syncRoutingForAllProviders(config: KMsgCliConfig): void {
  ensureRoutingExists(config);

  for (const messageType of collectRoutingSeedTypes(config.providers)) {
    const ids = config.providers
      .filter((provider) => supportsRoutingSeedType(provider.type, messageType))
      .map((provider) => provider.id);
    if (ids.length > 0) {
      setRoutingByType(config, messageType, ids);
    }
  }
}

function ensureIwinvManualCheck(config: KMsgCliConfig): void {
  const hasIwinv = config.providers.some(
    (provider) => provider.type === "iwinv",
  );
  if (!hasIwinv) return;

  if (!config.onboarding) config.onboarding = {};
  if (!config.onboarding.manualChecks) config.onboarding.manualChecks = {};
  if (!config.onboarding.manualChecks.iwinv) {
    config.onboarding.manualChecks.iwinv = {};
  }

  const existing =
    config.onboarding.manualChecks.iwinv.channel_registered_in_console;
  if (!existing) {
    config.onboarding.manualChecks.iwinv.channel_registered_in_console = {
      done: false,
      note: "Set true after Kakao channel onboarding is completed in IWINV console.",
    };
  }
}

function ensureRuntimeDefaults(config: KMsgCliConfig): void {
  if (!config.defaults) config.defaults = {};

  if (!config.defaults.sms) {
    config.defaults.sms = {};
  }
  if (typeof config.defaults.sms.autoLmsBytes !== "number") {
    config.defaults.sms.autoLmsBytes = 90;
  }
}

function ensureKakaoAliasDefaults(config: KMsgCliConfig): void {
  const primaryAlimTalkProvider = config.providers.find((provider) =>
    supportsRoutingSeedType(provider.type, "ALIMTALK"),
  );

  if (!primaryAlimTalkProvider) return;

  if (!config.aliases) config.aliases = {};
  if (!config.aliases.kakaoChannels) config.aliases.kakaoChannels = {};

  if (!config.aliases.kakaoChannels.main) {
    const senderKeyHint = getSenderKeyHintByProviderType(
      primaryAlimTalkProvider.type,
    );
    config.aliases.kakaoChannels.main = {
      providerId: primaryAlimTalkProvider.id,
      plusId: "@your_channel",
      ...(senderKeyHint ? { senderKey: senderKeyHint } : {}),
      name: "Main Channel",
    };
  }

  if (!config.defaults) config.defaults = {};
  if (!config.defaults.kakao) config.defaults.kakao = {};

  if (!config.defaults.kakao.channel) {
    config.defaults.kakao.channel = "main";
  }
  if (!config.defaults.kakao.plusId) {
    config.defaults.kakao.plusId =
      config.aliases.kakaoChannels.main.plusId ?? "@your_channel";
  }
}

function applySharedConfigDefaults(config: KMsgCliConfig): void {
  ensureSchemaField(config);
  ensureRuntimeDefaults(config);
  ensureKakaoAliasDefaults(config);
  ensureIwinvManualCheck(config);
  ensureRoutingExists(config);

  if (!config.routing.defaultProviderId && config.providers.length > 0) {
    config.routing.defaultProviderId = config.providers[0]?.id;
  }
}

function collectPlaintextCredentialLocations(
  config: KMsgCliConfig,
): PlaintextCredentialLocation[] {
  const sensitiveKeyPattern =
    /(api[-_]?key|secret|token|auth|password|passphrase)/i;
  const warnings: PlaintextCredentialLocation[] = [];

  for (const provider of config.providers) {
    const providerConfig = provider.config as Record<string, unknown>;
    for (const [key, value] of Object.entries(providerConfig)) {
      if (!sensitiveKeyPattern.test(key)) continue;
      if (typeof value !== "string") continue;

      const trimmed = value.trim();
      if (trimmed.length === 0) continue;
      if (trimmed.startsWith("env:")) continue;

      warnings.push({
        providerId: provider.id,
        keyPath: `config.${key}`,
      });
    }
  }

  return warnings;
}

function printConfigSavedSummary(input: {
  targetPath: string;
  providerCount: number;
  plaintextCredentials: PlaintextCredentialLocation[];
}): void {
  console.log(`Config saved: ${input.targetPath}`);
  console.log(`Providers configured: ${input.providerCount}`);
  console.log(
    "Next: run `k-msg providers doctor` to verify provider readiness.",
  );

  if (input.plaintextCredentials.length > 0) {
    console.log("");
    console.log(
      "Warning: plain-text credential values were detected in the config file.",
    );
    for (const warning of input.plaintextCredentials) {
      console.log(`  - ${warning.providerId}.${warning.keyPath}`);
    }
    console.log(
      "Recommendation: use `env:VAR_NAME` references (example: `env:ALIGO_API_KEY`).",
    );
  }
}

function upsertProvider(
  config: KMsgCliConfig,
  provider: ProviderEntry,
): "added" | "replaced" {
  const index = config.providers.findIndex((entry) => entry.id === provider.id);
  if (index >= 0) {
    config.providers[index] = provider;
    return "replaced";
  }
  config.providers.push(provider);
  return "added";
}

function nextProviderId(type: ProviderType, existingIds: Set<string>): string {
  if (!existingIds.has(type)) return type;
  let suffix = 2;
  while (existingIds.has(`${type}-${suffix}`)) {
    suffix += 1;
  }
  return `${type}-${suffix}`;
}

async function promptProviderId(
  prompt: PromptApi,
  input: {
    type: ProviderType;
    existingIds: Set<string>;
    allowReplace: boolean;
  },
): Promise<string> {
  const { type, existingIds, allowReplace } = input;
  const primaryId = type;
  if (!existingIds.has(primaryId)) {
    return primaryId;
  }
  if (!allowReplace) {
    return nextProviderId(type, existingIds);
  }
  const nextId = nextProviderId(type, existingIds);
  const shouldReplace = await promptConfirm(prompt, {
    message: `Provider '${primaryId}' already exists. Replace it? (No = create ${nextId})`,
    defaultValue: false,
  });
  if (shouldReplace) {
    return primaryId;
  }
  return nextId;
}

async function promptProviderType(
  prompt: PromptApi,
  input: {
    preselected?: ProviderType;
  },
): Promise<ProviderType> {
  if (input.preselected) {
    return input.preselected;
  }

  return promptSelect<ProviderType>(prompt, "Select provider type", {
    options: providerTypes.map((type) => ({
      label: providerCliMetadata[type].label,
      value: type,
    })),
    default: "iwinv",
  });
}

async function promptProviderEntry(
  prompt: PromptApi,
  input: {
    preselectedType?: ProviderType;
    existingIds: Set<string>;
    allowReplace: boolean;
  },
): Promise<ProviderEntry> {
  const type = await promptProviderType(prompt, {
    preselected: input.preselectedType,
  });

  const id = await promptProviderId(prompt, {
    type,
    existingIds: input.existingIds,
    allowReplace: input.allowReplace,
  });

  const config: Record<string, unknown> = {};

  for (const [key, fieldSpec] of providerFieldEntries(type)) {
    const raw = await promptText(prompt, {
      message: `${type}.config.${key}`,
      defaultValue: fieldSpec.defaultValue,
      validate: fieldSpec.required
        ? (value) =>
            value.trim().length > 0 ? true : `${key} is required for ${type}`
        : undefined,
    });

    const value = raw.trim();
    if (value.length > 0) {
      config[key] = value;
    }
  }

  return {
    type,
    id,
    config,
  };
}

async function buildInteractiveTemplateConfig(
  prompt: PromptApi,
): Promise<KMsgCliConfig> {
  const config = createConfigSkeleton();

  let addAnother = false;
  do {
    const entry = await promptProviderEntry(prompt, {
      existingIds: new Set(config.providers.map((provider) => provider.id)),
      allowReplace: true,
    });
    upsertProvider(config, entry);

    addAnother = await promptConfirm(prompt, {
      message: "Add another provider?",
      defaultValue: false,
    });
  } while (addAnother || config.providers.length === 0);

  syncRoutingForAllProviders(config);
  applySharedConfigDefaults(config);

  return config;
}

async function loadConfigOrSkeleton(
  targetPath: string,
): Promise<KMsgCliConfig> {
  const file = Bun.file(targetPath);
  if (!(await file.exists())) {
    return createConfigSkeleton();
  }

  const loaded = await loadKMsgConfig(targetPath);
  return loaded.config;
}

const initCmd = defineCommand({
  name: "init",
  description: "Initialize k-msg config",
  options: {
    config: optConfig,
    force: option(strictBooleanFlagSchema, {
      description:
        "Overwrite if the file already exists (boolean: --force, --force true|false, --no-force; default: false)",
      short: "f",
    }),
    template: option(z.enum(["interactive", "full"]).default("interactive"), {
      description: "Template mode (interactive|full)",
    }),
  },
  handler: async ({ flags, terminal, prompt }) => {
    try {
      const targetPath = await resolveConfigPathForWrite(flags.config);

      let templateMode: "interactive" | "full" = flags.template;
      if (templateMode === "interactive" && !canPromptInTerminal(terminal)) {
        templateMode = "full";
        console.log(
          "Non-interactive environment detected. Using template=full.",
        );
      }

      if (!flags.force && (await Bun.file(targetPath).exists())) {
        if (canPromptInTerminal(terminal)) {
          const ok = await promptConfirm(prompt, {
            message: `Config already exists: ${targetPath}. Overwrite?`,
            defaultValue: false,
          });
          if (!ok) return;
        } else {
          console.error(`Config already exists: ${targetPath}`);
          process.exitCode = 2;
          return;
        }
      }

      const config =
        templateMode === "interactive"
          ? await buildInteractiveTemplateConfig(prompt)
          : createFullTemplateConfig();

      applySharedConfigDefaults(config);
      const plaintextCredentials = collectPlaintextCredentialLocations(config);
      await saveKMsgConfig(targetPath, config);
      printConfigSavedSummary({
        targetPath,
        providerCount: config.providers.length,
        plaintextCredentials,
      });
    } catch (error) {
      if (isPromptCancelledError(error)) {
        reportPromptCancellation();
        process.exitCode = 2;
        return;
      }
      throw error;
    }
  },
});

const providerAddCmd = defineCommand({
  name: "add",
  description: "Add a provider entry via prompts",
  options: {
    config: optConfig,
  },
  handler: async ({ flags, positional, terminal, prompt }) => {
    if (!canPromptInTerminal(terminal)) {
      console.error("config provider add requires an interactive terminal");
      process.exitCode = 2;
      return;
    }

    try {
      const targetPath = await resolveConfigPathForWrite(flags.config);
      const config = await loadConfigOrSkeleton(targetPath);

      const requestedTypeRaw = positional[0];
      const requestedType = parseProviderType(requestedTypeRaw);
      if (typeof requestedTypeRaw === "string" && !requestedType) {
        console.error(
          `Unknown provider type: ${requestedTypeRaw} (supported: ${providerTypeSchema.options.join(", ")})`,
        );
        process.exitCode = 2;
        return;
      }

      const provider = await promptProviderEntry(prompt, {
        preselectedType: requestedType,
        existingIds: new Set(config.providers.map((entry) => entry.id)),
        allowReplace: true,
      });

      const result = upsertProvider(config, provider);

      const includeRouting = await promptConfirm(prompt, {
        message: "Add provider to routing.byType for matching message types?",
        defaultValue: true,
      });
      if (includeRouting) {
        addProviderToRouting(config, provider);
      }

      const shouldSetDefault = await promptConfirm(prompt, {
        message: "Set as default provider?",
        defaultValue: config.providers.length === 1,
      });
      if (shouldSetDefault && config.providers.length > 0) {
        ensureRoutingExists(config);
        config.routing.defaultProviderId = provider.id;
      }

      applySharedConfigDefaults(config);
      const plaintextCredentials = collectPlaintextCredentialLocations(config);

      await saveKMsgConfig(targetPath, config);
      printConfigSavedSummary({
        targetPath,
        providerCount: config.providers.length,
        plaintextCredentials,
      });
      console.log(`Provider ${provider.id} ${result}`);
    } catch (error) {
      if (isPromptCancelledError(error)) {
        reportPromptCancellation();
        process.exitCode = 2;
        return;
      }
      throw error;
    }
  },
});

const providerCmd = defineGroup({
  name: "provider",
  description: "Provider-level config helpers",
  commands: [providerAddCmd],
});

const showCmd = defineCommand({
  name: "show",
  description: "Show detected configuration",
  options: {
    config: optConfig,
    json: optJson,
  },
  handler: async ({ flags, context }) => {
    const asJson = shouldUseJsonOutput(flags.json, context);
    const loaded = await loadKMsgConfig(flags.config);

    if (asJson) {
      console.log(JSON.stringify(loaded, null, 2));
      return;
    }

    console.log(`Config: ${loaded.path}`);
    console.log(
      `Providers: ${loaded.config.providers.map((p) => p.id).join(", ") || "(none)"}`,
    );
    if (loaded.config.routing?.defaultProviderId) {
      console.log(
        `Default provider: ${loaded.config.routing.defaultProviderId}`,
      );
    }
  },
});

const validateCmd = defineCommand({
  name: "validate",
  description: "Validate configuration file",
  options: {
    config: optConfig,
  },
  handler: async ({ flags }) => {
    const loaded = await loadKMsgConfig(flags.config);
    console.log(`OK: ${loaded.path}`);
  },
});

export default defineGroup({
  name: "config",
  description: "Configuration helpers",
  commands: [initCmd, showCmd, validateCmd, providerCmd],
});
