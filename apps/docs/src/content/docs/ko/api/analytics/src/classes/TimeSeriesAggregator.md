---
editUrl: false
next: false
prev: false
title: "TimeSeriesAggregator"
---

Defined in: [packages/analytics/src/aggregators/time-series.aggregator.ts:24](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/aggregators/time-series.aggregator.ts#L24)

## Constructors

### Constructor

> **new TimeSeriesAggregator**(`timezone?`): `TimeSeriesAggregator`

Defined in: [packages/analytics/src/aggregators/time-series.aggregator.ts:27](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/aggregators/time-series.aggregator.ts#L27)

#### Parameters

##### timezone?

`string` = `"UTC"`

#### Returns

`TimeSeriesAggregator`

## Methods

### aggregate()

> **aggregate**(`metrics`, `interval`, `options?`): `Promise`\<[`AggregatedMetric`](/api/analytics/src/interfaces/aggregatedmetric/)[]\>

Defined in: [packages/analytics/src/aggregators/time-series.aggregator.ts:34](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/aggregators/time-series.aggregator.ts#L34)

시계열 데이터를 지정된 간격으로 집계

#### Parameters

##### metrics

[`MetricData`](/api/analytics/src/interfaces/metricdata/)[]

##### interval

`"minute"` | `"hour"` | `"day"` | `"week"` | `"month"`

##### options?

[`AggregationOptions`](/api/analytics/src/interfaces/aggregationoptions/) = `...`

#### Returns

`Promise`\<[`AggregatedMetric`](/api/analytics/src/interfaces/aggregatedmetric/)[]\>

***

### aggregateRolling()

> **aggregateRolling**(`metrics`, `windowSize`, `step?`): `Promise`\<[`AggregatedMetric`](/api/analytics/src/interfaces/aggregatedmetric/)[]\>

Defined in: [packages/analytics/src/aggregators/time-series.aggregator.ts:74](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/aggregators/time-series.aggregator.ts#L74)

롤링 윈도우 집계

#### Parameters

##### metrics

[`MetricData`](/api/analytics/src/interfaces/metricdata/)[]

##### windowSize

`number`

##### step?

`number` = `windowSize`

#### Returns

`Promise`\<[`AggregatedMetric`](/api/analytics/src/interfaces/aggregatedmetric/)[]\>

***

### decomposeSeasonality()

> **decomposeSeasonality**(`metrics`, `seasonLength?`): `Promise`\<\{ `residual`: [`AggregatedMetric`](/api/analytics/src/interfaces/aggregatedmetric/)[]; `seasonal`: [`AggregatedMetric`](/api/analytics/src/interfaces/aggregatedmetric/)[]; `trend`: [`AggregatedMetric`](/api/analytics/src/interfaces/aggregatedmetric/)[]; \}\>

Defined in: [packages/analytics/src/aggregators/time-series.aggregator.ts:121](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/aggregators/time-series.aggregator.ts#L121)

계절성 분해 (간단한 이동평균 기반)

#### Parameters

##### metrics

[`AggregatedMetric`](/api/analytics/src/interfaces/aggregatedmetric/)[]

##### seasonLength?

`number` = `24`

#### Returns

`Promise`\<\{ `residual`: [`AggregatedMetric`](/api/analytics/src/interfaces/aggregatedmetric/)[]; `seasonal`: [`AggregatedMetric`](/api/analytics/src/interfaces/aggregatedmetric/)[]; `trend`: [`AggregatedMetric`](/api/analytics/src/interfaces/aggregatedmetric/)[]; \}\>

***

### downsample()

> **downsample**(`metrics`, `targetInterval`): `Promise`\<[`AggregatedMetric`](/api/analytics/src/interfaces/aggregatedmetric/)[]\>

Defined in: [packages/analytics/src/aggregators/time-series.aggregator.ts:156](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/aggregators/time-series.aggregator.ts#L156)

다운샘플링 (고해상도 → 저해상도)

#### Parameters

##### metrics

[`AggregatedMetric`](/api/analytics/src/interfaces/aggregatedmetric/)[]

##### targetInterval

`"minute"` | `"hour"` | `"day"` | `"week"` | `"month"`

#### Returns

`Promise`\<[`AggregatedMetric`](/api/analytics/src/interfaces/aggregatedmetric/)[]\>
