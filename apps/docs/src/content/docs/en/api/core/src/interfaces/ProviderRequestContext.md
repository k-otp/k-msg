---
editUrl: false
next: false
prev: false
title: "ProviderRequestContext"
---

Defined in: [packages/core/src/provider.ts:30](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L30)

Per-operation transport context passed to provider calls.

Providers that use fetch should forward `signal` unchanged to the
underlying request and prefer `fetch` over the runtime global when supplied.

## Properties

### fetch?

> `optional` **fetch?**: *typeof* `fetch`

Defined in: [packages/core/src/provider.ts:34](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L34)

Optional fetch implementation for this operation.

***

### signal?

> `optional` **signal?**: `AbortSignal`

Defined in: [packages/core/src/provider.ts:32](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L32)

Abort signal for the underlying provider transport.
