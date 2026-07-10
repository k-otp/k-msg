import { access, readFile } from "node:fs/promises";
import path from "node:path";

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

  await Promise.all(
    requiredOutputs.map((relativePath) =>
      access(path.join(distRoot, relativePath)),
    ),
  );

  const pages = [
    { html: await readOutput("index.html"), lang: "ko", path: "index.html" },
    {
      html: await readOutput("en/index.html"),
      lang: "en",
      path: "en/index.html",
    },
  ];

  for (const page of pages) {
    assertIncludes(page.html, `<html lang="${page.lang}"`, page.path);
    assertIncludes(
      page.html,
      '<meta name="generator" content="Astro v',
      page.path,
    );
    assertIncludes(
      page.html,
      '<meta name="generator" content="Starlight v',
      page.path,
    );
    assertIncludes(page.html, 'hreflang="x-default"', page.path);
    assertIncludes(page.html, "vlennjsv6z", page.path);
    assertIncludes(
      page.html,
      "googletagmanager.com/gtag/js?id=G-2924TMM32H",
      page.path,
    );
    assertIncludes(page.html, 'gtag("config", "G-2924TMM32H")', page.path);
  }

  console.log(
    `ok: docs site shell contract passed (${pages.length} locales, ${requiredOutputs.length} required outputs)`,
  );
}

await main();
