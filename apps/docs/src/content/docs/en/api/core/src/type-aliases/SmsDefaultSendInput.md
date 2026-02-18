---
editUrl: false
next: false
prev: false
title: "SmsDefaultSendInput"
---

> **SmsDefaultSendInput** = `Omit`\<[`SmsSendOptions`](/api/core/src/interfaces/smssendoptions/), `"type"` \| `"text"`\> & `object`

Defined in: [packages/core/src/types/message.ts:265](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/core/src/types/message.ts#L265)

## Type Declaration

### content?

> `optional` **content**: `string`

Alias for `text`.

### text?

> `optional` **text**: `string`

SMS text. If omitted, `content` is used.

### type?

> `optional` **type**: `undefined`
