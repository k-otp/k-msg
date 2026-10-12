---
editUrl: false
next: false
prev: false
title: "JobProcessorOptions"
---

Defined in: [packages/messaging/src/queue/job.processor.ts:31](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job.processor.ts#L31)

## Properties

### circuitBreaker?

> `optional` **circuitBreaker?**: `object`

Defined in: [packages/messaging/src/queue/job.processor.ts:41](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job.processor.ts#L41)

#### failureThreshold

> **failureThreshold**: `number`

#### resetTimeout

> **resetTimeout**: `number`

#### timeout

> **timeout**: `number`

***

### concurrency

> **concurrency**: `number`

Defined in: [packages/messaging/src/queue/job.processor.ts:32](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job.processor.ts#L32)

***

### enableMetrics

> **enableMetrics**: `boolean`

Defined in: [packages/messaging/src/queue/job.processor.ts:36](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job.processor.ts#L36)

***

### maxRetries

> **maxRetries**: `number`

Defined in: [packages/messaging/src/queue/job.processor.ts:34](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job.processor.ts#L34)

***

### pollInterval

> **pollInterval**: `number`

Defined in: [packages/messaging/src/queue/job.processor.ts:35](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job.processor.ts#L35)

***

### rateLimiter?

> `optional` **rateLimiter?**: `object`

Defined in: [packages/messaging/src/queue/job.processor.ts:37](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job.processor.ts#L37)

#### maxRequests

> **maxRequests**: `number`

#### windowMs

> **windowMs**: `number`

***

### retryDelays

> **retryDelays**: `number`[]

Defined in: [packages/messaging/src/queue/job.processor.ts:33](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job.processor.ts#L33)
