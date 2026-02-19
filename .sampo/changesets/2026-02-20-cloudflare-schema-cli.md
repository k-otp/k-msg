---
npm/@k-msg/messaging: minor
npm/@k-msg/cli: minor
---

Add Cloudflare SQL schema generation APIs and Drizzle adapter helpers to `@k-msg/messaging`, including reusable SQL/Drizzle schema renderers and improved retry-safe lazy initialization for SQL-backed tracking stores and job queues.

Add `k-msg db schema print` and `k-msg db schema generate` commands to `@k-msg/cli`, using `@k-msg/messaging/adapters/cloudflare` as the single source of truth for generated SQL and Drizzle schema output.
