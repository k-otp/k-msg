#!/usr/bin/env bash

set -euo pipefail

max_attempts="${1:-3}"
attempt=1

while true; do
  echo "[docs-check] attempt ${attempt}/${max_attempts}"

  if bun run docs:check; then
    echo "[docs-check] success"
    exit 0
  fi

  if [[ "$attempt" -ge "$max_attempts" ]]; then
    echo "[docs-check] failed after ${attempt} attempts"
    exit 1
  fi

  sleep_seconds=$((attempt * 10))
  echo "[docs-check] retrying in ${sleep_seconds}s"
  sleep "${sleep_seconds}"
  attempt=$((attempt + 1))
done
