---
npm/@k-msg/webhook: patch
---

Import `@k-msg/core`, `zod`, and `@noble/hashes` instead of bundling a copy of them into each entry point. Errors thrown by webhook code, such as `FieldCryptoError`, are now `instanceof` the `FieldCryptoError` and `KMsgError` classes you import from `@k-msg/core`, and a logger installed with `setGlobalLogger()` now receives webhook's log output. Both need your app and `@k-msg/webhook` to share one installed `@k-msg/core`, so install matching `@k-msg/*` versions. The ESM entries shrink from 69 KB to 29 KB (root), 98 KB to 57 KB (`toolkit`), and 29 KB to 9.5 KB (`adapters/cloudflare`). Export names are unchanged.
