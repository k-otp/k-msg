---
editUrl: false
next: false
prev: false
title: "CloudflareSqlClient"
---

Defined in: packages/messaging/dist/adapters/cloudflare/sql-client.d.ts:6

## Properties

### dialect

> **dialect**: [`SqlDialect`](/api/k-msg/src/adapters/cloudflare/type-aliases/sqldialect/)

Defined in: packages/messaging/dist/adapters/cloudflare/sql-client.d.ts:7

## Methods

### close()?

> `optional` **close**(): `void` \| `Promise`\<`void`\>

Defined in: packages/messaging/dist/adapters/cloudflare/sql-client.d.ts:10

#### Returns

`void` \| `Promise`\<`void`\>

***

### query()

> **query**\<`T`\>(`sql`, `params?`): `Promise`\<[`CloudflareSqlQueryResult`](/api/k-msg/src/adapters/cloudflare/interfaces/cloudflaresqlqueryresult/)\<`T`\>\>

Defined in: packages/messaging/dist/adapters/cloudflare/sql-client.d.ts:8

#### Type Parameters

##### T

`T` = `Record`\<`string`, `unknown`\>

#### Parameters

##### sql

`string`

##### params?

readonly `unknown`[]

#### Returns

`Promise`\<[`CloudflareSqlQueryResult`](/api/k-msg/src/adapters/cloudflare/interfaces/cloudflaresqlqueryresult/)\<`T`\>\>

***

### transaction()?

> `optional` **transaction**\<`T`\>(`fn`): `Promise`\<`T`\>

Defined in: packages/messaging/dist/adapters/cloudflare/sql-client.d.ts:9

#### Type Parameters

##### T

`T`

#### Parameters

##### fn

(`tx`) => `Promise`\<`T`\>

#### Returns

`Promise`\<`T`\>
