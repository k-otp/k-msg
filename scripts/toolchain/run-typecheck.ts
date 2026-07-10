import { createRequire } from "node:module";
import path from "node:path";
import {
  docsTypecheckBoundary,
  type TypecheckTarget,
  typecheckTargets,
} from "./typecheck-targets";

type Compiler = "tsc" | "ttsc";

const repoRoot = path.resolve(import.meta.dir, "../..");

function resolveWorkspaceTsgoBinary(): string {
  const rootRequire = createRequire(path.join(repoRoot, "package.json"));
  const typescriptManifest = rootRequire.resolve("typescript/package.json");
  const typescriptRequire = createRequire(typescriptManifest);
  const platformManifest = typescriptRequire.resolve(
    `@typescript/typescript-${process.platform}-${process.arch}/package.json`,
  );
  return path.join(
    path.dirname(platformManifest),
    "lib",
    process.platform === "win32" ? "tsc.exe" : "tsc",
  );
}

function readCompiler(): Compiler {
  const flagIndex = process.argv.indexOf("--compiler");
  const value = flagIndex >= 0 ? process.argv[flagIndex + 1] : undefined;
  if (value === "tsc" || value === "ttsc") {
    return value;
  }

  throw new Error("Expected --compiler ttsc or --compiler tsc");
}

async function run(command: readonly string[], label: string): Promise<void> {
  const processHandle = Bun.spawn([...command], {
    cwd: repoRoot,
    stderr: "inherit",
    stdout: "inherit",
  });
  const exitCode = await processHandle.exited;
  if (exitCode !== 0) {
    throw new Error(`${label} failed with exit code ${exitCode}`);
  }
}

async function runTarget(
  compiler: Compiler,
  target: TypecheckTarget,
): Promise<void> {
  console.log(`\n[typecheck:${compiler}] ${target.label}`);
  const compilerOptions =
    compiler === "ttsc" ? ["--binary", resolveWorkspaceTsgoBinary()] : [];
  await run(
    [
      "bun",
      "x",
      compiler,
      "--noEmit",
      "--project",
      target.tsconfig,
      ...compilerOptions,
    ],
    target.label,
  );
}

async function main(): Promise<void> {
  const compiler = readCompiler();
  console.log(`Running workspace validation with ${compiler}.`);
  console.log(
    `${docsTypecheckBoundary.workspace} remains on its compatibility boundary; use ${docsTypecheckBoundary.validationCommand}.`,
  );

  console.log("\n[typecheck:prepare] CLI generated runtime");
  await run(["bun", "run", "--cwd", "apps/cli", "generate"], "CLI generation");

  for (const target of typecheckTargets) {
    await runTarget(compiler, target);
  }

  console.log(`\n[typecheck:${compiler}] All targets passed.`);
}

try {
  await main();
} catch (error) {
  console.error(`\n[typecheck] ${String(error)}`);
  process.exit(1);
}
