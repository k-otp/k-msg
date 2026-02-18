---
editUrl: false
next: false
prev: false
title: "SendInput"
---

> **SendInput** = [`SendOptions`](/api/core/src/type-aliases/sendoptions/) \| [`SmsDefaultSendInput`](/api/core/src/type-aliases/smsdefaultsendinput/)

Defined in: [packages/core/src/types/message.ts:282](https://github.com/k-otp/k-msg/blob/main/packages/core/src/types/message.ts#L282)

Developer-facing input type.
- SMS defaults allow omitting `type` and using `content`.
- Other channels are modeled as discriminated unions on `type`.
