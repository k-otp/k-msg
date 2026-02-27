#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT_DIR"

PACKAGE_DIRS=(
  "packages/channel"
  "packages/core"
  "packages/provider"
  "packages/template"
  "packages/messaging"
  "packages/analytics"
  "packages/webhook"
  "packages/k-msg"
)

echo "Building workspace packages for npm pack smoke..."
bun run build:all

for dir in "${PACKAGE_DIRS[@]}"; do
  if [[ ! -d "$dir" ]]; then
    echo "::error::missing package directory: $dir"
    exit 1
  fi

  echo
  echo "Checking npm pack --dry-run: $dir"

  tmp_json="$(mktemp)"
  if ! (cd "$dir" && npm pack --dry-run --json >"$tmp_json"); then
    rm -f "$tmp_json"
    echo "::error::npm pack --dry-run failed for $dir"
    exit 1
  fi

  if ! node - "$dir" "$tmp_json" <<'NODE'
const fs = require("node:fs");

const dir = process.argv[2];
const jsonPath = process.argv[3];
const raw = fs.readFileSync(jsonPath, "utf8");
let data;
try {
  data = JSON.parse(raw);
} catch (error) {
  console.error(`Failed to parse npm pack JSON for ${dir}: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}

if (!Array.isArray(data) || data.length === 0) {
  console.error(`npm pack output is empty for ${dir}`);
  process.exit(1);
}

const files = Array.isArray(data[0]?.files)
  ? data[0].files.map((f) => f.path)
  : [];

const mustHave = ["package.json"];
for (const required of mustHave) {
  if (!files.includes(required)) {
    console.error(`Missing ${required} in npm pack output for ${dir}`);
    process.exit(1);
  }
}

if (!files.some((p) => p.startsWith("dist/"))) {
  console.error(`No dist/* artifacts in npm pack output for ${dir}`);
  process.exit(1);
}

if (files.some((p) => p.endsWith(".map"))) {
  console.error(`Sourcemap artifact(s) must not be published for ${dir}`);
  process.exit(1);
}

if (dir === "packages/k-msg") {
  const kmsgRequired = ["dist/index.mjs", "dist/core/index.mjs"];
  for (const required of kmsgRequired) {
    if (!files.includes(required)) {
      console.error(`Missing ${required} in npm pack output for ${dir}`);
      process.exit(1);
    }
  }
}
NODE
  then
    rm -f "$tmp_json"
    exit 1
  fi
  rm -f "$tmp_json"
done

echo
echo "npm pack smoke checks passed."
