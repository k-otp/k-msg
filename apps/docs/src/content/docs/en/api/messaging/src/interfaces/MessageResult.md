---
editUrl: false
next: false
prev: false
title: "MessageResult"
---

Defined in: [packages/messaging/src/types/message.runtime.ts:51](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.runtime.ts#L51)

## Properties

### metadata

> **metadata**: `object`

Defined in: [packages/messaging/src/types/message.runtime.ts:60](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.runtime.ts#L60)

#### createdAt

> **createdAt**: `Date`

#### provider

> **provider**: `string`

#### templateId

> **templateId**: `string`

***

### requestId

> **requestId**: `string`

Defined in: [packages/messaging/src/types/message.runtime.ts:52](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.runtime.ts#L52)

***

### results

> **results**: [`RecipientResult`](/api/messaging/src/interfaces/recipientresult/)[]

Defined in: [packages/messaging/src/types/message.runtime.ts:53](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.runtime.ts#L53)

***

### summary

> **summary**: `object`

Defined in: [packages/messaging/src/types/message.runtime.ts:54](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/types/message.runtime.ts#L54)

#### failed

> **failed**: `number`

#### queued

> **queued**: `number`

#### sent

> **sent**: `number`

#### total

> **total**: `number`
