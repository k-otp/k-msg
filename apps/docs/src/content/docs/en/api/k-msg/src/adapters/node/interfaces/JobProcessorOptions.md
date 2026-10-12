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

### maxJobBytes?

> `optional` **maxJobBytes?**: `number`

Defined in: [packages/messaging/src/queue/job.processor.ts:58](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job.processor.ts#L58)

Most bytes a message job may take once its progress is saved (default
1,000,000, half of D1's 2 MB row limit). The estimate is the JSON size of
the request plus the progress kept for every recipient.

***

### maxRecipientsPerJob?

> `optional` **maxRecipientsPerJob?**: `number`

Defined in: [packages/messaging/src/queue/job.processor.ts:52](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job.processor.ts#L52)

Most recipients one message job may hold (default 1000). A message job
saves its progress with the whole job payload before every send, so the
work and the size of the stored row both grow with the recipient count.
Larger lists belong in several jobs.

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
