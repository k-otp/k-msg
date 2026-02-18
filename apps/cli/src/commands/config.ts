import { createInterface } from "node:readline/promises";
import { defineCommand, option } from "@bunli/core";
import type { MessageType } from "@k-msg/core";
import {
  type ProviderConfigFieldSpec,
  type ProviderTypeWithConfig,
  providerCliMetadata,
  providerConfigFieldSpecs,
} from "@k-msg/provider";
import { z } from "zod";
import { optConfig, optJson, strictBooleanFlagSchema } from "../cli/options";
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

type SelectOption<T> = {
  label: string;
  value: T;
  hint?: string;
};

const ESC = "\u001B";
const CSI = `${ESC}[`;
const CLEAR_LINE = `${CSI}2K`;
const CURSOR_START = `${CSI}G`;
const CURSOR_HIDE = `${CSI}?25l`;
const CURSOR_SHOW = `${CSI}?25h`;

function canPromptInTerminal(terminal: {
  isInteractive: boolean;
  isCI: boolean;
}): boolean {
  return terminal.isInteractive && !terminal.isCI;
}

function canUseArrowSelect(): boolean {
  return (
    process.stdin.isTTY === true &&
    process.stdout.isTTY === true &&
    typeof process.stdin.setRawMode === "function"
  );
}

async function askText(input: {
  message: string;
  defaultValue?: string;
  validate?: (value: string) => boolean | string;
}): Promise<string> {
  const defaultHint =
    typeof input.defaultValue === "string" && input.defaultValue.length > 0
      ? ` (${input.defaultValue})`
      : "";
  const promptText = `${input.message}${defaultHint} `;

  while (true) {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    let raw = "";
    try {
      raw = await rl.question(promptText);
    } finally {
      rl.close();
    }

    const value = raw.trim() || input.defaultValue || "";
    if (!input.validate) {
      return value;
    }
    const validated = input.validate(value);
    if (validated === true) {
      return value;
    }
    console.error(typeof validated === "string" ? validated : "Invalid input");
  }
}

async function askConfirm(input: {
  message: string;
  defaultValue?: boolean;
}): Promise<boolean> {
  const defaultHint =
    input.defaultValue === true
      ? "Y/n"
      : input.defaultValue === false
        ? "y/N"
        : "y/n";

  while (true) {
    const raw = await askText({
      message: `${input.message} (${defaultHint})`,
    });
    const normalized = raw.trim().toLowerCase();
    if (normalized.length === 0 && input.defaultValue !== undefined) {
      return input.defaultValue;
    }
    if (normalized === "y" || normalized === "yes") return true;
    if (normalized === "n" || normalized === "no") return false;
    console.error("Please answer with y/yes or n/no");
  }
}

function renderNumberedSelect<T>(
  message: string,
  options: SelectOption<T>[],
  defaultIndex: number,
): void {
  console.log(message);
  for (const [index, option] of options.entries()) {
    const marker = index === defaultIndex ? "*" : " ";
    const hint = option.hint ? ` (${option.hint})` : "";
    console.log(`  ${marker} ${index + 1}) ${option.label}${hint}`);
  }
}

async function promptSelectByNumber<T>(
  message: string,
  options: {
    options: SelectOption<T>[];
    default?: T;
  },
): Promise<T> {
  if (options.options.length === 0) {
    throw new Error("Select options cannot be empty");
  }

  let defaultIndex = 0;
  if (options.default !== undefined) {
    const resolved = options.options.findIndex(
      (option) => option.value === options.default,
    );
    if (resolved >= 0) {
      defaultIndex = resolved;
    }
  }

  renderNumberedSelect(message, options.options, defaultIndex);
  const raw = await askText({
    message: "Select number",
    defaultValue: String(defaultIndex + 1),
    validate: (value) => {
      const index = Number.parseInt(value.trim(), 10);
      if (!Number.isInteger(index)) return "Enter a numeric index";
      if (index < 1 || index > options.options.length) {
        return `Enter a number between 1 and ${options.options.length}`;
      }
      return true;
    },
  });
  const parsedIndex = Number.parseInt(raw.trim(), 10) - 1;
  const selected = options.options[parsedIndex];
  if (!selected) {
    throw new Error(
      `Invalid selection index: ${parsedIndex + 1}. Range is 1-${options.options.length}`,
    );
  }

  return selected.value;
}

function clearRenderedOptions(optionCount: number): void {
  for (let i = 0; i < optionCount; i += 1) {
    process.stdout.write(`${CSI}1A${CLEAR_LINE}`);
  }
}

function drawArrowOptions<T>(
  options: SelectOption<T>[],
  selectedIndex: number,
): void {
  clearRenderedOptions(options.length);
  for (const [index, option] of options.entries()) {
    process.stdout.write(CLEAR_LINE + CURSOR_START);
    const prefix = index === selectedIndex ? "❯ " : "  ";
    const hint = option.hint ? ` (${option.hint})` : "";
    console.log(`${prefix}${option.label}${hint}`);
  }
}

