import path from "node:path";

const repoRoot = path.resolve(import.meta.dir, "../..");
const checkMode = process.argv.includes("--check");

const generators = [
  "scripts/docs/collect-entrypoints.ts",
  "scripts/docs/generate-cli-help.ts",
  "scripts/docs/sync-tracking-schema-docs.ts",
  "scripts/docs/generate-schema-docs.ts",
  "scripts/docs/generate-guides.ts",
];

const selectedGenerators = checkMode
  ? generators.filter(
      (script) =>
        script !== "scripts/docs/generate-cli-help.ts" &&
        script !== "scripts/docs/generate-schema-docs.ts",
    )
  : generators;

for (const script of selectedGenerators) {
  const args = ["bun", script];
  if (checkMode) {
    args.push("--check");
  }

  const proc = Bun.spawn(args, {
    cwd: repoRoot,
    stdout: "inherit",
    stderr: "inherit",
  });

  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    process.exit(exitCode);
  }
}
