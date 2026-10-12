---
editUrl: false
next: false
prev: false
title: "CloudflareKvNamespaceLike"
---

Defined in: [packages/messaging/src/adapters/cloudflare/object-storage.ts:34](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-storage.ts#L34)

## Methods

### delete()

> **delete**(`key`): `Promise`\<`void`\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-storage.ts:37](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-storage.ts#L37)

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`void`\>

***

### get()

> **get**(`key`, `type?`): `Promise`\<`string` \| `null`\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-storage.ts:35](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-storage.ts#L35)

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

Defined in: [packages/messaging/src/adapters/cloudflare/object-storage.ts:38](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-storage.ts#L38)

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

Defined in: [packages/messaging/src/adapters/cloudflare/object-storage.ts:36](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-storage.ts#L36)

#### Parameters

##### key

`string`

##### value

`string`

#### Returns

`Promise`\<`void`\>
