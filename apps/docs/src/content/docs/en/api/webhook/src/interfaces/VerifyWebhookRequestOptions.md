---
editUrl: false
next: false
prev: false
title: "VerifyWebhookRequestOptions"
---

Defined in: [packages/webhook/src/security/verify-webhook-request.ts:29](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/security/verify-webhook-request.ts#L29)

Options for [verifyWebhookRequest](/en/api/webhook/src/functions/verifywebhookrequest/). `algorithm`, `signatureHeader`,
and `signaturePrefix` must match the sender's `WebhookConfig`, so the same
object can be passed to both.

## Extends

- `Pick`\<[`WebhookConfig`](/en/api/webhook/src/interfaces/webhookconfig/), `"algorithm"` \| `"signatureHeader"` \| `"signaturePrefix"`\>

## Properties

### algorithm?

> `optional` **algorithm?**: `"sha256"` \| `"sha1"`

Defined in: [packages/webhook/src/types/webhook.types.ts:23](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L23)

#### Inherited from

[`WebhookConfig`](/en/api/webhook/src/interfaces/webhookconfig/).[`algorithm`](/en/api/webhook/src/interfaces/webhookconfig/#algorithm)

***

### signatureHeader?

> `optional` **signatureHeader?**: `string`

Defined in: [packages/webhook/src/types/webhook.types.ts:24](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L24)

#### Inherited from

[`WebhookConfig`](/en/api/webhook/src/interfaces/webhookconfig/).[`signatureHeader`](/en/api/webhook/src/interfaces/webhookconfig/#signatureheader)

***

### signaturePrefix?

> `optional` **signaturePrefix?**: `string`

Defined in: [packages/webhook/src/types/webhook.types.ts:25](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L25)

#### Inherited from

[`WebhookConfig`](/en/api/webhook/src/interfaces/webhookconfig/).[`signaturePrefix`](/en/api/webhook/src/interfaces/webhookconfig/#signatureprefix)

***

### toleranceMs?

> `optional` **toleranceMs?**: `number`

Defined in: [packages/webhook/src/security/verify-webhook-request.ts:40](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/security/verify-webhook-request.ts#L40)

How far the signed time may be from the receiver's clock, in either
direction, in milliseconds: a finite number of 0 or more. Defaults to
300000 (5 minutes). Signed times have one-second resolution, so a
request up to a second older than this can still pass.
