---
npm/@k-msg/cli: minor
---

Migrate `@k-msg/cli` to Bunli 0.7.1 and adopt the 0.7 command model.

- Convert command trees to `defineGroup` for Bunli 0.7.x compatibility.
- Add runtime-safe shell completions via `k-msg completions <bash|zsh|fish|powershell>` and `k-msg complete -- ...`.
- Replace custom readline/arrow interactive flows with Bunli/Clack prompt APIs.
- Standardize interactive cancellation (`Ctrl+C`) to exit with code `2`.
- Add completion validation/smoke checks in CI and CLI distribution workflows.
