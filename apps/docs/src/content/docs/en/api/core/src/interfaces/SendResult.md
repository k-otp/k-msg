---
editUrl: false
next: false
prev: false
title: "SendResult"
---

Defined in: [packages/core/src/types/message.ts:367](https://github.com/k-otp/k-msg/blob/main/packages/core/src/types/message.ts#L367)

Result of a message send operation.
Returned by Provider.send() and KMsg.send().

## Properties

### messageId

> **messageId**: `string`

Defined in: [packages/core/src/types/message.ts:371](https://github.com/k-otp/k-msg/blob/main/packages/core/src/types/message.ts#L371)

Correlation id (equals the request `messageId`).

***

### providerId

> **providerId**: `string`

Defined in: [packages/core/src/types/message.ts:375](https://github.com/k-otp/k-msg/blob/main/packages/core/src/types/message.ts#L375)

Identifier of the provider that handled this message.

***

### providerMessageId?

> `optional` **providerMessageId**: `string`

Defined in: [packages/core/src/types/message.ts:379](https://github.com/k-otp/k-msg/blob/main/packages/core/src/types/message.ts#L379)

Provider-specific message identifier for tracking.

***

### raw?

> `optional` **raw**: `unknown`

Defined in: [packages/core/src/types/message.ts:399](https://github.com/k-otp/k-msg/blob/main/packages/core/src/types/message.ts#L399)

Raw provider response for debugging (provider-specific shape).

***

### status

> **status**: [`MessageStatus`](/api/core/src/type-aliases/messagestatus/)

Defined in: [packages/core/src/types/message.ts:383](https://github.com/k-otp/k-msg/blob/main/packages/core/src/types/message.ts#L383)

Current delivery status of the message.

***

### to

> **to**: `string`

Defined in: [packages/core/src/types/message.ts:391](https://github.com/k-otp/k-msg/blob/main/packages/core/src/types/message.ts#L391)

Recipient phone number.

***

### type

> **type**: [`MessageType`](/api/core/src/type-aliases/messagetype/)

Defined in: [packages/core/src/types/message.ts:387](https://github.com/k-otp/k-msg/blob/main/packages/core/src/types/message.ts#L387)

The message type that was sent.

***

### warnings?

> `optional` **warnings**: [`SendWarning`](/api/core/src/interfaces/sendwarning/)[]

Defined in: [packages/core/src/types/message.ts:395](https://github.com/k-otp/k-msg/blob/main/packages/core/src/types/message.ts#L395)

Non-fatal warnings (e.g., failover partially applied).
