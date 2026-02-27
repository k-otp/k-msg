---
editUrl: false
next: false
prev: false
title: "DeliveryTrackingAnalyticsService"
---

Defined in: [packages/analytics/src/services/delivery-tracking.analytics.ts:59](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/services/delivery-tracking.analytics.ts#L59)

## Constructors

### Constructor

> **new DeliveryTrackingAnalyticsService**(`config`): `DeliveryTrackingAnalyticsService`

Defined in: [packages/analytics/src/services/delivery-tracking.analytics.ts:63](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/services/delivery-tracking.analytics.ts#L63)

#### Parameters

##### config

###### store

[`DeliveryTrackingStore`](/api/messaging/src/tracking/interfaces/deliverytrackingstore/)

#### Returns

`DeliveryTrackingAnalyticsService`

## Methods

### getSummary()

> **getSummary**(`query`, `options?`): `Promise`\<`DeliveryTrackingAnalyticsSummary`\>

Defined in: [packages/analytics/src/services/delivery-tracking.analytics.ts:71](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/services/delivery-tracking.analytics.ts#L71)

#### Parameters

##### query

`DeliveryTrackingAnalyticsQuery`

##### options?

###### includeByProviderId?

`boolean`

###### includeByType?

`boolean`

#### Returns

`Promise`\<`DeliveryTrackingAnalyticsSummary`\>

***

### init()

> **init**(): `Promise`\<`void`\>

Defined in: [packages/analytics/src/services/delivery-tracking.analytics.ts:67](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/services/delivery-tracking.analytics.ts#L67)

#### Returns

`Promise`\<`void`\>
