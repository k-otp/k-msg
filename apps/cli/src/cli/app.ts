import { createCLI } from "@bunli/core";
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
  });

  cli.command(config);
  cli.command(providers);
  cli.command(sms);
  cli.command(alimtalk);
  cli.command(send);
  cli.command(kakao);

  return cli;
}
