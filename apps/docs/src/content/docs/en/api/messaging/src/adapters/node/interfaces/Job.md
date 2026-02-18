---
editUrl: false
next: false
prev: false
title: "Job"
---

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:9](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/queue/job-queue.interface.ts#L9)

## Type Parameters

### T

`T`

## Properties

### attempts

> **attempts**: `number`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:15](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/queue/job-queue.interface.ts#L15)

***

### completedAt?

> `optional` **completedAt**: `Date`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:20](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/queue/job-queue.interface.ts#L20)

***

### createdAt

> **createdAt**: `Date`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:18](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/queue/job-queue.interface.ts#L18)

***

### data

> **data**: `T`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:12](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/queue/job-queue.interface.ts#L12)

***

### delay

> **delay**: `number`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:17](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/queue/job-queue.interface.ts#L17)

***

### error?

> `optional` **error**: `string`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:22](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/queue/job-queue.interface.ts#L22)

***

### failedAt?

> `optional` **failedAt**: `Date`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:21](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/queue/job-queue.interface.ts#L21)

***

### id

> **id**: `string`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:10](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/queue/job-queue.interface.ts#L10)

***

### maxAttempts

> **maxAttempts**: `number`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:16](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/queue/job-queue.interface.ts#L16)

***

### metadata

> **metadata**: `Record`\<`string`, `any`\>

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:23](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/queue/job-queue.interface.ts#L23)

***

### priority

> **priority**: `number`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:14](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/queue/job-queue.interface.ts#L14)

***

### processAt

> **processAt**: `Date`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:19](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/queue/job-queue.interface.ts#L19)

***

### status

> **status**: [`JobStatus`](/api/messaging/src/queue/enumerations/jobstatus/)

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:13](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/queue/job-queue.interface.ts#L13)

***

### type

> **type**: `string`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:11](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/queue/job-queue.interface.ts#L11)
