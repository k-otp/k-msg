import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dir, "../..");
const schemaDir = path.join(repoRoot, "apps/cli/schemas");
const outputPath = path.join(repoRoot, "apps/docs/src/generated/cli/schema.md");
const checkMode = process.argv.includes("--check");

type JsonSchema = {
  $id?: string;
  title?: string;
  description?: string;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  type?: string | string[];
};

function typeLabel(schema: JsonSchema | undefined): string {
  if (!schema || !schema.type) {
    return "unknown";
  }
  return Array.isArray(schema.type) ? schema.type.join(" | ") : schema.type;
}

function renderSchemaBlock(fileName: string, schema: JsonSchema): string {
  const lines: string[] = [];
  const required = new Set(schema.required ?? []);

  lines.push(`## ${fileName}`);
  lines.push("");

  if (schema.$id) {
    lines.push(`- id: \`${schema.$id}\``);
  }
  if (schema.title) {
    lines.push(`- title: ${schema.title}`);
  }
  if (schema.description) {
    lines.push(`- description: ${schema.description}`);
  }
  lines.push("");

  lines.push("### Top-level fields");
  lines.push("");
  lines.push("| field | type | required | description |");
  lines.push("| --- | --- | --- | --- |");

  const entries = Object.entries(schema.properties ?? {}).sort((a, b) =>
    a[0].localeCompare(b[0]),
  );
  for (const [fieldName, fieldSchema] of entries) {
    const requiredLabel = required.has(fieldName) ? "yes" : "no";
    const description = (fieldSchema.description ?? "").replaceAll("|", "\\|");
    lines.push(
      `| \`${fieldName}\` | \`${typeLabel(fieldSchema)}\` | ${requiredLabel} | ${description} |`,
    );
  }

  lines.push("");
  lines.push("```json");
  lines.push(JSON.stringify(schema, null, 2));
  lines.push("```");
  lines.push("");

  return lines.join("\n");
}

async function renderSchemaMarkdown(): Promise<string> {
  const files = (await readdir(schemaDir))
    .filter((name) => name.endsWith(".json"))
    .sort();

  const sections: string[] = [
    "## CLI Config Schema",
    "",
    "Generated from `apps/cli/schemas/*.json`.",
    "",
  ];

  for (const fileName of files) {
    const schemaPath = path.join(schemaDir, fileName);
    const raw = await readFile(schemaPath, "utf8");
    const schema = JSON.parse(raw) as JsonSchema;

    sections.push(renderSchemaBlock(fileName, schema));
  }

  return sections.join("\n");
}

async function main(): Promise<void> {
  const next = await renderSchemaMarkdown();

  let current = "";
  try {
    current = await readFile(outputPath, "utf8");
  } catch {
    current = "";
  }

  if (checkMode) {
    if (current !== next) {
      console.error(`schema docs out of date: ${outputPath}`);
      process.exit(1);
    }
    console.log(`ok: ${outputPath}`);
    return;
  }

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, next, "utf8");
  console.log(`generated: ${outputPath}`);
}

await main();