async function promptSelectWithArrows<T>(
  message: string,
  options: {
    options: SelectOption<T>[];
    default?: T;
  },
): Promise<T> {
  if (!canUseArrowSelect()) {
    return promptSelectByNumber(message, options);
  }
  if (options.options.length === 0) {
    throw new Error("Select options cannot be empty");
  }

  let selectedIndex = 0;
  if (options.default !== undefined) {
    const resolved = options.options.findIndex(
      (option) => option.value === options.default,
    );
    if (resolved >= 0) selectedIndex = resolved;
  }

  console.log(message);
  process.stdout.write(CURSOR_HIDE);
  for (const option of options.options) {
    const hint = option.hint ? ` (${option.hint})` : "";
    console.log(`  ${option.label}${hint}`);
  }
  drawArrowOptions(options.options, selectedIndex);

  return new Promise<T>((resolve, reject) => {
    const cleanup = () => {
      process.stdin.off("data", onData);
      try {
        process.stdin.setRawMode(false);
      } catch {
        // ignore
      }
      process.stdin.pause();
      process.stdout.write(CURSOR_SHOW);
    };

    const onData = (data: Buffer) => {
      try {
        const key = data.toString();
        if (key === "\u001B[A") {
          selectedIndex = Math.max(0, selectedIndex - 1);
          drawArrowOptions(options.options, selectedIndex);
          return;
        }
        if (key === "\u001B[B") {
          selectedIndex = Math.min(
            options.options.length - 1,
            selectedIndex + 1,
          );
          drawArrowOptions(options.options, selectedIndex);
          return;
        }
        if (key === "\r" || key === "\n") {
          cleanup();
          clearRenderedOptions(options.options.length);
          const selected = options.options[selectedIndex];
          if (!selected) {
            throw new Error("Select option resolution failed");
          }
          console.log(`✓ ${selected.label}`);
          resolve(selected.value);
          return;
        }
        if (key === "\u0003") {
          cleanup();
          process.exit(0);
        }
      } catch (error) {
        cleanup();
        reject(error);
      }
    };

    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on("data", onData);
  });
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

async function promptProviderId(input: {
  type: ProviderType;
  existingIds: Set<string>;
  allowReplace: boolean;
}): Promise<string> {
  const { type, existingIds, allowReplace } = input;
  const primaryId = type;
  if (!existingIds.has(primaryId)) {
    return primaryId;
  }
  if (!allowReplace) {
    return nextProviderId(type, existingIds);
  }
  const nextId = nextProviderId(type, existingIds);
  const shouldReplace = await askConfirm({
    message: `Provider '${primaryId}' already exists. Replace it? (No = create ${nextId})`,
    defaultValue: false,
  });
  if (shouldReplace) {
    return primaryId;
  }
  return nextId;
}

async function promptProviderType(input: {
  preselected?: ProviderType;
}): Promise<ProviderType> {
  if (input.preselected) {
    return input.preselected;
  }

  return promptSelectWithArrows<ProviderType>("Select provider type", {
    options: providerTypes.map((type) => ({
      label: providerCliMetadata[type].label,
      value: type,
    })),
    default: "iwinv",
  });
}

async function promptProviderEntry(input: {
  preselectedType?: ProviderType;
  existingIds: Set<string>;
  allowReplace: boolean;
}): Promise<ProviderEntry> {
  const type = await promptProviderType({
    preselected: input.preselectedType,
  });

  const id = await promptProviderId({
    type,
    existingIds: input.existingIds,
    allowReplace: input.allowReplace,
  });

  const config: Record<string, unknown> = {};

  for (const [key, fieldSpec] of providerFieldEntries(type)) {
    const raw = await askText({
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

async function buildInteractiveTemplateConfig(): Promise<KMsgCliConfig> {
  const config = createConfigSkeleton();

  let addAnother = false;
  do {
    const entry = await promptProviderEntry({
      existingIds: new Set(config.providers.map((provider) => provider.id)),
      allowReplace: true,
    });
    upsertProvider(config, entry);

    addAnother = await askConfirm({
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
  handler: async ({ flags, terminal }) => {
    const targetPath = await resolveConfigPathForWrite(flags.config);

    let templateMode: "interactive" | "full" = flags.template;
    if (templateMode === "interactive" && !canPromptInTerminal(terminal)) {
      templateMode = "full";
      console.log("Non-interactive environment detected. Using template=full.");
    }

    if (!flags.force && (await Bun.file(targetPath).exists())) {
      if (canPromptInTerminal(terminal)) {
        const ok = await askConfirm({
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
        ? await buildInteractiveTemplateConfig()
        : createFullTemplateConfig();

    applySharedConfigDefaults(config);
    const plaintextCredentials = collectPlaintextCredentialLocations(config);
    await saveKMsgConfig(targetPath, config);
    printConfigSavedSummary({
      targetPath,
      providerCount: config.providers.length,
      plaintextCredentials,
    });
  },
});

const providerAddCmd = defineCommand({
  name: "add",
  description: "Add a provider entry via prompts",
  options: {
    config: optConfig,
  },
  handler: async ({ flags, positional, terminal }) => {
    if (!canPromptInTerminal(terminal)) {
      console.error("config provider add requires an interactive terminal");
      process.exitCode = 2;
      return;
    }

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

    const provider = await promptProviderEntry({
      preselectedType: requestedType,
      existingIds: new Set(config.providers.map((entry) => entry.id)),
      allowReplace: true,
    });

    const result = upsertProvider(config, provider);

    const includeRouting = await askConfirm({
      message: "Add provider to routing.byType for matching message types?",
      defaultValue: true,
    });
    if (includeRouting) {
      addProviderToRouting(config, provider);
    }

    const shouldSetDefault = await askConfirm({
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
  },
});

const providerCmd = defineCommand({
  name: "provider",
  description: "Provider-level config helpers",
  commands: [providerAddCmd],
  handler: async () => {
    console.log("Use a subcommand: add");
  },
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

export default defineCommand({
  name: "config",
  description: "Configuration helpers",
  commands: [initCmd, showCmd, validateCmd, providerCmd],
  handler: async () => {
    console.log("Use a subcommand: init | show | validate | provider");
  },
});
