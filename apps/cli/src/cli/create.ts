import { createCLI } from "@bunli/core";
import { aiAgentPlugin } from "@bunli/plugin-ai-detect";

function hasAnyNonEmptyEnv(
  env: NodeJS.ProcessEnv,
  keys: readonly string[],
): boolean {
  return keys.some((key) => {
    const value = env[key];
    return typeof value === "string" && value.trim().length > 0;
  });
}

export async function createKMsgCli() {
  const cli = await createCLI({
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
  await cli.init();

  return cli;
}
