import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { repoBranch, repoUrl } from "./site";
import { escapeHtml } from "./utils";

type Frontmatter = {
  description?: string;
  sourcePath?: string;
  title?: string;
};

export type DocsPage = {
  body: string;
  description?: string;
  route: string;
  sourcePath: string;
  title: string;
};

const repoRoot = path.resolve(import.meta.dir, "../../..");
const docsContentRoot = path.join(repoRoot, "apps/docs-hono/content/docs");

function toPosix(value: string): string {
  return value.replaceAll(path.sep, "/");
}

async function walkMarkdownFiles(
  dirPath: string,
  output: string[],
): Promise<void> {
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
}

function parseFrontmatter(markdown: string): {
  body: string;
  frontmatter: Frontmatter;
} {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n*/);
  if (!match) {
    return { body: markdown, frontmatter: {} };
  }

  const frontmatter: Frontmatter = {};
  for (const line of match[1].split("\n")) {
    const separator = line.indexOf(":");
    if (separator < 0) {
      continue;
    }

    const key = line.slice(0, separator).trim();
    const rawValue = line.slice(separator + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, "");

    if (key === "title") {
      frontmatter.title = value;
    }
    if (key === "description") {
      frontmatter.description = value;
    }
    if (key === "sourcePath") {
      frontmatter.sourcePath = value;
    }
  }

  return {
    body: markdown.slice(match[0].length),
    frontmatter,
  };
}

function routeFromFile(filePath: string): string {
  const relative = toPosix(path.relative(docsContentRoot, filePath));
  const withoutExt = relative.replace(/\.(md|mdx)$/i, "");
  const normalized = withoutExt
    .split("/")
    .map((segment) => (segment === "README" ? "readme" : segment))
    .join("/");

  if (normalized === "index") {
    return "/";
  }

  if (normalized.endsWith("/index")) {
    return `/${normalized.slice(0, -"/index".length)}/`;
  }

  return `/${normalized}/`;
}

function titleFromRoute(route: string): string {
  if (route === "/") {
    return "k-msg docs";
  }

  const segment = route.split("/").filter(Boolean).at(-1);

  return segment ? segment.replaceAll("-", " ") : "k-msg docs";
}

export async function loadDocsPages(): Promise<DocsPage[]> {
  const files: string[] = [];
  await walkMarkdownFiles(docsContentRoot, files);

  const pages = await Promise.all(
    files.sort().map(async (filePath) => {
      const generatedPath = toPosix(path.relative(repoRoot, filePath));
      const rawMarkdown = await readFile(filePath, "utf8");
      const { body, frontmatter } = parseFrontmatter(rawMarkdown);
      const route = routeFromFile(filePath);

      return {
        body: body.trim(),
        description: frontmatter.description,
        route,
        sourcePath: frontmatter.sourcePath ?? generatedPath,
        title: frontmatter.title ?? titleFromRoute(route),
      } satisfies DocsPage;
    }),
  );

  return pages;
}

export function sourceEditUrl(sourcePath: string): string {
  return `${repoUrl}/blob/${repoBranch}/${encodeURI(sourcePath)}`;
}

export function renderPreviewBanner(sourcePath: string): string {
  return `<p class="preview-note">This page is rendered by the Hono SSG docs app from <code>${escapeHtml(sourcePath)}</code>.</p>`;
}
