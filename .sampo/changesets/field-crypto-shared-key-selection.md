---
npm/@k-msg/core: minor
npm/@k-msg/messaging: patch
npm/@k-msg/webhook: patch
---

Share field-crypto key selection between the tracking and webhook stores.

- `@k-msg/core` exports `resolveFieldEncryptKid`, `resolveFieldDecryptKids`, `normalizeKidList`, and `extractEnvelopeKid`, which the messaging tracking stores already used as private helpers.
- When a `keyResolver` has `resolveDecryptKeys`, `@k-msg/webhook` now decrypts with the envelope's own `kid` first, then the `kid`s from `resolveDecryptKeys`, as the tracking stores do. Before, a webhook secret or delivery field stopped decrypting once `resolveDecryptKeys` no longer listed its `kid`, even while the provider still held that key. Resolver `kid`s are also trimmed and blank ones dropped.
- Both stores now put the envelope's `kid` first even when the resolver also lists it later, keep that `kid` exactly as written, and read it only from a v1 envelope, so a custom provider's own JSON ciphertext is no longer mistaken for one.
- Without `resolveDecryptKeys`, neither store passes decrypt candidates: the provider picks the key from its own ciphertext, which the built-in AES-GCM provider already did from the envelope `kid`.
