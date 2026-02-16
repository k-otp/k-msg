---
npm/@k-msg/cli: minor
---

Improve CLI config onboarding and schema distribution:

- Make `k-msg config init` interactive by default, with automatic `--template full` fallback in non-interactive environments.
- Add `k-msg config provider add [type]` for incremental provider setup via prompts.
- Switch default config lookup to home-based config directories with legacy `./k-msg.config.json` fallback.
- Generate and version `k-msg.config.json` schema files (`latest` and `v1`) in-repo, and include `$schema` in generated configs.
