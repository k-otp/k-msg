---
editUrl: false
next: false
prev: false
title: "CloudflareDurableObjectStorageLike"
---

Defined in: packages/messaging/dist/adapters/cloudflare/object-storage.d.ts:42

## Methods

### delete()

> **delete**(`key`): `Promise`\<`boolean` \| `undefined`\>

Defined in: packages/messaging/dist/adapters/cloudflare/object-storage.d.ts:45

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`boolean` \| `undefined`\>

***

### get()

> **get**\<`T`\>(`key`): `Promise`\<`T` \| `undefined`\>

Defined in: packages/messaging/dist/adapters/cloudflare/object-storage.d.ts:43

#### Type Parameters

##### T

`T`

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`T` \| `undefined`\>

***

### list()

> **list**\<`T`\>(`options?`): `Promise`\<`Map`\<`string`, `T`\>\>

Defined in: packages/messaging/dist/adapters/cloudflare/object-storage.d.ts:46

#### Type Parameters

##### T

`T`

#### Parameters

##### options?

###### cursor?

`string`

###### limit?

`number`

###### prefix?

`string`

#### Returns

`Promise`\<`Map`\<`string`, `T`\>\>

***

### put()

> **put**\<`T`\>(`key`, `value`): `Promise`\<`void`\>

Defined in: packages/messaging/dist/adapters/cloudflare/object-storage.d.ts:44

#### Type Parameters

##### T

`T`

#### Parameters

##### key

`string`

##### value

`T`

#### Returns

`Promise`\<`void`\>
