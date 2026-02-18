---
editUrl: false
next: false
prev: false
title: "CloudflareKvNamespaceLike"
---

Defined in: packages/messaging/dist/adapters/cloudflare/object-storage.d.ts:7

## Methods

### delete()

> **delete**(`key`): `Promise`\<`void`\>

Defined in: packages/messaging/dist/adapters/cloudflare/object-storage.d.ts:10

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`void`\>

***

### get()

> **get**(`key`, `type?`): `Promise`\<`string` \| `null`\>

Defined in: packages/messaging/dist/adapters/cloudflare/object-storage.d.ts:8

#### Parameters

##### key

`string`

##### type?

`"text"`

#### Returns

`Promise`\<`string` \| `null`\>

***

### list()

> **list**(`options?`): `Promise`\<\{ `cursor?`: `string`; `keys`: `object`[]; `list_complete`: `boolean`; \}\>

Defined in: packages/messaging/dist/adapters/cloudflare/object-storage.d.ts:11

#### Parameters

##### options?

###### cursor?

`string`

###### limit?

`number`

###### prefix?

`string`

#### Returns

`Promise`\<\{ `cursor?`: `string`; `keys`: `object`[]; `list_complete`: `boolean`; \}\>

***

### put()

> **put**(`key`, `value`): `Promise`\<`void`\>

Defined in: packages/messaging/dist/adapters/cloudflare/object-storage.d.ts:9

#### Parameters

##### key

`string`

##### value

`string`

#### Returns

`Promise`\<`void`\>
