---
editUrl: false
next: false
prev: false
title: "JobQueueIndexNames"
---

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:26](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L26)

Names of the job queue indexes. SQLite and D1 need index names to be unique
per database, and Postgres per schema, so each queue table sharing one needs
its own names.

## Properties

### dequeue

> **dequeue**: `string`

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:28](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L28)

#### Default

```ts
"idx_kmsg_jobs_dequeue"
```

***

### id

> **id**: `string`

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:30](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L30)

#### Default

```ts
"idx_kmsg_jobs_id"
```
