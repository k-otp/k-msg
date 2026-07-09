import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { escapeHtml } from "./utils";

type Frontmatter = {
  description?: string;
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
const docsAppRoot = path.join(repoRoot, "apps/docs");
const docsContentRoot = path.join(repoRoot, "apps/docs/src/content/docs");
const repoUrl = (
  process.env.DOCS_REPO_URL ?? "https://github.com/k-otp/k-msg"
).replace(/\/+$/, "");
const repoBranch = encodeURIComponent(process.env.DOCS_REPO_BRANCH ?? "main");

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
  }

  return {
    body: markdown.slice(match[0].length),
    frontmatter,
  };
}

function extractDefaultImports(
  markdown: string,
): Array<{ name: string; source: string }> {
  const matches = markdown.matchAll(
    /^import\s+([A-Za-z0-9_]+)\s+from\s+["']([^"']+)["'];?\s*$/gm,
  );
  return [...matches].map((match) => ({
    name: match[1] ?? "",
    source: match[2] ?? "",
  }));
}

function stripTopLevelImports(markdown: string): string {
  return markdown.replace(/^import\s.+$/gm, "").trimStart();
}

function assertReadableImportPath(
  resolvedPath: string,
  importedSource: string,
  filePath: string,
): void {
  const normalized = path.resolve(resolvedPath);
  if (!normalized.startsWith(docsAppRoot)) {
    throw new Error(
      `Import "${importedSource}" in ${filePath} resolves outside the docs app root`,
    );
  }
}

function replaceLinkButtons(markdown: string): string {
  return markdown.replace(
    /<LinkButton\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/LinkButton>/g,
    (_, href: string, label: string) => `[${label.trim()}](${href})`,
  );
}

function replaceRawCodeBlocks(
  markdown: string,
  rawImports: Map<string, { content: string; source: string }>,
): string {
  return markdown.replace(
    /<Code\s+code=\{([A-Za-z0-9_]+)\}\s+lang="([^"]+)"\s*\/>/g,
    (match, name: string, lang: string) => {
      const rawImport = rawImports.get(name);
      if (!rawImport) {
        return match;
      }

      return `\n\`\`\`${lang}\n${rawImport.content.trimEnd()}\n\`\`\`\n`;
    },
  );
}

function replaceMarkdownImports(
  markdown: string,
  markdownImports: Map<string, string>,
): string {
  let next = markdown;

  for (const [name, importedMarkdown] of markdownImports.entries()) {
    const selfClosing = new RegExp(`<${name}\\s*/>`, "g");
    const wrapped = new RegExp(`<${name}>[\\s\\S]*?</${name}>`, "g");
    next = next.replace(selfClosing, importedMarkdown);
    next = next.replace(wrapped, importedMarkdown);
  }

  return next;
}

async function preprocessMarkdown(
  markdown: string,
  filePath: string,
): Promise<string> {
  const imports = extractDefaultImports(markdown);
  const markdownImports = new Map<string, string>();
  const rawImports = new Map<string, { content: string; source: string }>();

  for (const imported of imports) {
    if (imported.source.endsWith(".md")) {
      const resolvedPath = path.join(path.dirname(filePath), imported.source);
      assertReadableImportPath(resolvedPath, imported.source, filePath);
      let importedMarkdown: string;
      try {
        importedMarkdown = await readFile(resolvedPath, "utf8");
      } catch (error) {
        throw new Error(
          `Failed to read markdown import "${imported.source}" referenced in ${filePath}: ${String(error)}`,
        );
      }
      const { body } = parseFrontmatter(importedMarkdown);
      markdownImports.set(imported.name, body.trim());
      continue;
    }

    if (imported.source.endsWith("?raw")) {
      const rawSource = imported.source.replace(/\?raw$/, "");
      const resolvedPath = path.join(path.dirname(filePath), rawSource);
      assertReadableImportPath(resolvedPath, imported.source, filePath);
      let content: string;
      try {
        content = await readFile(resolvedPath, "utf8");
      } catch (error) {
        throw new Error(
          `Failed to read raw import "${imported.source}" referenced in ${filePath}: ${String(error)}`,
        );
      }
      rawImports.set(imported.name, {
        content,
        source: resolvedPath,
      });
    }
  }

  let next = stripTopLevelImports(markdown);
  next = replaceLinkButtons(next);
  next = replaceMarkdownImports(next, markdownImports);
  next = replaceRawCodeBlocks(next, rawImports);
  return next;
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
      const sourcePath = toPosix(path.relative(repoRoot, filePath));
      const rawMarkdown = await readFile(filePath, "utf8");
      const { body, frontmatter } = parseFrontmatter(rawMarkdown);
      const processedBody = await preprocessMarkdown(body, filePath);
      const route = routeFromFile(filePath);

      return {
        body: processedBody.trim(),
        description: frontmatter.description,
        route,
        sourcePath,
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
  return `<p class="preview-note">This page is rendered by the parallel Hono SSG docs app from <code>${escapeHtml(sourcePath)}</code>.</p>`;
}
