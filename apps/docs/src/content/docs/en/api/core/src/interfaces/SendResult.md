---
editUrl: false
next: false
prev: false
title: "SendResult"
---

Defined in: [packages/core/src/types/message.ts:378](https://github.com/k-otp/k-msg/blob/main/packages/core/src/types/message.ts#L378)

Result of a message send operation.
Returned by Provider.send() and KMsg.send().

## Properties

### messageId

> **messageId**: `string`

Defined in: [packages/core/src/types/message.ts:382](https://github.com/k-otp/k-msg/blob/main/packages/core/src/types/message.ts#L382)

Correlation id (equals the request `messageId`).

***

### providerId

> **providerId**: `string`

Defined in: [packages/core/src/types/message.ts:386](https://github.com/k-otp/k-msg/blob/main/packages/core/src/types/message.ts#L386)

Identifier of the provider that handled this message.

***

### providerMessageId?

> `optional` **providerMessageId?**: `string`

Defined in: [packages/core/src/types/message.ts:390](https://github.com/k-otp/k-msg/blob/main/packages/core/src/types/message.ts#L390)

Provider-specific message identifier for tracking.

***

### raw?

> `optional` **raw?**: `unknown`

Defined in: [packages/core/src/types/message.ts:410](https://github.com/k-otp/k-msg/blob/main/packages/core/src/types/message.ts#L410)

Raw provider response for debugging (provider-specific shape).

***

### status

> **status**: [`MessageStatus`](/en/api/core/src/type-aliases/messagestatus/)

Defined in: [packages/core/src/types/message.ts:394](https://github.com/k-otp/k-msg/blob/main/packages/core/src/types/message.ts#L394)

Current delivery status of the message.

***

### to

> **to**: `string`

Defined in: [packages/core/src/types/message.ts:402](https://github.com/k-otp/k-msg/blob/main/packages/core/src/types/message.ts#L402)

Recipient phone number.

***

### type

> **type**: [`MessageType`](/en/api/core/src/type-aliases/messagetype/)

Defined in: [packages/core/src/types/message.ts:398](https://github.com/k-otp/k-msg/blob/main/packages/core/src/types/message.ts#L398)

The message type that was sent.

***

### warnings?

> `optional` **warnings?**: [`SendWarning`](/en/api/core/src/interfaces/sendwarning/)[]

Defined in: [packages/core/src/types/message.ts:406](https://github.com/k-otp/k-msg/blob/main/packages/core/src/types/message.ts#L406)

Non-fatal warnings (e.g., failover partially applied).
