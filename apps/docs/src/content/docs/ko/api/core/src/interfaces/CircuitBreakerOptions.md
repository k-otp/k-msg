---
editUrl: false
next: false
prev: false
title: "CircuitBreakerOptions"
---

Defined in: [packages/core/src/resilience/circuit-breaker.ts:7](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/core/src/resilience/circuit-breaker.ts#L7)

## Properties

### failureThreshold

> **failureThreshold**: `number`

Defined in: [packages/core/src/resilience/circuit-breaker.ts:8](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/core/src/resilience/circuit-breaker.ts#L8)

***

### onClose()?

> `optional` **onClose**: () => `void`

Defined in: [packages/core/src/resilience/circuit-breaker.ts:13](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/core/src/resilience/circuit-breaker.ts#L13)

#### Returns

`void`

***

### onHalfOpen()?

> `optional` **onHalfOpen**: () => `void`

Defined in: [packages/core/src/resilience/circuit-breaker.ts:12](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/core/src/resilience/circuit-breaker.ts#L12)

#### Returns

`void`

***

### onOpen()?

> `optional` **onOpen**: () => `void`

Defined in: [packages/core/src/resilience/circuit-breaker.ts:11](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/core/src/resilience/circuit-breaker.ts#L11)

#### Returns

`void`

***

### resetTimeout

> **resetTimeout**: `number`

Defined in: [packages/core/src/resilience/circuit-breaker.ts:10](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/core/src/resilience/circuit-breaker.ts#L10)

***

### timeout

> **timeout**: `number`

Defined in: [packages/core/src/resilience/circuit-breaker.ts:9](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/core/src/resilience/circuit-breaker.ts#L9)
