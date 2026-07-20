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
bun run check:package-artifacts

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

  if ! node ./scripts/ci/check-package-artifacts.mjs --pack-json "$dir" "$tmp_json"; then
    rm -f "$tmp_json"
    exit 1
  fi
  rm -f "$tmp_json"
done

echo
echo "npm pack smoke checks passed."
