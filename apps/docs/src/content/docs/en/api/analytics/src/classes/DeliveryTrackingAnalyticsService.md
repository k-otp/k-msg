---
editUrl: false
next: false
prev: false
title: "DeliveryTrackingAnalyticsService"
---

Defined in: [packages/analytics/src/services/delivery-tracking.analytics.ts:64](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/services/delivery-tracking.analytics.ts#L64)

## Constructors

### Constructor

> **new DeliveryTrackingAnalyticsService**(`config`): `DeliveryTrackingAnalyticsService`

Defined in: [packages/analytics/src/services/delivery-tracking.analytics.ts:68](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/services/delivery-tracking.analytics.ts#L68)

#### Parameters

##### config

###### store

[`DeliveryTrackingStore`](/api/messaging/src/tracking/interfaces/deliverytrackingstore/)

#### Returns

`DeliveryTrackingAnalyticsService`

## Methods

### getSummary()

> **getSummary**(`query`, `options?`): `Promise`\<`DeliveryTrackingAnalyticsSummary`\>

Defined in: [packages/analytics/src/services/delivery-tracking.analytics.ts:76](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/services/delivery-tracking.analytics.ts#L76)

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

Defined in: [packages/analytics/src/services/delivery-tracking.analytics.ts:72](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/services/delivery-tracking.analytics.ts#L72)

#### Returns

`Promise`\<`void`\>
