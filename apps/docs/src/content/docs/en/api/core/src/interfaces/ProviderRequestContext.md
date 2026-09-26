---
editUrl: false
next: false
prev: false
title: "ProviderRequestContext"
---

Defined in: [packages/core/src/provider.ts:36](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L36)

Per-operation transport context passed to provider calls.

Providers that use fetch should forward `signal` unchanged to the
underlying request and prefer `fetch` over the runtime global when supplied.

## Properties

### fetch?

> `optional` **fetch?**: [`ProviderFetch`](/en/api/core/src/type-aliases/providerfetch/)

Defined in: [packages/core/src/provider.ts:40](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L40)

Optional fetch implementation for this operation.

***

### signal?

> `optional` **signal?**: `AbortSignal`

Defined in: [packages/core/src/provider.ts:38](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L38)

Abort signal for the underlying provider transport.
