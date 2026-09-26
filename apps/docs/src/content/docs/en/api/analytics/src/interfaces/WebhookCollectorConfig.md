---
editUrl: false
next: false
prev: false
title: "WebhookCollectorConfig"
---

Defined in: [packages/analytics/src/collectors/webhook.collector.ts:26](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/collectors/webhook.collector.ts#L26)

## Properties

### allowedSources

> **allowedSources**: `string`[]

Defined in: [packages/analytics/src/collectors/webhook.collector.ts:40](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/collectors/webhook.collector.ts#L40)

***

### enableSignatureValidation

> **enableSignatureValidation**: `boolean`

Defined in: [packages/analytics/src/collectors/webhook.collector.ts:31](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/collectors/webhook.collector.ts#L31)

Verify each webhook's signature before collecting it. Defaults to `true`,
which needs `secretKey`; only `false` accepts unsigned webhooks.

***

### maxPayloadSize

> **maxPayloadSize**: `number`

Defined in: [packages/analytics/src/collectors/webhook.collector.ts:41](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/collectors/webhook.collector.ts#L41)

***

### rateLimitPerMinute

> **rateLimitPerMinute**: `number`

Defined in: [packages/analytics/src/collectors/webhook.collector.ts:42](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/collectors/webhook.collector.ts#L42)

***

### secretKey?

> `optional` **secretKey?**: `string`

Defined in: [packages/analytics/src/collectors/webhook.collector.ts:39](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/collectors/webhook.collector.ts#L39)

The shared signing secret. Required while signature validation is on.

***

### signatureHeader

> **signatureHeader**: `string`

Defined in: [packages/analytics/src/collectors/webhook.collector.ts:37](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/collectors/webhook.collector.ts#L37)

The header holding the signature, matched in any case. Its value is
`sha256=<hex>` or bare `<hex>`: the HMAC-SHA256 of `rawBody` keyed with
`secretKey`. Defaults to `x-signature`.
