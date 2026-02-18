---
editUrl: false
next: false
prev: false
title: "InsightEngine"
---

Defined in: [packages/analytics/src/services/insight.engine.ts:10](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/services/insight.engine.ts#L10)

## Constructors

### Constructor

> **new InsightEngine**(`config`): `InsightEngine`

Defined in: [packages/analytics/src/services/insight.engine.ts:18](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/services/insight.engine.ts#L18)

#### Parameters

##### config

[`AnalyticsConfig`](/api/analytics/src/interfaces/analyticsconfig/)

#### Returns

`InsightEngine`

## Methods

### detectAnomalies()

> **detectAnomalies**(`metricType`, `timeRange`): `Promise`\<[`InsightData`](/api/analytics/src/interfaces/insightdata/)[]\>

Defined in: [packages/analytics/src/services/insight.engine.ts:65](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/services/insight.engine.ts#L65)

시계열 이상 탐지

#### Parameters

##### metricType

[`MetricType`](/api/analytics/src/enumerations/metrictype/)

##### timeRange

###### end

`Date`

###### start

`Date`

#### Returns

`Promise`\<[`InsightData`](/api/analytics/src/interfaces/insightdata/)[]\>

***

### detectRealTimeAnomalies()

> **detectRealTimeAnomalies**(`metric`): `Promise`\<[`InsightData`](/api/analytics/src/interfaces/insightdata/)[]\>

Defined in: [packages/analytics/src/services/insight.engine.ts:26](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/services/insight.engine.ts#L26)

실시간 이상 탐지

#### Parameters

##### metric

[`MetricData`](/api/analytics/src/interfaces/metricdata/)

#### Returns

`Promise`\<[`InsightData`](/api/analytics/src/interfaces/insightdata/)[]\>

***

### generateInsights()

> **generateInsights**(`query`, `data`): `Promise`\<[`InsightData`](/api/analytics/src/interfaces/insightdata/)[]\>

Defined in: [packages/analytics/src/services/insight.engine.ts:98](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/services/insight.engine.ts#L98)

인사이트 생성

#### Parameters

##### query

[`AnalyticsQuery`](/api/analytics/src/interfaces/analyticsquery/)

##### data

[`AggregatedMetric`](/api/analytics/src/interfaces/aggregatedmetric/)[]

#### Returns

`Promise`\<[`InsightData`](/api/analytics/src/interfaces/insightdata/)[]\>

***

### predictTrends()

> **predictTrends**(`metricType`, `forecastDays`): `Promise`\<`object`[]\>

Defined in: [packages/analytics/src/services/insight.engine.ts:131](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/services/insight.engine.ts#L131)

트렌드 예측

#### Parameters

##### metricType

[`MetricType`](/api/analytics/src/enumerations/metrictype/)

##### forecastDays

`number`

#### Returns

`Promise`\<`object`[]\>
