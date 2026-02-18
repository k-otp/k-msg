---
editUrl: false
next: false
prev: false
title: "ReportGenerator"
---

Defined in: [packages/analytics/src/services/report.generator.ts:9](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/services/report.generator.ts#L9)

## Constructors

### Constructor

> **new ReportGenerator**(`config`): `ReportGenerator`

Defined in: [packages/analytics/src/services/report.generator.ts:12](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/services/report.generator.ts#L12)

#### Parameters

##### config

[`AnalyticsConfig`](/api/analytics/src/interfaces/analyticsconfig/)

#### Returns

`ReportGenerator`

## Methods

### exportToCSV()

> **exportToCSV**(`report`): `Promise`\<`string`\>

Defined in: [packages/analytics/src/services/report.generator.ts:167](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/services/report.generator.ts#L167)

보고서를 CSV 형식으로 내보내기

#### Parameters

##### report

[`AnalyticsReport`](/api/analytics/src/interfaces/analyticsreport/)

#### Returns

`Promise`\<`string`\>

***

### exportToJSON()

> **exportToJSON**(`report`): `Promise`\<`string`\>

Defined in: [packages/analytics/src/services/report.generator.ts:186](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/services/report.generator.ts#L186)

보고서를 JSON 형식으로 내보내기

#### Parameters

##### report

[`AnalyticsReport`](/api/analytics/src/interfaces/analyticsreport/)

#### Returns

`Promise`\<`string`\>

***

### generateCustomReport()

> **generateCustomReport**(`name`, `dateRange`, `filters`, `metricTypes`): `Promise`\<[`AnalyticsReport`](/api/analytics/src/interfaces/analyticsreport/)\>

Defined in: [packages/analytics/src/services/report.generator.ts:142](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/services/report.generator.ts#L142)

커스텀 보고서 생성

#### Parameters

##### name

`string`

##### dateRange

###### end

`Date`

###### start

`Date`

##### filters

`Record`\<`string`, `any`\>

##### metricTypes

[`MetricType`](/api/analytics/src/enumerations/metrictype/)[]

#### Returns

`Promise`\<[`AnalyticsReport`](/api/analytics/src/interfaces/analyticsreport/)\>

***

### generateDailySummary()

> **generateDailySummary**(`date`): `Promise`\<[`AnalyticsReport`](/api/analytics/src/interfaces/analyticsreport/)\>

Defined in: [packages/analytics/src/services/report.generator.ts:19](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/services/report.generator.ts#L19)

일일 요약 보고서 생성

#### Parameters

##### date

`Date`

#### Returns

`Promise`\<[`AnalyticsReport`](/api/analytics/src/interfaces/analyticsreport/)\>

***

### generateMonthlyReport()

> **generateMonthlyReport**(`year`, `month`): `Promise`\<[`AnalyticsReport`](/api/analytics/src/interfaces/analyticsreport/)\>

Defined in: [packages/analytics/src/services/report.generator.ts:74](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/services/report.generator.ts#L74)

월간 보고서 생성

#### Parameters

##### year

`number`

##### month

`number`

#### Returns

`Promise`\<[`AnalyticsReport`](/api/analytics/src/interfaces/analyticsreport/)\>

***

### generateProviderReport()

> **generateProviderReport**(`providerId`, `dateRange`): `Promise`\<[`AnalyticsReport`](/api/analytics/src/interfaces/analyticsreport/)\>

Defined in: [packages/analytics/src/services/report.generator.ts:104](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/services/report.generator.ts#L104)

프로바이더별 성능 보고서

#### Parameters

##### providerId

`string`

##### dateRange

###### end

`Date`

###### start

`Date`

#### Returns

`Promise`\<[`AnalyticsReport`](/api/analytics/src/interfaces/analyticsreport/)\>

***

### generateTemplateUsageReport()

> **generateTemplateUsageReport**(`dateRange`): `Promise`\<[`AnalyticsReport`](/api/analytics/src/interfaces/analyticsreport/)\>

Defined in: [packages/analytics/src/services/report.generator.ts:123](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/services/report.generator.ts#L123)

템플릿 사용량 보고서

#### Parameters

##### dateRange

###### end

`Date`

###### start

`Date`

#### Returns

`Promise`\<[`AnalyticsReport`](/api/analytics/src/interfaces/analyticsreport/)\>

***

### generateWeeklyReport()

> **generateWeeklyReport**(`weekStartDate`): `Promise`\<[`AnalyticsReport`](/api/analytics/src/interfaces/analyticsreport/)\>

Defined in: [packages/analytics/src/services/report.generator.ts:48](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/services/report.generator.ts#L48)

주간 보고서 생성

#### Parameters

##### weekStartDate

`Date`

#### Returns

`Promise`\<[`AnalyticsReport`](/api/analytics/src/interfaces/analyticsreport/)\>
