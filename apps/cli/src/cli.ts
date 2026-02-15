#!/usr/bin/env bun

import { readFileSync } from "node:fs";
import { createCLI } from "@bunli/core";

import alimtalk from "./commands/alimtalk";
import config from "./commands/config";
import kakao from "./commands/kakao";
import providers from "./commands/providers";
import send from "./commands/send";
import sms from "./commands/sms";

class BunliExit extends Error {
  constructor(readonly exitCode: number) {
    super(`process.exit(${exitCode})`);
    this.name = "BunliExit";
  }
}

function readCliVersion(): string {
  try {
    const pkgPath = new URL("../package.json", import.meta.url);
    const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as {
      version?: unknown;
    };
    return typeof pkg.version === "string" ? pkg.version : "0.0.0";
  } catch {
    return "0.0.0";
  }
}

async function main(): Promise<void> {
  // Bunli currently uses `-v` as a built-in version flag and calls `process.exit(1)`
  // on validation/unknown-command errors. We intercept `process.exit` so we can map
  // those cases to our planned exit codes.
  const originalExit = process.exit;
  (process as unknown as { exit: (code?: number) => never }).exit = (
    code?: number,
  ): never => {
    throw new BunliExit(typeof code === "number" ? code : 0);
  };

  try {
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

    await cli.run(process.argv.slice(2));
  } catch (error) {
    if (error instanceof BunliExit) {
      // Bunli uses exit(1) for input/usage errors; we standardize those to 2.
      process.exitCode = error.exitCode === 1 ? 2 : error.exitCode;
      return;
    }
    throw error;
  } finally {
    process.exit = originalExit;
  }
}

await main();
