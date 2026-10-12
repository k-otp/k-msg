---
editUrl: false
next: false
prev: false
title: "CloudflareObjectJob"
---

Defined in: [packages/messaging/src/adapters/cloudflare/object-job-queue.ts:29](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-job-queue.ts#L29)

A job in a KV, R2 or Durable Object queue.

## Extends

- [`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\>

## Type Parameters

### T

`T`

## Properties

### attempts

> **attempts**: `number`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:35](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L35)

#### Inherited from

[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/).[`attempts`](/en/api/k-msg/src/adapters/node/interfaces/job/#attempts)

***

### completedAt?

> `optional` **completedAt?**: `Date`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:40](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L40)

#### Inherited from

[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/).[`completedAt`](/en/api/k-msg/src/adapters/node/interfaces/job/#completedat)

***

### createdAt

> **createdAt**: `Date`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:38](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L38)

#### Inherited from

[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/).[`createdAt`](/en/api/k-msg/src/adapters/node/interfaces/job/#createdat)

***

### data

> **data**: `T`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:32](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L32)

#### Inherited from

[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/).[`data`](/en/api/k-msg/src/adapters/node/interfaces/job/#data)

***

### delay

> **delay**: `number`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:37](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L37)

#### Inherited from

[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/).[`delay`](/en/api/k-msg/src/adapters/node/interfaces/job/#delay)

***

### error?

> `optional` **error?**: `string`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:42](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L42)

#### Inherited from

[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/).[`error`](/en/api/k-msg/src/adapters/node/interfaces/job/#error)

***

### failedAt?

> `optional` **failedAt?**: `Date`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:41](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L41)

#### Inherited from

[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/).[`failedAt`](/en/api/k-msg/src/adapters/node/interfaces/job/#failedat)

***

### id

> **id**: `string`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:30](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L30)

#### Inherited from

[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/).[`id`](/en/api/k-msg/src/adapters/node/interfaces/job/#id)

***

### leaseExpiresAt?

> `optional` **leaseExpiresAt?**: `Date`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:48](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L48)

While the job is processing in a queue with `leaseMs`: when it becomes
due again unless it is completed or failed first.

#### Inherited from

[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/).[`leaseExpiresAt`](/en/api/k-msg/src/adapters/node/interfaces/job/#leaseexpiresat)

***

### maxAttempts

> **maxAttempts**: `number`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:36](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L36)

#### Inherited from

[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/).[`maxAttempts`](/en/api/k-msg/src/adapters/node/interfaces/job/#maxattempts)

***

### metadata

> **metadata**: `Record`\<`string`, `any`\>

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:43](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L43)

#### Inherited from

[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/).[`metadata`](/en/api/k-msg/src/adapters/node/interfaces/job/#metadata)

***

### priority

> **priority**: `number`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:34](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L34)

#### Inherited from

[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/).[`priority`](/en/api/k-msg/src/adapters/node/interfaces/job/#priority)

***

### processAt

> **processAt**: `Date`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:39](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L39)

#### Inherited from

[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/).[`processAt`](/en/api/k-msg/src/adapters/node/interfaces/job/#processat)

***

### result?

> `optional` **result?**: `unknown`

Defined in: [packages/messaging/src/adapters/cloudflare/object-job-queue.ts:31](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-job-queue.ts#L31)

What `complete()` was given.

***

### status

> **status**: [`JobStatus`](/en/api/messaging/src/queue/enumerations/jobstatus/)

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:33](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L33)

#### Inherited from

[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/).[`status`](/en/api/k-msg/src/adapters/node/interfaces/job/#status)

***

### type

> **type**: `string`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:31](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L31)

#### Inherited from

[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/).[`type`](/en/api/k-msg/src/adapters/node/interfaces/job/#type)
