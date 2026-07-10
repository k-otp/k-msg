---
editUrl: false
next: false
prev: false
title: "DashboardWidget"
---

Defined in: [packages/analytics/src/reports/dashboard.ts:25](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/reports/dashboard.ts#L25)

## Properties

### description?

> `optional` **description?**: `string`

Defined in: [packages/analytics/src/reports/dashboard.ts:29](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/reports/dashboard.ts#L29)

***

### id

> **id**: `string`

Defined in: [packages/analytics/src/reports/dashboard.ts:26](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/reports/dashboard.ts#L26)

***

### position

> **position**: `object`

Defined in: [packages/analytics/src/reports/dashboard.ts:30](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/reports/dashboard.ts#L30)

#### height

> **height**: `number`

#### width

> **width**: `number`

#### x

> **x**: `number`

#### y

> **y**: `number`

***

### query

> **query**: `object`

Defined in: [packages/analytics/src/reports/dashboard.ts:31](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/reports/dashboard.ts#L31)

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

### refreshInterval?

> `optional` **refreshInterval?**: `number`

Defined in: [packages/analytics/src/reports/dashboard.ts:33](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/reports/dashboard.ts#L33)

***

### title

> **title**: `string`

Defined in: [packages/analytics/src/reports/dashboard.ts:28](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/reports/dashboard.ts#L28)

***

### type

> **type**: `"trend"` \| `"metric"` \| `"chart"` \| `"table"` \| `"gauge"` \| `"heatmap"`

Defined in: [packages/analytics/src/reports/dashboard.ts:27](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/reports/dashboard.ts#L27)

***

### visualization

> **visualization**: `VisualizationConfig`

Defined in: [packages/analytics/src/reports/dashboard.ts:32](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/reports/dashboard.ts#L32)
