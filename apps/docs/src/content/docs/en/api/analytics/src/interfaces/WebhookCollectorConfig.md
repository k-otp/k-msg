---
editUrl: false
next: false
prev: false
title: "WebhookCollectorConfig"
---

Defined in: [packages/analytics/src/collectors/webhook.collector.ts:31](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/collectors/webhook.collector.ts#L31)

## Properties

### allowedSources

> **allowedSources**: `string`[]

Defined in: [packages/analytics/src/collectors/webhook.collector.ts:45](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/collectors/webhook.collector.ts#L45)

***

### enableSignatureValidation

> **enableSignatureValidation**: `boolean`

Defined in: [packages/analytics/src/collectors/webhook.collector.ts:36](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/collectors/webhook.collector.ts#L36)

Verify each webhook's signature before collecting it. Defaults to `true`,
which needs `secretKey`; only `false` accepts unsigned webhooks.

***

### maxPayloadSize

> **maxPayloadSize**: `number`

Defined in: [packages/analytics/src/collectors/webhook.collector.ts:50](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/collectors/webhook.collector.ts#L50)

The largest payload accepted, in bytes: `rawBody` is measured before its
signature is checked, then `body` by the length of its JSON.

***

### rateLimitPerMinute

> **rateLimitPerMinute**: `number`

Defined in: [packages/analytics/src/collectors/webhook.collector.ts:51](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/collectors/webhook.collector.ts#L51)

***

### secretKey?

> `optional` **secretKey?**: `string`

Defined in: [packages/analytics/src/collectors/webhook.collector.ts:44](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/collectors/webhook.collector.ts#L44)

The shared signing secret. Required while signature validation is on.

***

### signatureHeader

> **signatureHeader**: `string`

Defined in: [packages/analytics/src/collectors/webhook.collector.ts:42](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/collectors/webhook.collector.ts#L42)

The header holding the signature, matched in any case. Its value is
`sha256=<hex>` or bare `<hex>`: the HMAC-SHA256 of `rawBody` keyed with
`secretKey`. Defaults to `x-signature`.
