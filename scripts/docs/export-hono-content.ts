import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

type Frontmatter = {
  description?: string;
  title?: string;
};

const repoRoot = path.resolve(import.meta.dir, "../..");
const docsAppRoot = path.join(repoRoot, "apps/docs");
const sourceContentRoot = path.join(docsAppRoot, "src/content/docs");
const outputContentRoot = path.join(repoRoot, "apps/docs-hono/content/docs");

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
  for (const line of match[1].split(/\r?\n/)) {
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

function serializeFrontmatter({
  description,
  sourcePath,
  title,
}: {
  description?: string;
  sourcePath: string;
  title?: string;
}): string {
  const lines = ["---"];

  if (title) {
    lines.push(`title: ${JSON.stringify(title)}`);
  }
  if (description) {
    lines.push(`description: ${JSON.stringify(description)}`);
  }

  lines.push(`sourcePath: ${JSON.stringify(sourcePath)}`);
  lines.push("---", "");

  return lines.join("\n");
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

function replaceLinkButtons(markdown: string): string {
  return markdown.replace(
    /<LinkButton\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/LinkButton>/g,
    (_, href: string, label: string) => `[${label.trim()}](${href})`,
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

function replaceRawCodeBlocks(
  markdown: string,
  rawImports: Map<string, string>,
): string {
  return markdown.replace(
    /<Code\s+code=\{([A-Za-z0-9_]+)\}\s+lang="([^"]+)"\s*\/>/g,
    (match, name: string, lang: string) => {
      const content = rawImports.get(name);
      if (!content) {
        return match;
      }

      return `\n\`\`\`${lang}\n${content.trimEnd()}\n\`\`\`\n`;
    },
  );
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

async function preprocessMarkdown(
  markdown: string,
  filePath: string,
): Promise<string> {
  const imports = extractDefaultImports(markdown);
  const markdownImports = new Map<string, string>();
  const rawImports = new Map<string, string>();

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

      rawImports.set(imported.name, content);
    }
  }

  let next = stripTopLevelImports(markdown);
  next = replaceLinkButtons(next);
  next = replaceMarkdownImports(next, markdownImports);
  next = replaceRawCodeBlocks(next, rawImports);
  return next.trim();
}

function exportPathFromSource(sourcePath: string): string {
  const relative = path.relative(sourceContentRoot, sourcePath);
  const normalized = relative.replace(/\.(md|mdx)$/i, ".md");
  return path.join(outputContentRoot, normalized);
}

async function exportFile(sourcePath: string): Promise<void> {
  const sourceRelativePath = toPosix(path.relative(repoRoot, sourcePath));
  const raw = await readFile(sourcePath, "utf8");
  const { body, frontmatter } = parseFrontmatter(raw);
  const processed = await preprocessMarkdown(body, sourcePath);

  const next = `${serializeFrontmatter({
    description: frontmatter.description,
    sourcePath: sourceRelativePath,
    title: frontmatter.title,
  })}${processed}\n`;

  const targetPath = exportPathFromSource(sourcePath);
  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(targetPath, next, "utf8");
}

async function main(): Promise<void> {
  const files: string[] = [];
  await walkMarkdownFiles(sourceContentRoot, files);

  await rm(outputContentRoot, { force: true, recursive: true });
  await Promise.all(files.sort().map((filePath) => exportFile(filePath)));

  console.log(
    `exported hono docs content: ${path.relative(repoRoot, outputContentRoot)}`,
  );
}

await main();
