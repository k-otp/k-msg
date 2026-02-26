import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type Semver = {
  major: number;
  minor: number;
  patch: number;
  prerelease: Array<number | string>;
};

function parseSemver(input: string): Semver {
  const match =
    /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/.exec(
      input.trim(),
    );
  if (!match) {
    throw new Error(`Invalid semver: '${input}'`);
  }

  const prerelease = (match[4] ?? "")
    .split(".")
    .filter((entry) => entry.length > 0)
    .map((entry) => (/^\d+$/.test(entry) ? Number(entry) : entry));

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease,
  };
}

function tryParseSemver(input: string): Semver | null {
  try {
    return parseSemver(input);
  } catch {
    return null;
  }
}

function compareParsedSemver(a: Semver, b: Semver): number {
  const va = a;
  const vb = b;
  if (va.major !== vb.major) return va.major - vb.major;
  if (va.minor !== vb.minor) return va.minor - vb.minor;
  if (va.patch !== vb.patch) return va.patch - vb.patch;

  const aPre = va.prerelease;
  const bPre = vb.prerelease;

  if (aPre.length === 0 && bPre.length === 0) return 0;
  if (aPre.length === 0) return 1;
  if (bPre.length === 0) return -1;

  const max = Math.max(aPre.length, bPre.length);
  for (let i = 0; i < max; i += 1) {
    const left = aPre[i];
    const right = bPre[i];
    if (left === undefined) return -1;
    if (right === undefined) return 1;

    if (typeof left === "number" && typeof right === "number") {
      if (left !== right) return left - right;
      continue;
    }

    if (typeof left === "number") return -1;
    if (typeof right === "number") return 1;

    const byLexical = left.localeCompare(right);
    if (byLexical !== 0) return byLexical;
  }

  return 0;
}

function compareVersionToken(a: string, b: string): number {
  const va = tryParseSemver(a);
  const vb = tryParseSemver(b);

  if (va && vb) return compareParsedSemver(va, vb);
  if (va) return -1;
  if (vb) return 1;
  return a.localeCompare(b);
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
    throw new Error(
      "Unable to find drizzle matrix in .github/workflows/ci.yml",
    );
  }
  return [...match[2].matchAll(/"([^"]+)"/g)]
    .map((item) => item[1])
    .sort(compareVersionToken);
}

function updateCiMatrix(ciContent: string, versions: string[]): string {
  const matrixText = versions.map((v) => `"${v}"`).join(", ");
  return ciContent.replace(/(drizzle:\s*\[)([^\]]*)(\])/, `$1${matrixText}$3`);
}

function replaceDrizzleReadmeMatrix(
  content: string,
  versions: string[],
): string {
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

async function writeIfChanged(
  filePath: string,
  next: string,
): Promise<boolean> {
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
    throw new Error(
      "Usage: bun run scripts/automation/update-drizzle-peer-compat.ts <latest-version>",
    );
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
    throw new Error(
      "packages/messaging/package.json is missing peerDependencies.drizzle-orm",
    );
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
    compareVersionToken,
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

  const changed =
    pkgChanged ||
    ciChanged ||
    readmeEnChanged ||
    readmeKoChanged ||
    changesetChanged;
  if (changed) {
    console.log(
      `Updated Drizzle compatibility to include ${latestPair} (${latest}).`,
    );
    return;
  }

  console.log("No files changed.");
}

await main();
