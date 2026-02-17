---
npm/@k-msg/provider: minor
npm/@k-msg/messaging: patch
npm/k-msg: patch
---

Split SOLAPI exports into `@k-msg/provider/solapi` and make `solapi` an optional peer dependency,
while keeping runtime-neutral exports on `@k-msg/provider`.

Also updated messaging cloudflare DO storage typing compatibility and refreshed docs/examples
(including advanced Pages routes and new Bun/Express Node send-only templates).
