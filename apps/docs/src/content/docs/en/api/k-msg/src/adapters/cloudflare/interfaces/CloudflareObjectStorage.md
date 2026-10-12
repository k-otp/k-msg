---
editUrl: false
next: false
prev: false
title: "CloudflareObjectStorage"
---

Defined in: [packages/messaging/src/adapters/cloudflare/object-storage.ts:1](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-storage.ts#L1)

## Properties

### consistency?

> `readonly` `optional` **consistency?**: `"serialized"` \| `"strong"` \| `"eventual"`

Defined in: [packages/messaging/src/adapters/cloudflare/object-storage.ts:10](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-storage.ts#L10)

What a read-then-write sequence can rely on. Message delivery progress is
checkpointed with such a sequence, so only `"serialized"` storage, whose
reads and writes one coordinator runs one at a time (Durable Object
storage), can fence a stale worker. Leaving it out is the same as
`"strong"`: reads see earlier writes, but two workers can interleave
(R2). `"eventual"` stores (KV) may even read old values.

## Methods

### delete()

> **delete**(`key`): `Promise`\<`void`\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-storage.ts:13](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-storage.ts#L13)

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`void`\>

***

### entries()?

> `optional` **entries**(`prefix`): `AsyncIterable`\<\[`string`, `string`\]\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-storage.ts:20](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-storage.ts#L20)

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

Defined in: [packages/messaging/src/adapters/cloudflare/object-storage.ts:11](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-storage.ts#L11)

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`string` \| `null`\>

***

### list()

> **list**(`prefix`): `Promise`\<`string`[]\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-storage.ts:14](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-storage.ts#L14)

#### Parameters

##### prefix

`string`

#### Returns

`Promise`\<`string`[]\>

***

### put()

> **put**(`key`, `value`): `Promise`\<`void`\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-storage.ts:12](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-storage.ts#L12)

#### Parameters

##### key

`string`

##### value

`string`

#### Returns

`Promise`\<`void`\>
