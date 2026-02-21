import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type Semver = {
  major: number;
  minor: number;
  patch: number;
};

function parseSemver(input: string): Semver {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(input.trim());
  if (!match) {
    throw new Error(`Invalid semver: '${input}'`);
  }
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

function compareSemver(a: string, b: string): number {
  const va = parseSemver(a);
  const vb = parseSemver(b);
  if (va.major !== vb.major) return va.major - vb.major;
  if (va.minor !== vb.minor) return va.minor - vb.minor;
  return va.patch - vb.patch;
}

function compareMajorMinor(a: string, b: string): number {
  const [aMajor, aMinor] = a.split(".").map(Number);
  const [bMajor, bMinor] = b.split(".").map(Number);
  if (aMajor !== bMajor) return aMajor - bMajor;
  return aMinor - bMinor;
}

function parsePeerMajorMinors(range: string): string[] {
  const out = new Set<string>();
  const matcher = /\^(\d+)\.(\d+)\.0/g;
  for (const match of range.matchAll(matcher)) {
    out.add(`${match[1]}.${match[2]}`);
  }
  return [...out].sort(compareMajorMinor);
}

function formatPeerRange(majorMinors: string[]): string {
  return majorMinors
    .sort(compareMajorMinor)
    .map((pair) => {
      const [major, minor] = pair.split(".");
      return `^${major}.${minor}.0`;
    })
    .join(" || ");
}

function parseMatrixVersions(ciContent: string): string[] {
  const match = /(drizzle:\s*\[)([^\]]*)(\])/.exec(ciContent);
  if (!match) {
    throw new Error("Unable to find drizzle matrix in .github/workflows/ci.yml");
  }
  return [...match[2].matchAll(/"([^"]+)"/g)]
    .map((item) => item[1])
    .sort(compareSemver);
}

function updateCiMatrix(ciContent: string, versions: string[]): string {
  const matrixText = versions.map((v) => `"${v}"`).join(", ");
  return ciContent.replace(
    /(drizzle:\s*\[)([^\]]*)(\])/,
    `$1${matrixText}$3`,
  );
}

function replaceDrizzleReadmeMatrix(content: string, versions: string[]): string {
  const start = "<!-- drizzle-compat-matrix:start -->";
  const end = "<!-- drizzle-compat-matrix:end -->";
  const startIndex = content.indexOf(start);
  const endIndex = content.indexOf(end);

  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    throw new Error("Unable to find drizzle matrix markers in README");
  }

  const before = content.slice(0, startIndex + start.length);
  const after = content.slice(endIndex);
  const block = `\n${versions.map((v) => `- \`drizzle-orm@${v}\``).join("\n")}\n`;

  return `${before}${block}${after}`;
}

function replaceReadmeSupportRow(
  content: string,
  messagingVersion: string,
  peerRange: string,
): string {
  const parsed = parseSemver(messagingVersion);
  const row = `| \`${parsed.major}.${parsed.minor}.x\` | \`${peerRange}\` |`;
  const rowPattern = /\| `\d+\.\d+\.x` \| `[^`]+` \|/;
  if (!rowPattern.test(content)) {
    throw new Error("Unable to find Drizzle support table row in README");
  }
  return content.replace(rowPattern, row);
}

async function writeIfChanged(filePath: string, next: string): Promise<boolean> {
  let prev = "";
  try {
    prev = await readFile(filePath, "utf8");
  } catch {
    // new file
  }
  if (prev === next) return false;
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, next, "utf8");
  return true;
}

async function main(): Promise<void> {
  const latestArg = process.argv[2];
  if (!latestArg) {
    throw new Error("Usage: bun run scripts/automation/update-drizzle-peer-compat.ts <latest-version>");
  }

  const latest = latestArg.trim();
  const latestSemver = parseSemver(latest);
  const latestPair = `${latestSemver.major}.${latestSemver.minor}`;

  const root = process.cwd();
  const messagingPkgPath = path.join(root, "packages/messaging/package.json");
  const ciPath = path.join(root, ".github/workflows/ci.yml");
  const readmeEnPath = path.join(root, "packages/messaging/README.md");
  const readmeKoPath = path.join(root, "packages/messaging/README_ko.md");
  const changesetPath = path.join(
    root,
    ".sampo/changesets/auto-drizzle-peer-compat.md",
  );

  const messagingPkg = JSON.parse(await readFile(messagingPkgPath, "utf8")) as {
    version: string;
    devDependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
  };

  const currentPeerRange = messagingPkg.peerDependencies?.["drizzle-orm"];
  if (typeof currentPeerRange !== "string" || currentPeerRange.length === 0) {
    throw new Error("packages/messaging/package.json is missing peerDependencies.drizzle-orm");
  }

  const majorMinors = parsePeerMajorMinors(currentPeerRange);
  if (majorMinors.length === 0) {
    throw new Error(`Unable to parse peer range '${currentPeerRange}'`);
  }

  if (majorMinors.includes(latestPair)) {
    console.log(
      `No update needed: drizzle-orm ${latest} is already covered by peer range '${currentPeerRange}'.`,
    );
    return;
  }

  const nextPairs = [...majorMinors, latestPair].sort(compareMajorMinor);
  const nextPeerRange = formatPeerRange(nextPairs);

  messagingPkg.peerDependencies = messagingPkg.peerDependencies ?? {};
  messagingPkg.devDependencies = messagingPkg.devDependencies ?? {};
  messagingPkg.peerDependencies["drizzle-orm"] = nextPeerRange;
  messagingPkg.devDependencies["drizzle-orm"] = latest;

  const pkgChanged = await writeIfChanged(
    messagingPkgPath,
    `${JSON.stringify(messagingPkg, null, 2)}\n`,
  );

  const ciContent = await readFile(ciPath, "utf8");
  const matrixVersions = parseMatrixVersions(ciContent);
  const nextMatrixVersions = [...new Set([...matrixVersions, latest])].sort(
    compareSemver,
  );
  const ciChanged = await writeIfChanged(
    ciPath,
    updateCiMatrix(ciContent, nextMatrixVersions),
  );

  const readmeEn = await readFile(readmeEnPath, "utf8");
  const readmeEnChanged = await writeIfChanged(
    readmeEnPath,
    replaceDrizzleReadmeMatrix(
      replaceReadmeSupportRow(readmeEn, messagingPkg.version, nextPeerRange),
      nextMatrixVersions,
    ),
  );

  const readmeKo = await readFile(readmeKoPath, "utf8");
  const readmeKoChanged = await writeIfChanged(
    readmeKoPath,
    replaceDrizzleReadmeMatrix(
      replaceReadmeSupportRow(readmeKo, messagingPkg.version, nextPeerRange),
      nextMatrixVersions,
    ),
  );

  const changeset = `---
npm/@k-msg/messaging: patch
---

Automated Drizzle compatibility update for \`@k-msg/messaging\`.

- Extend peer support to \`${nextPeerRange}\`
- Update messaging dev baseline to \`drizzle-orm@${latest}\`
- Refresh CI drizzle compatibility matrix to: ${nextMatrixVersions
    .map((v) => `\`${v}\``)
    .join(", ")}
`;
  const changesetChanged = await writeIfChanged(changesetPath, changeset);

  const changed = pkgChanged || ciChanged || readmeEnChanged || readmeKoChanged || changesetChanged;
  if (changed) {
    console.log(`Updated Drizzle compatibility to include ${latestPair} (${latest}).`);
    return;
  }

  console.log("No files changed.");
}

await main();
