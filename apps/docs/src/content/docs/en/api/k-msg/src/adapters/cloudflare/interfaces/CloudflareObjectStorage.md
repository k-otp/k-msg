---
editUrl: false
next: false
prev: false
title: "CloudflareObjectStorage"
---

Defined in: [packages/messaging/src/adapters/cloudflare/object-storage.ts:1](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-storage.ts#L1)

## Properties

### consistency?

> `readonly` `optional` **consistency?**: `"strong"` \| `"eventual"`

Defined in: [packages/messaging/src/adapters/cloudflare/object-storage.ts:3](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-storage.ts#L3)

Eventual stores cannot safely checkpoint message delivery progress.

## Methods

### delete()

> **delete**(`key`): `Promise`\<`void`\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-storage.ts:6](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-storage.ts#L6)

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`void`\>

***

### entries()?

> `optional` **entries**(`prefix`): `AsyncIterable`\<\[`string`, `string`\]\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-storage.ts:13](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-storage.ts#L13)

The keys under `prefix` with their values, a listing page at a time, for
storage whose listing returns values (Durable Objects), so reading
everything under a prefix takes no get() per key.

#### Parameters

##### prefix

`string`

#### Returns

`AsyncIterable`\<\[`string`, `string`\]\>

***

### get()

> **get**(`key`): `Promise`\<`string` \| `null`\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-storage.ts:4](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-storage.ts#L4)

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`string` \| `null`\>

***

### list()

> **list**(`prefix`): `Promise`\<`string`[]\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-storage.ts:7](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-storage.ts#L7)

#### Parameters

##### prefix

`string`

#### Returns

`Promise`\<`string`[]\>

***

### put()

> **put**(`key`, `value`): `Promise`\<`void`\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-storage.ts:5](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-storage.ts#L5)

#### Parameters

##### key

`string`

##### value

`string`

#### Returns

`Promise`\<`void`\>
