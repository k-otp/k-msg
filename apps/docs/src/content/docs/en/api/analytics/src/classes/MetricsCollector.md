---
editUrl: false
next: false
prev: false
title: "MetricsCollector"
---

Defined in: [packages/analytics/src/services/metrics.collector.ts:8](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/services/metrics.collector.ts#L8)

## Constructors

### Constructor

> **new MetricsCollector**(`config`): `MetricsCollector`

Defined in: [packages/analytics/src/services/metrics.collector.ts:15](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/services/metrics.collector.ts#L15)

#### Parameters

##### config

[`AnalyticsConfig`](/api/analytics/src/interfaces/analyticsconfig/)

#### Returns

`MetricsCollector`

## Methods

### cleanup()

> **cleanup**(): `Promise`\<`void`\>

Defined in: [packages/analytics/src/services/metrics.collector.ts:190](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/services/metrics.collector.ts#L190)

메트릭 정리 (보존 기간 초과)

#### Returns

`Promise`\<`void`\>

***

### collect()

> **collect**(`metric`): `Promise`\<`void`\>

Defined in: [packages/analytics/src/services/metrics.collector.ts:23](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/services/metrics.collector.ts#L23)

메트릭 수집

#### Parameters

##### metric

[`MetricData`](/api/analytics/src/interfaces/metricdata/)

#### Returns

`Promise`\<`void`\>

***

### collectBatch()

> **collectBatch**(`metrics`): `Promise`\<`void`\>

Defined in: [packages/analytics/src/services/metrics.collector.ts:39](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/services/metrics.collector.ts#L39)

여러 메트릭 일괄 수집

#### Parameters

##### metrics

[`MetricData`](/api/analytics/src/interfaces/metricdata/)[]

#### Returns

`Promise`\<`void`\>

***

### flush()

> **flush**(): `Promise`\<`void`\>

Defined in: [packages/analytics/src/services/metrics.collector.ts:165](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/services/metrics.collector.ts#L165)

메트릭 버퍼 플러시

#### Returns

`Promise`\<`void`\>

***

### getMetricStats()

> **getMetricStats**(`type`, `timeRange`): `Promise`\<\{ `avg`: `number`; `count`: `number`; `max`: `number`; `min`: `number`; `sum`: `number`; \}\>

Defined in: [packages/analytics/src/services/metrics.collector.ts:69](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/services/metrics.collector.ts#L69)

메트릭 통계 조회

#### Parameters

##### type

[`MetricType`](/api/analytics/src/enumerations/metrictype/)

##### timeRange

###### end

`Date`

###### start

`Date`

#### Returns

`Promise`\<\{ `avg`: `number`; `count`: `number`; `max`: `number`; `min`: `number`; `sum`: `number`; \}\>

***

### getRecentMetrics()

> **getRecentMetrics**(`types`, `durationMs`): `Promise`\<[`MetricData`](/api/analytics/src/interfaces/metricdata/)[]\>

Defined in: [packages/analytics/src/services/metrics.collector.ts:48](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/services/metrics.collector.ts#L48)

최근 메트릭 조회

#### Parameters

##### types

[`MetricType`](/api/analytics/src/enumerations/metrictype/)[]

##### durationMs

`number`

#### Returns

`Promise`\<[`MetricData`](/api/analytics/src/interfaces/metricdata/)[]\>

***

### incrementCounter()

> **incrementCounter**(`type`, `dimensions`, `value?`): `Promise`\<`void`\>

Defined in: [packages/analytics/src/services/metrics.collector.ts:105](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/services/metrics.collector.ts#L105)

메트릭 카운터 증가

#### Parameters

##### type

[`MetricType`](/api/analytics/src/enumerations/metrictype/)

##### dimensions

`Record`\<`string`, `string`\>

##### value?

`number` = `1`

#### Returns

`Promise`\<`void`\>

***

### recordHistogram()

> **recordHistogram**(`type`, `dimensions`, `value`): `Promise`\<`void`\>

Defined in: [packages/analytics/src/services/metrics.collector.ts:143](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/services/metrics.collector.ts#L143)

메트릭 히스토그램 기록

#### Parameters

##### type

[`MetricType`](/api/analytics/src/enumerations/metrictype/)

##### dimensions

`Record`\<`string`, `string`\>

##### value

`number`

#### Returns

`Promise`\<`void`\>

***

### setGauge()

> **setGauge**(`type`, `dimensions`, `value`): `Promise`\<`void`\>

Defined in: [packages/analytics/src/services/metrics.collector.ts:124](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/services/metrics.collector.ts#L124)

메트릭 게이지 값 설정

#### Parameters

##### type

[`MetricType`](/api/analytics/src/enumerations/metrictype/)

##### dimensions

`Record`\<`string`, `string`\>

##### value

`number`

#### Returns

`Promise`\<`void`\>
