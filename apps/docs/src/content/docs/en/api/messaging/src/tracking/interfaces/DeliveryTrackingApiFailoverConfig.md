---
editUrl: false
next: false
prev: false
title: "DeliveryTrackingApiFailoverConfig"
---

Defined in: [packages/messaging/src/delivery-tracking/types.ts:84](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L84)

## Properties

### classifyNonKakaoUser()?

> `optional` **classifyNonKakaoUser**: (`context`) => `boolean`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:87](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L87)

#### Parameters

##### context

[`ApiFailoverClassificationContext`](/api/messaging/src/tracking/interfaces/apifailoverclassificationcontext/)

#### Returns

`boolean`

***

### enabled?

> `optional` **enabled**: `boolean`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:85](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L85)

***

### rulesByProviderId?

> `optional` **rulesByProviderId**: `Record`\<`string`, [`DeliveryTrackingApiFailoverRule`](/api/messaging/src/tracking/interfaces/deliverytrackingapifailoverrule/)\>

Defined in: [packages/messaging/src/delivery-tracking/types.ts:88](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L88)

***

### sender

> **sender**: [`ApiFailoverSender`](/api/messaging/src/tracking/type-aliases/apifailoversender/)

Defined in: [packages/messaging/src/delivery-tracking/types.ts:86](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L86)
