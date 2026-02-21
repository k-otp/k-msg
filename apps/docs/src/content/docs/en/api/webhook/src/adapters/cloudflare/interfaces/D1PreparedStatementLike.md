---
editUrl: false
next: false
prev: false
title: "D1PreparedStatementLike"
---

Defined in: packages/webhook/src/adapters/cloudflare/d1-client.ts:3

## Methods

### all()

> **all**\<`T`\>(): `Promise`\<\{ `results`: `T`[]; \}\>

Defined in: packages/webhook/src/adapters/cloudflare/d1-client.ts:6

#### Type Parameters

##### T

`T` *extends* `D1Row` = `D1Row`

#### Returns

`Promise`\<\{ `results`: `T`[]; \}\>

***

### bind()

> **bind**(...`values`): `D1PreparedStatementLike`

Defined in: packages/webhook/src/adapters/cloudflare/d1-client.ts:4

#### Parameters

##### values

...`unknown`[]

#### Returns

`D1PreparedStatementLike`

***

### first()

> **first**\<`T`\>(): `Promise`\<`T` \| `null`\>

Defined in: packages/webhook/src/adapters/cloudflare/d1-client.ts:5

#### Type Parameters

##### T

`T` *extends* `D1Row` = `D1Row`

#### Returns

`Promise`\<`T` \| `null`\>

***

### run()

> **run**(): `Promise`\<`unknown`\>

Defined in: packages/webhook/src/adapters/cloudflare/d1-client.ts:7

#### Returns

`Promise`\<`unknown`\>
