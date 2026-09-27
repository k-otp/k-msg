---
npm/@k-msg/messaging: patch
---

`provider_status_message` is now `TEXT` in the SQL and Drizzle tracking schemas on Postgres and MySQL, whatever `typeStrategy.shortText` is. As `VARCHAR(64)`, a longer provider message failed its status update with `value too long`. Existing tables keep the old column; widen it with `ALTER TABLE kmsg_delivery_tracking ALTER COLUMN provider_status_message TYPE TEXT` on Postgres or `ALTER TABLE kmsg_delivery_tracking MODIFY provider_status_message TEXT` on MySQL.
