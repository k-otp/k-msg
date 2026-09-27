---
editUrl: false
next: false
prev: false
title: "verifyWebhookRequest"
---

> **verifyWebhookRequest**(`headers`, `body`, `secret`, `options?`): [`Result`](/en/api/core/src/type-aliases/result/)\<[`VerifiedWebhookRequest`](/en/api/webhook/src/interfaces/verifiedwebhookrequest/), [`WebhookVerificationError`](/en/api/webhook/src/classes/webhookverificationerror/)\>

Defined in: [packages/webhook/src/security/verify-webhook-request.ts:145](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/security/verify-webhook-request.ts#L145)

Checks that a webhook request came from a k-msg sender that holds `secret`
and was signed recently.

It verifies the signature header, an HMAC of `<X-Webhook-Timestamp>.<body>`,
in constant time, then checks that the signed time is within `toleranceMs`
of now. A request that passes can still be a repeat: webhooks are delivered
at least once, so skip event ids you have already processed.

## Parameters

### headers

[`WebhookRequestHeaders`](/en/api/webhook/src/type-aliases/webhookrequestheaders/)

The request headers.

### body

[`WebhookRequestBody`](/en/api/webhook/src/type-aliases/webhookrequestbody/)

The raw request body, preferably its bytes, before any
  decoding or JSON parsing.

### secret

`string`

The endpoint's signing secret (or the sender's shared
  `secretKey`).

### options?

[`VerifyWebhookRequestOptions`](/en/api/webhook/src/interfaces/verifywebhookrequestoptions/) = `{}`

## Returns

[`Result`](/en/api/core/src/type-aliases/result/)\<[`VerifiedWebhookRequest`](/en/api/webhook/src/interfaces/verifiedwebhookrequest/), [`WebhookVerificationError`](/en/api/webhook/src/classes/webhookverificationerror/)\>

The signed time, or a [WebhookVerificationError](/en/api/webhook/src/classes/webhookverificationerror/) whose
  `code` says which check failed.

## Throws

TypeError when `secret` is empty, and RangeError when
  `toleranceMs` is negative, NaN, or infinite.

## Example

```ts
const body = await request.arrayBuffer();
const verified = verifyWebhookRequest(
  request.headers,
  body,
  env.WEBHOOK_SECRET,
);
if (verified.isFailure) {
  return new Response(verified.error.code, { status: 401 });
}
const event = JSON.parse(new TextDecoder().decode(body));
```
