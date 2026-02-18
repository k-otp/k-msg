---
editUrl: false
next: false
prev: false
title: "SendingOptions"
---

Defined in: [packages/messaging/src/types/message.types.ts:33](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.types.ts#L33)

## Extended by

- [`BulkSendingOptions`](/api/messaging/src/interfaces/bulksendingoptions/)

## Properties

### deduplication?

> `optional` **deduplication**: `object`

Defined in: [packages/messaging/src/types/message.types.ts:42](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.types.ts#L42)

#### enabled

> **enabled**: `boolean`

#### window

> **window**: `number`

***

### failover?

> `optional` **failover**: `object`

Defined in: [packages/messaging/src/types/message.types.ts:36](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.types.ts#L36)

#### enabled

> **enabled**: `boolean`

#### fallbackChannel?

> `optional` **fallbackChannel**: `"sms"` \| `"lms"`

#### fallbackContent?

> `optional` **fallbackContent**: `string`

#### fallbackTitle?

> `optional` **fallbackTitle**: `string`

***

### priority?

> `optional` **priority**: `"high"` \| `"normal"` \| `"low"`

Defined in: [packages/messaging/src/types/message.types.ts:34](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.types.ts#L34)

***

### tracking?

> `optional` **tracking**: `object`

Defined in: [packages/messaging/src/types/message.types.ts:46](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.types.ts#L46)

#### enabled

> **enabled**: `boolean`

#### webhookUrl?

> `optional` **webhookUrl**: `string`

***

### ttl?

> `optional` **ttl**: `number`

Defined in: [packages/messaging/src/types/message.types.ts:35](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.types.ts#L35)
