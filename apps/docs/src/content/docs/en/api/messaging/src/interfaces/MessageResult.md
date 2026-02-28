---
editUrl: false
next: false
prev: false
title: "MessageResult"
---

Defined in: packages/messaging/src/types/message.runtime.ts:51

## Properties

### metadata

> **metadata**: `object`

Defined in: packages/messaging/src/types/message.runtime.ts:60

#### createdAt

> **createdAt**: `Date`

#### provider

> **provider**: `string`

#### templateId

> **templateId**: `string`

***

### requestId

> **requestId**: `string`

Defined in: packages/messaging/src/types/message.runtime.ts:52

***

### results

> **results**: [`RecipientResult`](/api/messaging/src/interfaces/recipientresult/)[]

Defined in: packages/messaging/src/types/message.runtime.ts:53

***

### summary

> **summary**: `object`

Defined in: packages/messaging/src/types/message.runtime.ts:54

#### failed

> **failed**: `number`

#### queued

> **queued**: `number`

#### sent

> **sent**: `number`

#### total

> **total**: `number`
