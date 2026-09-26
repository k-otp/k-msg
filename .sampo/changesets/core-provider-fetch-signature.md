---
npm/@k-msg/core: patch
---

Type `ProviderFetch` as the call signature `(input: string | URL | Request, init?: RequestInit) => Promise<Response>` instead of `typeof globalThis.fetch`, so a plain async function can be injected through `ProviderRequestContext.fetch` under Bun's fetch typings, which also declare `preconnect`. The signature avoids the DOM-only `RequestInfo` alias, so Node-only type setups still compile the declarations.
