#!/usr/bin/env bash

set -euo pipefail

max_attempts="${1:-3}"
attempt=1
tmp_dir="$(mktemp -d)"

cleanup() {
  rm -rf "$tmp_dir"
}
trap cleanup EXIT

is_deterministic_failure() {
  local log_file="$1"
  grep -Eq 'generated guide out of date:' "$log_file"
}

while true; do
  echo "[docs-check] attempt ${attempt}/${max_attempts}"

  attempt_log="${tmp_dir}/attempt-${attempt}.log"
  set +e
  bun run docs:check 2>&1 | tee "$attempt_log"
  cmd_exit="${PIPESTATUS[0]}"
  set -e

  if [[ "$cmd_exit" -eq 0 ]]; then
    echo "[docs-check] success"
    exit 0
  fi

  if is_deterministic_failure "$attempt_log"; then
    echo "[docs-check] deterministic failure detected (generated docs mismatch); not retrying"
    exit "$cmd_exit"
  fi

  if [[ "$attempt" -ge "$max_attempts" ]]; then
    echo "[docs-check] failed after ${attempt} attempts"
    exit "$cmd_exit"
  fi

  sleep_seconds=$((attempt * 10))
  echo "[docs-check] retrying in ${sleep_seconds}s"
  sleep "${sleep_seconds}"
  attempt=$((attempt + 1))
done
