import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type Locale = "en" | "ko";

type OutputFile = {
  path: string;
  content: string;
};

type PackageDoc = {
  dirName: string;
  packageName: string;
  enPath: string;
  koPath: string;
};

type ExampleDoc = {
  dirName: string;
  enPath: string;
  koPath: string;
};

const repoRoot = path.resolve(import.meta.dir, "../..");
const docsRoot = path.join(repoRoot, "apps/docs/src/content/docs");
const checkMode = process.argv.includes("--check");
const githubBlobBase = "https://github.com/k-otp/k-msg/blob/main";

function docsFsRoot(locale: Locale): string {
  return path.join(docsRoot, locale);
}

function docsUrlRoot(locale: Locale): string {
  return `/${locale}`;
}

function toPosix(value: string): string {
  return value.replaceAll(path.sep, "/");
}

function firstHeading(markdown: string): string | null {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim() ?? null;
}

function stripLeadingHeading(markdown: string): string {
  return markdown.replace(/^#\s+.+\n+/, "");
}

function stripCanonicalBanner(markdown: string): string {
  return markdown
    .replace(/^>\s*Canonical docs:\s*.+\n+/m, "")
    .replace(/^>\s*공식 문서:\s*.+\n+/m, "");
}

function rewriteRelativeLinks(markdown: string, sourceRelativePath: string): string {
  const sourceDir = path.posix.dirname(toPosix(sourceRelativePath));

  return markdown.replace(/\]\(([^)]+)\)/g, (match, rawHref: string) => {
    const href = rawHref.trim();

    if (
      href.startsWith("http://") ||
      href.startsWith("https://") ||
      href.startsWith("mailto:") ||
      href.startsWith("#") ||
      href.startsWith("/") ||
      href.startsWith("data:")
    ) {
      return match;
    }

    const cleanHref = href.split(" ")[0] ?? href;
    const normalized = path.posix.normalize(path.posix.join(sourceDir, cleanHref));
    const absolute = `${githubBlobBase}/${normalized}`;

    return match.replace(href, absolute);
  });
}

function buildFrontmatter(title: string, sourceRelativePath: string): string {
  const safeTitle = JSON.stringify(title);
  const safeDescription = JSON.stringify(
    `Generated from \`${toPosix(sourceRelativePath)}\``,
  );

  return [
    "---",
    `title: ${safeTitle}`,
    `description: ${safeDescription}`,
    "---",
    "",
  ].join("\n");
}

async function readMarkdown(relativePath: string): Promise<string> {
  return readFile(path.join(repoRoot, relativePath), "utf8");
}

async function buildGuidePage(params: {
  locale: Locale;
  title: string;
  sourceRelativePath: string;
  outputRelativePath: string;
  fallbackNote?: string;
}): Promise<OutputFile> {
  const raw = await readMarkdown(params.sourceRelativePath);
  const cleaned = rewriteRelativeLinks(
    stripLeadingHeading(stripCanonicalBanner(raw)).trimStart(),
    params.sourceRelativePath,
  );

  const note = params.fallbackNote ? `${params.fallbackNote}\n\n` : "";
  const body = `${buildFrontmatter(params.title, params.sourceRelativePath)}${note}${cleaned}\n`;

  return {
    path: path.join(docsFsRoot(params.locale), params.outputRelativePath),
    content: body,
  };
}

async function collectPackages(): Promise<PackageDoc[]> {
  const packagesDir = path.join(repoRoot, "packages");
  const entries = await readdir(packagesDir, { withFileTypes: true });
  const docs: PackageDoc[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const dirName = entry.name;
    const packageJsonPath = path.join(packagesDir, dirName, "package.json");

    let packageName = dirName;
    try {
      const packageJsonRaw = await readFile(packageJsonPath, "utf8");
      const parsed = JSON.parse(packageJsonRaw) as { name?: string };
      packageName = parsed.name ?? dirName;
    } catch {
      packageName = dirName;
    }

    const enPath = `packages/${dirName}/README.md`;
    const koPathCandidate = `packages/${dirName}/README_ko.md`;

    let koPath = koPathCandidate;
    try {
      await readMarkdown(koPathCandidate);
    } catch {
      koPath = enPath;
    }

    docs.push({ dirName, packageName, enPath, koPath });
  }

  return docs.sort((a, b) => a.packageName.localeCompare(b.packageName));
}

async function collectExamples(): Promise<ExampleDoc[]> {
  const examplesDir = path.join(repoRoot, "examples");
  const entries = await readdir(examplesDir, { withFileTypes: true });
  const docs: ExampleDoc[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const dirName = entry.name;
    const enPath = `examples/${dirName}/README.md`;

    try {
      await readMarkdown(enPath);
      docs.push({ dirName, enPath, koPath: enPath });
    } catch {
      // skip directories without README
    }
  }

  return docs.sort((a, b) => a.dirName.localeCompare(b.dirName));
}

