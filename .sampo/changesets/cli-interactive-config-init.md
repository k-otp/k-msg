---
npm/@k-msg/cli: minor
---

Improve CLI config onboarding and schema distribution:

- Make `k-msg config init` interactive by default, with automatic `--template full` fallback in non-interactive environments.
- Add `k-msg config provider add [type]` for incremental provider setup via prompts.
- Switch default config lookup to home-based config directories with legacy `./k-msg.config.json` fallback.
- Publish `k-msg.config.json` schema files (`latest` and `v1`) to GitHub Pages and include `$schema` in generated configs.
