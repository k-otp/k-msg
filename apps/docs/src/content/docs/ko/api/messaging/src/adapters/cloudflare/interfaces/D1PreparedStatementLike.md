---
editUrl: false
next: false
prev: false
title: "D1PreparedStatementLike"
---

Defined in: [packages/messaging/src/adapters/cloudflare/sql-client.ts:18](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/adapters/cloudflare/sql-client.ts#L18)

## Methods

### all()

> **all**\<`T`\>(): `Promise`\<\{ `meta?`: \{ `changes?`: `number`; \}; `results?`: `T`[]; `success?`: `boolean`; \}\>

Defined in: [packages/messaging/src/adapters/cloudflare/sql-client.ts:20](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/adapters/cloudflare/sql-client.ts#L20)

#### Type Parameters

##### T

`T` = `Record`\<`string`, `unknown`\>

#### Returns

`Promise`\<\{ `meta?`: \{ `changes?`: `number`; \}; `results?`: `T`[]; `success?`: `boolean`; \}\>

***

### bind()

> **bind**(...`values`): `D1PreparedStatementLike`

Defined in: [packages/messaging/src/adapters/cloudflare/sql-client.ts:19](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/adapters/cloudflare/sql-client.ts#L19)

#### Parameters

##### values

...`unknown`[]

#### Returns

`D1PreparedStatementLike`

***

### run()?

> `optional` **run**(): `Promise`\<\{ `meta?`: \{ `changes?`: `number`; \}; `success?`: `boolean`; \}\>

Defined in: [packages/messaging/src/adapters/cloudflare/sql-client.ts:25](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/adapters/cloudflare/sql-client.ts#L25)

#### Returns

`Promise`\<\{ `meta?`: \{ `changes?`: `number`; \}; `success?`: `boolean`; \}\>
