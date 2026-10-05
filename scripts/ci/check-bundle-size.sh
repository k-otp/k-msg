#!/usr/bin/env bash
set -euo pipefail

# Bundle-size guard for publishable ESM artifacts.
# Threshold governance is documented in scripts/ci/README.md.

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT_DIR"

echo "Building ESM bundles for size guard..."
bun run --cwd packages/core build:esm
bun run --cwd packages/template build:esm
bun run --cwd packages/messaging build:esm
bun run --cwd packages/provider build:esm
bun run --cwd packages/k-msg build:esm

declare -a CHECKS=(
  "packages/core/dist/index.mjs|50000|16000"
  "packages/template/dist/send/index.mjs|15000|5000"
  "packages/template/dist/lifecycle/index.mjs|15000|5500"
  "packages/messaging/dist/index.mjs|30000|8000"
  "packages/messaging/dist/tracking/index.mjs|35000|9000"
  "packages/messaging/dist/sender/index.mjs|15000|5000"
  "packages/messaging/dist/queue/index.mjs|5000|2000"
  "packages/messaging/dist/adapters/bun/index.mjs|90000|25000"
  "packages/messaging/dist/adapters/node/index.mjs|45000|12000"
  "packages/messaging/dist/adapters/cloudflare/index.mjs|130000|35000"
  "packages/provider/dist/index.mjs|90000|25000"
  "packages/provider/dist/aligo/index.mjs|40000|10000"
  "packages/provider/dist/aligo/send.mjs|25000|8000"
  "packages/provider/dist/aligo/template.mjs|35000|9000"
  "packages/provider/dist/iwinv/index.mjs|50000|15000"
  "packages/provider/dist/iwinv/send.mjs|43000|13500"
  "packages/provider/dist/iwinv/template.mjs|42000|12000"
  "packages/provider/dist/solapi/index.mjs|30000|8000"
  "packages/k-msg/dist/index.mjs|5000|2000"
  "packages/k-msg/dist/core/index.mjs|1000|500"
)

FAILED=0

echo
echo "Bundle size limits (bytes)"
printf "%-58s %10s %10s %10s %10s %8s\n" "artifact" "raw" "raw limit" "gzip" "gzip limit" "result"
printf "%-58s %10s %10s %10s %10s %8s\n" "--------" "---" "---------" "----" "----------" "------"

for entry in "${CHECKS[@]}"; do
  IFS="|" read -r artifact raw_limit gzip_limit <<<"$entry"

  if [[ ! -f "$artifact" ]]; then
    echo "::error file=$artifact::bundle artifact is missing"
    printf "%-58s %10s %10s %10s %10s %8s\n" "$artifact" "missing" "$raw_limit" "missing" "$gzip_limit" "FAIL"
    FAILED=1
    continue
  fi

  raw_size="$(wc -c <"$artifact" | tr -d '[:space:]')"
  gzip_size="$(gzip -c "$artifact" | wc -c | tr -d '[:space:]')"
  result="OK"

  if (( raw_size > raw_limit )); then
    echo "::error file=$artifact::raw bundle size ${raw_size} exceeds limit ${raw_limit}"
    result="FAIL"
    FAILED=1
  fi

  if (( gzip_size > gzip_limit )); then
    echo "::error file=$artifact::gzip bundle size ${gzip_size} exceeds limit ${gzip_limit}"
    result="FAIL"
    FAILED=1
  fi

  printf "%-58s %10d %10d %10d %10d %8s\n" "$artifact" "$raw_size" "$raw_limit" "$gzip_size" "$gzip_limit" "$result"
done

# Runs in Bun, not through an external search tool: a missing tool must fail
# the guard, never skip it. Checks and semantics: scripts/ci/forbidden-imports.ts.
echo
if ! bun ./scripts/ci/forbidden-imports.ts; then
  FAILED=1
fi

if (( FAILED != 0 )); then
  echo
  echo "Bundle size guard failed."
  exit 1
fi

echo
echo "Bundle size guard passed."
