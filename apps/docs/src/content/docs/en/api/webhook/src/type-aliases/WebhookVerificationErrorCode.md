---
editUrl: false
next: false
prev: false
title: "WebhookVerificationErrorCode"
---

> **WebhookVerificationErrorCode** = `"MISSING_SIGNATURE"` \| `"MISSING_TIMESTAMP"` \| `"INVALID_SIGNATURE"` \| `"INVALID_TIMESTAMP"` \| `"STALE_TIMESTAMP"`

Defined in: [packages/webhook/src/security/verify-webhook-request.ts:50](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/security/verify-webhook-request.ts#L50)

Why [verifyWebhookRequest](/en/api/webhook/src/functions/verifywebhookrequest/) rejected a request:

- `MISSING_SIGNATURE`: the signature header is missing or empty.
- `MISSING_TIMESTAMP`: the `X-Webhook-Timestamp` header is missing or empty.
- `INVALID_SIGNATURE`: the signature does not match the body, timestamp,
  and secret.
- `INVALID_TIMESTAMP`: the signed timestamp is not a whole number of
  seconds.
- `STALE_TIMESTAMP`: the signed time is further from now than
  `toleranceMs`.
