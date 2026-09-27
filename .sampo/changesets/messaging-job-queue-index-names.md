---
npm/@k-msg/messaging: minor
---

SQL job queues take `indexNames` to name their indexes. The queue always created `idx_kmsg_jobs_dequeue` and `idx_kmsg_jobs_id`, whatever its `tableName`, but SQLite and D1 need index names to be unique per database, and Postgres per schema. So a second queue table in the same one got no indexes: its `CREATE INDEX IF NOT EXISTS` found the first table's and skipped, and its dequeues scanned the whole table. `HyperdriveJobQueue`, `createD1JobQueue`, `createDrizzleJobQueue`, and `buildJobQueueSchemaSql` take `indexNames: { dequeue, id }`, and `buildCloudflareSqlSchemaSql`, `initializeCloudflareSqlSchema`, and `renderDrizzleSchemaSource` take `queueIndexNames`. Names left out keep their defaults. `init()` never drops indexes, so a table that already has the default ones keeps them next to the new ones.
