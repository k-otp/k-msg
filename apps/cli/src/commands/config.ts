import { createInterface } from "node:readline/promises";
import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import { optConfig, optJson } from "../cli/options";
import { shouldUseJsonOutput } from "../cli/utils";
import { CONFIG_SCHEMA_LATEST_URL } from "../config/constants";
import { loadKMsgConfig, resolveConfigPathForWrite } from "../config/load";
import { saveKMsgConfig } from "../config/save";
import { type KMsgCliConfig, providerTypeSchema } from "../config/schema";

const MESSAGE_TYPES = ["ALIMTALK", "SMS", "LMS", "MMS"] as const;
type MessageType = (typeof MESSAGE_TYPES)[number];

type ProviderEntry = KMsgCliConfig["providers"][number];
type ProviderType = z.infer<typeof providerTypeSchema>;

interface ProviderFieldSpec {
  key: string;
  defaultValue?: string;
  required?: boolean;
}

interface PlaintextCredentialLocation {
  providerId: string;
  keyPath: string;
}

const providerFieldSpecs: Record<ProviderType, ProviderFieldSpec[]> = {
  mock: [],
  aligo: [
    { key: "apiKey", defaultValue: "env:ALIGO_API_KEY", required: true },
    { key: "userId", defaultValue: "env:ALIGO_USER_ID", required: true },
    { key: "sender", defaultValue: "env:ALIGO_SENDER" },
    { key: "senderKey", defaultValue: "env:ALIGO_SENDER_KEY" },
  ],
  iwinv: [
    { key: "apiKey", defaultValue: "env:IWINV_API_KEY", required: true },
    { key: "smsApiKey", defaultValue: "env:IWINV_SMS_API_KEY" },
    { key: "smsAuthKey", defaultValue: "env:IWINV_SMS_AUTH_KEY" },
    { key: "smsCompanyId", defaultValue: "env:IWINV_SMS_COMPANY_ID" },
    { key: "senderNumber", defaultValue: "env:IWINV_SENDER_NUMBER" },
  ],
  solapi: [
    { key: "apiKey", defaultValue: "env:SOLAPI_API_KEY", required: true },
    {
      key: "apiSecret",
      defaultValue: "env:SOLAPI_API_SECRET",
      required: true,
    },
    { key: "defaultFrom", defaultValue: "env:SOLAPI_DEFAULT_FROM" },
    { key: "kakaoPfId", defaultValue: "env:SOLAPI_KAKAO_PF_ID" },
  ],
};

const providerTypeLabels: Record<ProviderType, string> = {
  mock: "Mock (local test)",
  aligo: "Aligo",
  iwinv: "IWINV",
  solapi: "SOLAPI",
};

const providerSupportedTypes: Record<ProviderType, readonly MessageType[]> = {
  mock: ["ALIMTALK", "SMS", "LMS", "MMS"],
  aligo: ["ALIMTALK", "SMS", "LMS", "MMS"],
  iwinv: ["ALIMTALK", "SMS", "LMS", "MMS"],
  solapi: ["ALIMTALK", "SMS", "LMS", "MMS"],
};

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
  return parsed.success ? parsed.data : undefined;
}

function createConfigSkeleton(): KMsgCliConfig {
  return {
    $schema: CONFIG_SCHEMA_LATEST_URL,
    version: 1,
    providers: [],
  };
}

