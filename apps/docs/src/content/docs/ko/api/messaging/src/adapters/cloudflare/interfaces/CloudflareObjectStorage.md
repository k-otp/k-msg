---
editUrl: false
next: false
prev: false
title: "CloudflareObjectStorage"
---

Defined in: [packages/messaging/src/adapters/cloudflare/object-storage.ts:1](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-storage.ts#L1)

## Methods

### delete()

> **delete**(`key`): `Promise`\<`void`\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-storage.ts:4](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-storage.ts#L4)

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`void`\>

***

### get()

> **get**(`key`): `Promise`\<`string` \| `null`\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-storage.ts:2](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-storage.ts#L2)

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`string` \| `null`\>

***

### list()

> **list**(`prefix`): `Promise`\<`string`[]\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-storage.ts:5](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-storage.ts#L5)

#### Parameters

##### prefix

`string`

#### Returns

`Promise`\<`string`[]\>

***

### put()

> **put**(`key`, `value`): `Promise`\<`void`\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-storage.ts:3](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-storage.ts#L3)

#### Parameters

##### key

`string`

##### value

`string`

#### Returns

`Promise`\<`void`\>
