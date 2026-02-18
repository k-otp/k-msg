---
editUrl: false
next: false
prev: false
title: "CloudflareR2BucketLike"
---

Defined in: [packages/messaging/src/adapters/cloudflare/object-storage.ts:27](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/adapters/cloudflare/object-storage.ts#L27)

## Methods

### delete()

> **delete**(`key`): `Promise`\<`void`\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-storage.ts:30](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/adapters/cloudflare/object-storage.ts#L30)

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`void`\>

***

### get()

> **get**(`key`): `Promise`\<`R2ObjectBodyLike` \| `null`\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-storage.ts:28](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/adapters/cloudflare/object-storage.ts#L28)

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`R2ObjectBodyLike` \| `null`\>

***

### list()

> **list**(`options?`): `Promise`\<\{ `cursor?`: `string`; `objects`: `object`[]; `truncated?`: `boolean`; \}\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-storage.ts:31](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/adapters/cloudflare/object-storage.ts#L31)

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

Defined in: [packages/messaging/src/adapters/cloudflare/object-storage.ts:29](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/adapters/cloudflare/object-storage.ts#L29)

#### Parameters

##### key

`string`

##### value

`string`

#### Returns

`Promise`\<`void`\>
