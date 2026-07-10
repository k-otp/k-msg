---
editUrl: false
next: false
prev: false
title: "DeliveryReport"
---

Defined in: [packages/messaging/src/types/message.runtime.ts:42](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.runtime.ts#L42)

## Properties

### attempts

> **attempts**: [`DeliveryAttempt`](/en/api/messaging/src/interfaces/deliveryattempt/)[]

Defined in: [packages/messaging/src/types/message.runtime.ts:51](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.runtime.ts#L51)

***

### clickedAt?

> `optional` **clickedAt?**: `Date`

Defined in: [packages/messaging/src/types/message.runtime.ts:48](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.runtime.ts#L48)

***

### deliveredAt?

> `optional` **deliveredAt?**: `Date`

Defined in: [packages/messaging/src/types/message.runtime.ts:47](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.runtime.ts#L47)

***

### error?

> `optional` **error?**: `object`

Defined in: [packages/messaging/src/types/message.runtime.ts:50](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.runtime.ts#L50)

#### code

> **code**: `string`

#### details?

> `optional` **details?**: `Record`\<`string`, `unknown`\>

#### message

> **message**: `string`

***

### failedAt?

> `optional` **failedAt?**: `Date`

Defined in: [packages/messaging/src/types/message.runtime.ts:49](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.runtime.ts#L49)

***

### messageId

> **messageId**: `string`

Defined in: [packages/messaging/src/types/message.runtime.ts:43](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.runtime.ts#L43)

***

### metadata

> **metadata**: `Record`\<`string`, `unknown`\>

Defined in: [packages/messaging/src/types/message.runtime.ts:52](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.runtime.ts#L52)

***

### phoneNumber

> **phoneNumber**: `string`

Defined in: [packages/messaging/src/types/message.runtime.ts:44](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.runtime.ts#L44)

***

### sentAt?

> `optional` **sentAt?**: `Date`

Defined in: [packages/messaging/src/types/message.runtime.ts:46](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.runtime.ts#L46)

***

### status

> **status**: [`MessageStatus`](/en/api/messaging/src/enumerations/messagestatus/)

Defined in: [packages/messaging/src/types/message.runtime.ts:45](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.runtime.ts#L45)
