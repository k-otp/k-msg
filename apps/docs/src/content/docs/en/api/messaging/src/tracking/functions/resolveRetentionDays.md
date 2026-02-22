---
editUrl: false
next: false
prev: false
title: "resolveRetentionDays"
---

> **resolveRetentionDays**(`config`, `context`): `Promise`\<`number`\>

Defined in: [packages/messaging/src/delivery-tracking/retention.ts:29](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/retention.ts#L29)

## Parameters

### config

[`DeliveryTrackingRetentionConfig`](/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingretentionconfig/) | `undefined`

### context

#### record

[`TrackingRecord`](/api/messaging/src/tracking/interfaces/trackingrecord/)

#### retentionClass

[`DeliveryTrackingRetentionClass`](/api/messaging/src/tracking/type-aliases/deliverytrackingretentionclass/)

#### tenantId?

`string`

## Returns

`Promise`\<`number`\>
