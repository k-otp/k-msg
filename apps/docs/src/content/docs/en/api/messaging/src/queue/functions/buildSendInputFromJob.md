---
editUrl: false
next: false
prev: false
title: "buildSendInputFromJob"
---

> **buildSendInputFromJob**(`job`, `envelope`, `attempt`, `options?`): [`Result`](/api/core/src/type-aliases/result/)\<[`SendInput`](/api/core/src/type-aliases/sendinput/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>

Defined in: [packages/messaging/src/queue/send-input.builder.ts:82](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/send-input.builder.ts#L82)

## Parameters

### job

[`SendInputJobPayload`](/api/messaging/src/queue/interfaces/sendinputjobpayload/)

### envelope

[`SendInputEnvelope`](/api/messaging/src/queue/interfaces/sendinputenvelope/)

### attempt

`number`

### options?

[`BuildSendInputOptions`](/api/messaging/src/queue/interfaces/buildsendinputoptions/) = `{}`

## Returns

[`Result`](/api/core/src/type-aliases/result/)\<[`SendInput`](/api/core/src/type-aliases/sendinput/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>
