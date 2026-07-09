import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

type Frontmatter = {
  description?: string;
  title?: string;
};

const repoRoot = path.resolve(import.meta.dir, "../..");
const sourceContentRoot = path.join(repoRoot, "apps/docs/src/content/docs");
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
      const relative = toPosix(path.relative(sourceContentRoot, fullPath));
      if (relative === "api" || relative === "en/api") {
        continue;
      }
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

function stripCodeFences(markdown: string): string {
  let stripped = markdown.replace(/```[\s\S]*?```/g, "");
  stripped = stripped.replace(/~~~[\s\S]*?~~~/g, "");
  stripped = stripped.replace(/`[^`\n]+`/g, "");
  return stripped;
}

function assertFrameworkNeutralMarkdown(
  markdown: string,
  filePath: string,
): void {
  const trimmed = stripCodeFences(markdown).trim();
  const violations: string[] = [];

  if (/^import\s.+from\s+["'][^"']+["'];?/m.test(trimmed)) {
    violations.push("ES module import");
  }
  if (/^export\s/m.test(trimmed)) {
    violations.push("ES module export");
  }
  if (/<[A-Z][A-Za-z0-9]*[\s/>]/.test(trimmed)) {
    violations.push("JSX-style component tag");
  }
  if (/\?raw\b/.test(trimmed)) {
    violations.push("raw import hint");
  }

  if (violations.length > 0) {
    throw new Error(
      `Legacy MDX syntax is no longer supported in docs source (${violations.join(", ")}): ${filePath}`,
    );
  }
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
  assertFrameworkNeutralMarkdown(body, sourcePath);
  const trimmedBody = body.trim();

  const next = `${serializeFrontmatter({
    description: frontmatter.description,
    sourcePath: sourceRelativePath,
    title: frontmatter.title,
  })}${trimmedBody}\n`;

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
