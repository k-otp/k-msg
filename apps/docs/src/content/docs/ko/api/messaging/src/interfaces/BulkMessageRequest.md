---
editUrl: false
next: false
prev: false
title: "BulkMessageRequest"
---

Defined in: [packages/messaging/src/types/message.types.ts:121](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/types/message.types.ts#L121)

## Properties

### commonVariables?

> `optional` **commonVariables**: [`VariableMap`](/api/messaging/src/interfaces/variablemap/)

Defined in: [packages/messaging/src/types/message.types.ts:129](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/types/message.types.ts#L129)

***

### options?

> `optional` **options**: [`BulkSendingOptions`](/api/messaging/src/interfaces/bulksendingoptions/)

Defined in: [packages/messaging/src/types/message.types.ts:130](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/types/message.types.ts#L130)

***

### recipients

> **recipients**: [`BulkRecipient`](/api/messaging/src/interfaces/bulkrecipient/)[]

Defined in: [packages/messaging/src/types/message.types.ts:128](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/types/message.types.ts#L128)

***

### templateId

> **templateId**: `string`

Defined in: [packages/messaging/src/types/message.types.ts:127](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/types/message.types.ts#L127)

***

### type?

> `optional` **type**: [`BulkMessageType`](/api/messaging/src/type-aliases/bulkmessagetype/)

Defined in: [packages/messaging/src/types/message.types.ts:126](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/types/message.types.ts#L126)

BulkMessageSender currently targets template-based channels.
Default: "ALIMTALK"
