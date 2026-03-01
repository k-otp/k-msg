---
npm/@k-msg/cli: patch
---

Automatically configure shell completion during curl installer runs for detected `zsh`, `bash`, and `fish` shells.

- Add installer flags:
  - `K_MSG_CLI_SETUP_COMPLETIONS` (`true` by default, set `false` to opt out)
  - `K_MSG_CLI_SHELL` (override shell detection for completion setup)
- Resolve shell init targets by shell context:
  - `zsh`: `${ZDOTDIR:-$HOME}/.zshrc`
  - `bash`: `~/.bashrc` + login profile (`~/.bash_profile` or `~/.profile`)
  - `fish`: completion file under `~/.config/fish/completions`
- Register completion alias for `kmsg` alongside `k-msg`.
- Print shell reload hints after completion setup to reduce post-install confusion.
- Keep install success resilient by warning instead of failing when completion setup cannot be applied.
