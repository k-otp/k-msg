---
npm/@k-msg/core: patch
npm/@k-msg/messaging: patch
npm/@k-msg/webhook: patch
---

`validateFieldCryptoConfig` rejects unknown `failMode` and `openFallback` values, and the messaging and webhook crypto paths fail closed unless `failMode` is exactly `"open"`. A misspelled mode such as `"close"` from JSON configuration used to count as fail-open, storing masked or empty fallbacks when encryption failed. `resolveFieldCryptoFailMode` exposes the rule.
