import { execFile } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import sitemap from "@astrojs/sitemap";
import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";
import starlightTypeDoc, { typeDocSidebarGroup } from "starlight-typedoc";
import syncTypeDocLocales from "./plugins/sync-typedoc-locales.mjs";
import typedocEntryPoints from "./typedoc.entrypoints.json";

const docsContentRoot = fileURLToPath(
  new URL("./src/content/docs", import.meta.url),
);
const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
const execFileAsync = promisify(execFile);
const GIT_LASTMOD_CONCURRENCY = 16;
let docsSlugIndexPromise;
let docsSourceCandidatesPromise;
let sitemapLastmodIndexPromise;
const gitLastmodCache = new Map();

function toPosix(input) {
  return input.replaceAll(path.sep, "/");
}

function normalizeSlug(slug) {
  return slug.replace(/^\/+|\/+$/g, "").toLowerCase();
}

function fileToSlug(filePath) {
  const relative = toPosix(path.relative(docsContentRoot, filePath));
  const noExt = relative.replace(/\.(md|mdx)$/i, "");
  if (noExt === "index") return "";
  if (noExt.endsWith("/index"))
    return noExt.slice(0, -"/index".length).toLowerCase();
  return noExt.toLowerCase();
}

async function walkMarkdownFiles(dirPath, output) {
  let entries;
  try {
    entries = await readdir(dirPath, { withFileTypes: true });
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") {
      return;
    }
    throw error;
  }

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
}

async function buildDocsSlugIndex() {
  const files = [];
  await walkMarkdownFiles(docsContentRoot, files);

  const index = new Map();
  for (const filePath of files) {
    index.set(fileToSlug(filePath), filePath);
  }

  return index;
}

async function buildDocsSourceCandidatesIndex() {
  if (!docsSlugIndexPromise) {
    docsSlugIndexPromise = buildDocsSlugIndex();
  }

  const slugIndex = await docsSlugIndexPromise;
  const entries = [...slugIndex.entries()];

  const resolved = await Promise.all(
    entries.map(async ([slug, sourcePath]) => {
      try {
        const markdown = await readFile(sourcePath, "utf8");
        return [slug, extractSourceCandidates(markdown, sourcePath)];
      } catch {
        return [slug, [normalizeRepoPath(path.relative(repoRoot, sourcePath))]];
      }
    }),
  );

  return new Map(resolved);
}

function pathSitemapMeta(pathname) {
  if (pathname === "/" || pathname === "/en/") {
    return { changefreq: "daily", priority: 1.0 };
  }
  if (pathname.endsWith("/cli/") || pathname.endsWith("/snippets/")) {
    return { changefreq: "weekly", priority: 0.9 };
  }
  if (pathname.includes("/guides/")) {
    return { changefreq: "weekly", priority: 0.8 };
  }
  if (pathname.includes("/api/")) {
    return { changefreq: "weekly", priority: 0.7 };
  }
  return { changefreq: "weekly", priority: 0.7 };
}

