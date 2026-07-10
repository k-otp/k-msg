---
editUrl: false
next: false
prev: false
title: "AnomalyDetector"
---

Defined in: [packages/analytics/src/insights/anomaly.detector.ts:47](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/insights/anomaly.detector.ts#L47)

## Constructors

### Constructor

> **new AnomalyDetector**(`config?`): `AnomalyDetector`

Defined in: [packages/analytics/src/insights/anomaly.detector.ts:83](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/insights/anomaly.detector.ts#L83)

#### Parameters

##### config?

`Partial`\<[`AnomalyDetectionConfig`](/en/api/analytics/src/interfaces/anomalydetectionconfig/)\> = `{}`

#### Returns

`AnomalyDetector`

## Methods

### detectBatchAnomalies()

> **detectBatchAnomalies**(`metrics`, `timeWindow?`): `Promise`\<[`Anomaly`](/en/api/analytics/src/interfaces/anomaly/)[]\>

Defined in: [packages/analytics/src/insights/anomaly.detector.ts:121](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/insights/anomaly.detector.ts#L121)

배치 이상 탐지

#### Parameters

##### metrics

[`AggregatedMetric`](/en/api/analytics/src/interfaces/aggregatedmetric/)[]

##### timeWindow?

###### end

`Date`

###### start

`Date`

#### Returns

`Promise`\<[`Anomaly`](/en/api/analytics/src/interfaces/anomaly/)[]\>

***

### detectRealTimeAnomalies()

> **detectRealTimeAnomalies**(`metric`): `Promise`\<[`Anomaly`](/en/api/analytics/src/interfaces/anomaly/)[]\>

Defined in: [packages/analytics/src/insights/anomaly.detector.ts:90](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/insights/anomaly.detector.ts#L90)

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

`Promise`\<[`Anomaly`](/en/api/analytics/src/interfaces/anomaly/)[]\>

***

### detectTrendChanges()

> **detectTrendChanges**(`metrics`, `windowSize?`): `Promise`\<`object`[]\>

Defined in: [packages/analytics/src/insights/anomaly.detector.ts:179](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/insights/anomaly.detector.ts#L179)

트렌드 변화 탐지

#### Parameters

##### metrics

[`AggregatedMetric`](/en/api/analytics/src/interfaces/aggregatedmetric/)[]

##### windowSize?

`number` = `10`

#### Returns

`Promise`\<`object`[]\>

***

### updateBaselines()

> **updateBaselines**(`metrics`): `Promise`\<`void`\>

Defined in: [packages/analytics/src/insights/anomaly.detector.ts:248](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/insights/anomaly.detector.ts#L248)

베이스라인 업데이트

#### Parameters

##### metrics

[`AggregatedMetric`](/en/api/analytics/src/interfaces/aggregatedmetric/)[]

#### Returns

`Promise`\<`void`\>
