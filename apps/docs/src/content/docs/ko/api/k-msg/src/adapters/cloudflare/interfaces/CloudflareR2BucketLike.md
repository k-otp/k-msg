---
editUrl: false
next: false
prev: false
title: "CloudflareR2BucketLike"
---

Defined in: packages/messaging/dist/adapters/cloudflare/object-storage.d.ts:26

## Methods

### delete()

> **delete**(`key`): `Promise`\<`void`\>

Defined in: packages/messaging/dist/adapters/cloudflare/object-storage.d.ts:29

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`void`\>

***

### get()

> **get**(`key`): `Promise`\<`R2ObjectBodyLike` \| `null`\>

Defined in: packages/messaging/dist/adapters/cloudflare/object-storage.d.ts:27

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`R2ObjectBodyLike` \| `null`\>

***

### list()

> **list**(`options?`): `Promise`\<\{ `cursor?`: `string`; `objects`: `object`[]; `truncated?`: `boolean`; \}\>

Defined in: packages/messaging/dist/adapters/cloudflare/object-storage.d.ts:30

#### Parameters

##### options?

###### cursor?

`string`

###### limit?

`number`

###### prefix?

`string`

#### Returns

`Promise`\<\{ `cursor?`: `string`; `objects`: `object`[]; `truncated?`: `boolean`; \}\>

***

### put()

> **put**(`key`, `value`): `Promise`\<`void`\>

Defined in: packages/messaging/dist/adapters/cloudflare/object-storage.d.ts:28

#### Parameters

##### key

`string`

##### value

`string`

#### Returns

`Promise`\<`void`\>
