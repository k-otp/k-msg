---
editUrl: false
next: false
prev: false
title: "Job"
---

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:12](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L12)

## Extended by

- [`CloudflareObjectJob`](/en/api/k-msg/src/adapters/cloudflare/interfaces/cloudflareobjectjob/)

## Type Parameters

### T

`T`

## Properties

### attempts

> **attempts**: `number`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:18](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L18)

***

### completedAt?

> `optional` **completedAt?**: `Date`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:23](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L23)

***

### createdAt

> **createdAt**: `Date`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:21](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L21)

***

### data

> **data**: `T`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:15](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L15)

***

### delay

> **delay**: `number`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:20](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L20)

***

### error?

> `optional` **error?**: `string`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:25](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L25)

***

### failedAt?

> `optional` **failedAt?**: `Date`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:24](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L24)

***

### id

> **id**: `string`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:13](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L13)

***

### leaseExpiresAt?

> `optional` **leaseExpiresAt?**: `Date`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:31](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L31)

While the job is processing in a queue with `leaseMs`: when it becomes
due again unless it is completed or failed first.

***

### maxAttempts

> **maxAttempts**: `number`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:19](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L19)

***

### metadata

> **metadata**: `Record`\<`string`, `any`\>

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:26](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L26)

***

### priority

> **priority**: `number`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:17](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L17)

***

### processAt

> **processAt**: `Date`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:22](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L22)

***

### status

> **status**: [`JobStatus`](/en/api/messaging/src/queue/enumerations/jobstatus/)

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:16](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L16)

***

### type

> **type**: `string`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:14](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L14)
