---
editUrl: false
next: false
prev: false
title: "MetricAggregator"
---

Defined in: [packages/analytics/src/aggregators/metric.aggregator.ts:34](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/aggregators/metric.aggregator.ts#L34)

## Constructors

### Constructor

> **new MetricAggregator**(`config`): `MetricAggregator`

Defined in: [packages/analytics/src/aggregators/metric.aggregator.ts:39](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/aggregators/metric.aggregator.ts#L39)

#### Parameters

##### config

[`AggregatorConfig`](/api/analytics/src/interfaces/aggregatorconfig/)

#### Returns

`MetricAggregator`

## Methods

### addMetric()

> **addMetric**(`metric`): `Promise`\<`void`\>

Defined in: [packages/analytics/src/aggregators/metric.aggregator.ts:47](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/aggregators/metric.aggregator.ts#L47)

메트릭 추가 및 실시간 집계

#### Parameters

##### metric

[`MetricData`](/api/analytics/src/interfaces/metricdata/)

#### Returns

`Promise`\<`void`\>

***

### addMetrics()

> **addMetrics**(`metrics`): `Promise`\<`void`\>

Defined in: [packages/analytics/src/aggregators/metric.aggregator.ts:65](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/aggregators/metric.aggregator.ts#L65)

배치 메트릭 처리

#### Parameters

##### metrics

[`MetricData`](/api/analytics/src/interfaces/metricdata/)[]

#### Returns

`Promise`\<`void`\>

***

### aggregateByRules()

> **aggregateByRules**(`metrics`): `Promise`\<[`AggregatedMetric`](/api/analytics/src/interfaces/aggregatedmetric/)[]\>

Defined in: [packages/analytics/src/aggregators/metric.aggregator.ts:74](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/aggregators/metric.aggregator.ts#L74)

규칙 기반 집계 실행

#### Parameters

##### metrics

[`MetricData`](/api/analytics/src/interfaces/metricdata/)[]

#### Returns

`Promise`\<[`AggregatedMetric`](/api/analytics/src/interfaces/aggregatedmetric/)[]\>

***

### aggregateCustom()

> **aggregateCustom**(`metrics`, `groupBy`, `aggregationType`, `filters?`): `Promise`\<[`AggregatedMetric`](/api/analytics/src/interfaces/aggregatedmetric/)[]\>

Defined in: [packages/analytics/src/aggregators/metric.aggregator.ts:94](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/aggregators/metric.aggregator.ts#L94)

커스텀 집계 (동적 규칙)

#### Parameters

##### metrics

[`MetricData`](/api/analytics/src/interfaces/metricdata/)[]

##### groupBy

`string`[]

##### aggregationType

`"max"` | `"count"` | `"sum"` | `"avg"` | `"min"` | `"rate"`

##### filters?

`Record`\<`string`, `any`\>

#### Returns

`Promise`\<[`AggregatedMetric`](/api/analytics/src/interfaces/aggregatedmetric/)[]\>

***

### aggregateSlidingWindow()

> **aggregateSlidingWindow**(`metrics`, `windowSizeMs`, `stepMs`, `aggregationType`): `Promise`\<[`AggregatedMetric`](/api/analytics/src/interfaces/aggregatedmetric/)[]\>

Defined in: [packages/analytics/src/aggregators/metric.aggregator.ts:210](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/aggregators/metric.aggregator.ts#L210)

슬라이딩 윈도우 집계

#### Parameters

##### metrics

[`MetricData`](/api/analytics/src/interfaces/metricdata/)[]

##### windowSizeMs

`number`

##### stepMs

`number`

##### aggregationType

`"max"` | `"count"` | `"sum"` | `"avg"` | `"min"`

#### Returns

`Promise`\<[`AggregatedMetric`](/api/analytics/src/interfaces/aggregatedmetric/)[]\>

***

### calculatePercentiles()

> **calculatePercentiles**(`metrics`, `percentiles`, `groupBy?`): `Promise`\<[`AggregatedMetric`](/api/analytics/src/interfaces/aggregatedmetric/)[]\>

Defined in: [packages/analytics/src/aggregators/metric.aggregator.ts:173](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/aggregators/metric.aggregator.ts#L173)

백분위수 계산

#### Parameters

##### metrics

[`MetricData`](/api/analytics/src/interfaces/metricdata/)[]

##### percentiles

`number`[]

##### groupBy?

`string`[] = `[]`

#### Returns

`Promise`\<[`AggregatedMetric`](/api/analytics/src/interfaces/aggregatedmetric/)[]\>

***

### calculateRates()

> **calculateRates**(`numeratorMetrics`, `denominatorMetrics`, `groupBy?`): `Promise`\<[`AggregatedMetric`](/api/analytics/src/interfaces/aggregatedmetric/)[]\>

Defined in: [packages/analytics/src/aggregators/metric.aggregator.ts:127](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/aggregators/metric.aggregator.ts#L127)

비율 계산 (예: 전환율, 오류율)

#### Parameters

##### numeratorMetrics

[`MetricData`](/api/analytics/src/interfaces/metricdata/)[]

##### denominatorMetrics

[`MetricData`](/api/analytics/src/interfaces/metricdata/)[]

##### groupBy?

`string`[] = `[]`

#### Returns

`Promise`\<[`AggregatedMetric`](/api/analytics/src/interfaces/aggregatedmetric/)[]\>

***

### normalizeMetrics()

> **normalizeMetrics**(`metrics`, `method`): `Promise`\<[`AggregatedMetric`](/api/analytics/src/interfaces/aggregatedmetric/)[]\>

Defined in: [packages/analytics/src/aggregators/metric.aggregator.ts:252](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/aggregators/metric.aggregator.ts#L252)

메트릭 정규화

#### Parameters

##### metrics

[`AggregatedMetric`](/api/analytics/src/interfaces/aggregatedmetric/)[]

##### method

`"minmax"` | `"zscore"` | `"robust"`

#### Returns

`Promise`\<[`AggregatedMetric`](/api/analytics/src/interfaces/aggregatedmetric/)[]\>
