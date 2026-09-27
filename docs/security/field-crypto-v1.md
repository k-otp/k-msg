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
- Webhook ciphertext written before `tenantId` was bound is rejected, since a copy from another tenant's row would decrypt. It is read only while `acceptLegacyAad` is set for a one-time migration (`migrateWebhookFieldCryptoToTenant` or `runtime.migrateFieldCryptoToTenant()`) that re-encrypts it with the tenant.
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
- A webhook endpoint secret is never read as a fallback value, which would sign deliveries that receivers reject. With `failMode=open`, an endpoint whose secret cannot be decrypted is returned without it and gets no signed deliveries, not even with the shared `secretKey`. That includes `openFallback=plaintext`, since a stored value that does not decrypt cannot be told apart from ciphertext. An endpoint update never writes a fallback over a stored secret: an endpoint without a `secret` of its own keeps the stored one, an unchanged secret that cannot be encrypted again is kept, and an update whose secret can be neither encrypted nor compared with the stored one fails.

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
- Lookup: hash with the field's encrypt `kid`, search under every `kid` a record may carry

The messaging tracking stores hash `to`, `from`, and metadata `encrypt+hash` paths with the provider's hash key for the field's encrypt `kid`: the one `resolveEncryptKey` returns for `to`, `from`, or `metadata`, or the provider's default key when no `kid` resolves, as without a `keyResolver`. A degraded write under `failMode=open` stores the same `to` and `from` hashes. When the resolver is what failed, or its `kid` cannot hash, it uses the provider's default key. When nothing can hash, it stores an empty recipient hash, which no lookup matches.

A `to` or `from` lookup hashes each value under the `kid` that `resolveEncryptKey` returns, every `kid` from `resolveDecryptKeys`, and the provider's default key, and matches a record carrying any of those hashes. Records written under a tenant key, before a rotation, or before a `keyResolver` was configured therefore stay findable. A write resolves keys with its record's `providerId` and `messageId`. A lookup spans records, so it resolves them with the store's `tenantId`, `tableName`, and `fieldPath`: once for each `providerId` and `messageId` the filter pins (each pair when it pins both), and once for the whole store. A record hashed under a `kid` that none of these calls returns is not found. A resolver that scopes keys by provider or message must therefore also list them for the whole store, unless lookups always pin that scope. Keep a retired `kid` in `resolveDecryptKeys` while its records must stay findable, and give every listed `kid` a hash key.

A lookup that cannot compute a hash, or cannot resolve its candidate keys, emits `crypto_fail_count` with `operation=hash`. Under `failMode=closed` it fails. Under `failMode=open` it skips what failed, whether one `kid`'s hash or a whole resolver call, and if a field is left with no hash while the store keeps no plain columns, the lookup matches no records.

## Metrics

- `crypto_encrypt_ms`
- `crypto_decrypt_ms`
- `crypto_fail_count`
- `key_kid_usage`
- `crypto_circuit_open_count`
- `crypto_circuit_state`

## Logging policy

- Sensitive keys (`to`, `from`, `payload`, `secret`, `token`, `authorization`, etc.) are masked/redacted in core logger.
- Log messages, error messages and stacks, and other string context values are scrubbed of Korean phone numbers and of credentials written as key/value pairs or in URLs (`apiKey=...`, `AWS_SECRET_ACCESS_KEY=...`, `API key: ...`, `Authorization: Bearer ...`, `postgres://user:...@host`). A key names a credential when it contains secret, password, passwd, passphrase, token, credential, private key, or API key anywhere, however long the key or property path is, or has an auth or authorization segment (`auth`, `config.auth.value`, but not `author`); context keys of that form are masked too, in any case and with `_`, `-`, `.`, or a space between the words of private key and API key.
- Use masked values in operational diagnostics.

## Companion docs

- Basics: `./field-crypto-basics.md`
- Korean basics: `./field-crypto-basics_ko.md`
- Runbook: `./field-crypto-runbook.md`
- Key rotation: `./key-rotation-playbook.md`
- Migration CLI: `./migration-cli-runbook.md`
- Control signals: `./crypto-control-signals.md`
