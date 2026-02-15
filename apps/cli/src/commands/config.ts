import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import { optConfig, optJson } from "../cli/options";
import { loadKMsgConfig, resolveConfigPath } from "../config/load";
import { saveKMsgConfig } from "../config/save";
import type { KMsgCliConfig } from "../config/schema";

const sampleConfig: KMsgCliConfig = {
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
        baseUrl: "https://alimtalk.bizservice.iwinv.kr",
        smsBaseUrl: "https://sms.bizservice.iwinv.kr",
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
    kakao: { channel: "main" },
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
};

const initCmd = defineCommand({
  name: "init",
  description: "Create a sample k-msg.config.json",
  options: {
    config: optConfig,
    force: option(z.coerce.boolean().default(false), {
      description: "Overwrite if the file already exists",
      short: "f",
    }),
  },
  handler: async ({ flags, prompt, terminal }) => {
    const targetPath = resolveConfigPath(flags.config);
    if (!flags.force) {
      if (await Bun.file(targetPath).exists()) {
        if (terminal.isInteractive && !terminal.isCI) {
          const ok = await prompt.confirm(
            `Config already exists: ${targetPath}\nOverwrite?`,
            { default: false },
          );
          if (!ok) return;
        } else {
          console.error(`Config already exists: ${targetPath}`);
          process.exitCode = 2;
          return;
        }
      }
    }

    await saveKMsgConfig(targetPath, sampleConfig);
    console.log(targetPath);
  },
});

const showCmd = defineCommand({
  name: "show",
  description: "Show detected configuration",
  options: {
    config: optConfig,
    json: optJson,
  },
  handler: async ({ flags }) => {
    const loaded = await loadKMsgConfig(flags.config);

    if (flags.json) {
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
  commands: [initCmd, showCmd, validateCmd],
  handler: async () => {
    console.log("Use a subcommand: init | show | validate");
  },
});
