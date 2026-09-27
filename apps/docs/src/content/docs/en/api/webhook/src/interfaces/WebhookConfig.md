---
editUrl: false
next: false
prev: false
title: "WebhookConfig"
---

Defined in: [packages/webhook/src/types/webhook.types.ts:3](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L3)

## Properties

### algorithm?

> `optional` **algorithm?**: `"sha256"` \| `"sha1"`

Defined in: [packages/webhook/src/types/webhook.types.ts:23](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L23)

***

### backoffMultiplier?

> `optional` **backoffMultiplier?**: `number`

Defined in: [packages/webhook/src/types/webhook.types.ts:8](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L8)

***

### batchSize?

> `optional` **batchSize?**: `number`

Defined in: [packages/webhook/src/types/webhook.types.ts:39](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L39)

How many events queued by `emit()` go out in one batch. The `emit()` call
that fills a batch sends it, retries included, before it resolves, unless
another batch is still being sent: then the full batch follows that one,
or, if that one fails, goes with the timer, the next call, or `flush()`.
`Infinity` leaves every event for `flush()` or the timer. Defaults to 10,
which also replaces a value below 1. `emitSync()` does not use it.

***

### batchTimeoutMs?

> `optional` **batchTimeoutMs?**: `number`

Defined in: [packages/webhook/src/types/webhook.types.ts:45](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L45)

With `autoStart`, how long in milliseconds the first event queued by
`emit()` waits before its batch is sent. Defaults to 5000. `emitSync()`
does not use it.

***

### enabledEvents

> **enabledEvents**: [`WebhookEventType`](/en/api/webhook/src/enumerations/webhookeventtype/)[]

Defined in: [packages/webhook/src/types/webhook.types.ts:28](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L28)

***

### enableSecurity

> **enableSecurity**: `boolean`

Defined in: [packages/webhook/src/types/webhook.types.ts:20](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L20)

Signs every delivery with HMAC. While on, a delivery is never sent
unsigned: endpoints need a `secret` (or `secretKey` must be set), and a
stored endpoint without one gets a failed delivery and no request.

***

### jitter?

> `optional` **jitter?**: `boolean`

Defined in: [packages/webhook/src/types/webhook.types.ts:9](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L9)

***

### maxDelayMs?

> `optional` **maxDelayMs?**: `number`

Defined in: [packages/webhook/src/types/webhook.types.ts:7](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L7)

***

### maxRetries

> **maxRetries**: `number`

Defined in: [packages/webhook/src/types/webhook.types.ts:5](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L5)

***

### retryDelayMs

> **retryDelayMs**: `number`

Defined in: [packages/webhook/src/types/webhook.types.ts:6](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L6)

***

### secretKey?

> `optional` **secretKey?**: `string`

Defined in: [packages/webhook/src/types/webhook.types.ts:22](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L22)

Signs deliveries to endpoints that have no `secret` of their own.

***

### signatureHeader?

> `optional` **signatureHeader?**: `string`

Defined in: [packages/webhook/src/types/webhook.types.ts:24](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L24)

***

### signaturePrefix?

> `optional` **signaturePrefix?**: `string`

Defined in: [packages/webhook/src/types/webhook.types.ts:25](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L25)

***

### timeoutMs

> **timeoutMs**: `number`

Defined in: [packages/webhook/src/types/webhook.types.ts:12](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L12)
