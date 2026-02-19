---
editUrl: false
next: false
prev: false
title: "CreateDrizzleSqlClientOptions"
---

Defined in: [packages/messaging/src/adapters/cloudflare/sql-client.ts:37](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-client.ts#L37)

## Extended by

- [`CreateDrizzleDeliveryTrackingStoreOptions`](/api/messaging/src/adapters/cloudflare/interfaces/createdrizzledeliverytrackingstoreoptions/)
- [`CreateDrizzleJobQueueOptions`](/api/messaging/src/adapters/cloudflare/interfaces/createdrizzlejobqueueoptions/)

## Properties

### close()?

> `optional` **close**: () => `void` \| `Promise`\<`void`\>

Defined in: [packages/messaging/src/adapters/cloudflare/sql-client.ts:51](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-client.ts#L51)

#### Returns

`void` \| `Promise`\<`void`\>

***

### db

> **db**: [`DrizzleSqlDatabaseLike`](/api/k-msg/src/adapters/cloudflare/interfaces/drizzlesqldatabaselike/)

Defined in: [packages/messaging/src/adapters/cloudflare/sql-client.ts:39](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-client.ts#L39)

***

### dialect

> **dialect**: [`SqlDialect`](/api/k-msg/src/adapters/cloudflare/type-aliases/sqldialect/)

Defined in: [packages/messaging/src/adapters/cloudflare/sql-client.ts:38](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-client.ts#L38)

***

### mapTransactionDb()?

> `optional` **mapTransactionDb**: (`value`) => [`DrizzleSqlDatabaseLike`](/api/k-msg/src/adapters/cloudflare/interfaces/drizzlesqldatabaselike/)

Defined in: [packages/messaging/src/adapters/cloudflare/sql-client.ts:50](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-client.ts#L50)

#### Parameters

##### value

`unknown`

#### Returns

[`DrizzleSqlDatabaseLike`](/api/k-msg/src/adapters/cloudflare/interfaces/drizzlesqldatabaselike/)

***

### normalizeResult()?

> `optional` **normalizeResult**: \<`T`\>(`input`) => [`CloudflareSqlQueryResult`](/api/k-msg/src/adapters/cloudflare/interfaces/cloudflaresqlqueryresult/)\<`T`\>

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

[`CloudflareSqlQueryResult`](/api/k-msg/src/adapters/cloudflare/interfaces/cloudflaresqlqueryresult/)\<`T`\>

***

### renderQuery()?

> `optional` **renderQuery**: (`input`) => `unknown`

Defined in: [packages/messaging/src/adapters/cloudflare/sql-client.ts:40](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-client.ts#L40)

#### Parameters

##### input

###### dialect

[`SqlDialect`](/api/k-msg/src/adapters/cloudflare/type-aliases/sqldialect/)

###### params

readonly `unknown`[]

###### sql

`string`

#### Returns

`unknown`
