import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
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

type GuideSummary = {
  en: string;
  ko: string;
};

const repoRoot = path.resolve(import.meta.dir, "../..");
const docsRoot = path.join(repoRoot, "apps/docs/src/content/docs");
const checkMode = process.argv.includes("--check");
const githubBlobBase = "https://github.com/k-otp/k-msg/blob/main";

function docsFsRoot(locale: Locale): string {
  if (locale === "ko") {
    return docsRoot;
  }
  return path.join(docsRoot, "en");
}

function docsUrlRoot(locale: Locale): string {
  if (locale === "ko") {
    return "";
  }
  return "/en";
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

function rewriteRelativeLinks(
  markdown: string,
  sourceRelativePath: string,
): string {
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
    const normalized = path.posix.normalize(
      path.posix.join(sourceDir, cleanHref),
    );
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
    .map(
      (pkg) =>
        `- [${pkg.packageName}](${urlRoot}/guides/packages/${pkg.dirName}/)`,
    )
    .join("\n");
  const exampleLinks = params.exampleDocs
    .map(
      (example) =>
        `- [${example.dirName}](${urlRoot}/guides/examples/${example.dirName}/)`,
    )
    .join("\n");

  const title = isKo ? "k-msg 문서" : "k-msg Docs";
  const description = isKo ? "k-msg 문서" : "k-msg docs";
  const navItems = isKo
    ? `- 개요: [${urlRoot}/guides/overview/](${urlRoot}/guides/overview/)
- 시작하기: [${urlRoot}/guides/getting-started/](${urlRoot}/guides/getting-started/)
- 패키지 선택: [${urlRoot}/guides/package-selection/](${urlRoot}/guides/package-selection/)
- Provider 선택: [${urlRoot}/guides/provider-selection/](${urlRoot}/guides/provider-selection/)
- 트러블슈팅: [${urlRoot}/guides/troubleshooting/](${urlRoot}/guides/troubleshooting/)
- API 문서: [${urlRoot}/api/readme/](${urlRoot}/api/readme/)
- CLI 문서: [${urlRoot}/cli/](${urlRoot}/cli/)
- 코드 스니펫: [${urlRoot}/snippets/](${urlRoot}/snippets/)`
    : `- Overview: [${urlRoot}/guides/overview/](${urlRoot}/guides/overview/)
- Getting Started: [${urlRoot}/guides/getting-started/](${urlRoot}/guides/getting-started/)
- Package Selection: [${urlRoot}/guides/package-selection/](${urlRoot}/guides/package-selection/)
- Provider Selection: [${urlRoot}/guides/provider-selection/](${urlRoot}/guides/provider-selection/)
- Troubleshooting: [${urlRoot}/guides/troubleshooting/](${urlRoot}/guides/troubleshooting/)
- API docs: [${urlRoot}/api/readme/](${urlRoot}/api/readme/)
- CLI docs: [${urlRoot}/cli/](${urlRoot}/cli/)
- Code snippets: [${urlRoot}/snippets/](${urlRoot}/snippets/)`;
  const packageHeading = isKo ? "## 패키지 가이드" : "## Package Guides";
  const exampleHeading = isKo ? "## 예제 가이드" : "## Example Guides";
  const startHereHeading = isKo ? "## 시작 경로" : "## Start Here";
  const startHere = isKo
    ? `- [시작하기](${urlRoot}/guides/getting-started/): Mock Provider로 가장 빠르게 첫 전송을 확인합니다.
- [패키지 선택 가이드](${urlRoot}/guides/package-selection/): 어떤 패키지를 설치해야 하는지 먼저 정리합니다.
- [Provider 선택 가이드](${urlRoot}/guides/provider-selection/): IWINV, SOLAPI, Aligo 선택 기준을 비교합니다.
- [사용 사례 가이드](${urlRoot}/guides/use-cases/): OTP, 주문 알림, 마케팅 메시지 구현 흐름을 바로 봅니다.`
    : `- [Getting Started](${urlRoot}/guides/getting-started/): send your first message quickly with the Mock Provider.
- [Package Selection](${urlRoot}/guides/package-selection/): choose the smallest package set before wiring your app.
- [Provider Selection](${urlRoot}/guides/provider-selection/): compare IWINV, SOLAPI, and Aligo by use case.
- [Use Cases](${urlRoot}/guides/use-cases/): jump straight to OTP, order notification, and marketing flows.`;
  const githubLabel = isKo ? "GitHub 저장소 보기" : "View on GitHub";
  const content = `---
title: ${title}
description: ${description}
---

import { LinkButton } from "@astrojs/starlight/components";

<LinkButton href="https://github.com/k-otp/k-msg" target="_blank" rel="noopener noreferrer">${githubLabel}</LinkButton>

${navItems}

${startHereHeading}

${startHere}

${packageHeading}

${packageLinks}

${exampleHeading}

${exampleLinks}
`;

  return {
    path: path.join(docsFsRoot(params.locale), "index.mdx"),
    content,
  };
}

const packageSummaries: Record<string, GuideSummary> = {
  "k-msg": {
    en: "Unified facade most apps should start with.",
    ko: "대부분의 앱이 먼저 시작해야 하는 통합 facade입니다.",
  },
  analytics: {
    en: "Reporting and aggregation on top of delivery tracking data.",
    ko: "배달 추적 데이터를 기반으로 통계와 리포트를 만듭니다.",
  },
  channel: {
    en: "Provider-aware channel lifecycle helpers and in-memory toolkit helpers.",
    ko: "프로바이더별 채널 lifecycle helper와 인메모리 toolkit helper를 제공합니다.",
  },
  core: {
    en: "Low-level types, Result, errors, and resilience primitives.",
    ko: "저수준 타입, Result, 에러, 복원력 유틸을 제공합니다.",
  },
  messaging: {
    en: "Routing, queueing, delivery tracking, and runtime adapters behind KMsg.",
    ko: "KMsg 뒤에서 라우팅, 큐, 배달 추적, 런타임 어댑터를 담당합니다.",
  },
  provider: {
    en: "Built-in provider implementations and onboarding metadata.",
    ko: "내장 provider 구현체와 onboarding 메타데이터를 제공합니다.",
  },
  template: {
    en: "Template parsing, interpolation, lifecycle, and toolkit utilities.",
    ko: "템플릿 파싱, 치환, lifecycle, toolkit 유틸을 제공합니다.",
  },
  webhook: {
    en: "Webhook runtime, persistence, retries, and Cloudflare adapters.",
    ko: "웹훅 runtime, persistence, 재시도, Cloudflare 어댑터를 제공합니다.",
  },
};

const exampleSummaries: Record<string, GuideSummary> = {
  "express-node-send-only": {
    en: "Minimal Node + Express send-only server.",
    ko: "가장 단순한 Node + Express send-only 서버 예제입니다.",
  },
  "hono-bun-send-only": {
    en: "Fast Bun + Hono send-only API.",
    ko: "Bun + Hono 기반의 빠른 send-only API 예제입니다.",
  },
  "hono-pages-send-only": {
    en: "Cloudflare Pages Functions send-only starter.",
    ko: "Cloudflare Pages Functions용 send-only 스타터입니다.",
  },
  "hono-pages-tracking-hyperdrive": {
    en: "Pages + Hyperdrive example with delivery tracking.",
    ko: "Pages + Hyperdrive 기반 delivery tracking 예제입니다.",
  },
  "hono-worker-queue-do": {
    en: "Workers + Durable Objects queue processing example.",
    ko: "Workers + Durable Objects 큐 처리 예제입니다.",
  },
  "hono-worker-tracking-d1": {
    en: "Workers + D1 delivery tracking example.",
    ko: "Workers + D1 delivery tracking 예제입니다.",
  },
  "hono-worker-webhook-d1": {
    en: "Workers + D1 webhook runtime example.",
    ko: "Workers + D1 웹훅 runtime 예제입니다.",
  },
};

function buildGuideIndex(params: {
  locale: Locale;
  section: "packages" | "examples";
  packageDocs: PackageDoc[];
  exampleDocs: ExampleDoc[];
}): OutputFile {
  const { locale, section, packageDocs, exampleDocs } = params;
  const isKo = locale === "ko";
  const urlRoot = docsUrlRoot(locale);
  const title =
    section === "packages"
      ? isKo
        ? "패키지 가이드"
        : "Package Guides"
      : isKo
        ? "예제 가이드"
        : "Example Guides";
  const description =
    section === "packages"
      ? isKo
        ? "프로젝트 성격에 따라 어떤 k-msg 패키지부터 읽고 설치할지 빠르게 고릅니다."
        : "Quickly choose the right k-msg package entry point for your project."
      : isKo
        ? "런타임과 목적에 따라 어떤 starter example부터 보는 게 맞는지 고릅니다."
        : "Choose the starter example that matches your runtime and delivery goal.";

  const intro =
    section === "packages"
      ? isKo
        ? `프로젝트에 맞는 패키지를 빠르게 고를 수 있도록 역할별로 정리한 허브입니다.

- 먼저 읽기: [패키지 선택 가이드](${urlRoot}/guides/package-selection/)
- 대부분의 사용자 시작점: [k-msg](${urlRoot}/guides/packages/k-msg/)
- 저수준 커스터마이징이 필요하면: [@k-msg/core](${urlRoot}/guides/packages/core/)`
        : `This hub helps you choose the right package entry point quickly.

- Read first: [Package Selection](${urlRoot}/guides/package-selection/)
- Default starting point for most users: [k-msg](${urlRoot}/guides/packages/k-msg/)
- Drop lower when you need custom wiring: [@k-msg/core](${urlRoot}/guides/packages/core/)`
      : isKo
        ? `런타임과 목적에 맞는 예제를 고를 수 있도록 정리한 허브입니다.

- 첫 send-only 검증: [express-node-send-only](${urlRoot}/guides/examples/express-node-send-only/)
- Cloudflare queue/tracking: [hono-worker-queue-do](${urlRoot}/guides/examples/hono-worker-queue-do/), [hono-worker-tracking-d1](${urlRoot}/guides/examples/hono-worker-tracking-d1/)
- Webhook runtime: [hono-worker-webhook-d1](${urlRoot}/guides/examples/hono-worker-webhook-d1/)`
        : `This hub helps you choose the right example by runtime and goal.

- First send-only check: [express-node-send-only](${urlRoot}/guides/examples/express-node-send-only/)
- Cloudflare queue/tracking: [hono-worker-queue-do](${urlRoot}/guides/examples/hono-worker-queue-do/), [hono-worker-tracking-d1](${urlRoot}/guides/examples/hono-worker-tracking-d1/)
- Webhook runtime: [hono-worker-webhook-d1](${urlRoot}/guides/examples/hono-worker-webhook-d1/)`;

  const list =
    section === "packages"
      ? packageDocs
          .map((pkg) => {
            const summary =
              packageSummaries[pkg.dirName]?.[locale] ??
              (isKo ? "패키지 문서를 확인하세요." : "See the package guide.");
            return `- [${pkg.packageName}](${urlRoot}/guides/packages/${pkg.dirName}/): ${summary}`;
          })
          .join("\n")
      : exampleDocs
          .map((example) => {
            const summary =
              exampleSummaries[example.dirName]?.[locale] ??
              (isKo ? "예제 문서를 확인하세요." : "See the example guide.");
            return `- [${example.dirName}](${urlRoot}/guides/examples/${example.dirName}/): ${summary}`;
          })
          .join("\n");
  const quickPicks =
    section === "packages"
      ? isKo
        ? `| 지금 필요한 것 | 먼저 볼 패키지 | 보통 같이 보는 것 |
| --- | --- | --- |
| 앱에서 바로 메시지를 보내고 싶음 | [k-msg](${urlRoot}/guides/packages/k-msg/) | [@k-msg/provider](${urlRoot}/guides/packages/provider/) |
| Provider를 직접 구현하거나 저수준 제어가 필요함 | [@k-msg/core](${urlRoot}/guides/packages/core/) | [@k-msg/provider](${urlRoot}/guides/packages/provider/), [@k-msg/messaging](${urlRoot}/guides/packages/messaging/) |
| 큐, 배달 추적, 런타임 어댑터가 필요함 | [@k-msg/messaging](${urlRoot}/guides/packages/messaging/) | [k-msg](${urlRoot}/guides/packages/k-msg/), [@k-msg/provider](${urlRoot}/guides/packages/provider/) |
| 템플릿 파싱과 변수 치환이 중심임 | [@k-msg/template](${urlRoot}/guides/packages/template/) | [k-msg](${urlRoot}/guides/packages/k-msg/) |
| 채널/발신번호 운영 도구를 만들고 싶음 | [@k-msg/channel](${urlRoot}/guides/packages/channel/) | [@k-msg/provider](${urlRoot}/guides/packages/provider/) |
| 웹훅 런타임과 재시도 흐름이 필요함 | [@k-msg/webhook](${urlRoot}/guides/packages/webhook/) | [@k-msg/messaging](${urlRoot}/guides/packages/messaging/) |
| 배달 추적 데이터를 리포트로 보고 싶음 | [@k-msg/analytics](${urlRoot}/guides/packages/analytics/) | [@k-msg/messaging](${urlRoot}/guides/packages/messaging/) |`
        : `| What you need now | Start with | Usually paired with |
| --- | --- | --- |
| Send messages from an application | [k-msg](${urlRoot}/guides/packages/k-msg/) | [@k-msg/provider](${urlRoot}/guides/packages/provider/) |
| Implement a custom provider or control low-level behavior | [@k-msg/core](${urlRoot}/guides/packages/core/) | [@k-msg/provider](${urlRoot}/guides/packages/provider/), [@k-msg/messaging](${urlRoot}/guides/packages/messaging/) |
| Queueing, delivery tracking, or runtime adapters | [@k-msg/messaging](${urlRoot}/guides/packages/messaging/) | [k-msg](${urlRoot}/guides/packages/k-msg/), [@k-msg/provider](${urlRoot}/guides/packages/provider/) |
| Heavy template parsing and interpolation | [@k-msg/template](${urlRoot}/guides/packages/template/) | [k-msg](${urlRoot}/guides/packages/k-msg/) |
| Channel or sender-number admin tooling | [@k-msg/channel](${urlRoot}/guides/packages/channel/) | [@k-msg/provider](${urlRoot}/guides/packages/provider/) |
| Webhook runtime and retry flows | [@k-msg/webhook](${urlRoot}/guides/packages/webhook/) | [@k-msg/messaging](${urlRoot}/guides/packages/messaging/) |
| Reporting on delivery tracking data | [@k-msg/analytics](${urlRoot}/guides/packages/analytics/) | [@k-msg/messaging](${urlRoot}/guides/packages/messaging/) |`
      : isKo
        ? `| 목표 | 추천 예제 | 이 예제를 먼저 보면 좋은 경우 |
| --- | --- | --- |
| 가장 빨리 send-only 검증 | [express-node-send-only](${urlRoot}/guides/examples/express-node-send-only/) | Node 서버에서 가장 단순한 성공 경로가 필요할 때 |
| Bun 기반의 가벼운 API 서버 | [hono-bun-send-only](${urlRoot}/guides/examples/hono-bun-send-only/) | Bun + Hono 조합으로 빠르게 시작할 때 |
| Pages Functions에 send-only 배포 | [hono-pages-send-only](${urlRoot}/guides/examples/hono-pages-send-only/) | Cloudflare Pages에 간단히 올릴 때 |
| Workers에서 큐 처리 | [hono-worker-queue-do](${urlRoot}/guides/examples/hono-worker-queue-do/) | Durable Objects 기반 비동기 처리 흐름이 필요할 때 |
| Workers + D1 배달 추적 | [hono-worker-tracking-d1](${urlRoot}/guides/examples/hono-worker-tracking-d1/) | Cloudflare에서 tracking 저장소까지 같이 보고 싶을 때 |
| Pages + Hyperdrive 추적 | [hono-pages-tracking-hyperdrive](${urlRoot}/guides/examples/hono-pages-tracking-hyperdrive/) | Pages 런타임에서 Hyperdrive를 붙일 때 |
| 웹훅 수신과 runtime 운영 | [hono-worker-webhook-d1](${urlRoot}/guides/examples/hono-worker-webhook-d1/) | 이벤트 수집, 재시도, persistence까지 보고 싶을 때 |`
        : `| Goal | Recommended example | Pick it first when |
| --- | --- | --- |
| Fastest send-only proof | [express-node-send-only](${urlRoot}/guides/examples/express-node-send-only/) | You want the shortest path on Node |
| Lightweight Bun API server | [hono-bun-send-only](${urlRoot}/guides/examples/hono-bun-send-only/) | You are building with Bun + Hono |
| Send-only deploy on Pages Functions | [hono-pages-send-only](${urlRoot}/guides/examples/hono-pages-send-only/) | You want the simplest Cloudflare Pages entry point |
| Queue processing on Workers | [hono-worker-queue-do](${urlRoot}/guides/examples/hono-worker-queue-do/) | You need Durable Objects-based async processing |
| Delivery tracking on Workers + D1 | [hono-worker-tracking-d1](${urlRoot}/guides/examples/hono-worker-tracking-d1/) | You want Cloudflare-native tracking storage |
| Delivery tracking on Pages + Hyperdrive | [hono-pages-tracking-hyperdrive](${urlRoot}/guides/examples/hono-pages-tracking-hyperdrive/) | You are staying on Pages but need Hyperdrive |
| Webhook ingestion and runtime operations | [hono-worker-webhook-d1](${urlRoot}/guides/examples/hono-worker-webhook-d1/) | You need event intake, retries, and persistence |`;
  const readingPath =
    section === "packages"
      ? isKo
        ? `- 대부분의 앱 팀: [패키지 선택 가이드](${urlRoot}/guides/package-selection/) -> [k-msg](${urlRoot}/guides/packages/k-msg/) -> [프로바이더 선택 가이드](${urlRoot}/guides/provider-selection/) -> [예제 가이드](${urlRoot}/guides/examples/)
- 플랫폼/인프라 팀: [@k-msg/core](${urlRoot}/guides/packages/core/) -> [@k-msg/messaging](${urlRoot}/guides/packages/messaging/) -> [@k-msg/provider](${urlRoot}/guides/packages/provider/)
- 운영/백오피스 도구 팀: [@k-msg/channel](${urlRoot}/guides/packages/channel/) -> [@k-msg/webhook](${urlRoot}/guides/packages/webhook/) -> [@k-msg/analytics](${urlRoot}/guides/packages/analytics/)`
        : `- Most application teams: [Package Selection](${urlRoot}/guides/package-selection/) -> [k-msg](${urlRoot}/guides/packages/k-msg/) -> [Provider Selection](${urlRoot}/guides/provider-selection/) -> [Examples](${urlRoot}/guides/examples/)
- Platform or infrastructure teams: [@k-msg/core](${urlRoot}/guides/packages/core/) -> [@k-msg/messaging](${urlRoot}/guides/packages/messaging/) -> [@k-msg/provider](${urlRoot}/guides/packages/provider/)
- Admin or operations tooling teams: [@k-msg/channel](${urlRoot}/guides/packages/channel/) -> [@k-msg/webhook](${urlRoot}/guides/packages/webhook/) -> [@k-msg/analytics](${urlRoot}/guides/packages/analytics/)`
      : isKo
        ? `- 처음 보는 사용자: [express-node-send-only](${urlRoot}/guides/examples/express-node-send-only/) 또는 [hono-bun-send-only](${urlRoot}/guides/examples/hono-bun-send-only/) 로 send-only 흐름을 먼저 확인
- Cloudflare 배포가 목표면: [hono-pages-send-only](${urlRoot}/guides/examples/hono-pages-send-only/) -> [hono-worker-queue-do](${urlRoot}/guides/examples/hono-worker-queue-do/) -> [hono-worker-tracking-d1](${urlRoot}/guides/examples/hono-worker-tracking-d1/)
- 웹훅 중심 시스템이면: [hono-worker-webhook-d1](${urlRoot}/guides/examples/hono-worker-webhook-d1/) 부터 보고 필요 시 [hono-worker-tracking-d1](${urlRoot}/guides/examples/hono-worker-tracking-d1/) 를 함께 참고`
        : `- New users: start with [express-node-send-only](${urlRoot}/guides/examples/express-node-send-only/) or [hono-bun-send-only](${urlRoot}/guides/examples/hono-bun-send-only/) to validate the send-only flow first
- Cloudflare-focused teams: [hono-pages-send-only](${urlRoot}/guides/examples/hono-pages-send-only/) -> [hono-worker-queue-do](${urlRoot}/guides/examples/hono-worker-queue-do/) -> [hono-worker-tracking-d1](${urlRoot}/guides/examples/hono-worker-tracking-d1/)
- Webhook-heavy systems: start with [hono-worker-webhook-d1](${urlRoot}/guides/examples/hono-worker-webhook-d1/) and pair it with [hono-worker-tracking-d1](${urlRoot}/guides/examples/hono-worker-tracking-d1/) when you also need delivery state`;
  const quickPicksHeading = isKo ? "빠른 선택" : "Quick picks";
  const readingPathHeading = isKo
    ? "추천 읽는 순서"
    : "Recommended reading path";
  const directoryHeading =
    section === "packages"
      ? isKo
        ? "패키지별 역할"
        : "Package directory"
      : isKo
        ? "예제별 역할"
        : "Example directory";

  const content = `---\ntitle: ${title}\ndescription: ${description}\n---\n\n${intro}\n\n## ${quickPicksHeading}\n\n${quickPicks}\n\n## ${readingPathHeading}\n\n${readingPath}\n\n## ${directoryHeading}\n\n${list}\n`;

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
    buildGuideIndex({
      locale: "en",
      section: "packages",
      packageDocs,
      exampleDocs,
    }),
    buildGuideIndex({
      locale: "ko",
      section: "packages",
      packageDocs,
      exampleDocs,
    }),
    buildGuideIndex({
      locale: "en",
      section: "examples",
      packageDocs,
      exampleDocs,
    }),
    buildGuideIndex({
      locale: "ko",
      section: "examples",
      packageDocs,
      exampleDocs,
    }),
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

  if (current === file.content) {
    console.log(`unchanged: ${file.path}`);
    return;
  }

  await mkdir(path.dirname(file.path), { recursive: true });
  await writeFile(file.path, file.content, "utf8");
  console.log(`generated: ${file.path}`);
}

async function removeLegacyKoLocaleDir(): Promise<void> {
  if (checkMode) return;
  await rm(path.join(docsRoot, "ko"), { recursive: true, force: true });
}

async function main(): Promise<void> {
  await removeLegacyKoLocaleDir();
  const outputs = await collectOutputs();
  for (const file of outputs) {
    await writeOrCheck(file);
  }
}

await main();
