import { createCLI } from "@bunli/core";
import { aiAgentPlugin } from "@bunli/plugin-ai-detect";
import pkg from "../../package.json";
import alimtalk from "../commands/alimtalk";
import config from "../commands/config";
import kakao from "../commands/kakao";
import providers from "../commands/providers";
import send from "../commands/send";
import sms from "../commands/sms";

function readCliVersion(): string {
  return typeof pkg.version === "string" ? pkg.version : "0.0.0";
}

export async function createKMsgCli() {
  const cli = await createCLI({
    name: "k-msg",
    version: readCliVersion(),
    description: "k-msg CLI",
    plugins: [
      aiAgentPlugin({
        customAgents: [
          {
            name: "codex",
            envVars: ["CODEX_CI", "CODEX_SHELL", "CODEX_THREAD_ID"],
            detect: (env) =>
              Object.keys(env).some((key) => key.startsWith("CODEX_")),
          },
          {
            name: "mcp",
            envVars: ["MCP_SERVER_NAME", "MCP_SESSION_ID", "MCP_TOOL_NAME"],
            detect: (env) =>
              Object.keys(env).some((key) => key.startsWith("MCP_")),
          },
        ],
      }),
    ],
  });

  cli.command(config);
  cli.command(providers);
  cli.command(sms);
  cli.command(alimtalk);
  cli.command(send);
  cli.command(kakao);

  return cli;
}
