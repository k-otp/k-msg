---
npm/@k-msg/messaging: patch
---

Fix Drizzle SQL client rendering for parameterized queries in Cloudflare adapters by returning a Drizzle-compatible query wrapper (`getSQL().toQuery()`) instead of a plain `{ sql, params }` object.

This resolves runtime failures like `query.getSQL is not a function` when `createDrizzleDeliveryTrackingStore` and other Drizzle-backed Cloudflare adapters execute parameterized SQL against Postgres connections.
