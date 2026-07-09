---
editUrl: false
next: false
prev: false
title: "Fail"
---

> **Fail**\<`E`\> = `object`

Defined in: [packages/core/src/result.ts:16](https://github.com/k-otp/k-msg/blob/main/packages/core/src/result.ts#L16)

Represents a failed result containing an error.

## Type Parameters

### E

`E`

## Properties

### error

> `readonly` **error**: `E`

Defined in: [packages/core/src/result.ts:22](https://github.com/k-otp/k-msg/blob/main/packages/core/src/result.ts#L22)

The contained error.

***

### isFailure

> `readonly` **isFailure**: `true`

Defined in: [packages/core/src/result.ts:20](https://github.com/k-otp/k-msg/blob/main/packages/core/src/result.ts#L20)

Always true for failed results.

***

### isSuccess

> `readonly` **isSuccess**: `false`

Defined in: [packages/core/src/result.ts:18](https://github.com/k-otp/k-msg/blob/main/packages/core/src/result.ts#L18)

Always false for failed results.
