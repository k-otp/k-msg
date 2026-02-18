---
editUrl: false
next: false
prev: false
title: "D1PreparedStatementLike"
---

Defined in: packages/messaging/dist/adapters/cloudflare/sql-client.d.ts:12

## Methods

### all()

> **all**\<`T`\>(): `Promise`\<\{ `meta?`: \{ `changes?`: `number`; \}; `results?`: `T`[]; `success?`: `boolean`; \}\>

Defined in: packages/messaging/dist/adapters/cloudflare/sql-client.d.ts:14

#### Type Parameters

##### T

`T` = `Record`\<`string`, `unknown`\>

#### Returns

`Promise`\<\{ `meta?`: \{ `changes?`: `number`; \}; `results?`: `T`[]; `success?`: `boolean`; \}\>

***

### bind()

> **bind**(...`values`): `D1PreparedStatementLike`

Defined in: packages/messaging/dist/adapters/cloudflare/sql-client.d.ts:13

#### Parameters

##### values

...`unknown`[]

#### Returns

`D1PreparedStatementLike`

***

### run()?

> `optional` **run**(): `Promise`\<\{ `meta?`: \{ `changes?`: `number`; \}; `success?`: `boolean`; \}\>

Defined in: packages/messaging/dist/adapters/cloudflare/sql-client.d.ts:21

#### Returns

`Promise`\<\{ `meta?`: \{ `changes?`: `number`; \}; `success?`: `boolean`; \}\>
