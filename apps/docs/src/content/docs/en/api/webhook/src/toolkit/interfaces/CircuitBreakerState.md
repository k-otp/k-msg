---
editUrl: false
next: false
prev: false
title: "CircuitBreakerState"
---

Defined in: [packages/webhook/src/dispatcher/types.ts:44](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/types.ts#L44)

## Properties

### endpointId

> **endpointId**: `string`

Defined in: [packages/webhook/src/dispatcher/types.ts:45](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/types.ts#L45)

***

### failureCount

> **failureCount**: `number`

Defined in: [packages/webhook/src/dispatcher/types.ts:47](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/types.ts#L47)

***

### lastFailureTime?

> `optional` **lastFailureTime?**: `Date`

Defined in: [packages/webhook/src/dispatcher/types.ts:48](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/types.ts#L48)

***

### nextRetryTime?

> `optional` **nextRetryTime?**: `Date`

Defined in: [packages/webhook/src/dispatcher/types.ts:49](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/types.ts#L49)

***

### state

> **state**: `"closed"` \| `"open"` \| `"half-open"`

Defined in: [packages/webhook/src/dispatcher/types.ts:46](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/types.ts#L46)
