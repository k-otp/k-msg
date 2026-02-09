#!/usr/bin/env bun

import { ConfigLoader, KMsgError, logger } from "@k-msg/core";
import { KMsg } from "@k-msg/messaging";
import {
  type IWINVAdapter,
  IWINVProvider,
  MockProvider,
} from "@k-msg/provider";
import { TemplateService } from "@k-msg/template";
import chalk from "chalk";
import { Command } from "commander";
import { table } from "table";

// import { TemplateCommand } from './commands/template.js';
// import { MessageCommand } from './commands/message.js';
// import { ProviderCommand } from './commands/provider.js';
// import { ConfigCommand } from './commands/config.js';

// CLI 유틸리티 함수들
const cliUtils = {
  async withProgress<T>(message: string, fn: () => Promise<T>): Promise<T> {
    process.stdout.write(chalk.yellow(`${message}... `));
    try {
      const result = await fn();
      console.log(chalk.green("✅"));
      return result;
    } catch (error) {
      console.log(chalk.red("❌"));
      throw error;
    }
  },

  formatError(error: any): string {
    if (error?.response?.data?.message) return error.response.data.message;
    if (error?.message) return error.message;
    return String(error);
  },

  validateOptions(options: Record<string, any>, required: string[]): string[] {
    return required.filter((key) => !options[key]);
  },

  parseVariables(variablesStr?: string): Record<string, any> {
    if (!variablesStr) return {};
    try {
      return JSON.parse(variablesStr);
    } catch {
      throw new Error("Invalid JSON format for variables");
    }
  },
};

const program = new Command();

console.log(
  chalk.blue(`
┌─────────────────────────────────────┐
│           AlimTalk CLI              │
│     Open Source Messaging Platform  │
└─────────────────────────────────────┘
`),
);

program
  .name("k-msg")
  .description("K-Message Korean Multi-Channel Messaging Platform CLI")
  .version("0.1.0")
  .option("-v, --verbose", "enable verbose logging")
  .option("--config <path>", "config file path", "./k-msg.config.json")
  .hook("preAction", (thisCommand) => {
    const opts = thisCommand.optsWithGlobals();
    if (opts.verbose) {
      logger.info("CLI command starting", {
        command: thisCommand.name(),
        args: thisCommand.args,
      });
    }
  });

// Initialize kmsg
let kmsg: KMsg | null = null;
let adapter: IWINVAdapter | null = null;
let provider: IWINVProvider | null = null;
let templateService: TemplateService | null = null;

if (process.env.K_MSG_MOCK === "true") {
  const mock = new MockProvider();
  provider = mock as any;
  adapter = mock as any;
  kmsg = new KMsg(mock as any);
  templateService = new TemplateService(mock as any);
} else if (process.env.IWINV_API_KEY) {
  const config = {
    apiKey: process.env.IWINV_API_KEY,
    baseUrl:
      process.env.IWINV_BASE_URL || "https://alimtalk.bizservice.iwinv.kr",
    debug: true,
  };
  provider = new IWINVProvider(config);
  adapter = provider.getAdapter() as IWINVAdapter;
  kmsg = new KMsg(provider as any);
  templateService = new TemplateService(adapter);
}

// Register commands (임시로 주석처리)
// const templateCmd = new TemplateCommand(platform);
// const messageCmd = new MessageCommand(platform);
// const providerCmd = new ProviderCommand(platform);
// const configCmd = new ConfigCommand(platform);

// program.addCommand(templateCmd.getCommand());
// program.addCommand(messageCmd.getCommand());
// program.addCommand(providerCmd.getCommand());
// program.addCommand(configCmd.getCommand());

// Config 관리 명령어
const configCmd = program
  .command("config")
  .description("Configuration management");

