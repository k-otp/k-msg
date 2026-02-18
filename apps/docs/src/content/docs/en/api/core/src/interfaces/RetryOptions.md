---
editUrl: false
next: false
prev: false
title: "RetryOptions"
---

Defined in: [packages/core/src/resilience/retry-handler.ts:7](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/core/src/resilience/retry-handler.ts#L7)

## Properties

### backoffMultiplier?

> `optional` **backoffMultiplier**: `number`

Defined in: [packages/core/src/resilience/retry-handler.ts:11](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/core/src/resilience/retry-handler.ts#L11)

***

### initialDelay?

> `optional` **initialDelay**: `number`

Defined in: [packages/core/src/resilience/retry-handler.ts:9](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/core/src/resilience/retry-handler.ts#L9)

***

### jitter?

> `optional` **jitter**: `boolean`

Defined in: [packages/core/src/resilience/retry-handler.ts:12](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/core/src/resilience/retry-handler.ts#L12)

***

### maxAttempts?

> `optional` **maxAttempts**: `number`

Defined in: [packages/core/src/resilience/retry-handler.ts:8](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/core/src/resilience/retry-handler.ts#L8)

***

### maxDelay?

> `optional` **maxDelay**: `number`

Defined in: [packages/core/src/resilience/retry-handler.ts:10](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/core/src/resilience/retry-handler.ts#L10)

***

### onRetry()?

> `optional` **onRetry**: (`error`, `attempt`) => `void`

Defined in: [packages/core/src/resilience/retry-handler.ts:14](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/core/src/resilience/retry-handler.ts#L14)

#### Parameters

##### error

`Error`

##### attempt

`number`

#### Returns

`void`

***

### retryCondition()?

> `optional` **retryCondition**: (`error`, `attempt`) => `boolean`

Defined in: [packages/core/src/resilience/retry-handler.ts:13](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/core/src/resilience/retry-handler.ts#L13)

#### Parameters

##### error

`Error`

##### attempt

`number`

#### Returns

`boolean`
