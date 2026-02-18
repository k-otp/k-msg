---
editUrl: false
next: false
prev: false
title: "AggregationRule"
---

Defined in: [packages/analytics/src/aggregators/metric.aggregator.ts:9](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/aggregators/metric.aggregator.ts#L9)

Analytics Engine
메시지 전송 통계 및 분석 기능 제공

## Properties

### aggregationType

> **aggregationType**: `"max"` \| `"count"` \| `"sum"` \| `"avg"` \| `"min"` \| `"rate"` \| `"percentile"`

Defined in: [packages/analytics/src/aggregators/metric.aggregator.ts:11](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/aggregators/metric.aggregator.ts#L11)

***

### conditions?

> `optional` **conditions**: `object`[]

Defined in: [packages/analytics/src/aggregators/metric.aggregator.ts:20](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/aggregators/metric.aggregator.ts#L20)

#### field

> **field**: `string`

#### operator

> **operator**: `"equals"` \| `"not_equals"` \| `"gt"` \| `"lt"` \| `"contains"`

#### value

> **value**: `any`

***

### dimensions

> **dimensions**: `string`[]

Defined in: [packages/analytics/src/aggregators/metric.aggregator.ts:19](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/aggregators/metric.aggregator.ts#L19)

***

### metricType

> **metricType**: [`MetricType`](/api/analytics/src/enumerations/metrictype/)

Defined in: [packages/analytics/src/aggregators/metric.aggregator.ts:10](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/aggregators/metric.aggregator.ts#L10)

***

### percentile?

> `optional` **percentile**: `number`

Defined in: [packages/analytics/src/aggregators/metric.aggregator.ts:25](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/aggregators/metric.aggregator.ts#L25)
