---
editUrl: false
next: false
prev: false
title: "CloudflareDurableObjectStorageLike"
---

Defined in: [packages/messaging/src/adapters/cloudflare/object-storage.ts:42](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-storage.ts#L42)

## Methods

### delete()

> **delete**(`key`): `Promise`\<`boolean` \| `undefined`\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-storage.ts:45](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-storage.ts#L45)

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`boolean` \| `undefined`\>

***

### get()

> **get**\<`T`\>(`key`): `Promise`\<`T` \| `undefined`\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-storage.ts:43](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-storage.ts#L43)

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

Defined in: [packages/messaging/src/adapters/cloudflare/object-storage.ts:46](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-storage.ts#L46)

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

Defined in: [packages/messaging/src/adapters/cloudflare/object-storage.ts:44](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-storage.ts#L44)

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
