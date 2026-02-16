import { defineCommand } from "@bunli/core";
import { optConfig, optJson } from "../cli/options";
import { printError, shouldUseJsonOutput } from "../cli/utils";
import { runProviderDoctor } from "../onboarding";
import { loadRuntime } from "../runtime";

function detectCapabilities(provider: Record<string, unknown>): string[] {
  const caps: string[] = [];
  if (typeof provider.getDeliveryStatus === "function") caps.push("delivery");
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

export default defineCommand({
  name: "providers",
  description: "Provider utilities",
  commands: [listCmd, healthCmd, doctorCmd],
  handler: async () => {
    console.log("Use a subcommand: list | health | doctor");
  },
});
