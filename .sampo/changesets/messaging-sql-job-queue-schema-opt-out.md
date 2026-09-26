---
npm/@k-msg/messaging: minor
---

SQL job queues take `initializeSchema: false` to skip creating their table and indexes. `HyperdriveJobQueue`, `createD1JobQueue`, and `createDrizzleJobQueue` sent a `CREATE TABLE` and two `CREATE INDEX` statements before the first query of every new queue, which in a Worker means every request, and needed a role allowed to run DDL. With the option set, `init()` does nothing and the schema is left to migrations, as the SQL delivery tracking stores already allow. The second argument of `new HyperdriveJobQueue(client, ...)` takes a table name, as before, or `{ tableName, initializeSchema }`.
