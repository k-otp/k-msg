---
npm/@k-msg/messaging: minor
npm/@k-msg/cli: minor
---

Encrypt the field-crypto migration backfill instead of copying plaintext: `applyFieldCryptoMigration` and `retryFieldCryptoMigration` now require the tracking store's `fieldCrypto` options and encrypt rows whose `crypto_state` is empty, `plain`, or `degraded` through the same write path as the store. Chunks after the first no longer fail on SQLite, D1, and MySQL, and a failed row read marks the run failed instead of leaving it running. The CLI `db tracking migrate apply/retry` commands read the keys from `KMSG_FIELD_CRYPTO_KEYS` and `KMSG_ACTIVE_KID`.
