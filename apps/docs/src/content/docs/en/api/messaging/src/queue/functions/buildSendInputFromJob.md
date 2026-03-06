---
editUrl: false
next: false
prev: false
title: "buildSendInputFromJob"
---

> **buildSendInputFromJob**(`job`, `envelope`, `attempt`, `options?`): [`Result`](/en/api/core/src/type-aliases/result/)\<[`SendInput`](/en/api/core/src/type-aliases/sendinput/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>

Defined in: [packages/messaging/src/queue/send-input.builder.ts:82](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/send-input.builder.ts#L82)

## Parameters

### job

[`SendInputJobPayload`](/en/api/messaging/src/queue/interfaces/sendinputjobpayload/)

### envelope

[`SendInputEnvelope`](/en/api/messaging/src/queue/interfaces/sendinputenvelope/)

### attempt

`number`

### options?

[`BuildSendInputOptions`](/en/api/messaging/src/queue/interfaces/buildsendinputoptions/) = `{}`

## Returns

[`Result`](/en/api/core/src/type-aliases/result/)\<[`SendInput`](/en/api/core/src/type-aliases/sendinput/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>
