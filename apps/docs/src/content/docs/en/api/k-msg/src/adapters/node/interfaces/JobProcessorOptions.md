---
editUrl: false
next: false
prev: false
title: "JobProcessorOptions"
---

Defined in: [packages/messaging/src/queue/job.processor.ts:24](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job.processor.ts#L24)

## Properties

### circuitBreaker?

> `optional` **circuitBreaker**: `object`

Defined in: [packages/messaging/src/queue/job.processor.ts:34](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job.processor.ts#L34)

#### failureThreshold

> **failureThreshold**: `number`

#### resetTimeout

> **resetTimeout**: `number`

#### timeout

> **timeout**: `number`

***

### concurrency

> **concurrency**: `number`

Defined in: [packages/messaging/src/queue/job.processor.ts:25](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job.processor.ts#L25)

***

### enableMetrics

> **enableMetrics**: `boolean`

Defined in: [packages/messaging/src/queue/job.processor.ts:29](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job.processor.ts#L29)

***

### maxRetries

> **maxRetries**: `number`

Defined in: [packages/messaging/src/queue/job.processor.ts:27](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job.processor.ts#L27)

***

### pollInterval

> **pollInterval**: `number`

Defined in: [packages/messaging/src/queue/job.processor.ts:28](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job.processor.ts#L28)

***

### rateLimiter?

> `optional` **rateLimiter**: `object`

Defined in: [packages/messaging/src/queue/job.processor.ts:30](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job.processor.ts#L30)

#### maxRequests

> **maxRequests**: `number`

#### windowMs

> **windowMs**: `number`

***

### retryDelays

> **retryDelays**: `number`[]

Defined in: [packages/messaging/src/queue/job.processor.ts:26](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job.processor.ts#L26)
