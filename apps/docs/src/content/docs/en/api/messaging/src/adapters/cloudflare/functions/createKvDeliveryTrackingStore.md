---
editUrl: false
next: false
prev: false
title: "createKvDeliveryTrackingStore"
---

> **createKvDeliveryTrackingStore**(`namespace`, `options?`): [`CloudflareObjectDeliveryTrackingStore`](/en/api/k-msg/src/adapters/cloudflare/classes/cloudflareobjectdeliverytrackingstore/)

Defined in: [packages/messaging/src/adapters/cloudflare/index.ts:207](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/index.ts#L207)

## Parameters

### namespace

[`CloudflareKvNamespaceLike`](/en/api/k-msg/src/adapters/cloudflare/interfaces/cloudflarekvnamespacelike/)

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
