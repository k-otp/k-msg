---
editUrl: false
next: false
prev: false
title: "createKvDeliveryTrackingStore"
---

> **createKvDeliveryTrackingStore**(`namespace`, `options?`): [`CloudflareObjectDeliveryTrackingStore`](/api/k-msg/src/adapters/cloudflare/classes/cloudflareobjectdeliverytrackingstore/)

Defined in: [packages/messaging/src/adapters/cloudflare/index.ts:207](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/index.ts#L207)

## Parameters

### namespace

[`CloudflareKvNamespaceLike`](/api/k-msg/src/adapters/cloudflare/interfaces/cloudflarekvnamespacelike/)

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
