---
editUrl: false
next: false
prev: false
title: "CreateDrizzleJobQueueOptions"
---

Defined in: [packages/messaging/src/adapters/cloudflare/index.ts:111](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/index.ts#L111)

## Extends

- [`CreateDrizzleSqlClientOptions`](/api/k-msg/src/adapters/cloudflare/interfaces/createdrizzlesqlclientoptions/)

## Properties

### close()?

> `optional` **close**: () => `void` \| `Promise`\<`void`\>

Defined in: [packages/messaging/src/adapters/cloudflare/sql-client.ts:51](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-client.ts#L51)

#### Returns

`void` \| `Promise`\<`void`\>

#### Inherited from

[`CreateDrizzleSqlClientOptions`](/api/k-msg/src/adapters/cloudflare/interfaces/createdrizzlesqlclientoptions/).[`close`](/api/k-msg/src/adapters/cloudflare/interfaces/createdrizzlesqlclientoptions/#close)

***

### db

> **db**: [`DrizzleSqlDatabaseLike`](/api/k-msg/src/adapters/cloudflare/interfaces/drizzlesqldatabaselike/)

Defined in: [packages/messaging/src/adapters/cloudflare/sql-client.ts:39](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-client.ts#L39)

#### Inherited from

[`CreateDrizzleSqlClientOptions`](/api/k-msg/src/adapters/cloudflare/interfaces/createdrizzlesqlclientoptions/).[`db`](/api/k-msg/src/adapters/cloudflare/interfaces/createdrizzlesqlclientoptions/#db)

***

### dialect

> **dialect**: [`SqlDialect`](/api/k-msg/src/adapters/cloudflare/type-aliases/sqldialect/)

Defined in: [packages/messaging/src/adapters/cloudflare/sql-client.ts:38](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-client.ts#L38)

#### Inherited from

[`CreateDrizzleSqlClientOptions`](/api/k-msg/src/adapters/cloudflare/interfaces/createdrizzlesqlclientoptions/).[`dialect`](/api/k-msg/src/adapters/cloudflare/interfaces/createdrizzlesqlclientoptions/#dialect)

***

### mapTransactionDb()?

> `optional` **mapTransactionDb**: (`value`) => [`DrizzleSqlDatabaseLike`](/api/k-msg/src/adapters/cloudflare/interfaces/drizzlesqldatabaselike/)

Defined in: [packages/messaging/src/adapters/cloudflare/sql-client.ts:50](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-client.ts#L50)

#### Parameters

##### value

`unknown`

#### Returns

[`DrizzleSqlDatabaseLike`](/api/k-msg/src/adapters/cloudflare/interfaces/drizzlesqldatabaselike/)

#### Inherited from

[`CreateDrizzleSqlClientOptions`](/api/k-msg/src/adapters/cloudflare/interfaces/createdrizzlesqlclientoptions/).[`mapTransactionDb`](/api/k-msg/src/adapters/cloudflare/interfaces/createdrizzlesqlclientoptions/#maptransactiondb)

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

#### Inherited from

[`CreateDrizzleSqlClientOptions`](/api/k-msg/src/adapters/cloudflare/interfaces/createdrizzlesqlclientoptions/).[`normalizeResult`](/api/k-msg/src/adapters/cloudflare/interfaces/createdrizzlesqlclientoptions/#normalizeresult)

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

#### Inherited from

[`CreateDrizzleSqlClientOptions`](/api/k-msg/src/adapters/cloudflare/interfaces/createdrizzlesqlclientoptions/).[`renderQuery`](/api/k-msg/src/adapters/cloudflare/interfaces/createdrizzlesqlclientoptions/#renderquery)

***

### tableName?

> `optional` **tableName**: `string`

Defined in: [packages/messaging/src/adapters/cloudflare/index.ts:113](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/index.ts#L113)
