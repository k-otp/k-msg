---
editUrl: false
next: false
prev: false
title: "CircuitBreakerState"
---

Defined in: [packages/webhook/src/dispatcher/types.ts:52](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/types.ts#L52)

## Properties

### endpointId

> **endpointId**: `string`

Defined in: [packages/webhook/src/dispatcher/types.ts:53](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/types.ts#L53)

***

### failureCount

> **failureCount**: `number`

Defined in: [packages/webhook/src/dispatcher/types.ts:55](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/types.ts#L55)

***

### lastFailureTime?

> `optional` **lastFailureTime**: `Date`

Defined in: [packages/webhook/src/dispatcher/types.ts:56](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/types.ts#L56)

***

### nextRetryTime?

> `optional` **nextRetryTime**: `Date`

Defined in: [packages/webhook/src/dispatcher/types.ts:57](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/types.ts#L57)

***

### state

> **state**: `"closed"` \| `"open"` \| `"half-open"`

Defined in: [packages/webhook/src/dispatcher/types.ts:54](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/types.ts#L54)
