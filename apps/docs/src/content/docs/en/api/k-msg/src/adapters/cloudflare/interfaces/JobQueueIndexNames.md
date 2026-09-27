---
editUrl: false
next: false
prev: false
title: "JobQueueIndexNames"
---

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:27](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L27)

Names of the job queue indexes. SQLite and D1 need index names to be unique
per database, and Postgres per schema, so each queue table sharing one needs
its own names.

## Properties

### dequeue

> **dequeue**: `string`

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:29](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L29)

#### Default

```ts
"idx_kmsg_jobs_dequeue"
```

***

### id

> **id**: `string`

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:31](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L31)

#### Default

```ts
"idx_kmsg_jobs_id"
```
