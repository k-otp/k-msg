import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  type DeliveryTrackingColumnKey,
  getDeliveryTrackingSchemaSpec,
} from "../../packages/messaging/src/adapters/cloudflare/delivery-tracking-schema";

type Locale = "en" | "ko";

const checkMode = process.argv.includes("--check");
const repoRoot = path.resolve(import.meta.dir, "../..");
const startMarker = "<!-- tracking-schema-summary:start -->";
const endMarker = "<!-- tracking-schema-summary:end -->";

const spec = getDeliveryTrackingSchemaSpec();

function columnList(keys: readonly DeliveryTrackingColumnKey[]): string {
  return keys.map((key) => `\`${spec.columnMap[key]}\``).join(", ");
}

function renderBlock(locale: Locale): string {
  const primaryKey = `\`${spec.columnMap.messageId}\``;
  const coreColumns = columnList([
    "providerId",
    "providerMessageId",
    "type",
    "to",
    "from",
    "status",
  ]);
  const timeColumns = columnList([
    "requestedAt",
    "statusUpdatedAt",
    "nextCheckAt",
    "sentAt",
    "deliveredAt",
    "failedAt",
    "lastCheckedAt",
    "scheduledAt",
  ]);
  const metaColumns = columnList([
    "attemptCount",
    "providerStatusCode",
    "providerStatusMessage",
    "lastError",
    "metadata",
  ]);
  const dueIndex = `\`${spec.indexNames.due}(${spec.columnMap.status}, ${spec.columnMap.nextCheckAt})\``;
  const providerMessageIndex = `\`${spec.indexNames.providerMessage}(${spec.columnMap.providerId}, ${spec.columnMap.providerMessageId})\``;
  const requestedAtIndex = `\`${spec.indexNames.requestedAt}(${spec.columnMap.requestedAt})\``;

  if (locale === "ko") {
    return [
      `- Tracking 테이블 기본값: \`${spec.tableName}\` (\`tableName\`으로 override 가능)`,
      `- 기본 키: ${primaryKey}`,
      `- 주요 컬럼: ${coreColumns}`,
      `- 시간 컬럼: ${timeColumns}`,
      `- 부가 컬럼: ${metaColumns}`,
      "- `raw` 컬럼은 기본 비활성(`storeRaw: false`)이며, 필요 시 `storeRaw: true`로 활성화됩니다.",
      `- 인덱스: ${dueIndex}`,
      `- 인덱스: ${providerMessageIndex}`,
      `- 인덱스: ${requestedAtIndex}`,
    ].join("\n");
  }

  return [
    `- Tracking table default: \`${spec.tableName}\` (override with \`tableName\`)`,
    `- Primary key: ${primaryKey}`,
    `- Core columns: ${coreColumns}`,
    `- Time columns: ${timeColumns}`,
    `- Meta columns: ${metaColumns}`,
    "- `raw` column is disabled by default (`storeRaw: false`) and enabled only when `storeRaw: true` is set.",
    `- Index: ${dueIndex}`,
    `- Index: ${providerMessageIndex}`,
    `- Index: ${requestedAtIndex}`,
  ].join("\n");
}

function replaceMarkedBlock(content: string, block: string): string {
  const start = content.indexOf(startMarker);
  const end = content.indexOf(endMarker);

  if (start === -1 || end === -1 || end < start) {
    throw new Error("tracking schema markers not found");
  }

  const before = content.slice(0, start + startMarker.length);
  const after = content.slice(end);
  return `${before}\n${block}\n${after}`;
}

async function syncFile(
  relativePath: string,
  locale: Locale,
): Promise<boolean> {
  const filePath = path.join(repoRoot, relativePath);
  const current = await readFile(filePath, "utf8");
  const next = replaceMarkedBlock(current, renderBlock(locale));

  if (checkMode) {
    if (current !== next) {
      console.error(`tracking schema docs out of date: ${relativePath}`);
      return false;
    }
    console.log(`ok: ${relativePath}`);
    return true;
  }

  if (current === next) {
    console.log(`unchanged: ${relativePath}`);
    return true;
  }

  await writeFile(filePath, next, "utf8");
  console.log(`updated: ${relativePath}`);
  return true;
}

async function main(): Promise<void> {
  const allPassed = (
    await Promise.all([
      syncFile("packages/messaging/README.md", "en"),
      syncFile("packages/messaging/README_ko.md", "ko"),
    ])
  ).every(Boolean);

  if (!allPassed) {
    process.exit(1);
  }
}

await main();
