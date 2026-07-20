#!/usr/bin/env node

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  inspectBuiltPackage,
  inspectPackedPackage,
  listPublishablePackageDirs,
} from "./package-artifacts-lib.mjs";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

function fail(errors) {
  for (const error of errors) console.error(`::error::${error}`);
  process.exitCode = 1;
}

function parsePackResult(file) {
  const value = JSON.parse(readFileSync(file, "utf8"));
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`npm pack output is empty: ${file}`);
  }
  return value[0];
}

const args = process.argv.slice(2);
try {
  if (args[0] === "--pack-json") {
    if (args.length !== 3) {
      throw new Error(
        "Usage: check-package-artifacts.mjs --pack-json <package-dir> <npm-pack.json>",
      );
    }
    const packageDir = path.resolve(repositoryRoot, args[1]);
    const packJsonFile = path.resolve(repositoryRoot, args[2]);
    const result = inspectPackedPackage(
      packageDir,
      parsePackResult(packJsonFile),
    );
    if (result.errors.length > 0) fail(result.errors);
    else console.log(`ok: ${result.manifest.name} packed export contract`);
  } else if (args.length === 0) {
    const results = listPublishablePackageDirs(repositoryRoot).map(
      (packageDir) => inspectBuiltPackage(packageDir),
    );
    const errors = results.flatMap((result) => result.errors);
    if (errors.length > 0) fail(errors);
    else {
      const esmCount = results.reduce(
        (total, result) => total + result.checkedEsm.length,
        0,
      );
      console.log(
        `ok: ${results.length} publishable packages and ${esmCount} ESM exports validated`,
      );
    }
  } else {
    throw new Error("Usage: check-package-artifacts.mjs [--pack-json ...]");
  }
} catch (error) {
  fail([error instanceof Error ? error.message : String(error)]);
}