function normalizeRepoPath(value) {
  return toPosix(value).replace(/^\/+|^\.\//g, "");
}

function extractDefinedInPaths(markdown) {
  const matches = markdown.matchAll(
    /Defined in:\s*\[[^\]]+\]\(https:\/\/github\.com\/k-otp\/k-msg\/blob\/main\/([^#)]+)(?:#[^)]+)?\)/g,
  );

  const paths = new Set();
  for (const match of matches) {
    if (match[1]) {
      paths.add(decodeURIComponent(match[1]));
    }
  }

  return [...paths];
}

function extractGeneratedSourcePath(markdown) {
  const match = markdown.match(/Generated from `([^`]+)`/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

function extractSourceCandidates(markdown, sourcePath) {
  const definedInPaths = extractDefinedInPaths(markdown).map(normalizeRepoPath);
  const generatedSourcePath = extractGeneratedSourcePath(markdown);
  const sourceCandidates = new Set(definedInPaths);

  if (generatedSourcePath) {
    sourceCandidates.add(normalizeRepoPath(generatedSourcePath));
  }

  if (sourceCandidates.size === 0) {
    sourceCandidates.add(
      normalizeRepoPath(path.relative(repoRoot, sourcePath)),
    );
  }

  return [...sourceCandidates];
}

async function mapLimit(items, limit, mapper) {
  if (items.length === 0) return [];

  const results = new Array(items.length);
  let index = 0;
  const workerCount = Math.min(limit, items.length);

  const workers = Array.from({ length: workerCount }, async () => {
    while (index < items.length) {
      const currentIndex = index;
      index += 1;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  });

  await Promise.all(workers);
  return results;
}

async function resolveGitLastmod(repoRelativePath) {
  const normalized = normalizeRepoPath(repoRelativePath);
  if (!normalized) return undefined;

  const cached = gitLastmodCache.get(normalized);
  if (cached) return cached;

  const task = (async () => {
    try {
      const { stdout } = await execFileAsync(
        "git",
        ["log", "-1", "--format=%cI", "--", normalized],
        { cwd: repoRoot },
      );

      const value = stdout.trim();
      if (!value) return undefined;
      return value;
    } catch {
      return undefined;
    }
  })();

  gitLastmodCache.set(normalized, task);
  return task;
}

async function buildSitemapLastmodIndex() {
  if (!docsSourceCandidatesPromise) {
    docsSourceCandidatesPromise = buildDocsSourceCandidatesIndex();
  }

  const sourceCandidatesIndex = await docsSourceCandidatesPromise;
  const sourceCandidates = new Set();

  for (const candidates of sourceCandidatesIndex.values()) {
    for (const candidate of candidates) {
      sourceCandidates.add(candidate);
    }
  }

  const sourceLastmods = new Map();
  const sourceCandidateList = [...sourceCandidates];

  const resolvedSourceLastmods = await mapLimit(
    sourceCandidateList,
    GIT_LASTMOD_CONCURRENCY,
    async (candidate) => [candidate, await resolveGitLastmod(candidate)],
  );

  for (const [candidate, lastmod] of resolvedSourceLastmods) {
    if (lastmod) {
      sourceLastmods.set(candidate, lastmod);
    }
  }

  const lastmodIndex = new Map();

  for (const [slug, candidates] of sourceCandidatesIndex.entries()) {
    let latest;
    for (const candidate of candidates) {
      const gitLastmod = sourceLastmods.get(candidate);
      if (gitLastmod && (!latest || gitLastmod > latest)) {
        latest = gitLastmod;
      }
    }

    if (latest) {
      lastmodIndex.set(slug, latest);
    }
  }

  return lastmodIndex;
}

async function resolveLastmod(urlString) {
  if (!sitemapLastmodIndexPromise) {
    sitemapLastmodIndexPromise = buildSitemapLastmodIndex();
  }

  const lastmodIndex = await sitemapLastmodIndexPromise;
  const pathname = new URL(urlString).pathname;
  const slug = normalizeSlug(pathname);
  return lastmodIndex.get(slug);
}

export default defineConfig({
  site: "https://k-msg.and.guide",
  integrations: [
    starlight({
      title: "k-msg",
      description: "k-msg documentation",
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/k-otp/k-msg",
        },
      ],
      locales: {
        root: {
          label: "한국어",
          lang: "ko",
        },
        en: {
          label: "English",
          lang: "en",
        },
      },
      defaultLocale: "root",
      components: {
        Head: "./src/components/Head.astro",
      },
      plugins: [
        starlightTypeDoc({
          entryPoints: typedocEntryPoints,
          tsconfig: "./typedoc.tsconfig.json",
          output: "api",
          sidebar: {
            label: "API",
          },
          typeDoc: {
            excludePrivate: true,
            excludeProtected: true,
            excludeInternal: true,
            gitRevision: "main",
            readme: "none",
          },
        }),
        syncTypeDocLocales({
          source: "api",
          locales: ["en"],
        }),
      ],
      sidebar: [
        "index",
        {
          label: "가이드",
          translations: {
            ko: "가이드",
            en: "Guides",
          },
          items: [
            "guides/overview",
            {
              label: "Packages",
              translations: {
                ko: "Packages",
                en: "Packages",
              },
              items: [
                "guides/packages",
                "guides/packages/k-msg",
                "guides/packages/analytics",
                "guides/packages/channel",
                "guides/packages/core",
                "guides/packages/messaging",
                "guides/packages/provider",
                "guides/packages/template",
                "guides/packages/webhook",
              ],
            },
            {
              label: "Examples",
              translations: {
                ko: "Examples",
                en: "Examples",
              },
              items: [
                "guides/examples",
                "guides/examples/express-node-send-only",
                "guides/examples/hono-bun-send-only",
                "guides/examples/hono-pages-send-only",
                "guides/examples/hono-pages-tracking-hyperdrive",
                "guides/examples/hono-worker-queue-do",
                "guides/examples/hono-worker-tracking-d1",
              ],
            },
          ],
        },
        "cli",
        "snippets",
        typeDocSidebarGroup,
      ],
    }),
    sitemap({
      i18n: {
        defaultLocale: "root",
        locales: {
          root: "ko",
          en: "en",
        },
      },
      xslURL: "/sitemap.xsl",
      lastmod: new Date(),
      serialize: async (item) => {
        const pathname = new URL(item.url).pathname;
        const { changefreq, priority } = pathSitemapMeta(pathname);
        const lastmod = await resolveLastmod(item.url);

        return {
          ...item,
          changefreq,
          priority,
          lastmod: lastmod ?? item.lastmod,
        };
      },
    }),
  ],
});
