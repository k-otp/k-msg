---
editUrl: false
next: false
prev: false
title: "WebhookRequestBody"
---

> **WebhookRequestBody** = `string` \| `Uint8Array` \| `ArrayBuffer`

Defined in: [packages/webhook/src/security/verify-webhook-request.ts:22](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/security/verify-webhook-request.ts#L22)

The raw request body, exactly as received: prefer the bytes, such as
`await request.arrayBuffer()`. Bytes are checked exactly, so they must be
valid UTF-8, as the sender's always are. A string is trusted as given, but
`request.text()` drops a leading BOM and replaces malformed bytes before
any check, and parsing and re-serializing JSON changes the body.
