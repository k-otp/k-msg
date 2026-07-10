import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { docsAnalytics } from "../../apps/docs/src/config/analytics";

const repositoryRoot = path.resolve(import.meta.dir, "../..");
const distRoot = path.join(repositoryRoot, "apps/docs/dist");

async function readOutput(relativePath: string): Promise<string> {
  return readFile(path.join(distRoot, relativePath), "utf8");
}

function assertIncludes(
  source: string,
  expected: string,
  outputPath: string,
): void {
  if (!source.includes(expected)) {
    throw new Error(`${outputPath} is missing expected output: ${expected}`);
  }
}

async function main(): Promise<void> {
  const requiredOutputs = [
    "api/readme/index.html",
    "en/api/readme/index.html",
    "favicon.svg",
    "pagefind/pagefind.js",
  ];

  const outputChecks = await Promise.allSettled(
    requiredOutputs.map((relativePath) =>
      access(path.join(distRoot, relativePath)),
    ),
  );
  const missingOutputs = outputChecks.flatMap((result, index) => {
    if (result.status === "fulfilled") return [];
    const relativePath = requiredOutputs[index];
    return relativePath ? [relativePath] : [];
  });

  if (missingOutputs.length > 0) {
    throw new Error(
      `Docs site shell contract is missing required build outputs:\n${missingOutputs.map((output) => `- ${output}`).join("\n")}`,
    );
  }

  const pages = [
    {
      html: await readOutput("index.html"),
      lang: "ko",
      outputPath: "index.html",
    },
    {
      html: await readOutput("en/index.html"),
      lang: "en",
      outputPath: "en/index.html",
    },
  ];

  for (const page of pages) {
    assertIncludes(page.html, `<html lang="${page.lang}"`, page.outputPath);
    assertIncludes(
      page.html,
      '<meta name="generator" content="Astro v',
      page.outputPath,
    );
    assertIncludes(
      page.html,
      '<meta name="generator" content="Starlight v',
      page.outputPath,
    );
    assertIncludes(page.html, 'hreflang="x-default"', page.outputPath);
    assertIncludes(page.html, docsAnalytics.clarityProjectId, page.outputPath);
    assertIncludes(
      page.html,
      `googletagmanager.com/gtag/js?id=${docsAnalytics.googleAnalyticsMeasurementId}`,
      page.outputPath,
    );
    assertIncludes(
      page.html,
      'gtag("config", googleAnalyticsMeasurementId)',
      page.outputPath,
    );
  }

  console.log(
    `ok: docs site shell contract passed (${pages.length} locales, ${requiredOutputs.length} required outputs)`,
  );
}

await main();
