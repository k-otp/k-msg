#!/usr/bin/env bash
set -euo pipefail

CLI_NAME="k-msg"
CLI_ALIAS="kmsg"
DEFAULT_VERSION="__CLI_VERSION__"
TMP_DIR=""

fail() {
  echo "Error: $*" >&2
  exit 1
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    fail "required command not found: $1"
  fi
}

resolve_active_command_path() {
  local resolved
  resolved="$(command -v "$CLI_NAME" 2>/dev/null || true)"
  if [[ -n "$resolved" && "$resolved" == /* ]]; then
    echo "$resolved"
    return 0
  fi
  return 1
}

is_dir_writable_for_install() {
  local dir
  dir="$1"
  [[ -d "$dir" && -w "$dir" ]]
}

resolve_install_dir() {
  if [[ -n "${K_MSG_CLI_INSTALL_DIR:-}" ]]; then
    echo "${K_MSG_CLI_INSTALL_DIR}"
    return
  fi

  # If k-msg already exists on PATH and we can write to that directory, update it in place.
  # This avoids version confusion when users previously installed via npm/bun/curl.
  local active_path active_dir
  active_path="$(resolve_active_command_path || true)"
  if [[ -n "$active_path" ]]; then
    active_dir="$(dirname "$active_path")"
    if is_dir_writable_for_install "$active_dir"; then
      echo "$active_dir"
      return
    fi
  fi

  echo "$HOME/.local/bin"
}

install_binary() {
  local source_path dest_path
  source_path="$1"
  dest_path="$2"

  mkdir -p "$(dirname "$dest_path")"
  if command -v install >/dev/null 2>&1; then
    install -m 0755 "$source_path" "$dest_path"
  else
    cp "$source_path" "$dest_path"
    chmod 0755 "$dest_path"
  fi
}

print_detected_commands() {
  local found
  found="$(type -a -p "$CLI_NAME" 2>/dev/null | awk '!seen[$0]++' || true)"
  if [[ -n "$found" ]]; then
    echo "Detected ${CLI_NAME} commands on PATH:"
    while IFS= read -r line; do
      [[ -n "$line" ]] || continue
      echo "  - $line"
    done <<<"$found"
  fi
}

detect_target() {
  local os arch
  os="$(uname -s | tr '[:upper:]' '[:lower:]')"
  arch="$(uname -m)"

  case "$os" in
    darwin) os="darwin" ;;
    linux) os="linux" ;;
    *)
      fail "unsupported OS: $os (supported: darwin, linux)"
      ;;
  esac

  case "$arch" in
    arm64 | aarch64) arch="arm64" ;;
    x86_64 | amd64) arch="x64" ;;
    *)
      fail "unsupported architecture: $arch (supported: arm64, x64)"
      ;;
  esac

  echo "${os}-${arch}"
}

cleanup() {
  if [[ -n "${TMP_DIR}" ]]; then
    rm -rf "$TMP_DIR"
  fi
}

main() {
  require_cmd curl
  require_cmd tar

  local version target base_url asset checksums_url archive_path checksums_path
  local install_dir bin_path install_path active_before active_after install_dir_explicit

  version="${K_MSG_CLI_VERSION:-$DEFAULT_VERSION}"
  target="$(detect_target)"
  install_dir_explicit="false"
  if [[ -n "${K_MSG_CLI_INSTALL_DIR:-}" ]]; then
    install_dir_explicit="true"
  fi
  active_before="$(resolve_active_command_path || true)"
  install_dir="$(resolve_install_dir)"
  base_url="${K_MSG_CLI_BASE_URL:-https://github.com/k-otp/k-msg/releases/download/cli-v${version}}"

  asset="k-msg-cli-${version}-${target}.tar.gz"
  checksums_url="${base_url}/checksums.txt"

  TMP_DIR="$(mktemp -d)"
  trap cleanup EXIT

  archive_path="${TMP_DIR}/${asset}"
  checksums_path="${TMP_DIR}/checksums.txt"

  echo "Downloading ${asset}..."
  curl -fsSL "${base_url}/${asset}" -o "$archive_path"

  if curl -fsSL "$checksums_url" -o "$checksums_path"; then
    if command -v shasum >/dev/null 2>&1; then
      (cd "$TMP_DIR" && shasum -a 256 -c --ignore-missing checksums.txt)
    elif command -v sha256sum >/dev/null 2>&1; then
      (cd "$TMP_DIR" && sha256sum -c --ignore-missing checksums.txt)
    else
      echo "No checksum tool found (shasum/sha256sum); skipping verification."
    fi
  else
    echo "Could not fetch checksums.txt; continuing without checksum verification."
  fi

  tar -xzf "$archive_path" -C "$TMP_DIR"

  bin_path="${TMP_DIR}/${target}/${CLI_NAME}"
  if [[ ! -f "$bin_path" ]]; then
    fail "extracted binary not found: ${target}/${CLI_NAME}"
  fi

  install_path="${install_dir}/${CLI_NAME}"
  install_binary "$bin_path" "$install_path"

  if command -v ln >/dev/null 2>&1; then
    ln -sf "$install_path" "${install_dir}/${CLI_ALIAS}"
  fi

  # If a different active k-msg path existed and is writable, update it too so
  # shells still pointing there immediately get the new version.
  if [[ "$install_dir_explicit" != "true" && -n "$active_before" && "$active_before" != "$install_path" ]]; then
    if is_dir_writable_for_install "$(dirname "$active_before")"; then
      install_binary "$bin_path" "$active_before"
    fi
  fi

  hash -r 2>/dev/null || true
  active_after="$(resolve_active_command_path || true)"

  echo
  echo "Installed ${CLI_NAME} ${version} to ${install_path}"
  if [[ -n "$active_after" ]]; then
    echo "Active command path: ${active_after}"
  fi
  print_detected_commands
  if [[ ":$PATH:" != *":${install_dir}:"* ]]; then
    echo "Add this directory to your PATH:"
    echo "  export PATH=\"${install_dir}:\$PATH\""
  fi
  if [[ -n "$active_after" && "$active_after" != "$install_path" ]]; then
    echo
    echo "Warning: active ${CLI_NAME} path is not the newly installed path."
    echo "Check PATH order or remove older installations above '${install_dir}'."
  fi
  echo "Run:"
  echo "  ${CLI_NAME} --help"
}

main "$@"
