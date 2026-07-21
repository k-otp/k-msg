---
editUrl: false
next: false
prev: false
title: "ProviderHealthStatus"
---

Defined in: [packages/core/src/provider.ts:196](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L196)

Health check result from a provider.

## Properties

### data?

> `optional` **data?**: `Record`\<`string`, `unknown`\>

Defined in: [packages/core/src/provider.ts:204](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L204)

Provider-specific health details.

***

### healthy

> **healthy**: `boolean`

Defined in: [packages/core/src/provider.ts:198](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L198)

Whether the provider is operational.

***

### issues

> **issues**: `string`[]

Defined in: [packages/core/src/provider.ts:200](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L200)

List of issues if not healthy.

***

### latencyMs?

> `optional` **latencyMs?**: `number`

Defined in: [packages/core/src/provider.ts:202](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L202)

Response latency in milliseconds.
