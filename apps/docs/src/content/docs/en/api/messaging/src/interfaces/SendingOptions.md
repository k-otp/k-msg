---
editUrl: false
next: false
prev: false
title: "SendingOptions"
---

Defined in: packages/messaging/src/types/message.runtime.ts:32

## Extended by

- [`BulkSendingOptions`](/api/messaging/src/interfaces/bulksendingoptions/)

## Properties

### deduplication?

> `optional` **deduplication**: `object`

Defined in: packages/messaging/src/types/message.runtime.ts:41

#### enabled

> **enabled**: `boolean`

#### window

> **window**: `number`

***

### failover?

> `optional` **failover**: `object`

Defined in: packages/messaging/src/types/message.runtime.ts:35

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

Defined in: packages/messaging/src/types/message.runtime.ts:33

***

### tracking?

> `optional` **tracking**: `object`

Defined in: packages/messaging/src/types/message.runtime.ts:45

#### enabled

> **enabled**: `boolean`

#### webhookUrl?

> `optional` **webhookUrl**: `string`

***

### ttl?

> `optional` **ttl**: `number`

Defined in: packages/messaging/src/types/message.runtime.ts:34
