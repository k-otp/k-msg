---
editUrl: false
next: false
prev: false
title: "CreateDrizzleJobQueueOptions"
---

Defined in: [packages/messaging/src/adapters/cloudflare/index.ts:176](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/index.ts#L176)

## Extends

- [`CreateDrizzleSqlClientOptions`](/en/api/k-msg/src/adapters/cloudflare/interfaces/createdrizzlesqlclientoptions/)

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

### initializeSchema?

> `optional` **initializeSchema?**: `boolean`

Defined in: [packages/messaging/src/adapters/cloudflare/index.ts:184](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/index.ts#L184)

Whether the queue creates its table and indexes on first use. Set it to
`false` when migrations create the schema.

#### Default

```ts
true
```

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

Defined in: [packages/messaging/src/adapters/cloudflare/index.ts:178](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/index.ts#L178)
