---
title: "Field Crypto v1"
description: "k-msg security-audit encryption policy (v1)"
---
`fieldCrypto` is the field-level crypto layer shared across `@k-msg/core`, `@k-msg/messaging`, and `@k-msg/webhook`.

Question this page answers: What are the technical policies operators must know for `fieldCrypto`?

If terms are unfamiliar, start with [Security Glossary](./glossary) and [Security Recipes](./recipes).

## Supported modes

- `plain`: store as plaintext (discouraged in secure environments)
- `encrypt`: encrypted storage
- `encrypt+hash`: encrypted storage + hash for lookup
- `mask`: masked value storage

## Default security behavior

- Once enabled, consumers get `secure default`.
- `failMode` defaults to `closed`.
- `openFallback: "plaintext"` is rejected unless `unsafeAllowPlaintextStorage: true` is explicitly set.
- Envelope format is JSON text: `{ v, alg, kid, iv, tag, ct }`.
- Encoding is standardized to `base64url` across SQL dialects.

## Lookup and indexing

- Phone lookup does not rely on deterministic encryption.
- Use hash indexes such as `to_hash` and `from_hash`.
- Hashing uses `HMAC-SHA256(normalizedValue)`.

## AAD and key rotation

- Default AAD: `messageId`, `providerId`, `tableName`, `fieldPath` (plus optional `tenantId`)
- Rotation strategy: `active kid` for encrypt, `multi-kid` fallback for decrypt

## Operational metrics

- `crypto_encrypt_ms`
- `crypto_decrypt_ms`
- `crypto_fail_count`
- `key_kid_usage`

## Incident handling hints

- `crypto_fail_count` spike: verify keys, env vars, and payload shape
- `kid` mismatch: verify keyResolver and active key rollout status
- backfill interruption: replay migration order (`add columns -> index -> backfill -> optional legacy drop`)

Further details:

- [Migration guide](https://github.com/k-otp/k-msg/blob/main/docs/migration/field-crypto-migration.md)
- [Runbook](https://github.com/k-otp/k-msg/blob/main/docs/security/field-crypto-runbook.md)
