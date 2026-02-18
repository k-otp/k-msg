import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

async function runGit(args: string[]): Promise<string> {
  const { stdout } = await execFileAsync("git", args, {
    cwd: process.cwd(),
  });
  return stdout.trim();
}

async function tryGit(args: string[]): Promise<boolean> {
  try {
    await runGit(args);
    return true;
  } catch {
    return false;
  }
}

function shouldRunInCurrentEnv(): boolean {
  return process.env.CI === "true" || process.env.FORCE_DOCS_UNSHALLOW === "1";
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
    ["fetch", "--unshallow", "origin", branch],
    ["fetch", "--deepen=200", "origin", branch],
    ["fetch", "--depth=2000", "origin", branch],
  ];

  for (const args of attempts) {
    if (await tryGit(args)) {
      console.log(`ok: git history prepared via: git ${args.join(" ")}`);
      return;
    }
  }

  throw new Error(
    "failed to deepen git history in shallow repository; cannot derive stable per-file sitemap lastmod",
  );
}

await main();