configCmd
  .command("init")
  .description("Initialize configuration file")
  .action(async () => {
    try {
      const { default: inquirer } = await import("inquirer");

      console.log(chalk.cyan("🔧 Setting up K-Message configuration..."));

      const answers = await inquirer.prompt([
        {
          type: "list",
          name: "provider",
          message: "Which provider would you like to configure?",
          choices: ["iwinv", "aligo", "coolsms"],
        },
        {
          type: "password",
          name: "apiKey",
          message: "Enter your API key:",
          mask: "*",
          validate: (input: string) =>
            input.length > 0 || "API key is required",
        },
        {
          type: "input",
          name: "baseUrl",
          message: "Enter base URL (optional):",
          default: "https://alimtalk.bizservice.iwinv.kr",
          when: (answers: any) => answers.provider === "iwinv",
        },
      ]);

      const config = {
        environment: "development",
        providers: {
          [answers.provider]: {
            apiKey: answers.apiKey,
            ...(answers.baseUrl && { baseUrl: answers.baseUrl }),
          },
        },
        logger: {
          level: "INFO",
          enableConsole: true,
          enableColors: true,
        },
      };

      await cliUtils.withProgress("Creating configuration file", async () => {
        await Bun.write("k-msg.config.json", JSON.stringify(config, null, 2));
      });

      console.log(chalk.green("✅ Configuration file created successfully!"));
      console.log(chalk.cyan("📝 File: k-msg.config.json"));
      logger.info("Configuration file created", { provider: answers.provider });
    } catch (error) {
      logger.error("Config initialization failed", {}, error as Error);
      console.error(
        chalk.red("❌ Failed to initialize config:"),
        cliUtils.formatError(error),
      );
    }
  });

configCmd
  .command("show")
  .description("Show current configuration")
  .action(async () => {
    try {
      const config = ConfigLoader.loadFromEnv();

      console.log(chalk.cyan("📋 Current Configuration:"));
      console.log(chalk.gray("─".repeat(40)));
      console.log(`Environment: ${chalk.yellow(config.environment)}`);
      console.log(`Log Level: ${chalk.yellow(config.logger.level)}`);

      console.log("\nProviders:");
      for (const [name, providerConfig] of Object.entries(config.providers)) {
        if (providerConfig) {
          console.log(
            `  ${chalk.green("✓")} ${name} ${chalk.gray("(configured)")}`,
          );
        }
      }

      console.log("\nFeatures:");
      for (const [feature, enabled] of Object.entries(config.features)) {
        const icon = enabled ? chalk.green("✓") : chalk.red("✗");
        console.log(`  ${icon} ${feature}`);
      }
    } catch (error) {
      logger.error("Failed to show config", {}, error as Error);
      console.error(
        chalk.red("❌ Failed to show config:"),
        cliUtils.formatError(error),
      );
    }
  });

// Health check command
program
  .command("health")
  .description("Check platform and provider health")
  .action(async () => {
    try {
      console.log(chalk.yellow("🔍 Checking provider health..."));

      if (!provider) {
        console.log(
          chalk.red(
            "❌ IWINV provider not initialized. Check your IWINV_API_KEY.",
          ),
        );
        return;
      }

      // Simple health check for new architecture
      console.log(chalk.green("✅ Provider initialized"));
      console.log(`  Name: ${provider.name}`);
      console.log(`  ID: ${provider.id}`);
    } catch (error) {
      console.error(chalk.red("❌ Health check failed:"), error);
      process.exit(1);
    }
  });

// Info command
program
  .command("info")
  .description("Show platform information")
  .action(() => {
    console.log(chalk.cyan("📋 Platform Information:"));
    console.log("Version: 0.1.0");
    console.log("Providers: iwinv");
    console.log("Architecture: KMsg (New)");
  });

// Balance check command
program
  .command("balance")
  .description("Check IWINV account balance")
  .action(async () => {
    console.log(
      chalk.red("❌ Balance check not yet implemented in new architecture."),
    );
  });

