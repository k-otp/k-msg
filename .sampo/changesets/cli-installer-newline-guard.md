---
npm/@k-msg/cli: patch
---

Fix installer shell-init appends for files without a trailing newline.

- Prevent `.zshrc`/`.bashrc` line concatenation when appending completion setup lines.
- Keep completion setup idempotent and safe for existing shell config files.
