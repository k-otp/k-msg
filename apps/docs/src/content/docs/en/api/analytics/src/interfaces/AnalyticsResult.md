---
editUrl: false
next: false
prev: false
title: "AnalyticsResult"
---

Defined in: [packages/analytics/src/types/analytics.types.ts:60](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/types/analytics.types.ts#L60)

## Properties

### data

> **data**: [`AggregatedMetric`](/en/api/analytics/src/interfaces/aggregatedmetric/)[]

Defined in: [packages/analytics/src/types/analytics.types.ts:62](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/types/analytics.types.ts#L62)

***

### insights?

> `optional` **insights?**: `object`[]

Defined in: [packages/analytics/src/types/analytics.types.ts:68](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/types/analytics.types.ts#L68)

#### actionable

> **actionable**: `boolean`

#### confidence

> **confidence**: `number`

#### description

> **description**: `string`

#### detectedAt

> **detectedAt**: `Date`

#### dimensions

> **dimensions**: `Record`\<`string`, `string`\>

#### expectedValue?

> `optional` **expectedValue?**: `number`

#### id

> **id**: `string`

#### metric

> **metric**: [`MetricType`](/en/api/analytics/src/enumerations/metrictype/)

#### recommendations?

> `optional` **recommendations?**: `string`[]

#### severity

> **severity**: `"high"` \| `"low"` \| `"medium"` \| `"critical"`

#### title

> **title**: `string`

#### type

> **type**: `"anomaly"` \| `"trend"` \| `"recommendation"`

#### value

> **value**: `number`

***

### query

> **query**: `object`

Defined in: [packages/analytics/src/types/analytics.types.ts:61](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/types/analytics.types.ts#L61)

#### dateRange

> **dateRange**: `object` = `AnalyticsDateRangeSchema`

##### dateRange.end

> **end**: `Date`

##### dateRange.start

> **start**: `Date`

#### filters?

> `optional` **filters?**: `Record`\<`string`, `any`\>

#### groupBy?

> `optional` **groupBy?**: `string`[]

#### interval?

> `optional` **interval?**: `"minute"` \| `"hour"` \| `"day"` \| `"week"` \| `"month"`

#### limit?

> `optional` **limit?**: `number`

#### metrics

> **metrics**: [`MetricType`](/en/api/analytics/src/enumerations/metrictype/)[]

#### offset?

> `optional` **offset?**: `number`

#### orderBy?

> `optional` **orderBy?**: `object`[]

***

### summary

> **summary**: `object`

Defined in: [packages/analytics/src/types/analytics.types.ts:63](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/types/analytics.types.ts#L63)

#### dateRange

> **dateRange**: `object`

##### dateRange.end

> **end**: `Date`

##### dateRange.start

> **start**: `Date`

#### executionTime

> **executionTime**: `number`

#### totalRecords

> **totalRecords**: `number`
