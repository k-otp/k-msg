import { createCLI } from "@bunli/core";
import { aiAgentPlugin } from "@bunli/plugin-ai-detect";
import { cli as generatedCli } from "../../.bunli/commands.gen";
import pkg from "../../package.json";

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

export async function createKMsgCli() {
  const cli = await createCLI({
    name: CLI_NAME,
    version: CLI_VERSION,
    description: CLI_DESCRIPTION,
    plugins: [
      aiAgentPlugin({
        customAgents: [
          {
            name: "codex",
            envVars: ["CODEX_CI", "CODEX_SHELL", "CODEX_THREAD_ID"],
            detect: (env) =>
              hasAnyNonEmptyEnv(env, [
                "CODEX_CI",
                "CODEX_SHELL",
                "CODEX_THREAD_ID",
              ]),
          },
          {
            name: "mcp",
            envVars: ["MCP_SERVER_NAME", "MCP_SESSION_ID", "MCP_TOOL_NAME"],
            detect: (env) =>
              hasAnyNonEmptyEnv(env, [
                "MCP_SERVER_NAME",
                "MCP_SESSION_ID",
                "MCP_TOOL_NAME",
              ]),
          },
        ],
      }),
    ],
  });
  generatedCli.register(cli);

  return cli;
}
