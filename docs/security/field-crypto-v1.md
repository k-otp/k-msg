# Field Crypto v1

Question this page answers: What is the technical policy contract for field-level crypto in `k-msg` v1?

If this is your first time with crypto terms, read `./field-crypto-basics.md` first.

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

The built-in AES-GCM provider writes this envelope. An envelope object from a custom provider must match it (`v` 1, `alg` `A256GCM`, and string `kid`, `iv`, `tag`, and `ct`): the messaging tracking stores and the webhook registry storage reject any other before persisting it. A provider that returns its ciphertext as a string owns that serialization.

## Fail policy

- Default: `failMode=closed`
- Optional: `failMode=open`
- `openFallback=plaintext` is blocked unless `unsafeAllowPlaintextStorage=true`
- Any other `failMode` or `openFallback` value is a configuration error; at runtime anything but an explicit `failMode=open` fails closed, and an unrecognized `openFallback` falls back to `masked`

## Field policy modes

- `plain`: no encryption/hash
- `mask`: masked representation only
- `encrypt`: encrypted + masked
- `encrypt+hash`: encrypted + HMAC hash (recommended for lookup fields)

The messaging tracking stores look records up by `to` and `from`, so they also store an HMAC hash for those two fields in `encrypt` mode. The webhook registry storage always encrypts the endpoint `secret` and the delivery `payload`, which must stay recoverable: it accepts only `encrypt` or `encrypt+hash` for them and stores no hash.

## Key management

- Encrypt uses active `kid` from `resolveEncryptKey`
- Decrypt supports multi-kid from `resolveDecryptKeys`
- Rotation: write with new `kid`, read with old+new `kid`

## Metrics

- `crypto_encrypt_ms`
- `crypto_decrypt_ms`
- `crypto_fail_count`
- `key_kid_usage`
- `crypto_circuit_open_count`
- `crypto_circuit_state`

## Logging policy

- Sensitive keys (`to`, `from`, `payload`, `secret`, `token`, `authorization`, etc.) are masked/redacted in core logger.
- Log messages, error messages and stacks, and other string context values are scrubbed of Korean phone numbers and of credentials written as key/value pairs or in URLs (`apiKey=...`, `Authorization: Bearer ...`, `postgres://user:...@host`).
- Use masked values in operational diagnostics.

## Companion docs

- Basics: `./field-crypto-basics.md`
- Korean basics: `./field-crypto-basics_ko.md`
- Runbook: `./field-crypto-runbook.md`
- Key rotation: `./key-rotation-playbook.md`
- Migration CLI: `./migration-cli-runbook.md`
- Control signals: `./crypto-control-signals.md`
