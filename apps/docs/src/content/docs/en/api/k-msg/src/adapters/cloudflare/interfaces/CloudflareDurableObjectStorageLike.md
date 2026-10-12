---
editUrl: false
next: false
prev: false
title: "CloudflareDurableObjectStorageLike"
---

Defined in: [packages/messaging/src/adapters/cloudflare/object-storage.ts:68](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-storage.ts#L68)

## Methods

### delete()

> **delete**(`key`): `Promise`\<`boolean` \| `undefined`\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-storage.ts:71](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-storage.ts#L71)

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`boolean` \| `undefined`\>

***

### get()

> **get**\<`T`\>(`key`): `Promise`\<`T` \| `undefined`\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-storage.ts:69](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-storage.ts#L69)

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

Defined in: [packages/messaging/src/adapters/cloudflare/object-storage.ts:72](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-storage.ts#L72)

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

###### startAfter?

`string`

Lists keys after this one, as Durable Object storage pages.

#### Returns

`Promise`\<`Map`\<`string`, `T`\>\>

***

### put()

> **put**\<`T`\>(`key`, `value`): `Promise`\<`void`\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-storage.ts:70](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-storage.ts#L70)

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
