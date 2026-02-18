---
editUrl: false
next: false
prev: false
title: "CloudflareSqlClient"
---

Defined in: [packages/messaging/src/adapters/cloudflare/sql-client.ts:8](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/adapters/cloudflare/sql-client.ts#L8)

## Properties

### dialect

> **dialect**: [`SqlDialect`](/api/messaging/src/adapters/cloudflare/type-aliases/sqldialect/)

Defined in: [packages/messaging/src/adapters/cloudflare/sql-client.ts:9](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/adapters/cloudflare/sql-client.ts#L9)

## Methods

### close()?

> `optional` **close**(): `void` \| `Promise`\<`void`\>

Defined in: [packages/messaging/src/adapters/cloudflare/sql-client.ts:15](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/adapters/cloudflare/sql-client.ts#L15)

#### Returns

`void` \| `Promise`\<`void`\>

***

### query()

> **query**\<`T`\>(`sql`, `params?`): `Promise`\<[`CloudflareSqlQueryResult`](/api/messaging/src/adapters/cloudflare/interfaces/cloudflaresqlqueryresult/)\<`T`\>\>

Defined in: [packages/messaging/src/adapters/cloudflare/sql-client.ts:10](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/adapters/cloudflare/sql-client.ts#L10)

#### Type Parameters

##### T

`T` = `Record`\<`string`, `unknown`\>

#### Parameters

##### sql

`string`

##### params?

readonly `unknown`[]

#### Returns

`Promise`\<[`CloudflareSqlQueryResult`](/api/messaging/src/adapters/cloudflare/interfaces/cloudflaresqlqueryresult/)\<`T`\>\>

***

### transaction()?

> `optional` **transaction**\<`T`\>(`fn`): `Promise`\<`T`\>

Defined in: [packages/messaging/src/adapters/cloudflare/sql-client.ts:14](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/adapters/cloudflare/sql-client.ts#L14)

#### Type Parameters

##### T

`T`

#### Parameters

##### fn

(`tx`) => `Promise`\<`T`\>

#### Returns

`Promise`\<`T`\>
