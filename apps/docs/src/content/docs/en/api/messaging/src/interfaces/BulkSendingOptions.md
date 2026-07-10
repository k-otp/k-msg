---
editUrl: false
next: false
prev: false
title: "BulkSendingOptions"
---

Defined in: [packages/messaging/src/types/message.runtime.ts:84](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.runtime.ts#L84)

## Extends

- [`SendingOptions`](/en/api/messaging/src/type-aliases/sendingoptions/)

## Properties

### batchDelay?

> `optional` **batchDelay?**: `number`

Defined in: [packages/messaging/src/types/message.runtime.ts:88](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.runtime.ts#L88)

***

### batchSize?

> `optional` **batchSize?**: `number`

Defined in: [packages/messaging/src/types/message.runtime.ts:87](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.runtime.ts#L87)

***

### deduplication?

> `optional` **deduplication?**: `object`

Defined in: [packages/messaging/src/types/message.schema.ts:35](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.schema.ts#L35)

#### enabled

> **enabled**: `boolean`

#### window

> **window**: `number`

#### Inherited from

`SendingOptions.deduplication`

***

### failover?

> `optional` **failover?**: `object`

Defined in: [packages/messaging/src/types/message.schema.ts:27](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.schema.ts#L27)

#### enabled

> **enabled**: `boolean`

#### fallbackChannel?

> `optional` **fallbackChannel?**: `"sms"` \| `"lms"`

#### fallbackContent?

> `optional` **fallbackContent?**: `string`

#### fallbackTitle?

> `optional` **fallbackTitle?**: `string`

#### Inherited from

`SendingOptions.failover`

***

### from?

> `optional` **from?**: `string`

Defined in: [packages/messaging/src/types/message.runtime.ts:85](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.runtime.ts#L85)

***

### maxConcurrency?

> `optional` **maxConcurrency?**: `number`

Defined in: [packages/messaging/src/types/message.runtime.ts:89](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.runtime.ts#L89)

***

### priority?

> `optional` **priority?**: `"high"` \| `"normal"` \| `"low"`

Defined in: [packages/messaging/src/types/message.schema.ts:25](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.schema.ts#L25)

#### Inherited from

`SendingOptions.priority`

***

### retryOptions?

> `optional` **retryOptions?**: `Partial`\<[`RetryOptions`](/en/api/core/src/interfaces/retryoptions/)\>

Defined in: [packages/messaging/src/types/message.runtime.ts:90](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.runtime.ts#L90)

***

### senderNumber?

> `optional` **senderNumber?**: `string`

Defined in: [packages/messaging/src/types/message.runtime.ts:86](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.runtime.ts#L86)

***

### tracking?

> `optional` **tracking?**: `object`

Defined in: [packages/messaging/src/types/message.schema.ts:41](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.schema.ts#L41)

#### enabled

> **enabled**: `boolean`

#### webhookUrl?

> `optional` **webhookUrl?**: `string`

#### Inherited from

`SendingOptions.tracking`

***

### ttl?

> `optional` **ttl?**: `number`

Defined in: [packages/messaging/src/types/message.schema.ts:26](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.schema.ts#L26)

#### Inherited from

`SendingOptions.ttl`
