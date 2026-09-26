---
editUrl: false
next: false
prev: false
title: "CircuitBreaker"
---

Defined in: [packages/core/src/resilience/circuit-breaker.ts:17](https://github.com/k-otp/k-msg/blob/main/packages/core/src/resilience/circuit-breaker.ts#L17)

## Constructors

### Constructor

> **new CircuitBreaker**(`options`): `CircuitBreaker`

Defined in: [packages/core/src/resilience/circuit-breaker.ts:26](https://github.com/k-otp/k-msg/blob/main/packages/core/src/resilience/circuit-breaker.ts#L26)

#### Parameters

##### options

[`CircuitBreakerOptions`](/en/api/core/src/interfaces/circuitbreakeroptions/)

#### Returns

`CircuitBreaker`

## Methods

### execute()

> **execute**\<`T`\>(`operation`): `Promise`\<`T`\>

Defined in: [packages/core/src/resilience/circuit-breaker.ts:28](https://github.com/k-otp/k-msg/blob/main/packages/core/src/resilience/circuit-breaker.ts#L28)

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

Defined in: [packages/core/src/resilience/circuit-breaker.ts:130](https://github.com/k-otp/k-msg/blob/main/packages/core/src/resilience/circuit-breaker.ts#L130)

#### Returns

`number`

***

### getState()

> **getState**(): `string`

Defined in: [packages/core/src/resilience/circuit-breaker.ts:126](https://github.com/k-otp/k-msg/blob/main/packages/core/src/resilience/circuit-breaker.ts#L126)

#### Returns

`string`

***

### reset()

> **reset**(): `void`

Defined in: [packages/core/src/resilience/circuit-breaker.ts:134](https://github.com/k-otp/k-msg/blob/main/packages/core/src/resilience/circuit-breaker.ts#L134)

#### Returns

`void`
