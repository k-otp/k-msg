---
editUrl: false
next: false
prev: false
title: "DeliveryTrackingApiFailoverConfig"
---

Defined in: [packages/messaging/src/delivery-tracking/types.ts:91](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L91)

## Properties

### classifyNonKakaoUser?

> `optional` **classifyNonKakaoUser?**: (`context`) => `boolean`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:94](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L94)

#### Parameters

##### context

[`ApiFailoverClassificationContext`](/en/api/messaging/src/tracking/interfaces/apifailoverclassificationcontext/)

#### Returns

`boolean`

***

### enabled?

> `optional` **enabled?**: `boolean`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:92](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L92)

***

### rulesByProviderId?

> `optional` **rulesByProviderId?**: `Record`\<`string`, [`DeliveryTrackingApiFailoverRule`](/en/api/messaging/src/tracking/interfaces/deliverytrackingapifailoverrule/)\>

Defined in: [packages/messaging/src/delivery-tracking/types.ts:95](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L95)

***

### sender

> **sender**: [`ApiFailoverSender`](/en/api/messaging/src/tracking/type-aliases/apifailoversender/)

Defined in: [packages/messaging/src/delivery-tracking/types.ts:93](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L93)
