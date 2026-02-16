---
npm/@k-msg/cli: patch
---

Fix global `@k-msg/cli` startup failure when running outside a project that has `bunli.config.*`.

- `createKMsgCli()` now passes explicit CLI metadata (`name`, `version`, `description`) to Bunli.
- This allows `k-msg` to start correctly even when the current working directory does not contain a Bunli config file.
- Added an E2E test that runs CLI from a temporary directory without `bunli.config.*`.
