import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dir, "../..");
const docsRoot = path.join(repoRoot, "apps/docs/src/content/docs");

const sourceVersion = process.env.KMSG_DOCS_SOURCE ?? "latest";
const targetVersion = process.env.KMSG_DOCS_TARGET ?? "v0";

const locales = ["ko", "en"] as const;

function localeDir(locale: (typeof locales)[number]): string {
  return locale === "ko" ? "" : "en";
}

function localePrefix(locale: (typeof locales)[number]): string {
  return locale === "ko" ? "" : "/en";
}

async function collectDocsFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectDocsFiles(fullPath)));
      continue;
    }
    if (entry.name.endsWith(".md") || entry.name.endsWith(".mdx")) {
      files.push(fullPath);
    }
  }

  return files;
}

async function rewriteSnapshotContent(
  locale: (typeof locales)[number],
  targetDir: string,
): Promise<void> {
  const files = await collectDocsFiles(targetDir);
  const fromPrefix = `${localePrefix(locale)}/${sourceVersion}/`;
  const toPrefix = `${localePrefix(locale)}/${targetVersion}/`;

  for (const file of files) {
    const current = await readFile(file, "utf8");
    let next = current.replaceAll(fromPrefix, toPrefix);

    if (file === path.join(targetDir, "index.md")) {
      if (locale === "en") {
        next = next.replace(/^title:\s*.+$/m, "title: k-msg Docs (v0)");
        next = next.replace(
          /^description:\s*.+$/m,
          "description: k-msg v0 LTS docs",
        );
      } else {
        next = next.replace(/^title:\s*.+$/m, "title: k-msg 문서 (v0)");
        next = next.replace(
          /^description:\s*.+$/m,
          "description: k-msg v0 LTS 문서",
        );
      }
    }

    if (next !== current) {
      await writeFile(file, next, "utf8");
    }
  }
}

async function copyLocaleVersion(
  locale: (typeof locales)[number],
): Promise<void> {
  const src = path.join(docsRoot, localeDir(locale), sourceVersion);
  const dest = path.join(docsRoot, localeDir(locale), targetVersion);

  await rm(dest, { recursive: true, force: true });
  await mkdir(path.dirname(dest), { recursive: true });
  await cp(src, dest, { recursive: true, force: true });
  await rewriteSnapshotContent(locale, dest);

  console.log(
    `snapshot: ${localePrefix(locale) || "/"}${sourceVersion} -> ${localePrefix(locale) || "/"}${targetVersion}`,
  );
}

await Promise.all(locales.map((locale) => copyLocaleVersion(locale)));
