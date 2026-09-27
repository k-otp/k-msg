---
editUrl: false
next: false
prev: false
title: "WebhookData"
---

Defined in: [packages/analytics/src/collectors/webhook.collector.ts:9](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/collectors/webhook.collector.ts#L9)

## Properties

### body?

> `optional` **body?**: `any`

Defined in: [packages/analytics/src/collectors/webhook.collector.ts:19](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/collectors/webhook.collector.ts#L19)

The parsed payload that the transformers read. While signature
validation is on, the collector parses it from the verified `rawBody`
instead, so it can be omitted and a value passed here is replaced.

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

Defined in: [packages/analytics/src/collectors/webhook.collector.ts:26](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/collectors/webhook.collector.ts#L26)

The request body exactly as received, before any parsing: the bytes the
sender signed. Required while signature validation is on, and then it
must be UTF-8 JSON. Its size in bytes counts against `maxPayloadSize`
before the signature is checked.

***

### signature?

> `optional` **signature?**: `string`

Defined in: [packages/analytics/src/collectors/webhook.collector.ts:28](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/collectors/webhook.collector.ts#L28)

The signature to check when the signature header is missing.

***

### source

> **source**: `string`

Defined in: [packages/analytics/src/collectors/webhook.collector.ts:11](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/collectors/webhook.collector.ts#L11)

***

### timestamp

> **timestamp**: `Date`

Defined in: [packages/analytics/src/collectors/webhook.collector.ts:12](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/collectors/webhook.collector.ts#L12)
