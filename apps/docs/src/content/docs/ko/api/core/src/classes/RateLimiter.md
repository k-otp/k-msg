---
editUrl: false
next: false
prev: false
title: "RateLimiter"
---

Defined in: [packages/core/src/resilience/rate-limiter.ts:5](https://github.com/k-otp/k-msg/blob/main/packages/core/src/resilience/rate-limiter.ts#L5)

Rate limiter for API calls

## Constructors

### Constructor

> **new RateLimiter**(`maxRequests`, `windowMs`): `RateLimiter`

Defined in: [packages/core/src/resilience/rate-limiter.ts:8](https://github.com/k-otp/k-msg/blob/main/packages/core/src/resilience/rate-limiter.ts#L8)

#### Parameters

##### maxRequests

`number`

##### windowMs

`number`

#### Returns

`RateLimiter`

## Methods

### acquire()

> **acquire**(): `Promise`\<`void`\>

Defined in: [packages/core/src/resilience/rate-limiter.ts:13](https://github.com/k-otp/k-msg/blob/main/packages/core/src/resilience/rate-limiter.ts#L13)

#### Returns

`Promise`\<`void`\>

***

### canMakeRequest()

> **canMakeRequest**(): `boolean`

Defined in: [packages/core/src/resilience/rate-limiter.ts:31](https://github.com/k-otp/k-msg/blob/main/packages/core/src/resilience/rate-limiter.ts#L31)

#### Returns

`boolean`

***

### getRemainingRequests()

> **getRemainingRequests**(): `number`

Defined in: [packages/core/src/resilience/rate-limiter.ts:37](https://github.com/k-otp/k-msg/blob/main/packages/core/src/resilience/rate-limiter.ts#L37)

#### Returns

`number`
