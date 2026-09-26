---
editUrl: false
next: false
prev: false
title: "CloudflareR2BucketLike"
---

Defined in: [packages/messaging/src/adapters/cloudflare/object-storage.ts:47](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-storage.ts#L47)

## Methods

### delete()

> **delete**(`key`): `Promise`\<`void`\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-storage.ts:50](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-storage.ts#L50)

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`void`\>

***

### get()

> **get**(`key`): `Promise`\<`R2ObjectBodyLike` \| `null`\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-storage.ts:48](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-storage.ts#L48)

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`R2ObjectBodyLike` \| `null`\>

***

### list()

> **list**(`options?`): `Promise`\<\{ `cursor?`: `string`; `objects`: `object`[]; `truncated?`: `boolean`; \}\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-storage.ts:51](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-storage.ts#L51)

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

Defined in: [packages/messaging/src/adapters/cloudflare/object-storage.ts:49](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-storage.ts#L49)

#### Parameters

##### key

`string`

##### value

`string`

#### Returns

`Promise`\<`void`\>
