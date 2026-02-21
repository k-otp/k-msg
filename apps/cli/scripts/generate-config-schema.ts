import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import * as z from "zod";
import {
  CONFIG_SCHEMA_LATEST_URL,
  CONFIG_SCHEMA_VERSIONED_URL,
} from "../src/config/constants";
import { kMsgCliConfigSchema } from "../src/config/schema";

const isCheckMode = process.argv.includes("--check");
const cliRootDir = path.resolve(import.meta.dir, "..");
const outputDir = path.join(cliRootDir, "schemas");

type OutputTarget = {
  filePath: string;
  schemaId: string;
};

const outputTargets: OutputTarget[] = [
  {
    filePath: path.join(outputDir, "k-msg.config.schema.json"),
    schemaId: CONFIG_SCHEMA_LATEST_URL,
  },
  {
    filePath: path.join(outputDir, "k-msg.config.v1.schema.json"),
    schemaId: CONFIG_SCHEMA_VERSIONED_URL,
  },
];

function buildSchema(schemaId: string): Record<string, unknown> {
  const baseSchema = z.toJSONSchema(kMsgCliConfigSchema, {
    target: "draft-2020-12",
  }) as Record<string, unknown>;

  return {
    ...baseSchema,
    $id: schemaId,
    title: "k-msg CLI config",
    description: "Schema for k-msg.config.json used by @k-msg/cli (version 1)",
  };
}

function formatSchema(schema: Record<string, unknown>): string {
  return `${JSON.stringify(schema, null, 2)}\n`;
}

async function formatWithBiome(
  source: string,
  filePath: string,
): Promise<string> {
  const proc = Bun.spawn(
    ["bun", "x", "@biomejs/biome", "format", "--stdin-file-path", filePath],
    {
      stdin: "pipe",
      stdout: "pipe",
      stderr: "pipe",
    },
  );

  proc.stdin.write(source);
  proc.stdin.end();

  const [exitCode, stdout, stderr] = await Promise.all([
    proc.exited,
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);

  if (exitCode !== 0) {
    throw new Error(
      `Biome format failed for ${filePath}: ${stderr.trim() || `exit ${exitCode}`}`,
    );
  }

  return stdout;
}

async function renderSchema(target: OutputTarget): Promise<string> {
  const raw = formatSchema(buildSchema(target.schemaId));
  return formatWithBiome(raw, target.filePath);
}

async function writeSchemas(): Promise<void> {
  await mkdir(outputDir, { recursive: true });

  for (const target of outputTargets) {
    const rendered = await renderSchema(target);
    await writeFile(target.filePath, rendered, "utf8");
    console.log(`generated: ${target.filePath}`);
  }
}

async function checkSchemas(): Promise<void> {
  let hasMismatch = false;

  for (const target of outputTargets) {
    const expected = await renderSchema(target);

    let actual: string;
    try {
      actual = await readFile(target.filePath, "utf8");
    } catch {
      console.error(`missing schema file: ${target.filePath}`);
      hasMismatch = true;
      continue;
    }

    if (actual !== expected) {
      console.error(`schema out of date: ${target.filePath}`);
      hasMismatch = true;
    } else {
      console.log(`ok: ${target.filePath}`);
    }
  }

  if (hasMismatch) {
    process.exitCode = 1;
  }
}

if (isCheckMode) {
  await checkSchemas();
} else {
  await writeSchemas();
}
