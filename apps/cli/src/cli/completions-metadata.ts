import { mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { cli as generatedCli } from "../../.bunli/commands.gen";

const COMPLETIONS_CACHE_DIR = path.join(
  os.tmpdir(),
  "k-msg-cli",
  "completions",
);
const COMPLETIONS_METADATA_FILE = "commands.generated.mjs";

function renderMetadataModule(): string {
  const metadata = generatedCli.list().map((entry) => entry.metadata);
  const serialized = JSON.stringify(metadata, null, 2);

  return [
    `const metadata = ${serialized};`,
    "",
    "export const generated = {",
    "  list: () => metadata.map((item) => ({ metadata: item })),",
    "};",
    "",
    "export default { generated };",
    "",
  ].join("\n");
}

export async function ensureCompletionsMetadataModule(): Promise<string> {
  const modulePath = path.join(
    COMPLETIONS_CACHE_DIR,
    COMPLETIONS_METADATA_FILE,
  );
  await mkdir(COMPLETIONS_CACHE_DIR, { recursive: true });
  await writeFile(modulePath, renderMetadataModule(), "utf8");
  return modulePath;
}
