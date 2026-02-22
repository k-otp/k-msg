---
editUrl: false
next: false
prev: false
title: "SmsDefaultSendInput"
---

> **SmsDefaultSendInput** = `Omit`\<[`SmsSendOptions`](/api/core/src/interfaces/smssendoptions/), `"type"` \| `"text"`\> & `object`

Defined in: [packages/core/src/types/message.ts:283](https://github.com/k-otp/k-msg/blob/main/packages/core/src/types/message.ts#L283)

## Type Declaration

### content?

> `optional` **content**: `string`

Alias for `text`.

### text?

> `optional` **text**: `string`

SMS text. If omitted, `content` is used.

### type?

> `optional` **type**: `undefined`
