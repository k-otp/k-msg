import { readFile } from "node:fs/promises";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dir, "../..");
const sitemapPath = path.join(repoRoot, "apps/docs/dist/sitemap-0.xml");
const minApiEntries = 20;

function extractTagValue(block: string, tag: string): string | undefined {
  const match = block.match(new RegExp(`<${tag}>([^<]+)</${tag}>`));
  return match?.[1]?.trim();
}

async function main(): Promise<void> {
  let xml: string;
  try {
    xml = await readFile(sitemapPath, "utf8");
  } catch {
    console.warn(
      `warn: sitemap file not found, skipping check: ${sitemapPath}`,
    );
    return;
  }

  const apiLastmods: string[] = [];
  const urlBlocks = xml.matchAll(/<url>([\s\S]*?)<\/url>/g);

  for (const match of urlBlocks) {
    const block = match[1];
    if (!block) continue;

    const loc = extractTagValue(block, "loc");
    if (!loc?.includes("/api/")) continue;

    const lastmod = extractTagValue(block, "lastmod");
    if (lastmod) {
      apiLastmods.push(lastmod);
    }
  }

  if (apiLastmods.length < minApiEntries) {
    console.warn(
      `warn: sitemap has only ${apiLastmods.length} /api/ URLs (< ${minApiEntries}), skipping diversity check`,
    );
    return;
  }

  const uniqueLastmods = new Set(apiLastmods);
  if (uniqueLastmods.size <= 1) {
    console.error(
      `sitemap /api/ lastmod values lack diversity: ${apiLastmods.length} entries, ${uniqueLastmods.size} unique value`,
    );
    process.exit(1);
  }

  console.log(
    `ok: sitemap /api/ lastmod diversity passed (${apiLastmods.length} entries, ${uniqueLastmods.size} unique values)`,
  );
}

await main();
