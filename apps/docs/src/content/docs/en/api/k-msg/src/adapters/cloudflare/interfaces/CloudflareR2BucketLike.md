---
editUrl: false
next: false
prev: false
title: "CloudflareR2BucketLike"
---

Defined in: [packages/messaging/src/adapters/cloudflare/object-storage.ts:51](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-storage.ts#L51)

## Methods

### delete()

> **delete**(`key`): `Promise`\<`void`\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-storage.ts:54](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-storage.ts#L54)

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`void`\>

***

### get()

> **get**(`key`): `Promise`\<`R2ObjectBodyLike` \| `null`\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-storage.ts:52](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-storage.ts#L52)

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`R2ObjectBodyLike` \| `null`\>

***

### list()

> **list**(`options?`): `Promise`\<\{ `cursor?`: `string`; `objects`: `object`[]; `truncated?`: `boolean`; \}\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-storage.ts:55](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-storage.ts#L55)

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

Defined in: [packages/messaging/src/adapters/cloudflare/object-storage.ts:53](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-storage.ts#L53)

#### Parameters

##### key

`string`

##### value

`string`

#### Returns

`Promise`\<`void`\>