function createFullTemplateConfig(): KMsgCliConfig {
  return {
    $schema: CONFIG_SCHEMA_LATEST_URL,
    version: 1,
    providers: [
      { type: "mock", id: "mock", config: {} },
      {
        type: "aligo",
        id: "aligo",
        config: {
          apiKey: "env:ALIGO_API_KEY",
          userId: "env:ALIGO_USER_ID",
          senderKey: "env:ALIGO_SENDER_KEY",
          sender: "env:ALIGO_SENDER",
        },
      },
      {
        type: "iwinv",
        id: "iwinv",
        config: {
          apiKey: "env:IWINV_API_KEY",
          smsApiKey: "env:IWINV_SMS_API_KEY",
          smsAuthKey: "env:IWINV_SMS_AUTH_KEY",
          smsCompanyId: "env:IWINV_SMS_COMPANY_ID",
          senderNumber: "env:IWINV_SENDER_NUMBER",
        },
      },
      {
        type: "solapi",
        id: "solapi",
        config: {
          apiKey: "env:SOLAPI_API_KEY",
          apiSecret: "env:SOLAPI_API_SECRET",
          defaultFrom: "env:SOLAPI_DEFAULT_FROM",
          kakaoPfId: "env:SOLAPI_KAKAO_PF_ID",
        },
      },
    ],
    routing: {
      defaultProviderId: "mock",
      strategy: "first",
      byType: {
        ALIMTALK: ["aligo", "iwinv", "solapi"],
        SMS: ["aligo", "iwinv", "solapi"],
        LMS: ["aligo", "iwinv", "solapi"],
        MMS: ["aligo", "iwinv", "solapi"],
      },
    },
    defaults: {
      from: "env:K_MSG_DEFAULT_FROM",
      sms: { autoLmsBytes: 90 },
      kakao: { channel: "main", plusId: "@your_channel" },
    },
    aliases: {
      kakaoChannels: {
        main: {
          providerId: "aligo",
          plusId: "@your_channel",
          senderKey: "env:ALIGO_SENDER_KEY",
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

function getSenderKeyHintByProviderType(type: ProviderType): string {
  switch (type) {
    case "aligo":
      return "env:ALIGO_SENDER_KEY";
    case "solapi":
      return "env:SOLAPI_KAKAO_PF_ID";
    case "iwinv":
      return "env:IWINV_SENDER_KEY";
    case "mock":
      return "env:MOCK_SENDER_KEY";
  }
}

function ensureSchemaField(config: KMsgCliConfig): void {
  if (!config.$schema || config.$schema.trim().length === 0) {
    config.$schema = CONFIG_SCHEMA_LATEST_URL;
  }
}

function ensureRoutingExists(config: KMsgCliConfig): void {
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
  if (!config.routing?.byType) return;
  config.routing.byType[type] = deduped;
}

function addProviderToRouting(
  config: KMsgCliConfig,
  provider: ProviderEntry,
): void {
  ensureRoutingExists(config);
  for (const messageType of providerSupportedTypes[provider.type]) {
    const current = routeAsList(config.routing.byType?.[messageType]);
    if (!current.includes(provider.id)) {
      current.push(provider.id);
    }
    setRoutingByType(config, messageType, current);
  }
}

function syncRoutingForAllProviders(config: KMsgCliConfig): void {
  ensureRoutingExists(config);

  for (const messageType of MESSAGE_TYPES) {
    const ids = config.providers
      .filter((provider) =>
        providerSupportedTypes[provider.type].includes(messageType),
      )
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

  if (!config.defaults.from || config.defaults.from.trim().length === 0) {
    config.defaults.from = "env:K_MSG_DEFAULT_FROM";
  }

  if (!config.defaults.sms) {
    config.defaults.sms = {};
  }
  if (typeof config.defaults.sms.autoLmsBytes !== "number") {
    config.defaults.sms.autoLmsBytes = 90;
  }
}

function ensureKakaoAliasDefaults(config: KMsgCliConfig): void {
  const primaryAlimTalkProvider = config.providers.find((provider) =>
    providerSupportedTypes[provider.type].includes("ALIMTALK"),
  );

  if (!primaryAlimTalkProvider) return;

  if (!config.aliases) config.aliases = {};
  if (!config.aliases.kakaoChannels) config.aliases.kakaoChannels = {};

  if (!config.aliases.kakaoChannels.main) {
    config.aliases.kakaoChannels.main = {
      providerId: primaryAlimTalkProvider.id,
      plusId: "@your_channel",
      senderKey: getSenderKeyHintByProviderType(primaryAlimTalkProvider.type),
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

  if (
    config.routing &&
    !config.routing.defaultProviderId &&
    config.providers.length > 0
  ) {
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
    options: providerTypeSchema.options.map((type) => ({
      label: providerTypeLabels[type],
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

  const fieldSpecs = providerFieldSpecs[type];
  const config: Record<string, unknown> = {};

  for (const field of fieldSpecs) {
    const raw = await askText({
      message: `${type}.config.${field.key}`,
      defaultValue: field.defaultValue,
      validate: field.required
        ? (value) =>
            value.trim().length > 0
              ? true
              : `${field.key} is required for ${type}`
        : undefined,
    });

    const value = raw.trim();
    if (value.length > 0) {
      config[field.key] = value;
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
    force: option(z.coerce.boolean().default(false), {
      description: "Overwrite if the file already exists",
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
      if (config.routing) {
        config.routing.defaultProviderId = provider.id;
      }
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
