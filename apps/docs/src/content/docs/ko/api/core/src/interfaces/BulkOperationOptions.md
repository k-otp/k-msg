---
editUrl: false
next: false
prev: false
title: "BulkOperationOptions"
---

Defined in: [packages/core/src/resilience/bulk-operation.ts:8](https://github.com/k-otp/k-msg/blob/main/packages/core/src/resilience/bulk-operation.ts#L8)

## Properties

### concurrency

> **concurrency**: `number`

Defined in: [packages/core/src/resilience/bulk-operation.ts:9](https://github.com/k-otp/k-msg/blob/main/packages/core/src/resilience/bulk-operation.ts#L9)

***

### failFast

> **failFast**: `boolean`

Defined in: [packages/core/src/resilience/bulk-operation.ts:11](https://github.com/k-otp/k-msg/blob/main/packages/core/src/resilience/bulk-operation.ts#L11)

***

### onProgress()?

> `optional` **onProgress**: (`completed`, `total`, `failed`) => `void`

Defined in: [packages/core/src/resilience/bulk-operation.ts:12](https://github.com/k-otp/k-msg/blob/main/packages/core/src/resilience/bulk-operation.ts#L12)

#### Parameters

##### completed

`number`

##### total

`number`

##### failed

`number`

#### Returns

`void`

***

### retryOptions

> **retryOptions**: [`RetryOptions`](/api/core/src/interfaces/retryoptions/)

Defined in: [packages/core/src/resilience/bulk-operation.ts:10](https://github.com/k-otp/k-msg/blob/main/packages/core/src/resilience/bulk-operation.ts#L10)
