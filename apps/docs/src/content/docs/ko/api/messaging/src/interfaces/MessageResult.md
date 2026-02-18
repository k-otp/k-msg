---
editUrl: false
next: false
prev: false
title: "MessageResult"
---

Defined in: [packages/messaging/src/types/message.types.ts:52](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.types.ts#L52)

## Properties

### metadata

> **metadata**: `object`

Defined in: [packages/messaging/src/types/message.types.ts:61](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.types.ts#L61)

#### createdAt

> **createdAt**: `Date`

#### provider

> **provider**: `string`

#### templateId

> **templateId**: `string`

***

### requestId

> **requestId**: `string`

Defined in: [packages/messaging/src/types/message.types.ts:53](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.types.ts#L53)

***

### results

> **results**: [`RecipientResult`](/api/messaging/src/interfaces/recipientresult/)[]

Defined in: [packages/messaging/src/types/message.types.ts:54](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.types.ts#L54)

***

### summary

> **summary**: `object`

Defined in: [packages/messaging/src/types/message.types.ts:55](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.types.ts#L55)

#### failed

> **failed**: `number`

#### queued

> **queued**: `number`

#### sent

> **sent**: `number`

#### total

> **total**: `number`
