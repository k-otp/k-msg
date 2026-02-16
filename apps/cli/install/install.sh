#!/usr/bin/env bash
set -euo pipefail

CLI_NAME="k-msg"
CLI_ALIAS="kmsg"
DEFAULT_VERSION="__CLI_VERSION__"

fail() {
  echo "Error: $*" >&2
  exit 1
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    fail "required command not found: $1"
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

main() {
  require_cmd curl
  require_cmd tar

  local version target base_url asset checksums_url archive_path checksums_path
  local install_dir tmp_dir bin_path

  version="${K_MSG_CLI_VERSION:-$DEFAULT_VERSION}"
  target="$(detect_target)"
  install_dir="${K_MSG_CLI_INSTALL_DIR:-$HOME/.local/bin}"
  base_url="${K_MSG_CLI_BASE_URL:-https://github.com/k-otp/k-msg/releases/download/cli-v${version}}"

  asset="k-msg-cli-${version}-${target}.tar.gz"
  checksums_url="${base_url}/checksums.txt"

  tmp_dir="$(mktemp -d)"
  trap 'rm -rf "$tmp_dir"' EXIT

  archive_path="${tmp_dir}/${asset}"
  checksums_path="${tmp_dir}/checksums.txt"

  echo "Downloading ${asset}..."
  curl -fsSL "${base_url}/${asset}" -o "$archive_path"

  if curl -fsSL "$checksums_url" -o "$checksums_path"; then
    if command -v shasum >/dev/null 2>&1; then
      (cd "$tmp_dir" && shasum -a 256 -c --ignore-missing checksums.txt)
    elif command -v sha256sum >/dev/null 2>&1; then
      (cd "$tmp_dir" && sha256sum -c --ignore-missing checksums.txt)
    else
      echo "No checksum tool found (shasum/sha256sum); skipping verification."
    fi
  else
    echo "Could not fetch checksums.txt; continuing without checksum verification."
  fi

  tar -xzf "$archive_path" -C "$tmp_dir"

  bin_path="${tmp_dir}/${target}/${CLI_NAME}"
  if [[ ! -f "$bin_path" ]]; then
    fail "extracted binary not found: ${target}/${CLI_NAME}"
  fi

  mkdir -p "$install_dir"
  if command -v install >/dev/null 2>&1; then
    install -m 0755 "$bin_path" "${install_dir}/${CLI_NAME}"
  else
    cp "$bin_path" "${install_dir}/${CLI_NAME}"
    chmod 0755 "${install_dir}/${CLI_NAME}"
  fi

  if command -v ln >/dev/null 2>&1; then
    ln -sf "${install_dir}/${CLI_NAME}" "${install_dir}/${CLI_ALIAS}"
  fi

  echo
  echo "Installed ${CLI_NAME} ${version} to ${install_dir}/${CLI_NAME}"
  if [[ ":$PATH:" != *":${install_dir}:"* ]]; then
    echo "Add this directory to your PATH:"
    echo "  export PATH=\"${install_dir}:\$PATH\""
  fi
  echo "Run:"
  echo "  ${CLI_NAME} --help"
}

main "$@"
