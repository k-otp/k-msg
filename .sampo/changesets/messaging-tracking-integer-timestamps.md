---
npm/@k-msg/messaging: patch
---

`typeStrategy: { timestamp: "integer" }` now gives the SQL and Drizzle tracking schemas `BIGINT` time columns on Postgres and MySQL, the same as the default `bigint`. As `INTEGER`, which is 32-bit there, the columns could not hold the epoch milliseconds the stores write (about 1.8 × 10¹²), so every insert failed: `integer out of range` on Postgres, `Out of range value` on MySQL, which without strict mode stored 2147483647 instead. The stores still write epoch milliseconds, and SQLite and D1 keep `INTEGER`, which is 64-bit there, so tables that work today are unchanged. Postgres and MySQL tables already created with `INTEGER` time columns keep them; widen them to `BIGINT` with the `ALTER TABLE` statements in the README.
