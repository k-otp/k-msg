---
editUrl: false
next: false
prev: false
title: "SendResult"
---

Defined in: [packages/core/src/types/message.ts:302](https://github.com/k-otp/k-msg/blob/main/packages/core/src/types/message.ts#L302)

## Properties

### messageId

> **messageId**: `string`

Defined in: [packages/core/src/types/message.ts:306](https://github.com/k-otp/k-msg/blob/main/packages/core/src/types/message.ts#L306)

Correlation id (equals the request `messageId`).

***

### providerId

> **providerId**: `string`

Defined in: [packages/core/src/types/message.ts:307](https://github.com/k-otp/k-msg/blob/main/packages/core/src/types/message.ts#L307)

***

### providerMessageId?

> `optional` **providerMessageId**: `string`

Defined in: [packages/core/src/types/message.ts:308](https://github.com/k-otp/k-msg/blob/main/packages/core/src/types/message.ts#L308)

***

### raw?

> `optional` **raw**: `unknown`

Defined in: [packages/core/src/types/message.ts:313](https://github.com/k-otp/k-msg/blob/main/packages/core/src/types/message.ts#L313)

***

### status

> **status**: [`MessageStatus`](/api/core/src/type-aliases/messagestatus/)

Defined in: [packages/core/src/types/message.ts:309](https://github.com/k-otp/k-msg/blob/main/packages/core/src/types/message.ts#L309)

***

### to

> **to**: `string`

Defined in: [packages/core/src/types/message.ts:311](https://github.com/k-otp/k-msg/blob/main/packages/core/src/types/message.ts#L311)

***

### type

> **type**: [`MessageType`](/api/core/src/type-aliases/messagetype/)

Defined in: [packages/core/src/types/message.ts:310](https://github.com/k-otp/k-msg/blob/main/packages/core/src/types/message.ts#L310)

***

### warnings?

> `optional` **warnings**: [`SendWarning`](/api/core/src/interfaces/sendwarning/)[]

Defined in: [packages/core/src/types/message.ts:312](https://github.com/k-otp/k-msg/blob/main/packages/core/src/types/message.ts#L312)
