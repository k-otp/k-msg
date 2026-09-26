---
npm/@k-msg/core: patch
npm/@k-msg/webhook: patch
---

Validate ciphertext envelopes before they are stored. `toCiphertextEnvelopeString`, which the messaging tracking stores and now the webhook registry storage use, rejects an envelope object that is not `v: 1`, `alg: "A256GCM"` with string `kid`, `iv`, `tag`, and `ct`, and `assertCryptoEnvelopeV1` exposes the check. A custom provider could previously return any `v` or `alg` and have it persisted. A provider that returns its ciphertext as a string still owns that format.
