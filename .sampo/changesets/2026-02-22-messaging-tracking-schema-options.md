---
npm/@k-msg/messaging: minor
---

Improve delivery-tracking SQL schema flexibility and privacy defaults.

- Keep default tracking table as `kmsg_delivery_tracking`, with additive schema options:
  `tableName`, `columnMap`, and `typeStrategy`.
- Add `storeRaw` option across SQL tracking paths (Cloudflare/D1/Drizzle/Hyperdrive/Bun SQL/SQLite).
- Change SQL default to `storeRaw: false` so provider raw payload is not persisted unless explicitly enabled.
- Expose `getDeliveryTrackingSchemaSpec()` for SSOT-style schema sync tooling.
- Add tests for schema rendering and store parity with `storeRaw` on/off.
- Add docs sync guard (`scripts/docs/sync-tracking-schema-docs.ts`) and refresh messaging/analytics/example docs.
