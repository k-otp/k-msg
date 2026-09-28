---
npm/@k-msg/core: minor
npm/@k-msg/webhook: patch
---

Share field-crypto key selection between the tracking and webhook stores.

- `@k-msg/core` exports `resolveFieldEncryptKid`, `resolveFieldDecryptKids`, `normalizeKidList`, and `extractEnvelopeKid`, which the messaging tracking stores already used as private helpers.
- `@k-msg/webhook` now decrypts with the envelope's own `kid` first, then the `kid`s from `resolveDecryptKeys`, as the tracking stores do. Before, a webhook secret or delivery field stopped decrypting once `resolveDecryptKeys` no longer listed its `kid`, even while the provider still held that key. Resolver `kid`s are also trimmed and blank ones dropped.
