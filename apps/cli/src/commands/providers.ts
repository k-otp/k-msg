import { defineCommand, option } from "@bunli/core";
import { KMSG_MESSAGE_TYPES, type MessageType } from "@k-msg/core";
import { z } from "zod";
import { optConfig, optJson, optProvider } from "../cli/options";
import { printError, shouldUseJsonOutput } from "../cli/utils";
import { runProviderDoctor } from "../onboarding";
import { loadRuntime } from "../runtime";

const messageTypes = [...KMSG_MESSAGE_TYPES] as [MessageType, ...MessageType[]];

function detectCapabilities(provider: Record<string, unknown>): string[] {
  const caps: string[] = [];
  if (typeof provider.getDeliveryStatus === "function") caps.push("delivery");
  if (typeof provider.getBalance === "function") caps.push("balance");
  if (typeof provider.createTemplate === "function") caps.push("template");
  if (typeof provider.requestTemplateInspection === "function")
    caps.push("template_inspection");
  if (typeof provider.listKakaoChannels === "function")
    caps.push("kakao_channel");
  return caps;
}

const listCmd = defineCommand({
  name: "list",
  description: "List configured providers",
  options: {
    config: optConfig,
    json: optJson,
  },
  handler: async ({ flags, context }) => {
    const asJson = shouldUseJsonOutput(flags.json, context);
    try {
      const runtime = await loadRuntime(flags.config);
      const data = runtime.providers.map((p) => ({
        id: p.id,
        name: p.name,
        supportedTypes: p.supportedTypes,
        capabilities: detectCapabilities(
          p as unknown as Record<string, unknown>,
        ),
      }));

      if (asJson) {
        console.log(JSON.stringify(data, null, 2));
        return;
      }

      for (const p of data) {
        console.log(`${p.id}: ${p.name}`);
        console.log(`  supported: ${p.supportedTypes.join(", ")}`);
        console.log(`  caps: ${p.capabilities.join(", ") || "(none)"}`);
      }
    } catch (error) {
      printError(error, asJson);
      process.exitCode = 2;
    }
  },
});

const healthCmd = defineCommand({
  name: "health",
  description: "Run health checks for providers",
  options: {
    config: optConfig,
    json: optJson,
  },
  handler: async ({ flags, spinner, terminal, context }) => {
    const asJson = shouldUseJsonOutput(flags.json, context);
    try {
      const runtime = await loadRuntime(flags.config);

      const showProgress = !asJson && terminal.isInteractive && !terminal.isCI;
      const spin = showProgress ? spinner("Running health checks...") : null;

      if (spin) spin.start();

      const results: Array<{
        id: string;
        name: string;
        health: Awaited<
          ReturnType<(typeof runtime.providers)[number]["healthCheck"]>
        >;
      }> = [];

      if (spin) {
        for (const p of runtime.providers) {
          spin.update(`Checking ${p.id}...`);
          results.push({
            id: p.id,
            name: p.name,
            health: await p.healthCheck(),
          });
        }
      } else {
        results.push(
          ...(await Promise.all(
            runtime.providers.map(async (p) => ({
              id: p.id,
              name: p.name,
              health: await p.healthCheck(),
            })),
          )),
        );
      }

      if (asJson) {
        if (spin) spin.stop();
        console.log(JSON.stringify(results, null, 2));
        return;
      }

      if (spin) spin.succeed("Health checks complete");

      for (const r of results) {
        console.log(`${r.health.healthy ? "OK" : "FAIL"} ${r.id}: ${r.name}`);
        if (!r.health.healthy && r.health.issues.length > 0) {
          for (const issue of r.health.issues) {
            console.log(`  - ${issue}`);
          }
        }
      }

      if (results.some((r) => !r.health.healthy)) {
        process.exitCode = 3;
      }
    } catch (error) {
      printError(error, asJson);
      process.exitCode = 2;
    }
  },
});

