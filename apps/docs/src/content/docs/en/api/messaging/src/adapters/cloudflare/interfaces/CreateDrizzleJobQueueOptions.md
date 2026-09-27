---
editUrl: false
next: false
prev: false
title: "CreateDrizzleJobQueueOptions"
---

Defined in: [packages/messaging/src/adapters/cloudflare/index.ts:197](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/index.ts#L197)

Options of the queues that lease the jobs `dequeue()` returns.

## Extends

- [`CreateDrizzleSqlClientOptions`](/en/api/k-msg/src/adapters/cloudflare/interfaces/createdrizzlesqlclientoptions/).[`JobLeaseOptions`](/en/api/messaging/src/queue/interfaces/jobleaseoptions/)\<[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\>\>

## Type Parameters

### T

`T` = `unknown`

## Properties

### close?

> `optional` **close?**: () => `void` \| `Promise`\<`void`\>

Defined in: [packages/messaging/src/adapters/cloudflare/sql-client.ts:51](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-client.ts#L51)

#### Returns

`void` \| `Promise`\<`void`\>

#### Inherited from

[`CreateDrizzleSqlClientOptions`](/en/api/k-msg/src/adapters/cloudflare/interfaces/createdrizzlesqlclientoptions/).[`close`](/en/api/k-msg/src/adapters/cloudflare/interfaces/createdrizzlesqlclientoptions/#close)

***

### db

> **db**: [`DrizzleSqlDatabaseLike`](/en/api/k-msg/src/adapters/cloudflare/interfaces/drizzlesqldatabaselike/)

Defined in: [packages/messaging/src/adapters/cloudflare/sql-client.ts:39](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-client.ts#L39)

#### Inherited from

[`CreateDrizzleSqlClientOptions`](/en/api/k-msg/src/adapters/cloudflare/interfaces/createdrizzlesqlclientoptions/).[`db`](/en/api/k-msg/src/adapters/cloudflare/interfaces/createdrizzlesqlclientoptions/#db)

***

### dialect

> **dialect**: [`SqlDialect`](/en/api/k-msg/src/adapters/cloudflare/type-aliases/sqldialect/)

Defined in: [packages/messaging/src/adapters/cloudflare/sql-client.ts:38](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-client.ts#L38)

#### Inherited from

[`CreateDrizzleSqlClientOptions`](/en/api/k-msg/src/adapters/cloudflare/interfaces/createdrizzlesqlclientoptions/).[`dialect`](/en/api/k-msg/src/adapters/cloudflare/interfaces/createdrizzlesqlclientoptions/#dialect)

***

### indexNames?

> `optional` **indexNames?**: `Partial`\<[`JobQueueIndexNames`](/en/api/k-msg/src/adapters/cloudflare/interfaces/jobqueueindexnames/)\>

Defined in: [packages/messaging/src/adapters/cloudflare/index.ts:201](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/index.ts#L201)

***

### initializeSchema?

> `optional` **initializeSchema?**: `boolean`

Defined in: [packages/messaging/src/adapters/cloudflare/index.ts:207](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/index.ts#L207)

Whether the queue creates its table and indexes on first use. Set it to
`false` when migrations create the schema.

#### Default

```ts
true
```

***

### leaseMs?

> `optional` **leaseMs?**: `number`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:64](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L64)

How long a dequeued job may stay processing before it is due again
(default: `Infinity`, no lease). If it is neither completed nor failed
by then, for example because the worker stopped mid-job, the next
`dequeue()` counts the lost attempt as failed (`error: "LEASE_EXPIRED"`)
and makes the job due again, or fails it when no attempts are left.
Set it above the longest time a job can take: a lease is not renewed,
and a worker that outlives it can still complete or fail the job while
another worker has it. `dequeue()` leaves the jobs its caller names as
still running alone, which is how `JobProcessor` keeps a job it is
still running from being run again or counted as lost.

#### Inherited from

[`JobLeaseOptions`](/en/api/messaging/src/queue/interfaces/jobleaseoptions/).[`leaseMs`](/en/api/messaging/src/queue/interfaces/jobleaseoptions/#leasems)

***

### mapTransactionDb?

> `optional` **mapTransactionDb?**: (`value`) => [`DrizzleSqlDatabaseLike`](/en/api/k-msg/src/adapters/cloudflare/interfaces/drizzlesqldatabaselike/)

Defined in: [packages/messaging/src/adapters/cloudflare/sql-client.ts:50](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-client.ts#L50)

#### Parameters

##### value

`unknown`

#### Returns

[`DrizzleSqlDatabaseLike`](/en/api/k-msg/src/adapters/cloudflare/interfaces/drizzlesqldatabaselike/)

#### Inherited from

[`CreateDrizzleSqlClientOptions`](/en/api/k-msg/src/adapters/cloudflare/interfaces/createdrizzlesqlclientoptions/).[`mapTransactionDb`](/en/api/k-msg/src/adapters/cloudflare/interfaces/createdrizzlesqlclientoptions/#maptransactiondb)

***

### normalizeResult?

> `optional` **normalizeResult?**: \<`T`\>(`input`) => [`CloudflareSqlQueryResult`](/en/api/k-msg/src/adapters/cloudflare/interfaces/cloudflaresqlqueryresult/)\<`T`\>

Defined in: [packages/messaging/src/adapters/cloudflare/sql-client.ts:45](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-client.ts#L45)

#### Type Parameters

##### T

`T` = `Record`\<`string`, `unknown`\>

#### Parameters

##### input

###### params

readonly `unknown`[]

###### result

`unknown`

###### sql

`string`

#### Returns

[`CloudflareSqlQueryResult`](/en/api/k-msg/src/adapters/cloudflare/interfaces/cloudflaresqlqueryresult/)\<`T`\>

#### Inherited from

[`CreateDrizzleSqlClientOptions`](/en/api/k-msg/src/adapters/cloudflare/interfaces/createdrizzlesqlclientoptions/).[`normalizeResult`](/en/api/k-msg/src/adapters/cloudflare/interfaces/createdrizzlesqlclientoptions/#normalizeresult)

***

### onLeaseExpired?

> `optional` **onLeaseExpired?**: (`job`) => `void` \| `Promise`\<`void`\>

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:72](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L72)

Called by `dequeue()` for each job whose lease had expired, once the job
is stored pending again or, with no attempts left, failed. `dequeue()`
waits for it before it leases the job it returns, which may be the same
one, so it does not shorten that lease. What it throws is logged and
does not stop the dequeue.

#### Parameters

##### job

[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/)

#### Returns

`void` \| `Promise`\<`void`\>

#### Inherited from

[`JobLeaseOptions`](/en/api/messaging/src/queue/interfaces/jobleaseoptions/).[`onLeaseExpired`](/en/api/messaging/src/queue/interfaces/jobleaseoptions/#onleaseexpired)

***

### renderQuery?

> `optional` **renderQuery?**: (`input`) => `unknown`

Defined in: [packages/messaging/src/adapters/cloudflare/sql-client.ts:40](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-client.ts#L40)

#### Parameters

##### input

###### dialect

[`SqlDialect`](/en/api/k-msg/src/adapters/cloudflare/type-aliases/sqldialect/)

###### params

readonly `unknown`[]

###### sql

`string`

#### Returns

`unknown`

#### Inherited from

[`CreateDrizzleSqlClientOptions`](/en/api/k-msg/src/adapters/cloudflare/interfaces/createdrizzlesqlclientoptions/).[`renderQuery`](/en/api/k-msg/src/adapters/cloudflare/interfaces/createdrizzlesqlclientoptions/#renderquery)

***

### tableName?

> `optional` **tableName?**: `string`

Defined in: [packages/messaging/src/adapters/cloudflare/index.ts:200](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/index.ts#L200)
