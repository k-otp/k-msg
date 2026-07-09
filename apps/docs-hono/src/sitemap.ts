import { execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import type { DocsPage } from "./content";
import { pathSitemapMeta, siteOrigin } from "./site";
import { escapeHtml } from "./utils";

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(import.meta.dir, "../../..");
const stylePi = '<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>';
const gitLastmodConcurrency = 16;
let warnedGitLastmodFailure = false;

type SitemapEntry = {
  changefreq: string;
  lastmod?: string;
  loc: string;
  priority: number;
};

function normalizeRepoPath(value: string): string {
  return value.replaceAll(path.sep, "/").replace(/^\/+|^\.\//g, "");
}

function escapeXml(value: string): string {
  return escapeHtml(value);
}

async function resolveGitLastmod(
  repoRelativePath: string,
): Promise<string | undefined> {
  const normalized = normalizeRepoPath(repoRelativePath);
  if (!normalized) {
    return undefined;
  }

  try {
    const { stdout } = await execFileAsync(
      "git",
      ["log", "-1", "--format=%cI", "--", normalized],
      { cwd: repoRoot },
    );
    const value = stdout.trim();
    return value || undefined;
  } catch (error) {
    if (!warnedGitLastmodFailure) {
      warnedGitLastmodFailure = true;
      console.warn(
        `[docs-hono] warning: failed to resolve git lastmod values; sitemap lastmod precision may be degraded (${error instanceof Error ? error.message : String(error)})`,
      );
    }
    return undefined;
  }
}

async function mapLimit<TInput, TOutput>(
  items: TInput[],
  limit: number,
  mapper: (item: TInput, index: number) => Promise<TOutput>,
): Promise<TOutput[]> {
  if (items.length === 0) {
    return [];
  }

  const results = new Array<TOutput>(items.length);
  let nextIndex = 0;
  const workerCount = Math.min(limit, items.length);

  const workers = Array.from({ length: workerCount }, async () => {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  });

  await Promise.all(workers);
  return results;
}

function renderUrlset(entries: SitemapEntry[]): string {
  const body = entries
    .map((entry) => {
      const lastmodLine = entry.lastmod
        ? `    <lastmod>${escapeXml(entry.lastmod)}</lastmod>\n`
        : "";

      return `  <url>
    <loc>${escapeXml(entry.loc)}</loc>
${lastmodLine}    <changefreq>${escapeXml(entry.changefreq)}</changefreq>
    <priority>${entry.priority.toFixed(1)}</priority>
  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
${stylePi}
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
}

function renderIndex(lastmod?: string): string {
  const lastmodLine = lastmod
    ? `    <lastmod>${escapeXml(lastmod)}</lastmod>\n`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
${stylePi}
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${escapeXml(`${siteOrigin}/sitemap-0.xml`)}</loc>
${lastmodLine}  </sitemap>
</sitemapindex>
`;
}

export async function writeSitemapFiles(params: {
  outputDir: string;
  pages: DocsPage[];
}): Promise<void> {
  const uniqueSourcePaths = [
    ...new Set(params.pages.map((page) => normalizeRepoPath(page.sourcePath))),
  ].filter(Boolean);

  const sourceLastmods = new Map<string, string>();
  const resolvedLastmods = await mapLimit(
    uniqueSourcePaths,
    gitLastmodConcurrency,
    async (sourcePath) =>
      [sourcePath, await resolveGitLastmod(sourcePath)] as const,
  );

  for (const [sourcePath, lastmod] of resolvedLastmods) {
    if (lastmod) {
      sourceLastmods.set(sourcePath, lastmod);
    }
  }

  const entries = params.pages
    .map((page) => {
      const url = new URL(page.route, `${siteOrigin}/`);
      const loc = url.toString();
      const pathname = url.pathname;
      const { changefreq, priority } = pathSitemapMeta(pathname);
      const lastmod = sourceLastmods.get(normalizeRepoPath(page.sourcePath));

      return {
        changefreq,
        lastmod,
        loc,
        priority,
      } satisfies SitemapEntry;
    })
    .sort((left, right) => left.loc.localeCompare(right.loc));

  const latestLastmod = entries.reduce<string | undefined>(
    (latest, entry) =>
      entry.lastmod && (!latest || entry.lastmod > latest)
        ? entry.lastmod
        : latest,
    undefined,
  );

  if (entries.length > 50_000) {
    console.warn(
      `[docs-hono] warning: sitemap has ${entries.length} URLs, exceeding the 50,000 URL per file limit; chunking should be implemented before the site grows further`,
    );
  }

  await mkdir(params.outputDir, { recursive: true });
  await writeFile(
    path.join(params.outputDir, "sitemap-0.xml"),
    renderUrlset(entries),
    "utf8",
  );
  await writeFile(
    path.join(params.outputDir, "sitemap-index.xml"),
    renderIndex(latestLastmod),
    "utf8",
  );
}
