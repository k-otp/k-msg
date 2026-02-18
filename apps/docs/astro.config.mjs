import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import starlight from "@astrojs/starlight";
import { execFile } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import starlightTypeDoc, { typeDocSidebarGroup } from "starlight-typedoc";
import typedocEntryPoints from "./typedoc.entrypoints.json";
import syncTypeDocLocales from "./plugins/sync-typedoc-locales.mjs";

const docsContentRoot = fileURLToPath(
  new URL("./src/content/docs", import.meta.url),
);
const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
const execFileAsync = promisify(execFile);
let docsSlugIndexPromise;
const lastmodCache = new Map();
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

async function resolveLastmod(urlString) {
  if (!docsSlugIndexPromise) {
    docsSlugIndexPromise = buildDocsSlugIndex();
  }

  const slugIndex = await docsSlugIndexPromise;
  const pathname = new URL(urlString).pathname;
  const slug = normalizeSlug(pathname);
  const sourcePath = slugIndex.get(slug);
  if (!sourcePath) return undefined;

  const cached = lastmodCache.get(sourcePath);
  if (cached) return cached;

  try {
    const markdown = await readFile(sourcePath, "utf8");
    const definedInPaths =
      extractDefinedInPaths(markdown).map(normalizeRepoPath);
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

    let latest;
    for (const candidate of sourceCandidates) {
      const gitLastmod = await resolveGitLastmod(candidate);
      if (gitLastmod && (!latest || gitLastmod > latest)) {
        latest = gitLastmod;
      }
    }

    if (!latest) return undefined;

    lastmodCache.set(sourcePath, latest);
    return latest;
  } catch {
    return undefined;
  }
}

export default defineConfig({
  site: "https://k-msg.and.guide",
  integrations: [
    starlight({
      title: "k-msg",
      description: "k-msg documentation",
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
        "cli",
        "snippets",
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