function buildIndexPage(params: {
  locale: Locale;
  packageDocs: PackageDoc[];
  exampleDocs: ExampleDoc[];
}): OutputFile {
  const isKo = params.locale === "ko";
  const urlRoot = docsUrlRoot(params.locale);
  const packageLinks = params.packageDocs
    .map((pkg) => `- [${pkg.packageName}](${urlRoot}/guides/packages/${pkg.dirName}/)`)
    .join("\n");
  const exampleLinks = params.exampleDocs
    .map((example) => `- [${example.dirName}](${urlRoot}/guides/examples/${example.dirName}/)`)
    .join("\n");

  const content = isKo
    ? `---
title: k-msg 문서
description: k-msg 문서
---

- 개요: [/ko/guides/overview/](/ko/guides/overview/)
- API 문서: [/api/readme/](/api/readme/)
- CLI 문서: [/ko/cli/](/ko/cli/)
- 코드 스니펫: [/ko/snippets/](/ko/snippets/)

## 패키지 가이드

${packageLinks}

## 예제 가이드

${exampleLinks}
`
    : `---
title: k-msg Docs
description: k-msg docs
---

- Overview: [/en/guides/overview/](/en/guides/overview/)
- API docs: [/api/readme/](/api/readme/)
- CLI docs: [/en/cli/](/en/cli/)
- Code snippets: [/en/snippets/](/en/snippets/)

## Package Guides

${packageLinks}

## Example Guides

${exampleLinks}
`;

  return {
    path: path.join(docsFsRoot(params.locale), "index.md"),
    content,
  };
}

function buildGuideIndex(locale: Locale, section: "packages" | "examples"): OutputFile {
  const isKo = locale === "ko";
  const title = section === "packages" ? (isKo ? "패키지 가이드" : "Package Guides") : isKo ? "예제 가이드" : "Example Guides";

  const content = `---\ntitle: ${title}\n---\n\n${isKo ? "자동 생성 문서 목록입니다." : "Auto-generated documentation index."}\n`;

  return {
    path: path.join(docsFsRoot(locale), "guides", section, "index.md"),
    content,
  };
}

async function collectOutputs(): Promise<OutputFile[]> {
  const outputs: OutputFile[] = [];
  const packageDocs = await collectPackages();
  const exampleDocs = await collectExamples();

  outputs.push(
    buildIndexPage({ locale: "en", packageDocs, exampleDocs }),
    buildIndexPage({ locale: "ko", packageDocs, exampleDocs }),
    buildGuideIndex("en", "packages"),
    buildGuideIndex("ko", "packages"),
    buildGuideIndex("en", "examples"),
    buildGuideIndex("ko", "examples"),
  );

  outputs.push(
    await buildGuidePage({
      locale: "en",
      title: "Overview",
      sourceRelativePath: "README.md",
      outputRelativePath: "guides/overview.md",
    }),
    await buildGuidePage({
      locale: "ko",
      title: "개요",
      sourceRelativePath: "README_ko.md",
      outputRelativePath: "guides/overview.md",
    }),
  );

  for (const pkg of packageDocs) {
    outputs.push(
      await buildGuidePage({
        locale: "en",
        title: pkg.packageName,
        sourceRelativePath: pkg.enPath,
        outputRelativePath: `guides/packages/${pkg.dirName}.md`,
      }),
      await buildGuidePage({
        locale: "ko",
        title: pkg.packageName,
        sourceRelativePath: pkg.koPath,
        outputRelativePath: `guides/packages/${pkg.dirName}.md`,
        fallbackNote:
          pkg.koPath === pkg.enPath
            ? "> 이 페이지는 한국어 README가 없어 영문 README를 기반으로 자동 생성되었습니다."
            : undefined,
      }),
    );
  }

  for (const example of exampleDocs) {
    const enRaw = await readMarkdown(example.enPath);
    const enTitle = firstHeading(enRaw) ?? example.dirName;

    outputs.push(
      await buildGuidePage({
        locale: "en",
        title: enTitle,
        sourceRelativePath: example.enPath,
        outputRelativePath: `guides/examples/${example.dirName}.md`,
      }),
      await buildGuidePage({
        locale: "ko",
        title: `${example.dirName} (Example)`,
        sourceRelativePath: example.koPath,
        outputRelativePath: `guides/examples/${example.dirName}.md`,
        fallbackNote: "> 한국어 번역본이 없어 영문 예제 문서를 표시합니다.",
      }),
    );
  }

  return outputs;
}

async function writeOrCheck(file: OutputFile): Promise<void> {
  let current = "";
  try {
    current = await readFile(file.path, "utf8");
  } catch {
    current = "";
  }

  if (checkMode) {
    if (current !== file.content) {
      console.error(`generated guide out of date: ${file.path}`);
      process.exit(1);
    }
    console.log(`ok: ${file.path}`);
    return;
  }

  await mkdir(path.dirname(file.path), { recursive: true });
  await writeFile(file.path, file.content, "utf8");
  console.log(`generated: ${file.path}`);
}

async function main(): Promise<void> {
  const outputs = await collectOutputs();
  for (const file of outputs) {
    await writeOrCheck(file);
  }
}

await main();
