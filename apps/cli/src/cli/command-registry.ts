import alimtalk from "../commands/alimtalk";
import config from "../commands/config";
import db from "../commands/db";
import migrate from "../commands/db-tracking-migrate";
import kakao from "../commands/kakao";
import providers from "../commands/providers";
import send from "../commands/send";
import sms from "../commands/sms";
import type { CliNode } from "./command-contract";

export type CliCommandSummary = {
  description: string;
  name: string;
};

export const K_MSG_COMMAND_REGISTRY = [
  alimtalk,
  config,
  db,
  kakao,
  migrate,
  providers,
  send,
  sms,
] satisfies CliNode[];

const K_MSG_COMPLETION_COMMANDS = [
  {
    description: "Completion protocol callback for shell integration",
    name: "complete",
  },
  {
    description: "Print shell completion scripts",
    name: "completions",
  },
] satisfies CliCommandSummary[];

export function listRootCommands(): CliNode[] {
  return [...K_MSG_COMMAND_REGISTRY];
}

export function listPublicRootCommands(): CliCommandSummary[] {
  return [
    ...K_MSG_COMMAND_REGISTRY.map((node) => ({
      description: node.description,
      name: node.name,
    })),
    ...K_MSG_COMPLETION_COMMANDS,
  ];
}
