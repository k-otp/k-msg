---
npm/@k-msg/messaging: patch
---

The field-crypto migration runs on MySQL. Its state tables keyed on `TEXT` columns, which MySQL cannot index (error 1170), so `planFieldCryptoMigration()` failed there, as did the SQL from `buildFieldCryptoMigrationMetaSchemaSql()` and `includeMigrationMeta`; `plan_id` and the chunks table's `status` are now `VARCHAR` on MySQL. `ensureFieldCryptoMigrationStateTables()`, which plan, apply, retry and status each run, also created the chunk status index every time, and MySQL rejects that once the index exists (error 1061), so every call after the first failed; it now skips an existing table or index, as `initializeCloudflareSqlSchema()` does. Both now build the tables from the same statements.
