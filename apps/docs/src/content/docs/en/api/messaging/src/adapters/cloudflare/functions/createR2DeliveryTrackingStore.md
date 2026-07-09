---
editUrl: false
next: false
prev: false
title: "createR2DeliveryTrackingStore"
---

> **createR2DeliveryTrackingStore**(`bucket`, `options?`): [`CloudflareObjectDeliveryTrackingStore`](/en/api/k-msg/src/adapters/cloudflare/classes/cloudflareobjectdeliverytrackingstore/)

Defined in: [packages/messaging/src/adapters/cloudflare/index.ts:233](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/index.ts#L233)

## Parameters

### bucket

[`CloudflareR2BucketLike`](/en/api/k-msg/src/adapters/cloudflare/interfaces/cloudflarer2bucketlike/)

### options?

#### compatPlainColumns?

`boolean`

#### fieldCrypto?

[`DeliveryTrackingFieldCryptoOptions`](/en/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingfieldcryptooptions/)

#### keyPrefix?

`string`

#### retention?

[`DeliveryTrackingRetentionConfig`](/en/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingretentionconfig/)

#### secureMode?

`boolean`

## Returns

[`CloudflareObjectDeliveryTrackingStore`](/en/api/k-msg/src/adapters/cloudflare/classes/cloudflareobjectdeliverytrackingstore/)
