import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

async function runGit(args: string[]): Promise<string> {
  const { stdout } = await execFileAsync("git", args, {
    cwd: process.cwd(),
  });
  return stdout.trim();
}

function formatError(error: unknown): string {
  if (!error || typeof error !== "object") {
    return String(error ?? "unknown error");
  }

  const maybeError = error as {
    message?: string;
    stderr?: string | Buffer;
    stdout?: string | Buffer;
  };

  const stderr =
    typeof maybeError.stderr === "string"
      ? maybeError.stderr
      : maybeError.stderr?.toString("utf8");
  const stdout =
    typeof maybeError.stdout === "string"
      ? maybeError.stdout
      : maybeError.stdout?.toString("utf8");

  return (
    stderr?.trim() || stdout?.trim() || maybeError.message || "unknown error"
  );
}

async function tryGit(
  args: string[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await runGit(args);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: formatError(error) };
  }
}

function shouldRunInCurrentEnv(): boolean {
  return (
    process.env.CI === "true" ||
    process.env.CI === "1" ||
    process.env.GITHUB_ACTIONS === "true" ||
    typeof process.env.CF_PAGES !== "undefined" ||
    process.env.FORCE_DOCS_UNSHALLOW === "1"
  );
}

function strictModeEnabled(): boolean {
  return process.env.DOCS_REQUIRE_GIT_HISTORY === "1";
}

async function main(): Promise<void> {
  if (!shouldRunInCurrentEnv()) {
    console.log(
      "skip: docs git history prepare (set CI=true or FORCE_DOCS_UNSHALLOW=1 to enable)",
    );
    return;
  }

  const shallow = await runGit(["rev-parse", "--is-shallow-repository"]);
  if (shallow !== "true") {
    console.log("ok: repository already has full history");
    return;
  }

  const branch =
    process.env.CF_PAGES_BRANCH ?? process.env.GITHUB_REF_NAME ?? "main";

  // Pages/CI shallow clones collapse per-file git history, which makes sitemap
  // lastmod converge to the same timestamp. Deepen history before docs build.
  const attempts: string[][] = [
    ["fetch", "--no-tags", "--unshallow", "origin", branch],
    ["fetch", "--deepen=200", "origin", branch],
    ["fetch", "--depth=2000", "origin", branch],
  ];

  for (const args of attempts) {
    console.log(`info: trying git ${args.join(" ")}`);
    const result = await tryGit(args);
    if (result.ok) {
      console.log(`ok: git history prepared via: git ${args.join(" ")}`);
      return;
    }

    console.warn(
      `warn: git ${args.join(" ")} failed: ${result.error.split("\n")[0]}`,
    );
  }

  const fallbackMessage =
    "warn: continuing with shallow history; sitemap lastmod may be less precise";

  if (strictModeEnabled()) {
    throw new Error(
      `failed to deepen git history in shallow repository. ${fallbackMessage} (strict mode enabled by DOCS_REQUIRE_GIT_HISTORY=1)`,
    );
  }

  console.warn(fallbackMessage);
}

await main();
