---
editUrl: false
next: false
prev: false
title: "ApiFailoverSender"
---

> **ApiFailoverSender** = (`input`, `context`) => `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`SendResult`](/en/api/core/src/interfaces/sendresult/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/messaging/src/delivery-tracking/types.ts:79](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L79)

## Parameters

### input

[`SendInput`](/en/api/core/src/type-aliases/sendinput/)

### context

[`ApiFailoverAttemptContext`](/en/api/messaging/src/tracking/interfaces/apifailoverattemptcontext/)

## Returns

`Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`SendResult`](/en/api/core/src/interfaces/sendresult/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>
