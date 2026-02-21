---
npm/@k-msg/cli: patch
---

Harden CLI installer and launcher path sync behavior to reduce unsafe overwrites across mixed install methods.

- `install.sh` now skips replacing active symlink/script launchers (for example package-manager shims) and falls back to `~/.local/bin` unless `K_MSG_CLI_INSTALL_DIR` is explicitly set.
- The npm/bun launcher sync logic now targets only active command entries and only replaces native executables, avoiding broad PATH scanning and accidental script replacement.
