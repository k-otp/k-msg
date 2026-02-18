---
editUrl: false
next: false
prev: false
title: "BulkSendingOptions"
---

Defined in: [packages/messaging/src/types/message.types.ts:139](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/types/message.types.ts#L139)

## Extends

- [`SendingOptions`](/api/messaging/src/interfaces/sendingoptions/)

## Properties

### batchDelay?

> `optional` **batchDelay**: `number`

Defined in: [packages/messaging/src/types/message.types.ts:149](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/types/message.types.ts#L149)

***

### batchSize?

> `optional` **batchSize**: `number`

Defined in: [packages/messaging/src/types/message.types.ts:148](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/types/message.types.ts#L148)

***

### deduplication?

> `optional` **deduplication**: `object`

Defined in: [packages/messaging/src/types/message.types.ts:42](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/types/message.types.ts#L42)

#### enabled

> **enabled**: `boolean`

#### window

> **window**: `number`

#### Inherited from

[`SendingOptions`](/api/messaging/src/interfaces/sendingoptions/).[`deduplication`](/api/messaging/src/interfaces/sendingoptions/#deduplication)

***

### failover?

> `optional` **failover**: `object`

Defined in: [packages/messaging/src/types/message.types.ts:36](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/types/message.types.ts#L36)

#### enabled

> **enabled**: `boolean`

#### fallbackChannel?

> `optional` **fallbackChannel**: `"sms"` \| `"lms"`

#### fallbackContent?

> `optional` **fallbackContent**: `string`

#### fallbackTitle?

> `optional` **fallbackTitle**: `string`

#### Inherited from

[`SendingOptions`](/api/messaging/src/interfaces/sendingoptions/).[`failover`](/api/messaging/src/interfaces/sendingoptions/#failover)

***

### from?

> `optional` **from**: `string`

Defined in: [packages/messaging/src/types/message.types.ts:143](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/types/message.types.ts#L143)

Sender number / id for bulk sends (optional if KMsg defaults cover it).

***

### maxConcurrency?

> `optional` **maxConcurrency**: `number`

Defined in: [packages/messaging/src/types/message.types.ts:150](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/types/message.types.ts#L150)

***

### priority?

> `optional` **priority**: `"high"` \| `"normal"` \| `"low"`

Defined in: [packages/messaging/src/types/message.types.ts:34](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/types/message.types.ts#L34)

#### Inherited from

[`SendingOptions`](/api/messaging/src/interfaces/sendingoptions/).[`priority`](/api/messaging/src/interfaces/sendingoptions/#priority)

***

### retryOptions?

> `optional` **retryOptions**: `Partial`\<[`RetryOptions`](/api/core/src/interfaces/retryoptions/)\>

Defined in: [packages/messaging/src/types/message.types.ts:151](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/types/message.types.ts#L151)

***

### senderNumber?

> `optional` **senderNumber**: `string`

Defined in: [packages/messaging/src/types/message.types.ts:147](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/types/message.types.ts#L147)

Back-compat alias for legacy callers.

***

### tracking?

> `optional` **tracking**: `object`

Defined in: [packages/messaging/src/types/message.types.ts:46](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/types/message.types.ts#L46)

#### enabled

> **enabled**: `boolean`

#### webhookUrl?

> `optional` **webhookUrl**: `string`

#### Inherited from

[`SendingOptions`](/api/messaging/src/interfaces/sendingoptions/).[`tracking`](/api/messaging/src/interfaces/sendingoptions/#tracking)

***

### ttl?

> `optional` **ttl**: `number`

Defined in: [packages/messaging/src/types/message.types.ts:35](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/types/message.types.ts#L35)

#### Inherited from

[`SendingOptions`](/api/messaging/src/interfaces/sendingoptions/).[`ttl`](/api/messaging/src/interfaces/sendingoptions/#ttl)