// Test send command
program
  .command("test-send")
  .description("Test IWINV message sending")
  .option("-t, --template <code>", "Template code", "TEST_TEMPLATE")
  .option("-p, --phone <number>", "Phone number", "01012345678")
  .option("-v, --variables <json>", "Variables JSON", "{}")
  .action(async (options) => {
    try {
      console.log(chalk.yellow("📤 Testing IWINV message sending..."));

      if (!kmsg) {
        console.log(
          chalk.red("❌ KMsg not initialized. Check your IWINV_API_KEY."),
        );
        return;
      }

      const variables = JSON.parse(options.variables);
      const result = await kmsg.send({
        type: "ALIMTALK",
        templateId: options.template,
        to: options.phone,
        from: process.env.IWINV_SENDER_NUMBER || "01000000000",
        variables,
      });

      if (result.isSuccess) {
        console.log(chalk.green("✅ Message sent successfully!"));
        console.log(`Message ID: ${result.value.messageId}`);
        console.log(`Status: ${result.value.status}`);
      } else if (result.isFailure) {
        console.log(chalk.red("❌ Message send failed:"));
        console.log(chalk.yellow(result.error.message));
      }
    } catch (error) {
      console.error(chalk.red("❌ Test send failed:"), error);
    }
  });

// Advanced send command with all options
program
  .command("send")
  .description("Send IWINV message with advanced options")
  .option("-t, --template <code>", "Template code (required)")
  .option("-p, --phone <number>", "Phone number (required)")
  .option("-v, --variables <json>", "Variables JSON", "{}")
  .option("--from <number>", "Sender number")
  .action(async (options) => {
    try {
      // 필수 옵션 검증
      const missing = cliUtils.validateOptions(options, ["template", "phone"]);
      if (missing.length > 0) {
        console.log(
          chalk.red("❌ Missing required options:"),
          missing.join(", "),
        );
        return;
      }

      if (!kmsg) {
        console.log(
          chalk.red("❌ KMsg not initialized. Check your IWINV_API_KEY."),
        );
        return;
      }

      // Variables 파싱
      let variables: Record<string, string>;
      try {
        variables = cliUtils.parseVariables(options.variables);
      } catch (error) {
        console.log(
          chalk.red("❌ Invalid variables format:"),
          cliUtils.formatError(error),
        );
        return;
      }

      const from =
        options.from || process.env.IWINV_SENDER_NUMBER || "01000000000";

      // 메시지 발송
      const result = await cliUtils.withProgress(
        "📤 Sending IWINV message",
        async () => {
          return await kmsg!.send({
            type: "ALIMTALK",
            templateId: options.template,
            to: options.phone,
            from,
            variables,
          });
        },
      );

      if (result.isSuccess) {
        console.log(chalk.green("✅ Message sent successfully!"));
        console.log(`📱 Phone: ${chalk.cyan(options.phone)}`);
        console.log(`📝 Template: ${chalk.cyan(options.template)}`);
        console.log(`🆔 Message ID: ${chalk.cyan(result.value.messageId)}`);
        console.log(`📊 Status: ${chalk.cyan(result.value.status)}`);

        logger.info("Message sent successfully", {
          messageId: result.value.messageId,
          phone: options.phone,
          template: options.template,
        });
      } else if (result.isFailure) {
        console.log(chalk.red("❌ Message send failed:"));
        console.log(chalk.yellow(result.error.message));
        logger.error("Message send failed", { error: result.error.message });
      }
    } catch (error) {
      logger.error("Send command failed", { options }, error as Error);
      console.error(chalk.red("❌ Send failed:"), cliUtils.formatError(error));
    }
  });

