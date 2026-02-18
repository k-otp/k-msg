---
editUrl: false
next: false
prev: false
title: "DeliveryReport"
---

Defined in: [packages/messaging/src/types/message.types.ts:92](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.types.ts#L92)

## Properties

### attempts

> **attempts**: [`DeliveryAttempt`](/api/messaging/src/interfaces/deliveryattempt/)[]

Defined in: [packages/messaging/src/types/message.types.ts:101](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.types.ts#L101)

***

### clickedAt?

> `optional` **clickedAt**: `Date`

Defined in: [packages/messaging/src/types/message.types.ts:98](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.types.ts#L98)

***

### deliveredAt?

> `optional` **deliveredAt**: `Date`

Defined in: [packages/messaging/src/types/message.types.ts:97](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.types.ts#L97)

***

### error?

> `optional` **error**: [`MessageError`](/api/messaging/src/interfaces/messageerror/)

Defined in: [packages/messaging/src/types/message.types.ts:100](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.types.ts#L100)

***

### failedAt?

> `optional` **failedAt**: `Date`

Defined in: [packages/messaging/src/types/message.types.ts:99](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.types.ts#L99)

***

### messageId

> **messageId**: `string`

Defined in: [packages/messaging/src/types/message.types.ts:93](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.types.ts#L93)

***

### metadata

> **metadata**: `Record`\<`string`, `unknown`\>

Defined in: [packages/messaging/src/types/message.types.ts:102](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.types.ts#L102)

***

### phoneNumber

> **phoneNumber**: `string`

Defined in: [packages/messaging/src/types/message.types.ts:94](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.types.ts#L94)

***

### sentAt?

> `optional` **sentAt**: `Date`

Defined in: [packages/messaging/src/types/message.types.ts:96](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.types.ts#L96)

***

### status

> **status**: [`MessageStatus`](/api/messaging/src/enumerations/messagestatus/)

Defined in: [packages/messaging/src/types/message.types.ts:95](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.types.ts#L95)
