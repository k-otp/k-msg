---
editUrl: false
next: false
prev: false
title: "WebhookRequestBody"
---

> **WebhookRequestBody** = `string` \| `Uint8Array` \| `ArrayBuffer`

Defined in: [packages/webhook/src/security/verify-webhook-request.ts:20](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/security/verify-webhook-request.ts#L20)

The raw request body, exactly as received. Parsing and re-serializing JSON
changes the bytes and breaks the signature. Bytes are checked exactly, so
they must be valid UTF-8, as the sender's always are.
