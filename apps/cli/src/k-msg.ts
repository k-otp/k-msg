#!/usr/bin/env bun

import { createKMsgCli } from "./cli/create";

class BunliExit extends Error {
  constructor(readonly exitCode: number) {
    super(`process.exit(${exitCode})`);
    this.name = "BunliExit";
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
    const cli = await createKMsgCli();
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
