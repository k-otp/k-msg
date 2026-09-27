---
editUrl: false
next: false
prev: false
title: "WebhookRequestHeaders"
---

> **WebhookRequestHeaders** = `Headers` \| `Readonly`\<`Record`\<`string`, `string` \| readonly `string`[] \| `undefined`\>\>

Defined in: [packages/webhook/src/security/verify-webhook-request.ts:11](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/security/verify-webhook-request.ts#L11)

Request headers as a Fetch `Headers` object or a plain record, such as
Node's `IncomingHttpHeaders`. Record names are matched in any case.
