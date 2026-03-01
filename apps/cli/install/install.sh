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

is_symlink_path() {
  local file_path
  file_path="$1"
  [[ -L "$file_path" ]]
}

is_script_file() {
  local file_path
  file_path="$1"
  if [[ ! -f "$file_path" ]]; then
    return 1
  fi

  local sig
  sig="$(LC_ALL=C head -c 2 "$file_path" 2>/dev/null || true)"
  [[ "$sig" == "#!" ]]
}

is_safe_existing_binary_path() {
  local file_path
  file_path="$1"
  [[ -f "$file_path" ]] || return 1
  is_symlink_path "$file_path" && return 1
  is_script_file "$file_path" && return 1
  return 0
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

  # If k-msg already exists on PATH and is a writable native binary, update it in place.
  # Skip symlink/script launchers managed by package managers.
  local active_path active_dir
  active_path="$(resolve_active_command_path || true)"
  if [[ -n "$active_path" ]]; then
    active_dir="$(dirname "$active_path")"
    if is_dir_writable_for_install "$active_dir" && is_safe_existing_binary_path "$active_path"; then
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

append_line_once() {
  local file_path line trailing_newline_count
  file_path="$1"
  line="$2"

  mkdir -p "$(dirname "$file_path")"
  touch "$file_path"
  # Avoid concatenating onto an existing last line when the file has no trailing newline.
  trailing_newline_count="$(tail -c 1 "$file_path" 2>/dev/null | wc -l | tr -d ' ')"
  if [[ -s "$file_path" && "$trailing_newline_count" == "0" ]]; then
    printf '\n' >>"$file_path"
  fi
  if ! grep -Fqx "$line" "$file_path"; then
    printf '%s\n' "$line" >>"$file_path"
  fi
}

is_falsey_value() {
  local value
  value="${1:-}"

  case "$value" in
    0 | false | FALSE | False | no | NO | No | off | OFF | Off)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

detect_user_shell_name() {
  local shell_input
  shell_input="${K_MSG_CLI_SHELL:-${SHELL:-}}"
  if [[ -z "$shell_input" ]]; then
    echo ""
    return
  fi

  basename "$shell_input"
}

resolve_zsh_rc_file() {
  local zdotdir
  zdotdir="${ZDOTDIR:-${HOME}}"
  echo "${zdotdir}/.zshrc"
}

resolve_bash_login_file() {
  if [[ -f "${HOME}/.bash_profile" ]]; then
    echo "${HOME}/.bash_profile"
    return
  fi

  if [[ -f "${HOME}/.profile" ]]; then
    echo "${HOME}/.profile"
    return
  fi

  echo "${HOME}/.bash_profile"
}

setup_zsh_completion() {
  local install_path shell_name zfunc_dir completion_file zshrc_line zshrc_file
  install_path="$1"
  shell_name="$2"
  zfunc_dir="${HOME}/.zfunc"
  completion_file="${zfunc_dir}/_${CLI_NAME}"
  zshrc_file="$(resolve_zsh_rc_file)"
  zshrc_line="fpath+=(\"${zfunc_dir}\")"

  mkdir -p "$zfunc_dir"
  "$install_path" completions zsh >"$completion_file"
  if head -n 1 "$completion_file" | grep -Fqx "#compdef ${CLI_NAME}"; then
    awk -v cli="$CLI_NAME" -v alias="$CLI_ALIAS" '
      NR == 1 {
        print "#compdef " cli " " alias
        next
      }
      { print }
    ' "$completion_file" >"${completion_file}.tmp"
    mv "${completion_file}.tmp" "$completion_file"
  fi
  append_line_once "$zshrc_file" "$zshrc_line"
  append_line_once "$zshrc_file" "autoload -Uz compinit && compinit"

  echo "Configured ${shell_name} completions at ${completion_file}"
  echo "Reload ${shell_name} to apply now:"
  echo "  source \"${zshrc_file}\""
}

setup_bash_completion() {
  local install_path shell_name completion_dir completion_file bash_source_line login_file
  install_path="$1"
  shell_name="$2"
  completion_dir="${HOME}/.bash_completion.d"
  completion_file="${completion_dir}/${CLI_NAME}"
  bash_source_line="[[ -f \"${completion_file}\" ]] && source \"${completion_file}\""
  login_file="$(resolve_bash_login_file)"

  mkdir -p "$completion_dir"
  "$install_path" completions bash >"$completion_file"
  append_line_once "$completion_file" "complete -F __k_msg_complete ${CLI_ALIAS}"
  append_line_once "${HOME}/.bashrc" "$bash_source_line"
  append_line_once "$login_file" "$bash_source_line"

  echo "Configured ${shell_name} completions at ${completion_file}"
  echo "Reload ${shell_name} to apply now:"
  echo "  source \"${HOME}/.bashrc\""
}

setup_fish_completion() {
  local install_path shell_name completion_dir completion_file
  install_path="$1"
  shell_name="$2"
  completion_dir="${HOME}/.config/fish/completions"
  completion_file="${completion_dir}/${CLI_NAME}.fish"

  mkdir -p "$completion_dir"
  "$install_path" completions fish >"$completion_file"
  append_line_once "$completion_file" "complete -c ${CLI_ALIAS} -w ${CLI_NAME}"
  echo "Configured ${shell_name} completions at ${completion_file}"
  echo "Reload ${shell_name} to apply now:"
  echo "  source \"${completion_file}\""
}

setup_shell_completions() {
  local install_path shell_name
  install_path="$1"

  if is_falsey_value "${K_MSG_CLI_SETUP_COMPLETIONS:-true}"; then
    echo "Skipping shell completion setup (K_MSG_CLI_SETUP_COMPLETIONS=${K_MSG_CLI_SETUP_COMPLETIONS})"
    return
  fi

  shell_name="$(detect_user_shell_name)"
  if [[ -z "$shell_name" ]]; then
    echo "Skipping shell completion setup (unable to detect shell; set K_MSG_CLI_SHELL to override)"
    return
  fi

  case "$shell_name" in
    zsh)
      if setup_zsh_completion "$install_path" "$shell_name"; then
        return
      fi
      ;;
    bash)
      if setup_bash_completion "$install_path" "$shell_name"; then
        return
      fi
      ;;
    fish)
      if setup_fish_completion "$install_path" "$shell_name"; then
        return
      fi
      ;;
    *)
      echo "Skipping shell completion setup for unsupported shell: ${shell_name}"
      return
      ;;
  esac

  echo "Warning: failed to configure shell completions automatically for ${shell_name}."
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

  # If a different active native binary existed and is writable, update it too so
  # shells still pointing there immediately get the new version.
  if [[ "$install_dir_explicit" != "true" && -n "$active_before" && "$active_before" != "$install_path" ]]; then
    if is_dir_writable_for_install "$(dirname "$active_before")" && is_safe_existing_binary_path "$active_before"; then
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
  if [[ -n "$active_before" ]] && ! is_safe_existing_binary_path "$active_before"; then
    if is_symlink_path "$active_before"; then
      echo "Note: skipped replacing active symlink launcher: ${active_before}"
    elif is_script_file "$active_before"; then
      echo "Note: skipped replacing active script launcher: ${active_before}"
    fi
  fi

  setup_shell_completions "$install_path"

  echo "Run:"
  echo "  ${CLI_NAME} --help"
}

main "$@"
