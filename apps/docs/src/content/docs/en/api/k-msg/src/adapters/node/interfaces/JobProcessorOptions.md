---
editUrl: false
next: false
prev: false
title: "JobProcessorOptions"
---

Defined in: [packages/messaging/src/queue/job.processor.ts:25](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job.processor.ts#L25)

## Properties

### circuitBreaker?

> `optional` **circuitBreaker?**: `object`

Defined in: [packages/messaging/src/queue/job.processor.ts:35](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job.processor.ts#L35)

#### failureThreshold

> **failureThreshold**: `number`

#### resetTimeout

> **resetTimeout**: `number`

#### timeout

> **timeout**: `number`

***

### concurrency

> **concurrency**: `number`

Defined in: [packages/messaging/src/queue/job.processor.ts:26](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job.processor.ts#L26)

***

### enableMetrics

> **enableMetrics**: `boolean`

Defined in: [packages/messaging/src/queue/job.processor.ts:30](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job.processor.ts#L30)

***

### maxRetries

> **maxRetries**: `number`

Defined in: [packages/messaging/src/queue/job.processor.ts:28](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job.processor.ts#L28)

***

### pollInterval

> **pollInterval**: `number`

Defined in: [packages/messaging/src/queue/job.processor.ts:29](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job.processor.ts#L29)

***

### rateLimiter?

> `optional` **rateLimiter?**: `object`

Defined in: [packages/messaging/src/queue/job.processor.ts:31](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job.processor.ts#L31)

#### maxRequests

> **maxRequests**: `number`

#### windowMs

> **windowMs**: `number`

***

### retryDelays

> **retryDelays**: `number`[]

Defined in: [packages/messaging/src/queue/job.processor.ts:27](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job.processor.ts#L27)
