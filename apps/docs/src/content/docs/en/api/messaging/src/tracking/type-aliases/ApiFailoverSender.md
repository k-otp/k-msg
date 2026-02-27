---
editUrl: false
next: false
prev: false
title: "ApiFailoverSender"
---

> **ApiFailoverSender** = (`input`, `context`) => `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`SendResult`](/api/core/src/interfaces/sendresult/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/messaging/src/delivery-tracking/types.ts:79](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L79)

## Parameters

### input

[`SendInput`](/api/core/src/type-aliases/sendinput/)

### context

[`ApiFailoverAttemptContext`](/api/messaging/src/tracking/interfaces/apifailoverattemptcontext/)

## Returns

`Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`SendResult`](/api/core/src/interfaces/sendresult/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>