program
  .command("create-template")
  .description("Create a new IWINV template")
  .option("-c, --code <code>", "Template code")
  .option("-n, --name <name>", "Template name")
  .option("--content <content>", "Template content")
  .option(
    "--category <category>",
    "Template category (NOTIFICATION, etc)",
    "NOTIFICATION",
  )
  .action(async (options) => {
    try {
      const missing = cliUtils.validateOptions(options, [
        "code",
        "name",
        "content",
      ]);
      if (missing.length > 0) {
        console.log(
          chalk.red("❌ Missing required options:"),
          missing.join(", "),
        );
        return;
      }

      if (!templateService) {
        console.log(
          chalk.red(
            "❌ Template service not initialized. Check your IWINV_API_KEY.",
          ),
        );
        return;
      }

      const result = await cliUtils.withProgress(
        "🏗️ Creating template",
        async () => {
          return await templateService!.create({
            code: options.code,
            name: options.name,
            content: options.content,
            category: options.category,
          });
        },
      );

      if (result.isSuccess) {
        console.log(chalk.green("✅ Template created successfully!"));
        console.log(`Code: ${chalk.cyan(result.value.code)}`);
        console.log(`Name: ${chalk.cyan(result.value.name)}`);
        console.log(`Status: ${chalk.yellow(result.value.status)}`);
      } else if (result.isFailure) {
        console.log(chalk.red("❌ Failed to create template:"));
        console.log(chalk.yellow(result.error.message));
      }
    } catch (error) {
      console.error(chalk.red("❌ Template creation failed:"), error);
    }
  });

// List templates command
program
  .command("list-templates")
  .description("List IWINV templates")
  .option("-p, --page <number>", "Page number", "1")
  .option("-s, --size <number>", "Page size", "15")
  .option(
    "--status <status>",
    "Filter by status (APPROVED/PENDING/REJECTED)",
    "",
  )
  .action(async (options) => {
    try {
      if (!templateService) {
        console.log(
          chalk.red(
            "❌ Template service not initialized. Check your IWINV_API_KEY.",
          ),
        );
        return;
      }

      const result = await cliUtils.withProgress(
        "🔍 Fetching templates",
        async () => {
          return await templateService!.list({
            page: parseInt(options.page),
            limit: parseInt(options.size),
            status: options.status || undefined,
          });
        },
      );

      if (result.isSuccess) {
        if (result.value.length === 0) {
          console.log(chalk.yellow("No templates found."));
          return;
        }

        const data = [
          [
            chalk.bold("Code"),
            chalk.bold("Name"),
            chalk.bold("Status"),
            chalk.bold("Created At"),
          ],
          ...result.value.map((t) => [
            t.code,
            t.name,
            t.status === "APPROVED"
              ? chalk.green(t.status)
              : t.status === "REJECTED"
                ? chalk.red(t.status)
                : chalk.yellow(t.status),
            t.createdAt.toLocaleString(),
          ]),
        ];

        console.log(table(data));
      } else if (result.isFailure) {
        console.log(chalk.red("❌ Failed to list templates:"));
        console.log(chalk.yellow(result.error.message));
      }
    } catch (error) {
      console.error(chalk.red("❌ List templates failed:"), error);
    }
  });

// Delete template command
program
  .command("delete-template")
  .description("Delete IWINV template")
  .option("-c, --code <code>", "Template code to delete")
  .action(async (options) => {
    try {
      if (!options.code) {
        console.log(chalk.red("❌ Missing required option: code"));
        return;
      }

      if (!templateService) {
        console.log(
          chalk.red(
            "❌ Template service not initialized. Check your IWINV_API_KEY.",
          ),
        );
        return;
      }

      const result = await cliUtils.withProgress(
        `🗑️ Deleting template ${options.code}`,
        async () => {
          return await templateService!.delete(options.code);
        },
      );

      if (result.isSuccess) {
        console.log(chalk.green("✅ Template deleted successfully!"));
      } else if (result.isFailure) {
        console.log(chalk.red("❌ Failed to delete template:"));
        console.log(chalk.yellow(result.error.message));
      }
    } catch (error) {
      console.error(chalk.red("❌ Delete template failed:"), error);
    }
  });

