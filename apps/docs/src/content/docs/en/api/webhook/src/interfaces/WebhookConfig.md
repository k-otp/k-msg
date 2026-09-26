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

Defined in: [packages/webhook/src/types/webhook.types.ts:17](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L17)

***

### backoffMultiplier?

> `optional` **backoffMultiplier?**: `number`

Defined in: [packages/webhook/src/types/webhook.types.ts:8](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L8)

***

### batchSize?

> `optional` **batchSize?**: `number`

Defined in: [packages/webhook/src/types/webhook.types.ts:32](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L32)

How many events queued by `emit()` go out in one batch. The `emit()` call
that fills a batch sends it, retries included, before it resolves, unless
another batch is still being sent: then the full batch follows that one.
`Infinity` leaves every event for `flush()` or the timer. Defaults to 10,
which also replaces a value below 1. `emitSync()` does not use it.

***

### batchTimeoutMs?

> `optional` **batchTimeoutMs?**: `number`

Defined in: [packages/webhook/src/types/webhook.types.ts:38](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L38)

With `autoStart`, how long in milliseconds the first event queued by
`emit()` waits before its batch is sent. Defaults to 5000. `emitSync()`
does not use it.

***

### enabledEvents

> **enabledEvents**: [`WebhookEventType`](/en/api/webhook/src/enumerations/webhookeventtype/)[]

Defined in: [packages/webhook/src/types/webhook.types.ts:22](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L22)

***

### enableSecurity

> **enableSecurity**: `boolean`

Defined in: [packages/webhook/src/types/webhook.types.ts:15](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L15)

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

Defined in: [packages/webhook/src/types/webhook.types.ts:16](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L16)

***

### signatureHeader?

> `optional` **signatureHeader?**: `string`

Defined in: [packages/webhook/src/types/webhook.types.ts:18](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L18)

***

### signaturePrefix?

> `optional` **signaturePrefix?**: `string`

Defined in: [packages/webhook/src/types/webhook.types.ts:19](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L19)

***

### timeoutMs

> **timeoutMs**: `number`

Defined in: [packages/webhook/src/types/webhook.types.ts:12](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L12)