const doctorCmd = defineCommand({
  name: "doctor",
  description: "Run onboarding checks for configured providers",
  options: {
    config: optConfig,
    json: optJson,
  },
  handler: async ({ flags, context }) => {
    const asJson = shouldUseJsonOutput(flags.json, context);
    try {
      const runtime = await loadRuntime(flags.config);
      const results = await Promise.all(
        runtime.providers.map((provider) =>
          runProviderDoctor({ runtime, provider }),
        ),
      );

      if (asJson) {
        console.log(
          JSON.stringify({ ok: results.every((r) => r.ok), results }, null, 2),
        );
        if (results.some((r) => !r.ok)) {
          process.exitCode = 2;
        }
        return;
      }

      for (const result of results) {
        console.log(
          `${result.ok ? "OK" : "FAIL"} ${result.providerId}: ${result.providerName}`,
        );
        if (result.spec) {
          console.log(
            `  onboarding: channel=${result.spec.channelOnboarding}, templateApi=${result.spec.templateLifecycleApi}, plusIdPolicy=${result.spec.plusIdPolicy}, live=${result.spec.liveTestSupport ?? "unknown"}`,
          );
        }
        for (const check of result.checks) {
          const marker =
            check.status === "pass"
              ? "PASS"
              : check.status === "fail"
                ? "FAIL"
                : "SKIP";
          console.log(
            `  [${marker}] (${check.severity}) ${check.id}: ${check.message}`,
          );
        }
      }

      if (results.some((r) => !r.ok)) {
        process.exitCode = 2;
      }
    } catch (error) {
      printError(error, asJson);
      process.exitCode = 2;
    }
  },
});

const balanceCmd = defineCommand({
  name: "balance",
  description: "Query provider balance for providers that support it",
  options: {
    config: optConfig,
    json: optJson,
    provider: optProvider,
    channel: option(z.enum(messageTypes).optional(), {
      description: "Balance channel override (e.g. ALIMTALK, SMS, LMS, MMS)",
    }),
  },
  handler: async ({ flags, context }) => {
    const asJson = shouldUseJsonOutput(flags.json, context);
    try {
      const runtime = await loadRuntime(flags.config);
      const targets = flags.provider
        ? runtime.providers.filter((provider) => provider.id === flags.provider)
        : runtime.providers;

      if (targets.length === 0) {
        throw new Error(
          flags.provider
            ? `Provider not found: ${flags.provider}`
            : "No providers configured",
        );
      }

      const results = await Promise.all(
        targets.map(async (provider) => {
          if (typeof provider.getBalance !== "function") {
            return {
              id: provider.id,
              name: provider.name,
              supported: false as const,
            };
          }

          const result = await provider.getBalance(
            flags.channel ? { channel: flags.channel } : undefined,
          );

          if (result.isSuccess) {
            return {
              id: provider.id,
              name: provider.name,
              supported: true as const,
              balance: result.value,
            };
          }

          return {
            id: provider.id,
            name: provider.name,
            supported: true as const,
            error: {
              code: result.error.code,
              message: result.error.message,
              ...(result.error.details !== undefined
                ? { details: result.error.details }
                : {}),
            },
          };
        }),
      );

      if (asJson) {
        console.log(JSON.stringify(results, null, 2));
      } else {
        for (const item of results) {
          if (!item.supported) {
            console.log(`SKIP ${item.id}: balance capability not supported`);
            continue;
          }

          if ("error" in item) {
            const code = item.error?.code ?? "UNKNOWN_ERROR";
            const message = item.error?.message ?? "Unknown provider error";
            console.log(`FAIL ${item.id}: ${code} - ${message}`);
            continue;
          }

          console.log(
            `OK ${item.id}: ${item.balance.amount}${item.balance.currency ? ` ${item.balance.currency}` : ""}`,
          );
        }
      }

      const hasBalanceError = results.some((item) => "error" in item);
      const hasUnsupportedBalance = results.some((item) => !item.supported);

      if (hasBalanceError) {
        process.exitCode = 3;
      } else if (hasUnsupportedBalance) {
        process.exitCode = 4;
      }
    } catch (error) {
      printError(error, asJson);
      process.exitCode = 2;
    }
  },
});

export default defineCommand({
  name: "providers",
  description: "Provider utilities",
  commands: [listCmd, healthCmd, balanceCmd, doctorCmd],
  handler: async () => {
    console.log("Use a subcommand: list | health | balance | doctor");
  },
});
