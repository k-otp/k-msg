---
editUrl: false
next: false
prev: false
title: "BulkSendingOptions"
---

Defined in: [packages/messaging/src/types/message.runtime.ts:133](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.runtime.ts#L133)

## Extends

- [`SendingOptions`](/api/messaging/src/interfaces/sendingoptions/)

## Properties

### batchDelay?

> `optional` **batchDelay**: `number`

Defined in: [packages/messaging/src/types/message.runtime.ts:137](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.runtime.ts#L137)

***

### batchSize?

> `optional` **batchSize**: `number`

Defined in: [packages/messaging/src/types/message.runtime.ts:136](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.runtime.ts#L136)

***

### deduplication?

> `optional` **deduplication**: `object`

Defined in: [packages/messaging/src/types/message.runtime.ts:41](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.runtime.ts#L41)

#### enabled

> **enabled**: `boolean`

#### window

> **window**: `number`

#### Inherited from

[`SendingOptions`](/api/messaging/src/interfaces/sendingoptions/).[`deduplication`](/api/messaging/src/interfaces/sendingoptions/#deduplication)

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

#### Inherited from

[`SendingOptions`](/api/messaging/src/interfaces/sendingoptions/).[`failover`](/api/messaging/src/interfaces/sendingoptions/#failover)

***

### from?

> `optional` **from**: `string`

Defined in: [packages/messaging/src/types/message.runtime.ts:134](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.runtime.ts#L134)

***

### maxConcurrency?

> `optional` **maxConcurrency**: `number`

Defined in: [packages/messaging/src/types/message.runtime.ts:138](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.runtime.ts#L138)

***

### priority?

> `optional` **priority**: `"high"` \| `"normal"` \| `"low"`

Defined in: [packages/messaging/src/types/message.runtime.ts:33](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.runtime.ts#L33)

#### Inherited from

[`SendingOptions`](/api/messaging/src/interfaces/sendingoptions/).[`priority`](/api/messaging/src/interfaces/sendingoptions/#priority)

***

### retryOptions?

> `optional` **retryOptions**: `Partial`\<[`RetryOptions`](/api/core/src/interfaces/retryoptions/)\>

Defined in: [packages/messaging/src/types/message.runtime.ts:139](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.runtime.ts#L139)

***

### senderNumber?

> `optional` **senderNumber**: `string`

Defined in: [packages/messaging/src/types/message.runtime.ts:135](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.runtime.ts#L135)

***

### tracking?

> `optional` **tracking**: `object`

Defined in: [packages/messaging/src/types/message.runtime.ts:45](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.runtime.ts#L45)

#### enabled

> **enabled**: `boolean`

#### webhookUrl?

> `optional` **webhookUrl**: `string`

#### Inherited from

[`SendingOptions`](/api/messaging/src/interfaces/sendingoptions/).[`tracking`](/api/messaging/src/interfaces/sendingoptions/#tracking)

***

### ttl?

> `optional` **ttl**: `number`

Defined in: [packages/messaging/src/types/message.runtime.ts:34](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.runtime.ts#L34)

#### Inherited from

[`SendingOptions`](/api/messaging/src/interfaces/sendingoptions/).[`ttl`](/api/messaging/src/interfaces/sendingoptions/#ttl)
