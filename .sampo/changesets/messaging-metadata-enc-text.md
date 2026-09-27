---
npm/@k-msg/messaging: patch
---

`metadata_enc` is now `TEXT` in the SQL and Drizzle tracking schemas on every dialect, whatever `typeStrategy.id` says. It holds the encrypted metadata, which passes 255 characters once the metadata JSON is about 110 characters long, so as the `VARCHAR(255)` that `id: "varchar"` gave it, a record with metadata encryption failed its write (MySQL error 1406, Postgres `value too long`). Existing tables keep the old column; widen it with `ALTER TABLE kmsg_delivery_tracking ALTER COLUMN metadata_enc TYPE TEXT` on Postgres or `ALTER TABLE kmsg_delivery_tracking MODIFY metadata_enc TEXT` on MySQL.
