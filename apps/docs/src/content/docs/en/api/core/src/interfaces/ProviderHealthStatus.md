---
editUrl: false
next: false
prev: false
title: "ProviderHealthStatus"
---

Defined in: [packages/core/src/provider.ts:167](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L167)

Health check result from a provider.

## Properties

### data?

> `optional` **data**: `Record`\<`string`, `unknown`\>

Defined in: [packages/core/src/provider.ts:175](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L175)

Provider-specific health details.

***

### healthy

> **healthy**: `boolean`

Defined in: [packages/core/src/provider.ts:169](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L169)

Whether the provider is operational.

***

### issues

> **issues**: `string`[]

Defined in: [packages/core/src/provider.ts:171](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L171)

List of issues if not healthy.

***

### latencyMs?

> `optional` **latencyMs**: `number`

Defined in: [packages/core/src/provider.ts:173](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L173)

Response latency in milliseconds.
