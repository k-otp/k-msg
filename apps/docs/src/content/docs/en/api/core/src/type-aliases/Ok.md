---
editUrl: false
next: false
prev: false
title: "Ok"
---

> **Ok**\<`T`\> = `object`

Defined in: [packages/core/src/result.ts:4](https://github.com/k-otp/k-msg/blob/main/packages/core/src/result.ts#L4)

Represents a successful result containing a value.

## Type Parameters

### T

`T`

## Properties

### isFailure

> `readonly` **isFailure**: `false`

Defined in: [packages/core/src/result.ts:8](https://github.com/k-otp/k-msg/blob/main/packages/core/src/result.ts#L8)

Always false for successful results.

***

### isSuccess

> `readonly` **isSuccess**: `true`

Defined in: [packages/core/src/result.ts:6](https://github.com/k-otp/k-msg/blob/main/packages/core/src/result.ts#L6)

Always true for successful results.

***

### value

> `readonly` **value**: `T`

Defined in: [packages/core/src/result.ts:10](https://github.com/k-otp/k-msg/blob/main/packages/core/src/result.ts#L10)

The contained success value.
