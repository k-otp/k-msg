---
editUrl: false
next: false
prev: false
title: "ExportManager"
---

Defined in: [packages/analytics/src/reports/export.manager.ts:76](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/reports/export.manager.ts#L76)

## Constructors

### Constructor

> **new ExportManager**(`config?`): `ExportManager`

Defined in: [packages/analytics/src/reports/export.manager.ts:91](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/reports/export.manager.ts#L91)

#### Parameters

##### config?

`Partial`\<[`ExportConfig`](/api/analytics/src/interfaces/exportconfig/)\> = `{}`

#### Returns

`ExportManager`

## Methods

### deleteExport()

> **deleteExport**(`exportId`): `boolean`

Defined in: [packages/analytics/src/reports/export.manager.ts:271](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/reports/export.manager.ts#L271)

내보내기 삭제

#### Parameters

##### exportId

`string`

#### Returns

`boolean`

***

### exportInsights()

> **exportInsights**(`insights`, `format`, `options?`): `Promise`\<[`ExportResult`](/api/analytics/src/interfaces/exportresult/)\>

Defined in: [packages/analytics/src/reports/export.manager.ts:203](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/reports/export.manager.ts#L203)

인사이트 데이터 내보내기

#### Parameters

##### insights

[`InsightData`](/api/analytics/src/interfaces/insightdata/)[]

##### format

[`ExportFormat`](/api/analytics/src/interfaces/exportformat/)

##### options?

`any` = `{}`

#### Returns

`Promise`\<[`ExportResult`](/api/analytics/src/interfaces/exportresult/)\>

***

### exportMetrics()

> **exportMetrics**(`metrics`, `format`, `options?`): `Promise`\<[`ExportResult`](/api/analytics/src/interfaces/exportresult/)\>

Defined in: [packages/analytics/src/reports/export.manager.ts:160](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/reports/export.manager.ts#L160)

메트릭 데이터 내보내기

#### Parameters

##### metrics

[`AggregatedMetric`](/api/analytics/src/interfaces/aggregatedmetric/)[]

##### format

[`ExportFormat`](/api/analytics/src/interfaces/exportformat/)

##### options?

`any` = `{}`

#### Returns

`Promise`\<[`ExportResult`](/api/analytics/src/interfaces/exportresult/)\>

***

### exportReport()

> **exportReport**(`report`, `format`, `options?`): `Promise`\<[`ExportResult`](/api/analytics/src/interfaces/exportresult/)\>

Defined in: [packages/analytics/src/reports/export.manager.ts:98](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/reports/export.manager.ts#L98)

분석 보고서 내보내기

#### Parameters

##### report

[`AnalyticsReport`](/api/analytics/src/interfaces/analyticsreport/)

##### format

[`ExportFormat`](/api/analytics/src/interfaces/exportformat/)

##### options?

`any` = `{}`

#### Returns

`Promise`\<[`ExportResult`](/api/analytics/src/interfaces/exportresult/)\>

***

### getExportStatus()

> **getExportStatus**(`exportId`): [`ExportResult`](/api/analytics/src/interfaces/exportresult/) \| `null`

Defined in: [packages/analytics/src/reports/export.manager.ts:253](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/reports/export.manager.ts#L253)

내보내기 상태 조회

#### Parameters

##### exportId

`string`

#### Returns

[`ExportResult`](/api/analytics/src/interfaces/exportresult/) \| `null`

***

### listExports()

> **listExports**(`limit?`): [`ExportResult`](/api/analytics/src/interfaces/exportresult/)[]

Defined in: [packages/analytics/src/reports/export.manager.ts:260](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/reports/export.manager.ts#L260)

내보내기 목록 조회

#### Parameters

##### limit?

`number` = `50`

#### Returns

[`ExportResult`](/api/analytics/src/interfaces/exportresult/)[]
