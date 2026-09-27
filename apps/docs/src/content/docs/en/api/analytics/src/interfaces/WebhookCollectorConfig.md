---
editUrl: false
next: false
prev: false
title: "WebhookCollectorConfig"
---

Defined in: [packages/analytics/src/collectors/webhook.collector.ts:33](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/collectors/webhook.collector.ts#L33)

## Properties

### allowedSources

> **allowedSources**: `string`[]

Defined in: [packages/analytics/src/collectors/webhook.collector.ts:47](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/collectors/webhook.collector.ts#L47)

***

### enableSignatureValidation

> **enableSignatureValidation**: `boolean`

Defined in: [packages/analytics/src/collectors/webhook.collector.ts:38](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/collectors/webhook.collector.ts#L38)

Verify each webhook's signature before collecting it. Defaults to `true`,
which needs `secretKey`; only `false` accepts unsigned webhooks.

***

### maxPayloadSize

> **maxPayloadSize**: `number`

Defined in: [packages/analytics/src/collectors/webhook.collector.ts:52](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/collectors/webhook.collector.ts#L52)

The largest payload accepted, in bytes: `rawBody` is measured before its
signature is checked, then `body` by the length of its JSON.

***

### rateLimitPerMinute

> **rateLimitPerMinute**: `number`

Defined in: [packages/analytics/src/collectors/webhook.collector.ts:53](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/collectors/webhook.collector.ts#L53)

***

### secretKey?

> `optional` **secretKey?**: `string`

Defined in: [packages/analytics/src/collectors/webhook.collector.ts:46](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/collectors/webhook.collector.ts#L46)

The shared signing secret. Required while signature validation is on.

***

### signatureHeader

> **signatureHeader**: `string`

Defined in: [packages/analytics/src/collectors/webhook.collector.ts:44](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/collectors/webhook.collector.ts#L44)

The header holding the signature, matched in any case. Its value is
`sha256=<hex>` or bare `<hex>`: the HMAC-SHA256 of `rawBody` keyed with
`secretKey`. Defaults to `x-signature`.
