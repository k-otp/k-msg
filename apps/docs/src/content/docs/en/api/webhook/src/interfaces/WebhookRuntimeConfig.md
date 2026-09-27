---
editUrl: false
next: false
prev: false
title: "WebhookRuntimeConfig"
---

Defined in: [packages/webhook/src/runtime/types.ts:99](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L99)

## Properties

### autoStart?

> `optional` **autoStart?**: `boolean`

Defined in: [packages/webhook/src/runtime/types.ts:117](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L117)

Sends events queued by `emit()` without waiting for `flush()`: the
first queued event starts a timer, its batch goes out after
`batchTimeoutMs`, and the timer stops once the queue is empty. A runtime
that never calls `emit()` starts no timer. Defaults to true.

Set it to false where timers do not outlive the invocation, such as
Cloudflare Workers, and call `flush()` before the invocation ends (or use
`emitSync()`).

***

### delivery

> **delivery**: [`WebhookConfig`](/en/api/webhook/src/interfaces/webhookconfig/)

Defined in: [packages/webhook/src/runtime/types.ts:100](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L100)

***

### deliveryStore?

> `optional` **deliveryStore?**: [`WebhookDeliveryStore`](/en/api/webhook/src/interfaces/webhookdeliverystore/)

Defined in: [packages/webhook/src/runtime/types.ts:103](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L103)

***

### endpointStore?

> `optional` **endpointStore?**: [`WebhookEndpointStore`](/en/api/webhook/src/interfaces/webhookendpointstore/)

Defined in: [packages/webhook/src/runtime/types.ts:102](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L102)

***

### fieldCrypto?

> `optional` **fieldCrypto?**: [`WebhookRuntimeFieldCryptoOptions`](/en/api/webhook/src/interfaces/webhookruntimefieldcryptooptions/)

Defined in: [packages/webhook/src/runtime/types.ts:104](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L104)

***

### httpClient?

> `optional` **httpClient?**: [`HttpClient`](/en/api/webhook/src/interfaces/httpclient/)

Defined in: [packages/webhook/src/runtime/types.ts:105](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L105)

***

### persistence?

> `optional` **persistence?**: [`WebhookPersistence`](/en/api/webhook/src/interfaces/webhookpersistence/)

Defined in: [packages/webhook/src/runtime/types.ts:101](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L101)

***

### security?

> `optional` **security?**: [`WebhookRuntimeSecurityOptions`](/en/api/webhook/src/interfaces/webhookruntimesecurityoptions/)

Defined in: [packages/webhook/src/runtime/types.ts:106](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L106)
