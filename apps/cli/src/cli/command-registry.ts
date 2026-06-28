import alimtalk from "../commands/alimtalk";
import config from "../commands/config";
import db from "../commands/db";
import migrate from "../commands/db-tracking-migrate";
import kakao from "../commands/kakao";
import providers from "../commands/providers";
import send from "../commands/send";
import sms from "../commands/sms";
import type { CliNode } from "./command-contract";

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

export function listRootCommands(): CliNode[] {
  return [...K_MSG_COMMAND_REGISTRY];
}
