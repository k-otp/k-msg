---
editUrl: false
next: false
prev: false
title: "AnomalyDetector"
---

Defined in: [packages/analytics/src/insights/anomaly.detector.ts:47](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/insights/anomaly.detector.ts#L47)

## Constructors

### Constructor

> **new AnomalyDetector**(`config?`): `AnomalyDetector`

Defined in: [packages/analytics/src/insights/anomaly.detector.ts:83](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/insights/anomaly.detector.ts#L83)

#### Parameters

##### config?

`Partial`\<[`AnomalyDetectionConfig`](/api/analytics/src/interfaces/anomalydetectionconfig/)\> = `{}`

#### Returns

`AnomalyDetector`

## Methods

### detectBatchAnomalies()

> **detectBatchAnomalies**(`metrics`, `timeWindow?`): `Promise`\<[`Anomaly`](/api/analytics/src/interfaces/anomaly/)[]\>

Defined in: [packages/analytics/src/insights/anomaly.detector.ts:121](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/insights/anomaly.detector.ts#L121)

배치 이상 탐지

#### Parameters

##### metrics

[`AggregatedMetric`](/api/analytics/src/interfaces/aggregatedmetric/)[]

##### timeWindow?

###### end

`Date`

###### start

`Date`

#### Returns

`Promise`\<[`Anomaly`](/api/analytics/src/interfaces/anomaly/)[]\>

***

### detectRealTimeAnomalies()

> **detectRealTimeAnomalies**(`metric`): `Promise`\<[`Anomaly`](/api/analytics/src/interfaces/anomaly/)[]\>

Defined in: [packages/analytics/src/insights/anomaly.detector.ts:90](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/insights/anomaly.detector.ts#L90)

실시간 이상 탐지

#### Parameters

##### metric

[`MetricData`](/api/analytics/src/interfaces/metricdata/)

#### Returns

`Promise`\<[`Anomaly`](/api/analytics/src/interfaces/anomaly/)[]\>

***

### detectTrendChanges()

> **detectTrendChanges**(`metrics`, `windowSize?`): `Promise`\<[`InsightData`](/api/analytics/src/interfaces/insightdata/)[]\>

Defined in: [packages/analytics/src/insights/anomaly.detector.ts:179](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/insights/anomaly.detector.ts#L179)

트렌드 변화 탐지

#### Parameters

##### metrics

[`AggregatedMetric`](/api/analytics/src/interfaces/aggregatedmetric/)[]

##### windowSize?

`number` = `10`

#### Returns

`Promise`\<[`InsightData`](/api/analytics/src/interfaces/insightdata/)[]\>

***

### updateBaselines()

> **updateBaselines**(`metrics`): `Promise`\<`void`\>

Defined in: [packages/analytics/src/insights/anomaly.detector.ts:248](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/insights/anomaly.detector.ts#L248)

베이스라인 업데이트

#### Parameters

##### metrics

[`AggregatedMetric`](/api/analytics/src/interfaces/aggregatedmetric/)[]

#### Returns

`Promise`\<`void`\>
