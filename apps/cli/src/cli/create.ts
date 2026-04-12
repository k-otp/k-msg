import { createCLI } from "@bunli/core";
import { cli as generatedCli } from "../../.bunli/commands.gen";
import pkg from "../../package.json";
import { ensureCompletionsMetadataModule } from "./completions-metadata";

function hasAnyNonEmptyEnv(env: Bun.Env, keys: readonly string[]): boolean {
  const envRecord = env as Record<string, string | undefined>;
  return keys.some((key) => {
    const value = envRecord[key];
    return typeof value === "string" && value.trim().length > 0;
  });
}

const CLI_NAME = "k-msg";
const CLI_VERSION =
  typeof pkg.version === "string" && pkg.version.trim().length > 0
    ? pkg.version
    : "0.0.0";
const CLI_DESCRIPTION =
  typeof pkg.description === "string" && pkg.description.trim().length > 0
    ? pkg.description
    : "k-msg CLI";

type LocalBunliPlugin = {
  afterCommand?: (...args: unknown[]) => void | Promise<void>;
  beforeCommand?: (...args: unknown[]) => void | Promise<void>;
  configResolved?: (...args: unknown[]) => void | Promise<void>;
  name: string;
  postRun?: (...args: unknown[]) => void | Promise<void>;
  preRun?: (...args: unknown[]) => void | Promise<void>;
  setup?: (...args: unknown[]) => void | Promise<void>;
  store?: object;
  version?: string;
};

type LocalPluginFactory = (options?: unknown) => LocalBunliPlugin;

function isBunliPlugin(value: unknown): value is LocalBunliPlugin {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    typeof (value as { name?: unknown }).name === "string"
  );
}

function getPluginFactory(
  moduleValue: unknown,
  exportName: string,
): LocalPluginFactory {
  if (
    typeof moduleValue !== "object" ||
    moduleValue === null ||
    !(exportName in moduleValue)
  ) {
    throw new Error(`Missing Bunli plugin export: ${exportName}`);
  }

  const factory = (moduleValue as Record<string, unknown>)[exportName];
  if (typeof factory !== "function") {
    throw new Error(`Invalid Bunli plugin export: ${exportName}`);
  }

  return (options?: unknown) => {
    const plugin = factory(options);
    if (!isBunliPlugin(plugin)) {
      throw new Error(`Invalid Bunli plugin instance from ${exportName}`);
    }
    return plugin;
  };
}

export async function createKMsgCli() {
  const completionsMetadataPath = await ensureCompletionsMetadataModule();
  const aiDetectModule: unknown = await import("@bunli/plugin-ai-detect");
  const completionsModule: unknown = await import("@bunli/plugin-completions");
  const aiAgentPlugin = getPluginFactory(aiDetectModule, "aiAgentPlugin");
  const completionsPlugin = getPluginFactory(
    completionsModule,
    "completionsPlugin",
  );
  const plugins = [
    completionsPlugin({
      generatedPath: completionsMetadataPath,
      commandName: CLI_NAME,
      executable: CLI_NAME,
    }),
    aiAgentPlugin({
      customAgents: [
        {
          name: "codex",
          envVars: ["CODEX_CI", "CODEX_SHELL", "CODEX_THREAD_ID"],
          detect: (env: Bun.Env) =>
            hasAnyNonEmptyEnv(env, [
              "CODEX_CI",
              "CODEX_SHELL",
              "CODEX_THREAD_ID",
            ]),
        },
        {
          name: "mcp",
          envVars: ["MCP_SERVER_NAME", "MCP_SESSION_ID", "MCP_TOOL_NAME"],
          detect: (env: Bun.Env) =>
            hasAnyNonEmptyEnv(env, [
              "MCP_SERVER_NAME",
              "MCP_SESSION_ID",
              "MCP_TOOL_NAME",
            ]),
        },
      ],
    }),
  ] satisfies readonly LocalBunliPlugin[];

  const cli = await createCLI({
    name: CLI_NAME,
    version: CLI_VERSION,
    description: CLI_DESCRIPTION,
    plugins,
  });
  generatedCli.register(cli);

  return cli;
}
