import { createCLI } from "@bunli/core";
import { aiAgentPlugin } from "@bunli/plugin-ai-detect";
import alimtalk from "../commands/alimtalk";
import config from "../commands/config";
import kakao from "../commands/kakao";
import providers from "../commands/providers";
import send from "../commands/send";
import sms from "../commands/sms";

function hasAnyNonEmptyEnv(env: Bun.Env, keys: readonly string[]): boolean {
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

  // Keep explicit registration so CLI tests do not depend on generated `.bunli/*` artifacts.
  cli.command(config);
  cli.command(providers);
  cli.command(sms);
  cli.command(alimtalk);
  cli.command(send);
  cli.command(kakao);

  return cli;
}
