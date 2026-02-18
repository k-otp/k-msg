---
editUrl: false
next: false
prev: false
title: "DeliveryTrackingApiFailoverConfig"
---

Defined in: [packages/messaging/src/delivery-tracking/types.ts:69](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L69)

## Properties

### classifyNonKakaoUser()?

> `optional` **classifyNonKakaoUser**: (`context`) => `boolean`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:72](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L72)

#### Parameters

##### context

[`ApiFailoverClassificationContext`](/api/messaging/src/tracking/interfaces/apifailoverclassificationcontext/)

#### Returns

`boolean`

***

### enabled?

> `optional` **enabled**: `boolean`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:70](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L70)

***

### rulesByProviderId?

> `optional` **rulesByProviderId**: `Record`\<`string`, [`DeliveryTrackingApiFailoverRule`](/api/messaging/src/tracking/interfaces/deliverytrackingapifailoverrule/)\>

Defined in: [packages/messaging/src/delivery-tracking/types.ts:73](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L73)

***

### sender

> **sender**: [`ApiFailoverSender`](/api/messaging/src/tracking/type-aliases/apifailoversender/)

Defined in: [packages/messaging/src/delivery-tracking/types.ts:71](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L71)
