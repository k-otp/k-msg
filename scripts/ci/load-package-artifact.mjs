#!/usr/bin/env node

// Loads one built package artifact the way a consumer does: require() for the
// CommonJS condition and import() for the ESM condition. It reads every export
// and prints the export names, or why the artifact failed to load, as one JSON
// line. The artifact gate starts a fresh process per artifact, so a broken
// module cannot affect the gate or the other artifacts.

import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const LOADERS = {
  import: (file) => import(pathToFileURL(file).href),
  require: (file) => createRequire(file)(file),
};

function describe(error) {
  if (!(error instanceof Error)) return String(error);
  const code = typeof error.code === "string" ? ` [${error.code}]` : "";
  return `${error.name}${code}: ${error.message.split("\n")[0]}`;
}

async function inspect(condition, file) {
  let loaded;
  try {
    loaded = await LOADERS[condition](file);
  } catch (error) {
    return { error: `${condition}() threw ${describe(error)}` };
  }

  const exportNames = Object.keys(loaded ?? {});
  const problems = [];
  if (exportNames.length === 0 && typeof loaded !== "function") {
    problems.push("no exports");
  }
  for (const name of exportNames) {
    try {
      if (loaded[name] === undefined) {
        problems.push(`export ${name} is undefined`);
      }
    } catch (error) {
      problems.push(`reading export ${name} threw ${describe(error)}`);
    }
  }
  return { exports: exportNames, problems };
}

const [condition, file] = process.argv.slice(2);
if (!Object.hasOwn(LOADERS, condition) || !file) {
  console.error(
    "Usage: load-package-artifact.mjs <import|require> <absolute-file>",
  );
  process.exitCode = 2;
} else {
  process.stdout.write(`${JSON.stringify(await inspect(condition, file))}\n`);
}
