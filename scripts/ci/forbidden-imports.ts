import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { countModulesByPackage } from "./package-artifacts-lib.mjs";

// Forbidden-import guard for send-only artifacts, run by
// check-bundle-size.sh after it builds the ESM bundles.
//
// An artifact contains a package when it imports it, by its name or one of
// its subpaths ("zod" covers "zod/mini"), or when it inlines a module the
// package owns. Imports come from Bun's own parser, not a text search, so a
// string or comment that mentions a package is not a match. Inlined modules
// come from the sources of the artifact's linked sourcemap. Anything the
// guard cannot read, including a missing sourcemap, fails the guard instead
// of passing it.

export interface ForbiddenImportCheck {
  /** Package directory, relative to the repository root. */
  packageDir: string;
  /** Built artifact, relative to `packageDir`. */
  artifact: string;
  /** Package names the artifact must neither import nor inline. */
  forbidden: string[];
}

export const FORBIDDEN_IMPORT_CHECKS: ForbiddenImportCheck[] = [
  {
    packageDir: "packages/messaging",
    artifact: "dist/sender/index.mjs",
    forbidden: ["zod", "drizzle-orm"],
  },
  {
    packageDir: "packages/provider",
    artifact: "dist/aligo/send.mjs",
    forbidden: ["zod", "drizzle-orm", "@k-msg/template"],
  },
  {
    packageDir: "packages/provider",
    artifact: "dist/iwinv/send.mjs",
    forbidden: ["zod", "drizzle-orm", "@k-msg/template"],
  },
];

export interface ForbiddenImportReport {
  /** Forbidden packages the artifact imports or inlines. */
  violations: string[];
  /** Reasons the artifact could not be inspected. */
  problems: string[];
}

function belongsTo(specifier: string, packageName: string): boolean {
  return specifier === packageName || specifier.startsWith(`${packageName}/`);
}

function createScanner(): Bun.Transpiler {
  if (typeof Bun === "undefined" || typeof Bun.Transpiler !== "function") {
    throw new Error(
      "the forbidden-import guard needs Bun's transpiler; run it with bun",
    );
  }
  return new Bun.Transpiler({ loader: "js" });
}

export function inspectForbiddenImports(
  artifactFile: string,
  packageDir: string,
  forbidden: readonly string[],
): ForbiddenImportReport {
  const violations: string[] = [];
  const problems: string[] = [];
  if (!existsSync(artifactFile)) {
    return { violations, problems: ["the artifact is missing"] };
  }

  const scanner = createScanner();
  let imports: Bun.Import[];
  try {
    imports = scanner.scanImports(readFileSync(artifactFile, "utf8"));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { violations, problems: [`cannot parse it: ${message}`] };
  }
  // A minified bundle repeats an import statement per source module.
  const seen = new Set<string>();
  for (const { kind, path: specifier } of imports) {
    const violation = `${kind} of '${specifier}'`;
    if (seen.has(violation)) continue;
    seen.add(violation);
    if (forbidden.some((packageName) => belongsTo(specifier, packageName))) {
      violations.push(violation);
    }
  }

  const modules = countModulesByPackage(artifactFile, packageDir);
  if (!modules.counts) {
    problems.push(`cannot check inlined modules: ${modules.problem}`);
  } else {
    for (const [owner, count] of modules.counts) {
      if (forbidden.includes(owner)) {
        violations.push(`${count} inlined module(s) of '${owner}'`);
      }
    }
  }
  return { violations, problems };
}

function main(): number {
  const rootDir = path.resolve(import.meta.dir, "../..");
  let failed = false;
  console.log("Forbidden import guard (send-only artifacts)");
  for (const check of FORBIDDEN_IMPORT_CHECKS) {
    const packageDir = path.join(rootDir, check.packageDir);
    const artifactFile = path.join(packageDir, check.artifact);
    const label = path.join(check.packageDir, check.artifact);
    const { violations, problems } = inspectForbiddenImports(
      artifactFile,
      packageDir,
      check.forbidden,
    );
    for (const problem of problems) {
      console.log(`::error file=${label}::${problem}`);
    }
    for (const violation of violations) {
      console.log(`::error file=${label}::forbidden ${violation}`);
    }
    if (problems.length > 0 || violations.length > 0) {
      failed = true;
      console.log(`FAIL ${label}`);
    } else {
      console.log(`OK   ${label} has none of ${check.forbidden.join(", ")}`);
    }
  }
  return failed ? 1 : 0;
}

if (import.meta.main) {
  process.exitCode = main();
}
