---
npm/@k-msg/messaging: minor
npm/@k-msg/cli: minor
---

Encrypt the field-crypto migration backfill instead of copying plaintext: `applyFieldCryptoMigration` and `retryFieldCryptoMigration` now require the tracking store's `fieldCrypto` options and encrypt rows whose `crypto_state` is empty, `plain`, or `degraded` through the same write path as the store. Chunks after the first no longer fail on SQLite, D1, and MySQL, a failed row read or state write marks the run failed instead of leaving it running, and a row with no plain recipient fails its chunk instead of being skipped. `retryFieldCryptoMigration` only changes a run that has failed chunks to reprocess, so it no longer flips completed or read-failed runs back to running. The CLI `db tracking migrate apply/retry` commands read the keys from `KMSG_FIELD_CRYPTO_KEYS` and `KMSG_ACTIVE_KID`, accepting base64url or standard base64 keys and rejecting truncated ones before the backfill starts, and `KMSG_FIELD_CRYPTO_AAD_FIELDS` mirrors a store's `aadFields`.
