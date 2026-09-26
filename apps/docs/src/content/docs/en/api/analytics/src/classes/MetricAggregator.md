---
editUrl: false
next: false
prev: false
title: "MetricAggregator"
---

Defined in: [packages/analytics/src/aggregators/metric.aggregator.ts:35](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/aggregators/metric.aggregator.ts#L35)

## Constructors

### Constructor

> **new MetricAggregator**(`config`): `MetricAggregator`

Defined in: [packages/analytics/src/aggregators/metric.aggregator.ts:40](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/aggregators/metric.aggregator.ts#L40)

#### Parameters

##### config

[`AggregatorConfig`](/en/api/analytics/src/interfaces/aggregatorconfig/)

#### Returns

`MetricAggregator`

## Methods

### addMetric()

> **addMetric**(`metric`): `Promise`\<`void`\>

Defined in: [packages/analytics/src/aggregators/metric.aggregator.ts:48](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/aggregators/metric.aggregator.ts#L48)

메트릭 추가 및 실시간 집계

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

`Promise`\<`void`\>

***

### addMetrics()

> **addMetrics**(`metrics`): `Promise`\<`void`\>

Defined in: [packages/analytics/src/aggregators/metric.aggregator.ts:66](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/aggregators/metric.aggregator.ts#L66)

배치 메트릭 처리

#### Parameters

##### metrics

`object`[]

#### Returns

`Promise`\<`void`\>

***

### aggregateByRules()

> **aggregateByRules**(`metrics`): `Promise`\<[`AggregatedMetric`](/en/api/analytics/src/interfaces/aggregatedmetric/)[]\>

Defined in: [packages/analytics/src/aggregators/metric.aggregator.ts:75](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/aggregators/metric.aggregator.ts#L75)

규칙 기반 집계 실행

#### Parameters

##### metrics

`object`[]

#### Returns

`Promise`\<[`AggregatedMetric`](/en/api/analytics/src/interfaces/aggregatedmetric/)[]\>

***

### aggregateCustom()

> **aggregateCustom**(`metrics`, `groupBy`, `aggregationType`, `filters?`): `Promise`\<[`AggregatedMetric`](/en/api/analytics/src/interfaces/aggregatedmetric/)[]\>

Defined in: [packages/analytics/src/aggregators/metric.aggregator.ts:95](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/aggregators/metric.aggregator.ts#L95)

커스텀 집계 (동적 규칙)

#### Parameters

##### metrics

`object`[]

##### groupBy

`string`[]

##### aggregationType

`"count"` \| `"sum"` \| `"max"` \| `"avg"` \| `"min"` \| `"rate"`

##### filters?

`Record`\<`string`, `any`\>

#### Returns

`Promise`\<[`AggregatedMetric`](/en/api/analytics/src/interfaces/aggregatedmetric/)[]\>

***

### aggregateSlidingWindow()

> **aggregateSlidingWindow**(`metrics`, `windowSizeMs`, `stepMs`, `aggregationType`): `Promise`\<[`AggregatedMetric`](/en/api/analytics/src/interfaces/aggregatedmetric/)[]\>

Defined in: [packages/analytics/src/aggregators/metric.aggregator.ts:211](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/aggregators/metric.aggregator.ts#L211)

슬라이딩 윈도우 집계

#### Parameters

##### metrics

`object`[]

##### windowSizeMs

`number`

##### stepMs

`number`

##### aggregationType

`"count"` \| `"sum"` \| `"max"` \| `"avg"` \| `"min"`

#### Returns

`Promise`\<[`AggregatedMetric`](/en/api/analytics/src/interfaces/aggregatedmetric/)[]\>

***

### calculatePercentiles()

> **calculatePercentiles**(`metrics`, `percentiles`, `groupBy?`): `Promise`\<[`AggregatedMetric`](/en/api/analytics/src/interfaces/aggregatedmetric/)[]\>

Defined in: [packages/analytics/src/aggregators/metric.aggregator.ts:174](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/aggregators/metric.aggregator.ts#L174)

백분위수 계산

#### Parameters

##### metrics

`object`[]

##### percentiles

`number`[]

##### groupBy?

`string`[] = `[]`

#### Returns

`Promise`\<[`AggregatedMetric`](/en/api/analytics/src/interfaces/aggregatedmetric/)[]\>

***

### calculateRates()

> **calculateRates**(`numeratorMetrics`, `denominatorMetrics`, `groupBy?`): `Promise`\<[`AggregatedMetric`](/en/api/analytics/src/interfaces/aggregatedmetric/)[]\>

Defined in: [packages/analytics/src/aggregators/metric.aggregator.ts:128](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/aggregators/metric.aggregator.ts#L128)

비율 계산 (예: 전환율, 오류율)

#### Parameters

##### numeratorMetrics

`object`[]

##### denominatorMetrics

`object`[]

##### groupBy?

`string`[] = `[]`

#### Returns

`Promise`\<[`AggregatedMetric`](/en/api/analytics/src/interfaces/aggregatedmetric/)[]\>

***

### normalizeMetrics()

> **normalizeMetrics**(`metrics`, `method`): `Promise`\<[`AggregatedMetric`](/en/api/analytics/src/interfaces/aggregatedmetric/)[]\>

Defined in: [packages/analytics/src/aggregators/metric.aggregator.ts:253](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/aggregators/metric.aggregator.ts#L253)

메트릭 정규화

#### Parameters

##### metrics

[`AggregatedMetric`](/en/api/analytics/src/interfaces/aggregatedmetric/)[]

##### method

`"minmax"` \| `"zscore"` \| `"robust"`

#### Returns

`Promise`\<[`AggregatedMetric`](/en/api/analytics/src/interfaces/aggregatedmetric/)[]\>
