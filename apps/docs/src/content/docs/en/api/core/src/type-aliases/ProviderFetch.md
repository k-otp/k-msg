---
editUrl: false
next: false
prev: false
title: "ProviderFetch"
---

> **ProviderFetch** = (`input`, `init?`) => `Promise`\<`Response`\>

Defined in: [packages/core/src/provider.ts:26](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L26)

Fetch implementation used for a single provider operation.

Callers can inject a compatible implementation for runtime-specific
transports, tracing, or deterministic tests. It is a call signature rather
than `typeof globalThis.fetch`, so a plain async function qualifies in every
runtime (Bun's `fetch` type also declares `preconnect`, which providers never
call); the global `fetch` still satisfies it. The input avoids the DOM-only
`RequestInfo` alias so Node-only type setups can compile the declaration.

## Parameters

### input

`string` \| `URL` \| `Request`

### init?

`RequestInit`

## Returns

`Promise`\<`Response`\>
