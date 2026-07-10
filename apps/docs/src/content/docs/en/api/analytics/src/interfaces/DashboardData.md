---
editUrl: false
next: false
prev: false
title: "DashboardData"
---

Defined in: [packages/analytics/src/reports/dashboard.ts:56](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/reports/dashboard.ts#L56)

## Properties

### filters

> **filters**: `Record`\<`string`, `any`\>

Defined in: [packages/analytics/src/reports/dashboard.ts:62](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/reports/dashboard.ts#L62)

***

### insights

> **insights**: `object`[]

Defined in: [packages/analytics/src/reports/dashboard.ts:61](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/reports/dashboard.ts#L61)

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

### kpis

> **kpis**: [`KPIData`](/en/api/analytics/src/interfaces/kpidata/)[]

Defined in: [packages/analytics/src/reports/dashboard.ts:59](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/reports/dashboard.ts#L59)

***

### timeRange

> **timeRange**: `object`

Defined in: [packages/analytics/src/reports/dashboard.ts:58](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/reports/dashboard.ts#L58)

#### end

> **end**: `Date`

#### start

> **start**: `Date`

***

### timestamp

> **timestamp**: `Date`

Defined in: [packages/analytics/src/reports/dashboard.ts:57](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/reports/dashboard.ts#L57)

***

### widgets

> **widgets**: [`WidgetData`](/en/api/analytics/src/interfaces/widgetdata/)[]

Defined in: [packages/analytics/src/reports/dashboard.ts:60](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/reports/dashboard.ts#L60)
