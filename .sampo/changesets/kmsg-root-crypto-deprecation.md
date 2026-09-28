---
npm/k-msg: minor
---

Deprecate the field-crypto re-exports on the `k-msg` root. Import them from `k-msg/core` (or `@k-msg/core`) instead; the root aliases keep working and will be removed in a future minor release.

- deprecated: `createAesGcmFieldCryptoProvider`, `createNoopFieldCryptoProvider`, `createDefaultMasker`, `normalizePhoneForHash`, `toCiphertextEnvelopeString`
- deprecated: `validateFieldCryptoConfig`, `assertFieldCryptoConfig`, `resolveFieldMode`, `FieldCryptoError`
- deprecated: the static, refreshable, rolling, ENV, AWS KMS, and Vault Transit key resolvers, the rollout helpers, and the related field-crypto types
- the root keeps `KMsg`, its config types, `estimateSmsBytes`, `Result`, errors, delivery-status helpers, and the retry-policy helpers
