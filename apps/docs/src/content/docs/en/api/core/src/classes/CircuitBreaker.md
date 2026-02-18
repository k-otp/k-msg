---
editUrl: false
next: false
prev: false
title: "CircuitBreaker"
---

Defined in: [packages/core/src/resilience/circuit-breaker.ts:16](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/core/src/resilience/circuit-breaker.ts#L16)

## Constructors

### Constructor

> **new CircuitBreaker**(`options`): `CircuitBreaker`

Defined in: [packages/core/src/resilience/circuit-breaker.ts:22](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/core/src/resilience/circuit-breaker.ts#L22)

#### Parameters

##### options

[`CircuitBreakerOptions`](/api/core/src/interfaces/circuitbreakeroptions/)

#### Returns

`CircuitBreaker`

## Methods

### execute()

> **execute**\<`T`\>(`operation`): `Promise`\<`T`\>

Defined in: [packages/core/src/resilience/circuit-breaker.ts:24](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/core/src/resilience/circuit-breaker.ts#L24)

#### Type Parameters

##### T

`T`

#### Parameters

##### operation

() => `Promise`\<`T`\>

#### Returns

`Promise`\<`T`\>

***

### getFailureCount()

> **getFailureCount**(): `number`

Defined in: [packages/core/src/resilience/circuit-breaker.ts:93](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/core/src/resilience/circuit-breaker.ts#L93)

#### Returns

`number`

***

### getState()

> **getState**(): `string`

Defined in: [packages/core/src/resilience/circuit-breaker.ts:89](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/core/src/resilience/circuit-breaker.ts#L89)

#### Returns

`string`

***

### reset()

> **reset**(): `void`

Defined in: [packages/core/src/resilience/circuit-breaker.ts:97](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/core/src/resilience/circuit-breaker.ts#L97)

#### Returns

`void`
