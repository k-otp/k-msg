---
editUrl: false
next: false
prev: false
title: "LoadBalancerConfig"
---

Defined in: [packages/webhook/src/dispatcher/types.ts:25](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/types.ts#L25)

## Properties

### healthCheckInterval

> **healthCheckInterval**: `number`

Defined in: [packages/webhook/src/dispatcher/types.ts:27](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/types.ts#L27)

***

### healthCheckTimeoutMs

> **healthCheckTimeoutMs**: `number`

Defined in: [packages/webhook/src/dispatcher/types.ts:28](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/types.ts#L28)

***

### strategy

> **strategy**: `"round-robin"` \| `"least-connections"` \| `"weighted"` \| `"random"`

Defined in: [packages/webhook/src/dispatcher/types.ts:26](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/types.ts#L26)

***

### weights?

> `optional` **weights?**: `Record`\<`string`, `number`\>

Defined in: [packages/webhook/src/dispatcher/types.ts:29](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/types.ts#L29)
