---
npm/@k-msg/cli: patch
---

`k-msg db schema print` and `generate` print a MySQL schema that MySQL can create with the default type flags: the primary key and the indexed tracking columns are `VARCHAR` whatever `--message-id-type`, `--id-type` and `--short-text-type` say. The MySQL Drizzle output now follows `--id-type` and `--json-type` like the SQL output, instead of always using `varchar(255)` ids and `text` JSON columns.
