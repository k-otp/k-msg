---
editUrl: false
next: false
prev: false
title: "WebhookData"
---

Defined in: [packages/analytics/src/collectors/webhook.collector.ts:9](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/collectors/webhook.collector.ts#L9)

## Properties

### body

> **body**: `any`

Defined in: [packages/analytics/src/collectors/webhook.collector.ts:14](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/collectors/webhook.collector.ts#L14)

***

### headers

> **headers**: `Record`\<`string`, `string`\>

Defined in: [packages/analytics/src/collectors/webhook.collector.ts:13](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/collectors/webhook.collector.ts#L13)

***

### id

> **id**: `string`

Defined in: [packages/analytics/src/collectors/webhook.collector.ts:10](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/collectors/webhook.collector.ts#L10)

***

### rawBody?

> `optional` **rawBody?**: `string` \| `ArrayBuffer` \| `Uint8Array`\<`ArrayBufferLike`\>

Defined in: [packages/analytics/src/collectors/webhook.collector.ts:21](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/collectors/webhook.collector.ts#L21)

The request body exactly as received, before JSON parsing: the bytes the
sender signed. Required while signature validation is on, because
re-serializing `body` rarely reproduces those bytes. `body` should be
parsed from these same bytes.

***

### signature?

> `optional` **signature?**: `string`

Defined in: [packages/analytics/src/collectors/webhook.collector.ts:23](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/collectors/webhook.collector.ts#L23)

The signature to check when the signature header is missing.

***

### source

> **source**: `string`

Defined in: [packages/analytics/src/collectors/webhook.collector.ts:11](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/collectors/webhook.collector.ts#L11)

***

### timestamp

> **timestamp**: `Date`

Defined in: [packages/analytics/src/collectors/webhook.collector.ts:12](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/collectors/webhook.collector.ts#L12)
