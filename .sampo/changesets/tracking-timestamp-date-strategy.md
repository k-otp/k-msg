---
npm/@k-msg/messaging: patch
---

Add `typeStrategy.timestamp = "date"` support for Cloudflare delivery tracking schema generation on PostgreSQL.

- `renderDrizzleSchemaSource()` now renders Postgres tracking timestamps as `timestamp(..., { withTimezone: true, mode: "date" })` when `date` strategy is selected.
- SQL schema generation maps Postgres timestamp columns to `TIMESTAMPTZ` for the same strategy.
- Hyperdrive delivery tracking store now binds timestamp values as `Date` objects for Postgres when `date` strategy is enabled.
