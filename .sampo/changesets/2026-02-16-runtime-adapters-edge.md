---
npm/k-msg: minor
npm/@k-msg/core: minor
npm/@k-msg/provider: minor
npm/@k-msg/messaging: minor
---

Split runtime-specific messaging implementations into adapter subpaths and keep root APIs runtime-neutral.

- Remove `test-utils` from `@k-msg/core` public exports.
- Enforce `IWINVProvider` MMS image input as `blob/bytes` only and drop Node-only file/path/buffer dependencies.
- Add `@k-msg/messaging/adapters/{bun,node,cloudflare}` with Cloudflare support for Hyperdrive/Postgres/MySQL/D1 and KV/R2/DO-backed object adapters.
- Sync `k-msg/adapters/{bun,node,cloudflare}` re-exports and package export maps.
