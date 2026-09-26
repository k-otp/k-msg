---
editUrl: false
next: false
prev: false
title: "ProviderHealthStatus"
---

Defined in: [packages/core/src/provider.ts:202](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L202)

Health check result from a provider.

## Properties

### data?

> `optional` **data?**: `Record`\<`string`, `unknown`\>

Defined in: [packages/core/src/provider.ts:210](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L210)

Provider-specific health details.

***

### healthy

> **healthy**: `boolean`

Defined in: [packages/core/src/provider.ts:204](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L204)

Whether the provider is operational.

***

### issues

> **issues**: `string`[]

Defined in: [packages/core/src/provider.ts:206](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L206)

List of issues if not healthy.

***

### latencyMs?

> `optional` **latencyMs?**: `number`

Defined in: [packages/core/src/provider.ts:208](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L208)

Response latency in milliseconds.
