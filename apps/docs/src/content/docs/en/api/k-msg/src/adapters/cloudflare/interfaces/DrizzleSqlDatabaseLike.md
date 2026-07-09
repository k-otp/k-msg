---
editUrl: false
next: false
prev: false
title: "DrizzleSqlDatabaseLike"
---

Defined in: [packages/messaging/src/adapters/cloudflare/sql-client.ts:32](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-client.ts#L32)

## Methods

### execute()

> **execute**(`query`): `unknown`

Defined in: [packages/messaging/src/adapters/cloudflare/sql-client.ts:33](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-client.ts#L33)

#### Parameters

##### query

`unknown`

#### Returns

`unknown`

***

### transaction()?

> `optional` **transaction**\<`T`\>(`fn`): `Promise`\<`T`\>

Defined in: [packages/messaging/src/adapters/cloudflare/sql-client.ts:34](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-client.ts#L34)

#### Type Parameters

##### T

`T`

#### Parameters

##### fn

(`tx`) => `Promise`\<`T`\>

#### Returns

`Promise`\<`T`\>
