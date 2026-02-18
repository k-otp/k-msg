---
editUrl: false
next: false
prev: false
title: "CloudflareObjectStorage"
---

Defined in: packages/messaging/dist/adapters/cloudflare/object-storage.d.ts:1

## Methods

### delete()

> **delete**(`key`): `Promise`\<`void`\>

Defined in: packages/messaging/dist/adapters/cloudflare/object-storage.d.ts:4

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`void`\>

***

### get()

> **get**(`key`): `Promise`\<`string` \| `null`\>

Defined in: packages/messaging/dist/adapters/cloudflare/object-storage.d.ts:2

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`string` \| `null`\>

***

### list()

> **list**(`prefix`): `Promise`\<`string`[]\>

Defined in: packages/messaging/dist/adapters/cloudflare/object-storage.d.ts:5

#### Parameters

##### prefix

`string`

#### Returns

`Promise`\<`string`[]\>

***

### put()

> **put**(`key`, `value`): `Promise`\<`void`\>

Defined in: packages/messaging/dist/adapters/cloudflare/object-storage.d.ts:3

#### Parameters

##### key

`string`

##### value

`string`

#### Returns

`Promise`\<`void`\>
