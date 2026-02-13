#!/usr/bin/env bun

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  BulkOperationHandler,
  logger,
  type BaseProvider,
  type MessageType,
  type StandardRequest,
  type StandardResult,
} from "@k-msg/core";
import chalk from "chalk";
import { Command } from "commander";

const program = new Command();
const SUPPORTED_CHANNELS: MessageType[] = [
  "ALIMTALK",
  "FRIENDTALK",
  "SMS",
  "LMS",
  "MMS",
];
const DIRECT_TEMPLATE_FALLBACK: Partial<Record<MessageType, string>> = {
  SMS: "SMS_DIRECT",
  LMS: "LMS_DIRECT",
  MMS: "MMS_DIRECT",
  FRIENDTALK: "FRIENDTALK_DIRECT",
};

class CliMockProvider implements BaseProvider<StandardRequest, StandardResult> {
  readonly id = "mock";
  readonly name = "Mock Provider";
  readonly type = "messaging" as const;
  readonly version = "1.0.0";

  private history: StandardRequest[] = [];

  async healthCheck() {
    return { healthy: true, issues: [] };
  }

  async send<T extends StandardRequest = StandardRequest, R extends StandardResult = StandardResult>(
    request: T,
  ): Promise<R> {
    this.history.push(request);
    return {
      messageId: `mock-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      status: "SENT",
      provider: this.id,
      timestamp: new Date(),
      phoneNumber: request.phoneNumber,
      metadata: {
        channel: request.channel,
      },
    } as unknown as R;
  }
}

type Runtime = {
  providers: Map<string, BaseProvider<StandardRequest, StandardResult>>;
  defaultProviderId?: string;
  source: "mock" | "plugin-manifest";
  pluginManifestPath?: string;
};

type ProviderConcreteDefinition = {
  kind?: "provider";
  id?: string;
  module: string;
  exportName?: string;
  enabledWhenEnv?: string;
  default?: boolean;
  config?: Record<string, unknown>;
  configFromEnv?: Record<string, string>;
};

type ProviderRouterDefinition = {
  kind: "router";
  id: string;
  strategy: "round_robin";
  providers: string[];
  default?: boolean;
};

type ProviderDefinition = ProviderConcreteDefinition | ProviderRouterDefinition;

type ProviderPluginManifest = {
  defaultProviderId?: string;
  providers: ProviderDefinition[];
};

type PluginManifestSource = {
  manifest: ProviderPluginManifest;
  baseDir: string;
  pathLabel: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isProviderInstance(value: unknown): value is BaseProvider<StandardRequest, StandardResult> {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.version === "string" &&
    typeof value.type === "string" &&
    typeof value.send === "function" &&
    typeof value.healthCheck === "function"
  );
}

function normalizePluginManifest(raw: unknown): ProviderPluginManifest {
  if (Array.isArray(raw)) {
    return { providers: raw as ProviderDefinition[] };
  }
  if (isRecord(raw) && Array.isArray(raw.providers)) {
    return {
      defaultProviderId:
        typeof raw.defaultProviderId === "string" ? raw.defaultProviderId : undefined,
      providers: raw.providers as ProviderDefinition[],
    };
  }
  throw new Error(
    "Invalid provider plugin manifest. Expected an array or { providers: [...] }.",
  );
}

function readPluginManifestSource(): PluginManifestSource | null {
  const inlineJson = process.env.K_MSG_PROVIDER_PLUGINS;
  if (inlineJson && inlineJson.trim().length > 0) {
    return {
      manifest: normalizePluginManifest(JSON.parse(inlineJson)),
      baseDir: process.cwd(),
      pathLabel: "K_MSG_PROVIDER_PLUGINS",
    };
  }

  const explicitPath = process.env.K_MSG_PROVIDER_PLUGIN_FILE;
  const candidatePaths = explicitPath
    ? [explicitPath]
    : ["k-msg.providers.json", "apps/cli/k-msg.providers.json"];

  for (const candidatePath of candidatePaths) {
    const absolutePath = path.isAbsolute(candidatePath)
      ? candidatePath
      : path.resolve(process.cwd(), candidatePath);
    if (!existsSync(absolutePath)) continue;

    const fileContent = readFileSync(absolutePath, "utf8");
    return {
      manifest: normalizePluginManifest(JSON.parse(fileContent)),
      baseDir: path.dirname(absolutePath),
      pathLabel: absolutePath,
    };
  }

  return null;
}

function resolvePluginModuleSpecifier(moduleName: string, baseDir: string): string {
  if (moduleName.startsWith(".") || moduleName.startsWith("/")) {
    const absolutePath = path.isAbsolute(moduleName)
      ? moduleName
      : path.resolve(baseDir, moduleName);
    return pathToFileURL(absolutePath).href;
  }
  return moduleName;
}

function buildProviderConfig(definition: ProviderConcreteDefinition): Record<string, unknown> {
  const config: Record<string, unknown> = {
    ...(definition.config || {}),
  };

  for (const [field, envVar] of Object.entries(definition.configFromEnv || {})) {
    const value = process.env[envVar];
    if (value !== undefined) {
      config[field] = value;
    }
  }

  return config;
}

class SendFailedError extends Error {
  readonly result: StandardResult;

  constructor(result: StandardResult) {
    super(result.error?.message || "Unknown provider error");
    this.name = "SendFailedError";
    this.result = result;
  }
}

async function createProviderFromPlugin(
  definition: ProviderConcreteDefinition,
  baseDir: string,
): Promise<BaseProvider<StandardRequest, StandardResult> | null> {
  if (definition.enabledWhenEnv && !process.env[definition.enabledWhenEnv]) {
    return null;
  }

  if (!definition.module || typeof definition.module !== "string") {
    throw new Error("Plugin definition requires a non-empty `module` field.");
  }

  const moduleSpecifier = resolvePluginModuleSpecifier(definition.module, baseDir);
  const loadedModule = await import(moduleSpecifier);
  const candidateExport =
    definition.exportName && definition.exportName.length > 0
      ? loadedModule[definition.exportName]
      : loadedModule.default ?? loadedModule;

  const config = buildProviderConfig(definition);
  let created: unknown;

  if (candidateExport && typeof candidateExport.createProvider === "function") {
    created = await candidateExport.createProvider(config);
  } else if (typeof candidateExport === "function") {
    try {
      created = new candidateExport(config);
    } catch {
      created = await candidateExport(config);
    }
  } else {
    throw new Error(
      `Plugin export is not constructable/callable: ${definition.module}${definition.exportName ? `#${definition.exportName}` : ""}`,
    );
  }

  if (!isProviderInstance(created)) {
    throw new Error(
      `Loaded plugin did not return a valid provider instance: ${definition.module}${definition.exportName ? `#${definition.exportName}` : ""}`,
    );
  }

  return created;
}

class RoundRobinRouterProvider
  implements BaseProvider<StandardRequest, StandardResult>
{
  readonly id: string;
  readonly name: string;
  readonly type = "messaging" as const;
  readonly version = "1.0.0";

  private readonly providers: BaseProvider<StandardRequest, StandardResult>[];
  private idx = 0;

  constructor(params: {
    id: string;
    name?: string;
    providers: BaseProvider<StandardRequest, StandardResult>[];
  }) {
    this.id = params.id;
    this.name = params.name || `RoundRobinRouter(${params.providers.map((p) => p.id).join(",")})`;
    this.providers = params.providers;
  }

  async healthCheck() {
    const results = await Promise.allSettled(
      this.providers.map(async (provider) => ({
        id: provider.id,
        name: provider.name,
        health: await provider.healthCheck(),
      })),
    );

    const issues: string[] = [];
    let anyHealthy = false;
    const data: Record<string, unknown> = {};

    for (const result of results) {
      if (result.status === "rejected") {
        issues.push(`Health check failed: ${String(result.reason)}`);
        continue;
      }

      const entry = result.value;
      data[entry.id] = entry.health;
      if (!entry.health.healthy) {
        issues.push(`${entry.id}: ${entry.health.issues.join(", ")}`);
      } else {
        anyHealthy = true;
      }
    }

    return {
      healthy: anyHealthy,
      issues,
      data,
    };
  }

  async send<
    T extends StandardRequest = StandardRequest,
    R extends StandardResult = StandardResult,
  >(request: T): Promise<R> {
    if (this.providers.length === 0) {
      throw new Error("Router provider has no upstream providers");
    }

    const provider = this.providers[this.idx % this.providers.length]!;
    this.idx = (this.idx + 1) % this.providers.length;
    return provider.send(request) as Promise<R>;
  }
}

function createRouterProvider(
  definition: ProviderRouterDefinition,
  providers: Map<string, BaseProvider<StandardRequest, StandardResult>>,
): BaseProvider<StandardRequest, StandardResult> | null {
  if (!definition.id) {
    throw new Error("Router definition requires `id`");
  }
  if (!Array.isArray(definition.providers) || definition.providers.length === 0) {
    throw new Error("Router definition requires non-empty `providers`");
  }

  if (definition.strategy !== "round_robin") {
    throw new Error(`Unsupported router strategy: ${definition.strategy}`);
  }

  const upstreamProviders = definition.providers
    .map((providerId) => providers.get(providerId))
    .filter((provider): provider is BaseProvider<StandardRequest, StandardResult> => Boolean(provider));

  if (upstreamProviders.length === 0) {
    const missing = definition.providers.join(", ");
    if (definition.default) {
      console.warn(
        `[k-msg] Router provider (${definition.id}) disabled; no upstream providers found (${missing})`,
      );
    }
    return null;
  }

  return new RoundRobinRouterProvider({
    id: definition.id,
    providers: upstreamProviders,
  });
}

async function initializeRuntimeFromPluginManifest(): Promise<Runtime | null> {
  const source = readPluginManifestSource();
  if (!source) return null;

  const providers = new Map<string, BaseProvider<StandardRequest, StandardResult>>();
  const manifestDefaultCandidates: string[] = [];
  const routerDefinitions: ProviderRouterDefinition[] = [];

  for (const definition of source.manifest.providers) {
    if (isRecord(definition) && definition.kind === "router") {
      routerDefinitions.push(definition as ProviderRouterDefinition);
      continue;
    }

    try {
      const provider = await createProviderFromPlugin(
        definition as ProviderConcreteDefinition,
        source.baseDir,
      );
      if (!provider) continue;

      const key = definition.id || provider.id;
      providers.set(key, provider);
      if (provider.id !== key && !providers.has(provider.id)) {
        providers.set(provider.id, provider);
      }

      if (definition.default) {
        manifestDefaultCandidates.push(key);
      }
    } catch (error) {
      console.warn(
        `[k-msg] Failed to load provider plugin (${definition.module}${definition.exportName ? `#${definition.exportName}` : ""}):`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  for (const routerDefinition of routerDefinitions) {
    try {
      const routerProvider = createRouterProvider(routerDefinition, providers);
      if (!routerProvider) continue;
      providers.set(routerProvider.id, routerProvider);
      if (routerDefinition.default) {
        manifestDefaultCandidates.push(routerProvider.id);
      }
    } catch (error) {
      console.warn(
        `[k-msg] Failed to create router provider (${routerDefinition.id}):`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  if (providers.size === 0) {
    throw new Error(
      `No providers were loaded from plugin manifest (${source.pathLabel}).`,
    );
  }

  const requestedDefault = process.env.K_MSG_DEFAULT_PROVIDER;
  const defaultProviderId =
    (requestedDefault && providers.has(requestedDefault) && requestedDefault) ||
    (source.manifest.defaultProviderId &&
      providers.has(source.manifest.defaultProviderId) &&
      source.manifest.defaultProviderId) ||
    manifestDefaultCandidates.find((id) => providers.has(id)) ||
    providers.keys().next().value;

  return {
    providers,
    defaultProviderId,
    source: "plugin-manifest",
    pluginManifestPath: source.pathLabel,
  };
}

async function initializeRuntime(): Promise<Runtime> {
  if (process.env.K_MSG_MOCK === "true") {
    const mock = new CliMockProvider();
    return {
      providers: new Map([[mock.id, mock]]),
      defaultProviderId: mock.id,
      source: "mock",
    };
  }

  const pluginRuntime = await initializeRuntimeFromPluginManifest();
  if (pluginRuntime) {
  return pluginRuntime;
  }
  throw new Error(
    "No provider manifest found. Set K_MSG_PROVIDER_PLUGINS, K_MSG_PROVIDER_PLUGIN_FILE, or provide k-msg.providers.json.",
  );
}

const runtime = await initializeRuntime();

function parseChannel(raw?: string): MessageType {
  const normalized = (raw || "ALIMTALK").toUpperCase() as MessageType;
  if (!SUPPORTED_CHANNELS.includes(normalized)) {
    throw new Error(
      `Unsupported channel '${raw}'. Use one of: ${SUPPORTED_CHANNELS.join(", ")}`,
    );
  }
  return normalized;
}

function parsePhone(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return "";
  if (trimmed.startsWith("+")) return trimmed;
  return trimmed.replace(/[^0-9]/g, "");
}

function parsePhones(raw?: string): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map(parsePhone)
    .filter((value) => value.length > 0);
}

function parsePhonesFile(filePath?: string): string[] {
  if (!filePath) return [];
  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(process.cwd(), filePath);
  const content = readFileSync(absolutePath, "utf8");
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"))
    .map(parsePhone)
    .filter((value) => value.length > 0);
}

function dedupePreserveOrder(values: string[]): string[] {
  return Array.from(new Set(values));
}

function parseVariables(raw?: string): Record<string, any> {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("Invalid JSON format for variables");
  }
}

function resolveProvider(
  providerId?: string,
): BaseProvider<StandardRequest, StandardResult> {
  const id = providerId || runtime.defaultProviderId;
  if (!id) {
    throw new Error(
      "No provider initialized. Set K_MSG_MOCK=true or provide a provider manifest (K_MSG_PROVIDER_PLUGINS / K_MSG_PROVIDER_PLUGIN_FILE / k-msg.providers.json).",
    );
  }

  const provider = runtime.providers.get(id);
  if (!provider) {
    throw new Error(`Provider '${id}' is not initialized`);
  }

  return provider;
}

function toProviderChannel(channel: MessageType): "alimtalk" | "friendtalk" | "sms" | "mms" {
  if (channel === "ALIMTALK") return "alimtalk";
  if (channel === "FRIENDTALK") return "friendtalk";
  if (channel === "MMS") return "mms";
  return "sms";
}

function resolveTemplateCode(channel: MessageType, templateCode?: string): string {
  if (templateCode && templateCode.trim().length > 0) {
    return templateCode;
  }

  if (channel === "ALIMTALK") {
    throw new Error("template is required for ALIMTALK channel");
  }

  const fallback = DIRECT_TEMPLATE_FALLBACK[channel];
  if (!fallback) {
    throw new Error(`template is required for ${channel} channel`);
  }

  return fallback;
}

function hasMessageContent(text: string | undefined, variables: Record<string, any>): boolean {
  if (typeof text === "string" && text.trim().length > 0) {
    return true;
  }
  return typeof variables.message === "string" && variables.message.trim().length > 0;
}

async function sendMessage(options: {
  provider?: string;
  channel: MessageType;
  phone: string;
  template?: string;
  text?: string;
  variables: Record<string, any>;
  sender?: string;
  subject?: string;
  imageUrl?: string;
}): Promise<StandardResult> {
  const provider = resolveProvider(options.provider);
  const templateCode = resolveTemplateCode(options.channel, options.template);

  if (
    (options.channel === "FRIENDTALK" ||
      options.channel === "SMS" ||
      options.channel === "LMS" ||
      options.channel === "MMS") &&
    !hasMessageContent(options.text, options.variables)
  ) {
    throw new Error(`text or variables.message is required for ${options.channel} channel`);
  }

  const request: StandardRequest = {
    channel: options.channel,
    templateCode,
    phoneNumber: options.phone,
    variables: { ...options.variables },
    text: options.text,
    imageUrl: options.imageUrl,
    options: {
      channel: toProviderChannel(options.channel),
      senderNumber: options.sender,
      subject: options.subject,
      imageUrl: options.imageUrl,
    },
  };

  if (request.text && request.variables.message === undefined) {
    request.variables.message = request.text;
  }
  if (options.subject && request.variables.subject === undefined) {
    request.variables.subject = options.subject;
  }

  return provider.send(request);
}

console.log(
  chalk.blue(`
┌─────────────────────────────────────┐
│            K-Message CLI            │
│      Unified Messaging Console      │
└─────────────────────────────────────┘
`),
);

program
  .name("k-msg")
  .description("K-Message unified CLI")
  .version("0.2.0")
  .option("-v, --verbose", "enable verbose logging")
  .hook("preAction", (thisCommand) => {
    const opts = thisCommand.optsWithGlobals();
    if (opts.verbose) {
      logger.info("CLI command starting", {
        command: thisCommand.name(),
        args: thisCommand.args,
      });
    }
  });

program
  .command("info")
  .description("Show runtime information")
  .action(() => {
    console.log(chalk.cyan("📋 Platform Information:"));
    console.log("Version: 0.2.0");

    const providerIds = Array.from(runtime.providers.keys());
    console.log(`Providers: ${providerIds.length > 0 ? providerIds.join(", ") : "(none)"}`);
    console.log(`Default Provider: ${runtime.defaultProviderId || "(none)"}`);
    console.log(`Runtime Source: ${runtime.source}`);
    if (runtime.pluginManifestPath) {
      console.log(`Plugin Manifest: ${runtime.pluginManifestPath}`);
    }
    console.log(`Supported Channels: ${SUPPORTED_CHANNELS.join(", ")}`);

    if (providerIds.length === 0) {
      console.log(
        chalk.yellow(
          "Set K_MSG_MOCK=true or configure a provider manifest (K_MSG_PROVIDER_PLUGINS / K_MSG_PROVIDER_PLUGIN_FILE / k-msg.providers.json).",
        ),
      );
    }
  });

program
  .command("health")
  .description("Check provider health")
  .action(async () => {
    try {
      console.log(chalk.yellow("🔍 Checking provider health..."));

      const providers = Array.from(runtime.providers.values());
      if (providers.length === 0) {
        throw new Error(
          "No provider initialized. Set K_MSG_MOCK=true or configure a provider manifest (K_MSG_PROVIDER_PLUGINS / K_MSG_PROVIDER_PLUGIN_FILE / k-msg.providers.json).",
        );
      }

      let allHealthy = true;
      for (const provider of providers) {
        const health = await provider.healthCheck();
        const healthy = health.healthy;
        allHealthy = allHealthy && healthy;

        const mark = healthy ? chalk.green("✅") : chalk.red("❌");
        console.log(`${mark} ${provider.name} (${provider.id})`);

        if (!healthy && health.issues.length > 0) {
          for (const issue of health.issues) {
            console.log(`  - ${issue}`);
          }
        }
      }

      if (allHealthy) {
        console.log(chalk.green("✅ Platform healthy"));
      } else {
        console.log(chalk.red("❌ Platform unhealthy"));
        process.exitCode = 1;
      }
    } catch (error) {
      console.error(chalk.red("❌ Health check failed:"), error);
      process.exitCode = 1;
    }
  });

program
  .command("send")
  .description("Send message with unified API")
  .requiredOption("-p, --phone <number>", "recipient phone number")
  .option("-c, --channel <channel>", "ALIMTALK|FRIENDTALK|SMS|LMS|MMS", "ALIMTALK")
  .option("-t, --template <code>", "template code")
  .option("--text <text>", "message text")
  .option("--variables <json>", "variables as JSON", "{}")
  .option("--provider <providerId>", "provider id (iwinv|aligo|mock)")
  .option("--sender <number>", "sender number")
  .option("--subject <subject>", "subject for LMS/MMS/FRIENDTALK")
  .option("--image-url <url>", "image URL for MMS/FRIENDTALK")
  .action(async (options) => {
    try {
      const channel = parseChannel(options.channel);
      const variables = parseVariables(options.variables);
      const result = await sendMessage({
        provider: options.provider,
        channel,
        phone: options.phone,
        template: options.template,
        text: options.text,
        variables,
        sender: options.sender,
        subject: options.subject,
        imageUrl: options.imageUrl,
      });

      if (result.status === "FAILED") {
        console.log(chalk.red("❌ Message send failed"));
        console.log(result.error?.message || "Unknown provider error");
        process.exitCode = 1;
        return;
      }

      console.log(chalk.green("✅ Message sent successfully"));
      console.log(`Provider: ${result.provider}`);
      console.log(`Channel: ${channel}`);
      console.log(`Message ID: ${result.messageId}`);
      console.log(`Status: ${result.status}`);
    } catch (error) {
      console.error(
        chalk.red("❌ Send failed:"),
        error instanceof Error ? error.message : String(error),
      );
      process.exitCode = 1;
    }
  });

program
  .command("bulk-send")
  .description("Send the same message to multiple recipients")
  .option("--phones <numbers>", "comma-separated recipient phone numbers")
  .option("--phones-file <path>", "file with phone numbers (one per line)")
  .option("-c, --channel <channel>", "ALIMTALK|FRIENDTALK|SMS|LMS|MMS", "SMS")
  .option("-t, --template <code>", "template code")
  .option("--text <text>", "message text")
  .option("--variables <json>", "variables as JSON", "{}")
  .option("--provider <providerId>", "provider id")
  .option("--sender <number>", "sender number")
  .option("--subject <subject>", "subject for LMS/MMS/FRIENDTALK")
  .option("--image-url <url>", "image URL for MMS/FRIENDTALK")
  .option("--concurrency <n>", "number of concurrent sends", "1")
  .option("--fail-fast", "stop on first failure", false)
  .option("--print-each", "print per-recipient results (auto-enabled for <= 25 recipients)", false)
  .action(async (options) => {
    try {
      const phones = dedupePreserveOrder([
        ...parsePhones(options.phones),
        ...parsePhonesFile(options.phonesFile),
      ]);
      if (phones.length === 0) {
        throw new Error("No recipient phones provided. Use --phones or --phones-file.");
      }

      const channel = parseChannel(options.channel);
      const variables = parseVariables(options.variables);
      const concurrencyRaw = Number(options.concurrency);
      const concurrency =
        Number.isFinite(concurrencyRaw) && concurrencyRaw > 0 ? Math.floor(concurrencyRaw) : 1;
      const shouldPrintEach = Boolean(options.printEach) || phones.length <= 25;

      console.log(chalk.yellow(`📨 Sending to ${phones.length} recipients...`));

      let lastProgressAt = 0;

      const { successful, failed, summary } = await BulkOperationHandler.execute(
        phones,
        async (phone) => {
          const result = await sendMessage({
            provider: options.provider,
            channel,
            phone,
            template: options.template,
            text: options.text,
            variables,
            sender: options.sender,
            subject: options.subject,
            imageUrl: options.imageUrl,
          });

          if (result.status === "FAILED") {
            if (shouldPrintEach) {
              console.log(
                chalk.red(
                  `❌ [${result.provider}] ${phone} -> FAILED: ${result.error?.message || "Unknown provider error"}`,
                ),
              );
            }
            throw new SendFailedError(result);
          }

          if (shouldPrintEach) {
            console.log(chalk.green(`✅ [${result.provider}] ${phone} -> SENT (${result.messageId})`));
          }

          return result;
        },
        {
          concurrency,
          failFast: Boolean(options.failFast),
          retryOptions: { maxAttempts: 1 },
          onProgress: (completed, total, failedCount) => {
            if (shouldPrintEach) return;
            const now = Date.now();
            if (now - lastProgressAt < 200) return;
            lastProgressAt = now;
            process.stdout.write(`\rProgress: ${completed}/${total} (failed: ${failedCount})`);
          },
        },
      );

      if (!shouldPrintEach) {
        process.stdout.write("\n");
      }

      const providerCounts = new Map<string, number>();
      for (const entry of successful) {
        providerCounts.set(entry.result.provider, (providerCounts.get(entry.result.provider) || 0) + 1);
      }
      for (const entry of failed) {
        const error = entry.error;
        if (error instanceof SendFailedError) {
          const providerId = error.result.provider;
          providerCounts.set(providerId, (providerCounts.get(providerId) || 0) + 1);
        }
      }

      console.log(chalk.cyan("📊 Bulk send summary:"));
      console.log(`Total: ${summary.total}`);
      console.log(`Successful: ${summary.successful}`);
      console.log(`Failed: ${summary.failed}`);
      console.log(`Duration: ${summary.duration}ms`);
      if (providerCounts.size > 0) {
        console.log(`Providers used: ${Array.from(providerCounts.entries()).map(([id, count]) => `${id}=${count}`).join(", ")}`);
      }

      if (failed.length > 0) {
        if (!shouldPrintEach) {
          const failuresToShow = failed.slice(0, 10);
          for (const entry of failuresToShow) {
            const providerId =
              entry.error instanceof SendFailedError ? entry.error.result.provider : "unknown";
            console.log(
              chalk.red(
                `❌ [${providerId}] ${entry.item} -> FAILED: ${entry.error.message || "Unknown error"}`,
              ),
            );
          }
          if (failed.length > failuresToShow.length) {
            console.log(chalk.red(`...and ${failed.length - failuresToShow.length} more failures`));
          }
        }

        process.exitCode = 1;
        return;
      }

      console.log(chalk.green("✅ Bulk send completed"));
    } catch (error) {
      console.error(
        chalk.red("❌ Bulk send failed:"),
        error instanceof Error ? error.message : String(error),
      );
      process.exitCode = 1;
    }
  });

program
  .command("test-send")
  .description("Quick send test")
  .option("-p, --phone <number>", "recipient phone number", "01012345678")
  .option("-t, --template <code>", "template code", "TEST_TEMPLATE")
  .option("--variables <json>", "variables as JSON", '{"name":"테스트"}')
  .action(async (options) => {
    try {
      const variables = parseVariables(options.variables);
      const result = await sendMessage({
        channel: "ALIMTALK",
        phone: options.phone,
        template: options.template,
        variables,
        sender: process.env.K_MSG_SENDER_NUMBER,
      });

      if (result.status === "FAILED") {
        console.log(chalk.red("❌ Test send failed"));
        console.log(result.error?.message || "Unknown provider error");
        process.exitCode = 1;
        return;
      }

      console.log(chalk.green("✅ Test message sent"));
      console.log(`Message ID: ${result.messageId}`);
    } catch (error) {
      console.error(
        chalk.red("❌ Test send failed:"),
        error instanceof Error ? error.message : String(error),
      );
      process.exitCode = 1;
    }
  });

const configCmd = program.command("config").description("Configuration helpers");

configCmd
  .command("show")
  .description("Show detected runtime configuration")
  .action(() => {
    const providerIds = Array.from(runtime.providers.keys());
    console.log(chalk.cyan("📋 Runtime Configuration:"));
    console.log(`Mock Mode: ${process.env.K_MSG_MOCK === "true" ? "enabled" : "disabled"}`);
    console.log(`Providers: ${providerIds.length > 0 ? providerIds.join(", ") : "(none)"}`);
    console.log(`Default Provider: ${runtime.defaultProviderId || "(none)"}`);
    console.log(`Runtime Source: ${runtime.source}`);
    if (runtime.pluginManifestPath) {
      console.log(`Plugin Manifest: ${runtime.pluginManifestPath}`);
    }
    console.log(`Default Sender: ${process.env.K_MSG_SENDER_NUMBER || "(none)"}`);
  });

program.configureOutput({
  writeErr: (str) => process.stderr.write(chalk.red(str)),
});

program.exitOverride();

try {
  await program.parseAsync(process.argv);
} catch (error: any) {
  if (error.code !== "commander.help" && error.code !== "commander.version") {
    console.error(chalk.red("❌ Command failed:"), error.message);
    process.exit(1);
  }
}
