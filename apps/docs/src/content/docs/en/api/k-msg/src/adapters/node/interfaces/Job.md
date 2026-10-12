---
editUrl: false
next: false
prev: false
title: "Job"
---

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:29](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L29)

## Extended by

- [`CloudflareObjectJob`](/en/api/k-msg/src/adapters/cloudflare/interfaces/cloudflareobjectjob/)

## Type Parameters

### T

`T`

## Properties

### attempts

> **attempts**: `number`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:35](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L35)

***

### completedAt?

> `optional` **completedAt?**: `Date`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:40](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L40)

***

### createdAt

> **createdAt**: `Date`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:38](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L38)

***

### data

> **data**: `T`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:32](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L32)

***

### delay

> **delay**: `number`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:37](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L37)

***

### error?

> `optional` **error?**: `string`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:42](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L42)

***

### failedAt?

> `optional` **failedAt?**: `Date`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:41](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L41)

***

### id

> **id**: `string`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:30](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L30)

***

### leaseExpiresAt?

> `optional` **leaseExpiresAt?**: `Date`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:48](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L48)

While the job is processing in a queue with `leaseMs`: when it becomes
due again unless it is completed or failed first.

***

### maxAttempts

> **maxAttempts**: `number`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:36](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L36)

***

### metadata

> **metadata**: `Record`\<`string`, `any`\>

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:43](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L43)

***

### priority

> **priority**: `number`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:34](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L34)

***

### processAt

> **processAt**: `Date`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:39](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L39)

***

### status

> **status**: [`JobStatus`](/en/api/messaging/src/queue/enumerations/jobstatus/)

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:33](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L33)

***

### type

> **type**: `string`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:31](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L31)
