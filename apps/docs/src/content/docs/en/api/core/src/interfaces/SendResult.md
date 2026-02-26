---
editUrl: false
next: false
prev: false
title: "SendResult"
---

Defined in: [packages/core/src/types/message.ts:344](https://github.com/k-otp/k-msg/blob/main/packages/core/src/types/message.ts#L344)

Result of a message send operation.
Returned by Provider.send() and KMsg.send().

## Properties

### messageId

> **messageId**: `string`

Defined in: [packages/core/src/types/message.ts:348](https://github.com/k-otp/k-msg/blob/main/packages/core/src/types/message.ts#L348)

Correlation id (equals the request `messageId`).

***

### providerId

> **providerId**: `string`

Defined in: [packages/core/src/types/message.ts:352](https://github.com/k-otp/k-msg/blob/main/packages/core/src/types/message.ts#L352)

Identifier of the provider that handled this message.

***

### providerMessageId?

> `optional` **providerMessageId**: `string`

Defined in: [packages/core/src/types/message.ts:356](https://github.com/k-otp/k-msg/blob/main/packages/core/src/types/message.ts#L356)

Provider-specific message identifier for tracking.

***

### raw?

> `optional` **raw**: `unknown`

Defined in: [packages/core/src/types/message.ts:376](https://github.com/k-otp/k-msg/blob/main/packages/core/src/types/message.ts#L376)

Raw provider response for debugging (provider-specific shape).

***

### status

> **status**: [`MessageStatus`](/api/core/src/type-aliases/messagestatus/)

Defined in: [packages/core/src/types/message.ts:360](https://github.com/k-otp/k-msg/blob/main/packages/core/src/types/message.ts#L360)

Current delivery status of the message.

***

### to

> **to**: `string`

Defined in: [packages/core/src/types/message.ts:368](https://github.com/k-otp/k-msg/blob/main/packages/core/src/types/message.ts#L368)

Recipient phone number.

***

### type

> **type**: [`MessageType`](/api/core/src/type-aliases/messagetype/)

Defined in: [packages/core/src/types/message.ts:364](https://github.com/k-otp/k-msg/blob/main/packages/core/src/types/message.ts#L364)

The message type that was sent.

***

### warnings?

> `optional` **warnings**: [`SendWarning`](/api/core/src/interfaces/sendwarning/)[]

Defined in: [packages/core/src/types/message.ts:372](https://github.com/k-otp/k-msg/blob/main/packages/core/src/types/message.ts#L372)

Non-fatal warnings (e.g., failover partially applied).
