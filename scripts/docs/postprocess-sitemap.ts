import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dir, "../..");
const distDir = path.join(repoRoot, "apps/docs/dist");
const stylePi = '<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>';

function isSitemapFile(name: string): boolean {
  return name === "sitemap-index.xml" || /^sitemap-\d+\.xml$/.test(name);
}

function injectStylesheet(xml: string): string {
  if (xml.includes("xml-stylesheet")) {
    return xml;
  }

  const xmlDecl = /^<\?xml[^>]*\?>/;
  if (xmlDecl.test(xml)) {
    return xml.replace(xmlDecl, (matched) => `${matched}\n${stylePi}`);
  }

  return `${stylePi}\n${xml}`;
}

function prettyPrint(xml: string): string {
  // Keep output deterministic but human-readable in browsers and source view.
  return xml.replace(/></g, ">\n<");
}

async function main(): Promise<void> {
  try {
    const dist = await stat(distDir);
    if (!dist.isDirectory()) {
      console.log(`skip: dist directory not found: ${distDir}`);
      return;
    }
  } catch {
    console.log(`skip: dist directory not found: ${distDir}`);
    return;
  }

  const names = (await readdir(distDir)).filter(isSitemapFile).sort();

  for (const name of names) {
    const filePath = path.join(distDir, name);
    const current = await readFile(filePath, "utf8");
    const next = prettyPrint(injectStylesheet(current));

    if (next !== current) {
      await writeFile(filePath, next, "utf8");
      console.log(`postprocessed: ${filePath}`);
    } else {
      console.log(`unchanged: ${filePath}`);
    }
  }
}

await main();
