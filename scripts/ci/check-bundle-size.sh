#!/usr/bin/env bash
set -euo pipefail

# Bundle-size guard for publishable ESM artifacts.
# Threshold governance is documented in scripts/ci/README.md.

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT_DIR"

echo "Building ESM bundles for size guard..."
bun run --cwd packages/core build:esm
bun run --cwd packages/messaging build:esm
bun run --cwd packages/provider build:esm
bun run --cwd packages/k-msg build:esm

declare -a CHECKS=(
  "packages/core/dist/index.mjs|50000"
  "packages/messaging/dist/index.mjs|30000"
  "packages/messaging/dist/tracking/index.mjs|35000"
  "packages/messaging/dist/sender/index.mjs|15000"
  "packages/messaging/dist/queue/index.mjs|5000"
  "packages/messaging/dist/adapters/bun/index.mjs|90000"
  "packages/messaging/dist/adapters/node/index.mjs|45000"
  "packages/messaging/dist/adapters/cloudflare/index.mjs|130000"
  "packages/provider/dist/index.mjs|90000"
  "packages/provider/dist/aligo/index.mjs|40000"
  "packages/provider/dist/iwinv/index.mjs|50000"
  "packages/provider/dist/solapi/index.mjs|30000"
  "packages/k-msg/dist/index.mjs|5000"
  "packages/k-msg/dist/core/index.mjs|1000"
)

FAILED=0

echo
echo "Bundle size limits (bytes)"
printf "%-58s %12s %12s %8s\n" "artifact" "size" "limit" "result"
printf "%-58s %12s %12s %8s\n" "--------" "----" "-----" "------"

for entry in "${CHECKS[@]}"; do
  IFS="|" read -r artifact limit <<<"$entry"

  if [[ ! -f "$artifact" ]]; then
    echo "::error file=$artifact::bundle artifact is missing"
    printf "%-58s %12s %12s %8s\n" "$artifact" "missing" "$limit" "FAIL"
    FAILED=1
    continue
  fi

  size="$(wc -c <"$artifact" | tr -d '[:space:]')"
  result="OK"

  if (( size > limit )); then
    echo "::error file=$artifact::bundle size ${size} exceeds limit ${limit}"
    result="FAIL"
    FAILED=1
  fi

  printf "%-58s %12d %12d %8s\n" "$artifact" "$size" "$limit" "$result"
done

if (( FAILED != 0 )); then
  echo
  echo "Bundle size guard failed."
  exit 1
fi

echo
echo "Bundle size guard passed."
