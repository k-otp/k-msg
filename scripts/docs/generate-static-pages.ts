import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type OutputFile = {
  content: string;
  path: string;
};

const repoRoot = path.resolve(import.meta.dir, "../..");
const docsContentRoot = path.join(repoRoot, "apps/docs/src/content/docs");
const generatedRoot = path.join(repoRoot, "apps/docs/src/generated/cli");
const snippetsRoot = path.join(repoRoot, "apps/docs/snippets");
const checkMode = process.argv.includes("--check");
const installUrl = "https://k-otp.github.io/k-msg/cli/install.sh";
const defaultReleaseBaseUrl =
  "https://github.com/k-otp/k-msg/releases/download/cli-v<version>";
const localeRoots: Record<"en" | "ko", string> = {
  ko: docsContentRoot,
  en: path.join(docsContentRoot, "en"),
};

function docsLocaleRoot(locale: "en" | "ko"): string {
  const root = localeRoots[locale];
  if (!root) {
    throw new Error(`Unsupported locale: ${locale}`);
  }
  return root;
}

async function readUtf8(filePath: string): Promise<string> {
  return readFile(filePath, "utf8");
}

function cliPageContent(params: {
  helpMarkdown: string;
  locale: "en" | "ko";
  schemaMarkdown: string;
}): string {
  const title = "CLI Reference";
  const installerLabel =
    params.locale === "ko" ? "## 설치 (curl only)" : "## Install (curl only)";
  const envLabel =
    params.locale === "ko"
      ? "설치 스크립트 환경 변수:"
      : "Installer environment variables:";

  return `---
title: ${title}
---

${installerLabel}

\`\`\`bash
curl -fsSL ${installUrl} | bash
k-msg --help
\`\`\`

${envLabel}

- \`K_MSG_CLI_VERSION\`: override target version (default: latest Pages script version)
- \`K_MSG_CLI_INSTALL_DIR\`: target directory override (default: auto-detect active \`k-msg\` path when writable, otherwise \`~/.local/bin\`)
- \`K_MSG_CLI_BASE_URL\`: override release base URL (default: \`${defaultReleaseBaseUrl}\`)

${params.helpMarkdown.trim()}

${params.schemaMarkdown.trim()}
`;
}

function snippetsPageContent(params: {
  locale: "en" | "ko";
  quickStartSource: string;
}): string {
  const title = params.locale === "ko" ? "스니펫" : "Snippets";
  const intro =
    params.locale === "ko"
      ? "문서 예제는 `apps/docs/snippets`를 단일 원천으로 사용합니다."
      : "Documentation examples are sourced from `apps/docs/snippets`.";

  return `---
title: ${title}
---

${intro}

\`\`\`ts
${params.quickStartSource.trimEnd()}
\`\`\`
`;
}

async function buildOutputs(): Promise<OutputFile[]> {
  const [helpMarkdown, schemaMarkdown, quickStartSource] = await Promise.all([
    readUtf8(path.join(generatedRoot, "help.md")),
    readUtf8(path.join(generatedRoot, "schema.md")),
    readUtf8(path.join(snippetsRoot, "quick-start.ts")),
  ]);

  return [
    {
      content: cliPageContent({
        helpMarkdown,
        locale: "ko",
        schemaMarkdown,
      }),
      path: path.join(docsLocaleRoot("ko"), "cli.md"),
    },
    {
      content: cliPageContent({
        helpMarkdown,
        locale: "en",
        schemaMarkdown,
      }),
      path: path.join(docsLocaleRoot("en"), "cli.md"),
    },
    {
      content: snippetsPageContent({
        locale: "ko",
        quickStartSource,
      }),
      path: path.join(docsLocaleRoot("ko"), "snippets.md"),
    },
    {
      content: snippetsPageContent({
        locale: "en",
        quickStartSource,
      }),
      path: path.join(docsLocaleRoot("en"), "snippets.md"),
    },
  ];
}

async function main(): Promise<void> {
  const outputs = await buildOutputs();

  for (const output of outputs) {
    let current = "";
    try {
      current = await readUtf8(output.path);
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code !== "ENOENT"
      ) {
        throw error;
      }
      current = "";
    }

    if (checkMode) {
      if (current !== output.content) {
        console.error(`static docs page out of date: ${output.path}`);
        process.exit(1);
      }
      console.log(`ok: ${output.path}`);
      continue;
    }

    if (current === output.content) {
      console.log(`unchanged: ${output.path}`);
      continue;
    }

    await mkdir(path.dirname(output.path), { recursive: true });
    await writeFile(output.path, output.content, "utf8");
    console.log(`generated: ${output.path}`);
  }
}

try {
  await main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Failed to generate static docs pages: ${message}`);
  console.error(
    "Ensure prerequisite generators have run for CLI help, schema docs, and snippets source content.",
  );
  process.exit(1);
}
