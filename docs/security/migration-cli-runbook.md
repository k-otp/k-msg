# Migration CLI Runbook

Question this page answers: How do operators execute and recover legacy -> secure migration using CLI?

## One-line definition

Migration orchestrator commands (`plan/apply/status/retry`) provide resumable field-crypto backfill.

## Why this matters

Large migrations can fail mid-run; resumable state prevents data drift and duplicate updates.

## Commands

```bash
k-msg db tracking migrate plan --sqlite-file ./local.db
k-msg db tracking migrate apply --sqlite-file ./local.db
k-msg db tracking migrate status --sqlite-file ./local.db
k-msg db tracking migrate retry --sqlite-file ./local.db
```

`apply` and `retry` encrypt the backfill with the default AES-256-GCM provider, so they need the same keys and field policy as the tracking store:

```bash
export KMSG_FIELD_CRYPTO_KEYS='{"k-2026-01":"<base64url AES-256 key>"}'
export KMSG_ACTIVE_KID=k-2026-01
# optional, when the store uses them:
export KMSG_FIELD_CRYPTO_HASH_KEYS='{"k-2026-01":"<base64url HMAC key>"}'
export KMSG_FIELD_CRYPTO_FIELDS='{"to":"encrypt+hash","from":"encrypt+hash"}'
export KMSG_FIELD_CRYPTO_TENANT_ID=tenant-a
export KMSG_FIELD_CRYPTO_AAD_FIELDS=messageId,providerId,tableName,fieldPath
```

Keys are 32 bytes, in base64url or standard base64 like the tracking store accepts. A truncated or malformed key is rejected before any row is read.

Set `KMSG_FIELD_CRYPTO_AAD_FIELDS` exactly when the store sets `aadFields`: ciphertext is bound to those fields, so any difference makes migrated rows undecryptable. The CLI builds the default AES-256-GCM provider with base64url keys; stores with other provider settings (utf8 key encodings, or another provider such as KMS) should call `applyFieldCryptoMigration` with their own `fieldCrypto` options instead.

## Operational sequence

1. Add the secure columns to the tracking table (`to_enc`, `to_hash`, `to_masked`, `from_enc`, `from_hash`, `from_masked`, `metadata_enc`, `metadata_hashes`, `crypto_kid`, `crypto_version`, `crypto_state`, `retention_class`, `retention_bucket_ym`); `buildDeliveryTrackingSchemaSql()` with `fieldCryptoSchema: { enabled: true, mode: "secure" }` lists their types. On MySQL, make the indexed `to_hash` and `from_hash` `VARCHAR(255)` and `retention_class` `VARCHAR(64)`, since MySQL cannot index `TEXT`.
2. Generate a plan and record `planId`.
3. Apply chunks with controlled `--max-chunks`. The tracking store can keep writing: a row that changes while its chunk runs is re-read and encrypted from its current values, and one that keeps changing fails its chunk for `retry`.
4. Check status before each stage transition.
5. Retry only failed chunks. A run that stopped on a read error has none; resume it with `apply`, which continues from the recorded cursor.
6. Switch to secure-only read path after parity checks.

## Common mistakes

- Creating a new plan while an existing plan is incomplete.
- Running retry without checking failure scope.
- Disabling plain compatibility before hash/cipher parity checks.
- Running `apply` with keys, hash keys, field modes, or tenant id that differ from the tracking store's: the rows encrypt, but reads and hash lookups no longer match.
