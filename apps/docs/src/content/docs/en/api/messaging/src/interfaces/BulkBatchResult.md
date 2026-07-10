---
editUrl: false
next: false
prev: false
title: "BulkBatchResult"
---

Defined in: [packages/messaging/src/types/message.runtime.ts:107](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.runtime.ts#L107)

## Properties

### batchId

> **batchId**: `string`

Defined in: [packages/messaging/src/types/message.runtime.ts:108](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.runtime.ts#L108)

***

### batchNumber

> **batchNumber**: `number`

Defined in: [packages/messaging/src/types/message.runtime.ts:109](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.runtime.ts#L109)

***

### completedAt?

> `optional` **completedAt?**: `Date`

Defined in: [packages/messaging/src/types/message.runtime.ts:113](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.runtime.ts#L113)

***

### createdAt

> **createdAt**: `Date`

Defined in: [packages/messaging/src/types/message.runtime.ts:112](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.runtime.ts#L112)

***

### recipients

> **recipients**: `object`[]

Defined in: [packages/messaging/src/types/message.runtime.ts:110](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.runtime.ts#L110)

#### error?

> `optional` **error?**: `object`

##### error.code

> **code**: `string`

##### error.details?

> `optional` **details?**: `Record`\<`string`, `unknown`\>

##### error.message

> **message**: `string`

#### messageId?

> `optional` **messageId?**: `string`

#### metadata?

> `optional` **metadata?**: `Record`\<`string`, `unknown`\>

#### phoneNumber

> **phoneNumber**: `string`

#### status

> **status**: [`MessageStatus`](/en/api/messaging/src/enumerations/messagestatus/)

***

### status

> **status**: `"failed"` \| `"pending"` \| `"processing"` \| `"completed"`

Defined in: [packages/messaging/src/types/message.runtime.ts:111](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.runtime.ts#L111)
