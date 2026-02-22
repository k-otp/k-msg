---
title: "Security Glossary (Plain Language)"
description: "Simple explanations of fieldCrypto terms for non-security engineers"
---
Question this page answers: How should I interpret security terms in `fieldCrypto` settings as an operator?

## AAD

- One-line definition: A "seal context" attached to ciphertext.
- Why it matters: Prevents copied ciphertext from being decrypted in another record.
- Example (`safe`): include `messageId`, `providerId`, `tableName`, `fieldPath`
- Common mistake: inconsistent AAD keys between write and read paths

## `kid`

- One-line definition: A key identifier label.
- Why it matters: Supports key rotation without breaking old records.
- Example (`safe`): active `kid` for encrypt, multi-`kid` for decrypt
- Common mistake: removing old keys too early from `resolveDecryptKeys`

## `encrypt+hash`

- One-line definition: store encrypted value, query by hash.
- Why it matters: stable lookup without deterministic encryption.
- Example (`safe`): use on `to` and `from` lookup fields
- Common mistake: querying ciphertext columns directly

## `failMode=closed`

- One-line definition: stop processing on crypto errors.
- Why it matters: blocks accidental plaintext exposure paths.
- Example (`safe`): keep default behavior
- Common mistake: switching to `open` permanently for convenience

## `failMode=open`

- One-line definition: continue with a fallback when crypto fails.
- Why it matters: only for temporary availability-first incidents.
- Example (`caution`): `openFallback: "masked"`
- Common mistake: enabling plaintext fallback casually

## `openFallback=plaintext`

- One-line definition: writes/returns plaintext on crypto failure.
- Why it matters: highest-risk fallback and should be avoided.
- Example (`unsafe`): requires explicit `unsafeAllowPlaintextStorage: true`
- Common mistake: leaving temporary debug fallback in production

## Next

- [Field Crypto v1](./field-crypto-v1)
- [Security Recipes](./recipes)
