---
editUrl: false
next: false
prev: false
title: "createDurableObjectDeliveryTrackingStore"
---

> **createDurableObjectDeliveryTrackingStore**(`storage`, `options?`): [`CloudflareObjectDeliveryTrackingStore`](/api/k-msg/src/adapters/cloudflare/classes/cloudflareobjectdeliverytrackingstore/)

Defined in: [packages/messaging/src/adapters/cloudflare/index.ts:215](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/index.ts#L215)

## Parameters

### storage

[`CloudflareDurableObjectStorageLike`](/api/k-msg/src/adapters/cloudflare/interfaces/cloudflaredurableobjectstoragelike/)

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
