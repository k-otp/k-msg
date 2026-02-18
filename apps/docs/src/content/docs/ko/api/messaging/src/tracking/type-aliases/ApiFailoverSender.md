---
editUrl: false
next: false
prev: false
title: "ApiFailoverSender"
---

> **ApiFailoverSender** = (`input`, `context`) => `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`SendResult`](/api/core/src/interfaces/sendresult/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/messaging/src/delivery-tracking/types.ts:64](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/delivery-tracking/types.ts#L64)

## Parameters

### input

[`SendInput`](/api/core/src/type-aliases/sendinput/)

### context

[`ApiFailoverAttemptContext`](/api/messaging/src/tracking/interfaces/apifailoverattemptcontext/)

## Returns

`Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`SendResult`](/api/core/src/interfaces/sendresult/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>
