---
npm/@k-msg/core: patch
---

Type `ProviderFetch` as a fetch call signature instead of `typeof globalThis.fetch`, so a plain async function can be injected through `ProviderRequestContext.fetch` under Bun's fetch typings, which also declare `preconnect`.
