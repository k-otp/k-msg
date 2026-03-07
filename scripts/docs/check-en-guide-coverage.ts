import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dir, "../..");
const docsRoot = path.join(repoRoot, "apps/docs/src/content/docs");
const englishDocsRoot = path.join(docsRoot, "en");
const astroConfigPath = path.join(repoRoot, "apps/docs/astro.config.mjs");

type MissingReference = {
  ref: string;
  source: string;
};

function toPosix(value: string): string {
  return value.replaceAll(path.sep, "/");
}

function normalizeSlug(value: string): string {
  return value.replace(/^\/+|\/+$/g, "").toLowerCase();
}

function fileToSlug(root: string, filePath: string): string {
  const relative = toPosix(path.relative(root, filePath));
  const noExt = relative.replace(/\.(md|mdx)$/i, "");
  if (noExt === "index") return "";
  if (noExt.endsWith("/index")) {
    return noExt.slice(0, -"/index".length).toLowerCase();
  }
  return noExt.toLowerCase();
}

async function walkMarkdownFiles(
  dirPath: string,
  output: string[] = [],
): Promise<string[]> {
  const entries = await readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      await walkMarkdownFiles(fullPath, output);
      continue;
    }

    if (entry.name.endsWith(".md") || entry.name.endsWith(".mdx")) {
      output.push(fullPath);
    }
  }

  return output;
}

function hrefToGuideSlug(href: string): string | null {
  if (!href.startsWith("/en/guides/")) {
    return null;
  }

  const [pathname] = href.split(/[?#]/, 1);
  if (!pathname) return null;
  return normalizeSlug(pathname.replace(/^\/en\//, ""));
}

function extractEnglishGuideHrefs(markdown: string): string[] {
  const hrefs = new Set<string>();

  for (const match of markdown.matchAll(
    /\[[^\]]+\]\((\/en\/guides\/[^)\s]+(?:\s+"[^"]*")?)\)/g,
  )) {
    const raw = match[1]?.trim();
    if (!raw) continue;
    const href = raw.split(/\s+"/, 1)[0];
    if (href) hrefs.add(href);
  }

  for (const match of markdown.matchAll(/href=["'](\/en\/guides\/[^"']+)["']/g)) {
    if (match[1]) hrefs.add(match[1]);
  }

  return [...hrefs];
}

function extractSidebarGuideIds(source: string): string[] {
  const guideIds = new Set<string>();

  for (const match of source.matchAll(/["'](guides\/[^"']+)["']/g)) {
    const value = match[1];
    if (value) guideIds.add(normalizeSlug(value));
  }

  return [...guideIds];
}

function formatMissing(title: string, items: MissingReference[]): string {
  const lines = items.map(
    ({ ref, source }) => `- ${ref} (referenced from ${toPosix(path.relative(repoRoot, source))})`,
  );
  return `${title}\n${lines.join("\n")}`;
}

const englishFiles = await walkMarkdownFiles(englishDocsRoot);
const englishSlugs = new Set(
  englishFiles.map((filePath) => fileToSlug(englishDocsRoot, filePath)),
);

const missingSidebarRefs: MissingReference[] = [];
const astroConfig = await readFile(astroConfigPath, "utf8");

for (const guideId of extractSidebarGuideIds(astroConfig)) {
  if (!englishSlugs.has(guideId)) {
    missingSidebarRefs.push({ ref: guideId, source: astroConfigPath });
  }
}

const missingLinkedRefs: MissingReference[] = [];

for (const filePath of englishFiles) {
  const markdown = await readFile(filePath, "utf8");
  for (const href of extractEnglishGuideHrefs(markdown)) {
    const slug = hrefToGuideSlug(href);
    if (!slug) continue;
    if (!englishSlugs.has(slug)) {
      missingLinkedRefs.push({ ref: href, source: filePath });
    }
  }
}

if (missingSidebarRefs.length > 0 || missingLinkedRefs.length > 0) {
  const sections: string[] = [];

  if (missingSidebarRefs.length > 0) {
    sections.push(
      formatMissing(
        "Missing English guide source for sidebar references:",
        missingSidebarRefs,
      ),
    );
  }

  if (missingLinkedRefs.length > 0) {
    sections.push(
      formatMissing(
        "Missing English guide source for linked routes:",
        missingLinkedRefs,
      ),
    );
  }

  console.error(sections.join("\n\n"));
  process.exit(1);
}

console.log(
  `ok: english guide coverage passed (${englishSlugs.size} english guide sources checked)`,
);
