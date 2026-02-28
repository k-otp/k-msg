---
editUrl: false
next: false
prev: false
title: "SendingOptions"
---

Defined in: [packages/messaging/src/types/message.runtime.ts:32](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.runtime.ts#L32)

## Extended by

- [`BulkSendingOptions`](/api/messaging/src/interfaces/bulksendingoptions/)

## Properties

### deduplication?

> `optional` **deduplication**: `object`

Defined in: [packages/messaging/src/types/message.runtime.ts:41](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.runtime.ts#L41)

#### enabled

> **enabled**: `boolean`

#### window

> **window**: `number`

***

### failover?

> `optional` **failover**: `object`

Defined in: [packages/messaging/src/types/message.runtime.ts:35](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.runtime.ts#L35)

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

Defined in: [packages/messaging/src/types/message.runtime.ts:33](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.runtime.ts#L33)

***

### tracking?

> `optional` **tracking**: `object`

Defined in: [packages/messaging/src/types/message.runtime.ts:45](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.runtime.ts#L45)

#### enabled

> **enabled**: `boolean`

#### webhookUrl?

> `optional` **webhookUrl**: `string`

***

### ttl?

> `optional` **ttl**: `number`

Defined in: [packages/messaging/src/types/message.runtime.ts:34](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.runtime.ts#L34)
