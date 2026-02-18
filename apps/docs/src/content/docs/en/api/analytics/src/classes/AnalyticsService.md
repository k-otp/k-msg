---
editUrl: false
next: false
prev: false
title: "AnalyticsService"
---

Defined in: [packages/analytics/src/services/analytics.service.ts:15](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/services/analytics.service.ts#L15)

## Constructors

### Constructor

> **new AnalyticsService**(`config`): `AnalyticsService`

Defined in: [packages/analytics/src/services/analytics.service.ts:23](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/services/analytics.service.ts#L23)

#### Parameters

##### config

[`AnalyticsConfig`](/api/analytics/src/interfaces/analyticsconfig/)

#### Returns

`AnalyticsService`

## Methods

### collectMetric()

> **collectMetric**(`metric`): `Promise`\<`void`\>

Defined in: [packages/analytics/src/services/analytics.service.ts:36](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/services/analytics.service.ts#L36)

메트릭 데이터 수집

#### Parameters

##### metric

[`MetricData`](/api/analytics/src/interfaces/metricdata/)

#### Returns

`Promise`\<`void`\>

***

### detectAnomalies()

> **detectAnomalies**(`metricType`, `timeRange`): `Promise`\<[`InsightData`](/api/analytics/src/interfaces/insightdata/)[]\>

Defined in: [packages/analytics/src/services/analytics.service.ts:136](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/services/analytics.service.ts#L136)

이상 탐지

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

### getDashboardData()

> **getDashboardData**(`timeRange`): `Promise`\<\{ `insights`: [`InsightData`](/api/analytics/src/interfaces/insightdata/)[] \| `undefined`; `kpis`: \{ `clickRate`: `number`; `deliveryRate`: `number`; `errorRate`: `number`; `totalMessages`: `number`; \}; `metrics`: [`AggregatedMetric`](/api/analytics/src/interfaces/aggregatedmetric/)[]; `timeRange`: \{ `end`: `Date`; `start`: `Date`; \}; `trends`: \{ \}; \}\>

Defined in: [packages/analytics/src/services/analytics.service.ts:95](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/services/analytics.service.ts#L95)

대시보드 데이터 조회

#### Parameters

##### timeRange

###### end

`Date`

###### start

`Date`

#### Returns

`Promise`\<\{ `insights`: [`InsightData`](/api/analytics/src/interfaces/insightdata/)[] \| `undefined`; `kpis`: \{ `clickRate`: `number`; `deliveryRate`: `number`; `errorRate`: `number`; `totalMessages`: `number`; \}; `metrics`: [`AggregatedMetric`](/api/analytics/src/interfaces/aggregatedmetric/)[]; `timeRange`: \{ `end`: `Date`; `start`: `Date`; \}; `trends`: \{ \}; \}\>

***

### query()

> **query**(`query`): `Promise`\<[`AnalyticsResult`](/api/analytics/src/interfaces/analyticsresult/)\>

Defined in: [packages/analytics/src/services/analytics.service.ts:52](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/services/analytics.service.ts#L52)

분석 쿼리 실행

#### Parameters

##### query

[`AnalyticsQuery`](/api/analytics/src/interfaces/analyticsquery/)

#### Returns

`Promise`\<[`AnalyticsResult`](/api/analytics/src/interfaces/analyticsresult/)\>

***

### streamMetrics()

> **streamMetrics**(`types`): `AsyncGenerator`\<[`MetricData`](/api/analytics/src/interfaces/metricdata/)\>

Defined in: [packages/analytics/src/services/analytics.service.ts:81](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/services/analytics.service.ts#L81)

실시간 메트릭 스트림

#### Parameters

##### types

[`MetricType`](/api/analytics/src/enumerations/metrictype/)[]

#### Returns

`AsyncGenerator`\<[`MetricData`](/api/analytics/src/interfaces/metricdata/)\>
