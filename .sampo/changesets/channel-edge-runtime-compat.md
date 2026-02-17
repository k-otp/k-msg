---
npm/@k-msg/channel: patch
---

Remove runtime dependence on Node's `events` module in `@k-msg/channel` so it can run in Edge environments without `nodejs_compat`.
Also drops `@types/node` from the package's dev dependencies and documents Edge runtime compatibility in package README files.
