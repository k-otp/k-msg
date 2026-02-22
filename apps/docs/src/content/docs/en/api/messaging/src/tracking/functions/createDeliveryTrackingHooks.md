---
editUrl: false
next: false
prev: false
title: "createDeliveryTrackingHooks"
---

> **createDeliveryTrackingHooks**(`service`, `options?`): [`KMsgHooks`](/api/messaging/src/interfaces/kmsghooks/)

Defined in: [packages/messaging/src/delivery-tracking/hooks.ts:4](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/hooks.ts#L4)

## Parameters

### service

[`DeliveryTrackingService`](/api/messaging/src/tracking/classes/deliverytrackingservice/)

### options?

#### onError?

(`error`) => `void` \| `Promise`\<`void`\>

#### onFinal?

(`context`, `state`) => `void` \| `Promise`\<`void`\>

#### onQueued?

(`context`) => `void` \| `Promise`\<`void`\>

#### onRetryScheduled?

(`context`, `error`, `metadata`) => `void` \| `Promise`\<`void`\>

## Returns

[`KMsgHooks`](/api/messaging/src/interfaces/kmsghooks/)
