import { defineCommand } from "@bunli/core";
import { loadRuntime } from "../runtime";
import { optConfig, optJson } from "../cli/options";
import { printError } from "../cli/utils";

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
  handler: async ({ flags }) => {
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

      if (flags.json) {
        console.log(JSON.stringify(data, null, 2));
        return;
      }

      for (const p of data) {
        console.log(`${p.id}: ${p.name}`);
        console.log(`  supported: ${p.supportedTypes.join(", ")}`);
        console.log(`  caps: ${p.capabilities.join(", ") || "(none)"}`);
      }
    } catch (error) {
      printError(error, flags.json);
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
  handler: async ({ flags }) => {
    try {
      const runtime = await loadRuntime(flags.config);

      const results = await Promise.all(
        runtime.providers.map(async (p) => ({
          id: p.id,
          name: p.name,
          health: await p.healthCheck(),
        })),
      );

      if (flags.json) {
        console.log(JSON.stringify(results, null, 2));
        return;
      }

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
      printError(error, flags.json);
      process.exitCode = 2;
    }
  },
});

export default defineCommand({
  name: "providers",
  description: "Provider utilities",
  commands: [listCmd, healthCmd],
  handler: async () => {
    console.log("Use a subcommand: list | health");
  },
});
