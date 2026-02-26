---
editUrl: false
next: false
prev: false
title: "createR2DeliveryTrackingStore"
---

> **createR2DeliveryTrackingStore**(`bucket`, `options?`): [`CloudflareObjectDeliveryTrackingStore`](/api/k-msg/src/adapters/cloudflare/classes/cloudflareobjectdeliverytrackingstore/)

Defined in: [packages/messaging/src/adapters/cloudflare/index.ts:233](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/index.ts#L233)

## Parameters

### bucket

[`CloudflareR2BucketLike`](/api/k-msg/src/adapters/cloudflare/interfaces/cloudflarer2bucketlike/)

### options?

#### compatPlainColumns?

`boolean`

#### fieldCrypto?

[`DeliveryTrackingFieldCryptoOptions`](/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingfieldcryptooptions/)

#### keyPrefix?

`string`

#### retention?

[`DeliveryTrackingRetentionConfig`](/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingretentionconfig/)

#### secureMode?

`boolean`

## Returns

[`CloudflareObjectDeliveryTrackingStore`](/api/k-msg/src/adapters/cloudflare/classes/cloudflareobjectdeliverytrackingstore/)
