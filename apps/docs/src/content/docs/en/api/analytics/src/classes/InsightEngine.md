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

[`AnalyticsConfig`](/en/api/analytics/src/interfaces/analyticsconfig/)

#### Returns

`InsightEngine`

## Methods

### detectAnomalies()

> **detectAnomalies**(`metricType`, `timeRange`): `Promise`\<`object`[]\>

Defined in: [packages/analytics/src/services/insight.engine.ts:65](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/services/insight.engine.ts#L65)

시계열 이상 탐지

#### Parameters

##### metricType

[`MetricType`](/en/api/analytics/src/enumerations/metrictype/)

##### timeRange

###### end

`Date`

###### start

`Date`

#### Returns

`Promise`\<`object`[]\>

***

### detectRealTimeAnomalies()

> **detectRealTimeAnomalies**(`metric`): `Promise`\<`object`[]\>

Defined in: [packages/analytics/src/services/insight.engine.ts:26](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/services/insight.engine.ts#L26)

실시간 이상 탐지

#### Parameters

##### metric

###### dimensions

`Record`\<`string`, `string`\> = `...`

###### id

`string` = `...`

###### metadata?

`Record`\<`string`, `any`\> = `...`

###### timestamp

`Date` = `...`

###### type

[`MetricType`](/en/api/analytics/src/enumerations/metrictype/) = `...`

###### value

`number` = `...`

#### Returns

`Promise`\<`object`[]\>

***

### generateInsights()

> **generateInsights**(`query`, `data`): `Promise`\<`object`[]\>

Defined in: [packages/analytics/src/services/insight.engine.ts:98](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/services/insight.engine.ts#L98)

인사이트 생성

#### Parameters

##### query

###### dateRange

\{ `end`: `Date`; `start`: `Date`; \} = `AnalyticsDateRangeSchema`

###### dateRange.end

`Date` = `...`

###### dateRange.start

`Date` = `...`

###### filters?

`Record`\<`string`, `any`\> = `...`

###### groupBy?

`string`[] = `...`

###### interval?

`"minute"` \| `"hour"` \| `"day"` \| `"week"` \| `"month"` = `...`

###### limit?

`number` = `...`

###### metrics

[`MetricType`](/en/api/analytics/src/enumerations/metrictype/)[] = `...`

###### offset?

`number` = `...`

###### orderBy?

`object`[] = `...`

##### data

[`AggregatedMetric`](/en/api/analytics/src/interfaces/aggregatedmetric/)[]

#### Returns

`Promise`\<`object`[]\>

***

### predictTrends()

> **predictTrends**(`metricType`, `forecastDays`): `Promise`\<`object`[]\>

Defined in: [packages/analytics/src/services/insight.engine.ts:131](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/services/insight.engine.ts#L131)

트렌드 예측

#### Parameters

##### metricType

[`MetricType`](/en/api/analytics/src/enumerations/metrictype/)

##### forecastDays

`number`

#### Returns

`Promise`\<`object`[]\>
