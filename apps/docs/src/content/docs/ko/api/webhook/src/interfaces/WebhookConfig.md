---
editUrl: false
next: false
prev: false
title: "WebhookConfig"
---

Defined in: [packages/webhook/src/types/webhook.types.ts:3](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/types/webhook.types.ts#L3)

## Properties

### algorithm?

> `optional` **algorithm**: `"sha256"` \| `"sha1"`

Defined in: [packages/webhook/src/types/webhook.types.ts:17](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/types/webhook.types.ts#L17)

***

### backoffMultiplier?

> `optional` **backoffMultiplier**: `number`

Defined in: [packages/webhook/src/types/webhook.types.ts:8](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/types/webhook.types.ts#L8)

***

### batchSize

> **batchSize**: `number`

Defined in: [packages/webhook/src/types/webhook.types.ts:25](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/types/webhook.types.ts#L25)

***

### batchTimeoutMs

> **batchTimeoutMs**: `number`

Defined in: [packages/webhook/src/types/webhook.types.ts:26](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/types/webhook.types.ts#L26)

***

### enabledEvents

> **enabledEvents**: [`WebhookEventType`](/api/webhook/src/enumerations/webhookeventtype/)[]

Defined in: [packages/webhook/src/types/webhook.types.ts:22](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/types/webhook.types.ts#L22)

***

### enableSecurity

> **enableSecurity**: `boolean`

Defined in: [packages/webhook/src/types/webhook.types.ts:15](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/types/webhook.types.ts#L15)

***

### jitter?

> `optional` **jitter**: `boolean`

Defined in: [packages/webhook/src/types/webhook.types.ts:9](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/types/webhook.types.ts#L9)

***

### maxDelayMs?

> `optional` **maxDelayMs**: `number`

Defined in: [packages/webhook/src/types/webhook.types.ts:7](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/types/webhook.types.ts#L7)

***

### maxRetries

> **maxRetries**: `number`

Defined in: [packages/webhook/src/types/webhook.types.ts:5](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/types/webhook.types.ts#L5)

***

### retryDelayMs

> **retryDelayMs**: `number`

Defined in: [packages/webhook/src/types/webhook.types.ts:6](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/types/webhook.types.ts#L6)

***

### secretKey?

> `optional` **secretKey**: `string`

Defined in: [packages/webhook/src/types/webhook.types.ts:16](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/types/webhook.types.ts#L16)

***

### signatureHeader?

> `optional` **signatureHeader**: `string`

Defined in: [packages/webhook/src/types/webhook.types.ts:18](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/types/webhook.types.ts#L18)

***

### signaturePrefix?

> `optional` **signaturePrefix**: `string`

Defined in: [packages/webhook/src/types/webhook.types.ts:19](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/types/webhook.types.ts#L19)

***

### timeoutMs

> **timeoutMs**: `number`

Defined in: [packages/webhook/src/types/webhook.types.ts:12](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/types/webhook.types.ts#L12)
