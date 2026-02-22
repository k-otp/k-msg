---
editUrl: false
next: false
prev: false
title: "DeliveryTrackingApiFailoverConfig"
---

Defined in: [packages/messaging/src/delivery-tracking/types.ts:82](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L82)

## Properties

### classifyNonKakaoUser()?

> `optional` **classifyNonKakaoUser**: (`context`) => `boolean`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:85](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L85)

#### Parameters

##### context

[`ApiFailoverClassificationContext`](/api/messaging/src/tracking/interfaces/apifailoverclassificationcontext/)

#### Returns

`boolean`

***

### enabled?

> `optional` **enabled**: `boolean`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:83](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L83)

***

### rulesByProviderId?

> `optional` **rulesByProviderId**: `Record`\<`string`, [`DeliveryTrackingApiFailoverRule`](/api/messaging/src/tracking/interfaces/deliverytrackingapifailoverrule/)\>

Defined in: [packages/messaging/src/delivery-tracking/types.ts:86](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L86)

***

### sender

> **sender**: [`ApiFailoverSender`](/api/messaging/src/tracking/type-aliases/apifailoversender/)

Defined in: [packages/messaging/src/delivery-tracking/types.ts:84](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L84)
