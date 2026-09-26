---
editUrl: false
next: false
prev: false
title: "ProviderHealthStatus"
---

Defined in: [packages/core/src/provider.ts:203](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L203)

Health check result from a provider.

## Properties

### data?

> `optional` **data?**: `Record`\<`string`, `unknown`\>

Defined in: [packages/core/src/provider.ts:211](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L211)

Provider-specific health details.

***

### healthy

> **healthy**: `boolean`

Defined in: [packages/core/src/provider.ts:205](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L205)

Whether the provider is operational.

***

### issues

> **issues**: `string`[]

Defined in: [packages/core/src/provider.ts:207](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L207)

List of issues if not healthy.

***

### latencyMs?

> `optional` **latencyMs?**: `number`

Defined in: [packages/core/src/provider.ts:209](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L209)

Response latency in milliseconds.
