# Field Crypto v1

## Scope

`k-msg` v1 field crypto standardizes encryption, hash lookup, and key lifecycle across:

- `@k-msg/core` (`FieldCryptoConfig`, provider/key interfaces, AES-GCM helper)
- `@k-msg/messaging` tracking stores (SQL/Object)
- `@k-msg/webhook` registry storage (`secret`, `payload`)

## Threat model

- Prevent accidental plaintext persistence for recipient/sender identifiers.
- Prevent index/search reliance on deterministic encryption.
- Prevent record-copy attacks by binding ciphertext to AAD (`messageId`, `providerId`, `tableName`, `fieldPath`, optional `tenantId`).
- Keep operational logs plaintext-free by default redaction.

## Envelope format

Ciphertext is persisted as JSON envelope:

```json
{
  "v": 1,
  "alg": "A256GCM",
  "kid": "k-2026-01",
  "iv": "<base64url>",
  "tag": "<base64url>",
  "ct": "<base64url>"
}
```

## Fail policy

- Default: `failMode=closed`
- Optional: `failMode=open`
- `openFallback=plaintext` is blocked unless `unsafeAllowPlaintextStorage=true`

## Field policy modes

- `plain`: no encryption/hash
- `mask`: masked representation only
- `encrypt`: encrypted + masked
- `encrypt+hash`: encrypted + HMAC hash (recommended for lookup fields)

## Key management

- Encrypt uses active `kid` from `resolveEncryptKey`
- Decrypt supports multi-kid from `resolveDecryptKeys`
- Rotation: write with new `kid`, read with old+new `kid`

## Metrics

- `crypto_encrypt_ms`
- `crypto_decrypt_ms`
- `crypto_fail_count`
- `key_kid_usage`

## Logging policy

- Sensitive keys (`to`, `from`, `payload`, `secret`, `token`, `authorization`, etc.) are masked/redacted in core logger.
- Use masked values in operational diagnostics.
