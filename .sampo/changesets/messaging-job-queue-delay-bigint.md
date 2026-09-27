---
npm/@k-msg/messaging: patch
---

The SQL job queue's `delay` column is now `BIGINT` on Postgres and MySQL, in `buildJobQueueSchemaSql()`, `buildCloudflareSqlSchemaSql()`, the queues' `init()` and `renderDrizzleSchemaSource()`. It holds milliseconds, and as a 32-bit `INTEGER` it could not take a delay of 2^31 ms (about 24.9 days) or more, so `HyperdriveJobQueue` and `createDrizzleJobQueue` failed to enqueue such a job: `integer out of range` on Postgres, `Out of range value` on MySQL, which without strict mode stored 2147483647 instead (the job still ran at its `process_at`). SQLite and D1 keep `INTEGER`, which is 64-bit there. Existing tables keep their column; widen it with `ALTER TABLE kmsg_jobs ALTER COLUMN delay TYPE BIGINT` on Postgres or `ALTER TABLE kmsg_jobs MODIFY delay BIGINT NOT NULL DEFAULT 0` on MySQL.
