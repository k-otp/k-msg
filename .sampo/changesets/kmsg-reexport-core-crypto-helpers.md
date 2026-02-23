---
npm/k-msg: patch
---

Re-export core field-crypto helpers from `k-msg` facade so consumers can avoid direct `@k-msg/core` dependency for common crypto setup.

- add field-crypto provider/helpers (`createAesGcmFieldCryptoProvider`, `createNoopFieldCryptoProvider`, `normalizePhoneForHash`, `createDefaultMasker`)
- add field-crypto policy exports (`validateFieldCryptoConfig`, `assertFieldCryptoConfig`, `resolveFieldMode`)
- add key management exports (static/refreshable/rolling resolvers and ENV/AWS KMS/Vault adapters)
- add rollout and crypto event/type exports for tracking integration
