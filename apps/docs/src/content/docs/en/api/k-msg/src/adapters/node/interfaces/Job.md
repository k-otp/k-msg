---
editUrl: false
next: false
prev: false
title: "Job"
---

Defined in: packages/messaging/dist/queue/job-queue.interface.d.ts:8

## Type Parameters

### T

`T`

## Properties

### attempts

> **attempts**: `number`

Defined in: packages/messaging/dist/queue/job-queue.interface.d.ts:14

***

### completedAt?

> `optional` **completedAt**: `Date`

Defined in: packages/messaging/dist/queue/job-queue.interface.d.ts:19

***

### createdAt

> **createdAt**: `Date`

Defined in: packages/messaging/dist/queue/job-queue.interface.d.ts:17

***

### data

> **data**: `T`

Defined in: packages/messaging/dist/queue/job-queue.interface.d.ts:11

***

### delay

> **delay**: `number`

Defined in: packages/messaging/dist/queue/job-queue.interface.d.ts:16

***

### error?

> `optional` **error**: `string`

Defined in: packages/messaging/dist/queue/job-queue.interface.d.ts:21

***

### failedAt?

> `optional` **failedAt**: `Date`

Defined in: packages/messaging/dist/queue/job-queue.interface.d.ts:20

***

### id

> **id**: `string`

Defined in: packages/messaging/dist/queue/job-queue.interface.d.ts:9

***

### maxAttempts

> **maxAttempts**: `number`

Defined in: packages/messaging/dist/queue/job-queue.interface.d.ts:15

***

### metadata

> **metadata**: `Record`\<`string`, `any`\>

Defined in: packages/messaging/dist/queue/job-queue.interface.d.ts:22

***

### priority

> **priority**: `number`

Defined in: packages/messaging/dist/queue/job-queue.interface.d.ts:13

***

### processAt

> **processAt**: `Date`

Defined in: packages/messaging/dist/queue/job-queue.interface.d.ts:18

***

### status

> **status**: `JobStatus`

Defined in: packages/messaging/dist/queue/job-queue.interface.d.ts:12

***

### type

> **type**: `string`

Defined in: packages/messaging/dist/queue/job-queue.interface.d.ts:10
