---
editUrl: false
next: false
prev: false
title: "LoadBalancerConfig"
---

Defined in: [packages/webhook/src/dispatcher/types.ts:33](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/types.ts#L33)

## Properties

### healthCheckInterval

> **healthCheckInterval**: `number`

Defined in: [packages/webhook/src/dispatcher/types.ts:35](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/types.ts#L35)

***

### healthCheckTimeoutMs

> **healthCheckTimeoutMs**: `number`

Defined in: [packages/webhook/src/dispatcher/types.ts:36](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/types.ts#L36)

***

### strategy

> **strategy**: `"round-robin"` \| `"least-connections"` \| `"weighted"` \| `"random"`

Defined in: [packages/webhook/src/dispatcher/types.ts:34](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/types.ts#L34)

***

### weights?

> `optional` **weights**: `Record`\<`string`, `number`\>

Defined in: [packages/webhook/src/dispatcher/types.ts:37](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/types.ts#L37)