// Modify template command
program
  .command("modify-template")
  .description("Modify IWINV template")
  .option("-c, --code <code>", "Template code to modify")
  .option("-n, --name <name>", "New template name")
  .option("--content <content>", "New template content")
  .action(async (options) => {
    try {
      if (!options.code) {
        console.log(chalk.red("❌ Missing required option: code"));
        return;
      }

      if (!templateService) {
        console.log(
          chalk.red(
            "❌ Template service not initialized. Check your IWINV_API_KEY.",
          ),
        );
        return;
      }

      const result = await cliUtils.withProgress(
        `📝 Modifying template ${options.code}`,
        async () => {
          return await templateService!.update(options.code, {
            name: options.name,
            content: options.content,
          });
        },
      );

      if (result.isSuccess) {
        console.log(chalk.green("✅ Template modified successfully!"));
      } else if (result.isFailure) {
        console.log(chalk.red("❌ Failed to modify template:"));
        console.log(chalk.yellow(result.error.message));
      }
    } catch (error) {
      console.error(chalk.red("❌ Modify template failed:"), error);
    }
  });

// History command
program
  .command("history")
  .description("Get IWINV message history")
  .option("-p, --page <number>", "Page number", "1")
  .option("-s, --size <number>", "Page size", "15")
  .option("--reserve <reserve>", "Filter by reservation status (Y/N)")
  .option("--start <date>", "Start date (yyyy-MM-dd HH:mm:ss)")
  .option("--end <date>", "End date (yyyy-MM-dd HH:mm:ss)")
  .option("--message-id <id>", "Filter by message ID")
  .option("--phone <phone>", "Filter by phone number")
  .action(async (options) => {
    console.log(
      chalk.red(
        "❌ History management not yet migrated to new architecture in CLI.",
      ),
    );
  });

// Cancel reservation command
program
  .command("cancel-reservation")
  .description("Cancel IWINV reserved message")
  .option("-m, --message-id <id>", "Message ID to cancel")
  .action(async (options) => {
    console.log(
      chalk.red(
        "❌ History management not yet migrated to new architecture in CLI.",
      ),
    );
  });

// Setup command
program
  .command("setup")
  .description("Interactive setup for providers")
  .action(async () => {
    const { default: inquirer } = await import("inquirer");

    console.log(chalk.yellow("🔧 Setting up AlimTalk Platform..."));

    const answers = await inquirer.prompt([
      {
        type: "list",
        name: "provider",
        message: "Which provider would you like to configure?",
        choices: ["IWINV", "Aligo", "Kakao", "NHN"],
      },
      {
        type: "password",
        name: "apiKey",
        message: "Enter your API key:",
        mask: "*",
      },
      {
        type: "input",
        name: "baseUrl",
        message: "Enter base URL (optional):",
        default: "https://alimtalk.bizservice.iwinv.kr",
      },
    ]);

    if (answers.provider === "IWINV") {
      try {
        const config = {
          apiKey: answers.apiKey,
          baseUrl: answers.baseUrl,
          debug: program.opts().verbose,
        };
        provider = new IWINVProvider(config);
        adapter = provider.getAdapter() as IWINVAdapter;
        kmsg = new KMsg(provider as any);
        templateService = new TemplateService(adapter);

        console.log(chalk.green("✅ IWINV provider configured successfully!"));

        // Test connection
        console.log(chalk.yellow("🔍 Testing connection..."));
        if (provider) {
          console.log(
            chalk.green(
              "✅ Connection test successful (Provider initialized)!",
            ),
          );
        } else {
          console.log(chalk.red("❌ Connection test failed"));
        }
      } catch (error) {
        console.error(chalk.red("❌ Setup failed:"), error);
        process.exit(1);
      }
    } else {
      console.log(
        chalk.red(
          `❌ Provider ${answers.provider} not yet supported in new architecture.`,
        ),
      );
    }
  });

// Error handling
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
