---
editUrl: false
next: false
prev: false
title: "CloudflareObjectJob"
---

Defined in: [packages/messaging/src/adapters/cloudflare/object-job-queue.ts:20](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-job-queue.ts#L20)

A job in a KV, R2 or Durable Object queue.

## Extends

- [`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\>

## Type Parameters

### T

`T`

## Properties

### attempts

> **attempts**: `number`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:15](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L15)

#### Inherited from

[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/).[`attempts`](/en/api/k-msg/src/adapters/node/interfaces/job/#attempts)

***

### completedAt?

> `optional` **completedAt?**: `Date`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:20](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L20)

#### Inherited from

[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/).[`completedAt`](/en/api/k-msg/src/adapters/node/interfaces/job/#completedat)

***

### createdAt

> **createdAt**: `Date`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:18](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L18)

#### Inherited from

[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/).[`createdAt`](/en/api/k-msg/src/adapters/node/interfaces/job/#createdat)

***

### data

> **data**: `T`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:12](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L12)

#### Inherited from

[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/).[`data`](/en/api/k-msg/src/adapters/node/interfaces/job/#data)

***

### delay

> **delay**: `number`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:17](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L17)

#### Inherited from

[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/).[`delay`](/en/api/k-msg/src/adapters/node/interfaces/job/#delay)

***

### error?

> `optional` **error?**: `string`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:22](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L22)

#### Inherited from

[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/).[`error`](/en/api/k-msg/src/adapters/node/interfaces/job/#error)

***

### failedAt?

> `optional` **failedAt?**: `Date`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:21](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L21)

#### Inherited from

[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/).[`failedAt`](/en/api/k-msg/src/adapters/node/interfaces/job/#failedat)

***

### id

> **id**: `string`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:10](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L10)

#### Inherited from

[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/).[`id`](/en/api/k-msg/src/adapters/node/interfaces/job/#id)

***

### leaseExpiresAt?

> `optional` **leaseExpiresAt?**: `Date`

Defined in: [packages/messaging/src/adapters/cloudflare/object-job-queue.ts:25](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-job-queue.ts#L25)

While the job is processing: when it becomes due again unless it is
completed or failed first.

***

### maxAttempts

> **maxAttempts**: `number`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:16](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L16)

#### Inherited from

[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/).[`maxAttempts`](/en/api/k-msg/src/adapters/node/interfaces/job/#maxattempts)

***

### metadata

> **metadata**: `Record`\<`string`, `any`\>

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:23](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L23)

#### Inherited from

[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/).[`metadata`](/en/api/k-msg/src/adapters/node/interfaces/job/#metadata)

***

### priority

> **priority**: `number`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:14](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L14)

#### Inherited from

[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/).[`priority`](/en/api/k-msg/src/adapters/node/interfaces/job/#priority)

***

### processAt

> **processAt**: `Date`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:19](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L19)

#### Inherited from

[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/).[`processAt`](/en/api/k-msg/src/adapters/node/interfaces/job/#processat)

***

### result?

> `optional` **result?**: `unknown`

Defined in: [packages/messaging/src/adapters/cloudflare/object-job-queue.ts:27](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-job-queue.ts#L27)

What `complete()` was given.

***

### status

> **status**: [`JobStatus`](/en/api/messaging/src/queue/enumerations/jobstatus/)

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:13](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L13)

#### Inherited from

[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/).[`status`](/en/api/k-msg/src/adapters/node/interfaces/job/#status)

***

### type

> **type**: `string`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:11](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L11)

#### Inherited from

[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/).[`type`](/en/api/k-msg/src/adapters/node/interfaces/job/#type)
