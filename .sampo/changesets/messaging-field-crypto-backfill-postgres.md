---
npm/@k-msg/messaging: patch
npm/@k-msg/cli: patch
---

The field-crypto backfill encrypts rows on Postgres. `applyFieldCryptoMigration()` and `retryFieldCryptoMigration()`, which `k-msg db tracking migrate apply` and `retry` run, read their cursor through unquoted camelCase aliases, which Postgres folds to lowercase. They found no rows and marked the run completed with nothing encrypted. Such a run never moved its cursor, so running `apply` again with the same plan now encrypts the table. The backfill also wrote `metadata_hashes` through postgres.js and Bun.SQL as a JSON string, the bug the tracking store had before its JSON parameters were cast, and now stores it as a JSON document. Metadata that those drivers stored as a JSON string is now read as its object, as the store reads it, instead of being encrypted as missing.
