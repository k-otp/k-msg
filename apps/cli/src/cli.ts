#!/usr/bin/env bun

import {
  logger,
  type BaseProvider,
  type MessageType,
  type StandardRequest,
  type StandardResult,
} from "@k-msg/core";
import {
  AligoProvider,
  IWINVProvider,
  type AligoConfig,
  type IWINVConfig,
} from "@k-msg/provider";
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
    } as R;
  }
}

type Runtime = {
  providers: Map<string, BaseProvider<StandardRequest, StandardResult>>;
  defaultProviderId?: string;
};

function initializeRuntime(): Runtime {
  if (process.env.K_MSG_MOCK === "true") {
    const mock = new CliMockProvider();
    return {
      providers: new Map([[mock.id, mock]]),
      defaultProviderId: mock.id,
    };
  }

  const providers = new Map<string, BaseProvider<StandardRequest, StandardResult>>();

  if (process.env.IWINV_API_KEY) {
    const iwinvConfig: IWINVConfig = {
      apiKey: process.env.IWINV_API_KEY,
      baseUrl:
        process.env.IWINV_BASE_URL || "https://alimtalk.bizservice.iwinv.kr",
      debug: process.env.NODE_ENV !== "production",
      senderNumber: process.env.IWINV_SENDER_NUMBER,
    };
    const provider = new IWINVProvider(iwinvConfig);
    providers.set(provider.id, provider);
  }

  if (process.env.ALIGO_API_KEY && process.env.ALIGO_USER_ID) {
    const aligoConfig: AligoConfig = {
      apiKey: process.env.ALIGO_API_KEY,
      userId: process.env.ALIGO_USER_ID,
      senderKey: process.env.ALIGO_SENDER_KEY,
      sender: process.env.ALIGO_SENDER,
      smsBaseUrl: process.env.ALIGO_SMS_BASE_URL,
      alimtalkBaseUrl: process.env.ALIGO_ALIMTALK_BASE_URL,
      friendtalkEndpoint: process.env.ALIGO_FRIENDTALK_ENDPOINT,
      debug: process.env.NODE_ENV !== "production",
      testMode: process.env.NODE_ENV !== "production",
    };
    const provider = new AligoProvider(aligoConfig);
    providers.set(provider.id, provider);
  }

  const requestedDefault = process.env.K_MSG_DEFAULT_PROVIDER;
  const defaultProviderId =
    requestedDefault && providers.has(requestedDefault)
      ? requestedDefault
      : providers.keys().next().value;

  return {
    providers,
    defaultProviderId,
  };
}

const runtime = initializeRuntime();

function parseChannel(raw?: string): MessageType {
  const normalized = (raw || "ALIMTALK").toUpperCase() as MessageType;
  if (!SUPPORTED_CHANNELS.includes(normalized)) {
    throw new Error(
      `Unsupported channel '${raw}'. Use one of: ${SUPPORTED_CHANNELS.join(", ")}`,
    );
  }
  return normalized;
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
      "No provider initialized. Set K_MSG_MOCK=true or configure IWINV/ALIGO environment variables.",
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
    console.log(`Supported Channels: ${SUPPORTED_CHANNELS.join(", ")}`);

    if (providerIds.length === 0) {
      console.log(
        chalk.yellow(
          "Set K_MSG_MOCK=true, IWINV_API_KEY, or ALIGO_API_KEY + ALIGO_USER_ID.",
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
          "No provider initialized. Set K_MSG_MOCK=true or provider environment variables.",
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
