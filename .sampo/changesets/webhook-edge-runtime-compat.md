---
npm/@k-msg/webhook: patch
---

Remove runtime dependence on Node built-ins in `@k-msg/webhook` so it can run in Edge environments without `nodejs_compat`.
`events`, `node:crypto`, `fs/path`, `NodeJS.Timeout`, and direct `process.env` usage are replaced with runtime-neutral implementations.
File persistence is now adapter-based via `fileAdapter`, and README docs include a Node compatibility adapter example.
