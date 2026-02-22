---
npm/@k-msg/core: patch
npm/@k-msg/messaging: patch
npm/@k-msg/webhook: patch
---

Harden field crypto P0 policy and improve beginner-facing security docs.

- add fail-fast `fieldCrypto` policy validation API (`validateFieldCryptoConfig`, `assertFieldCryptoConfig`, `resolveFieldMode`)
- enforce secure-mode config checks at tracking store initialization
- strengthen fail-open metric tags and normalization consistency for hash lookups
- apply the same validation policy to webhook registry crypto options
- add plain-language security glossary/recipes in docs (ko/en) and root basics docs
