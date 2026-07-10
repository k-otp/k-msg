---
editUrl: false
next: false
prev: false
title: "ExportManager"
---

Defined in: [packages/analytics/src/reports/export.manager.ts:77](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/reports/export.manager.ts#L77)

## Constructors

### Constructor

> **new ExportManager**(`config?`): `ExportManager`

Defined in: [packages/analytics/src/reports/export.manager.ts:92](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/reports/export.manager.ts#L92)

#### Parameters

##### config?

`Partial`\<[`ExportConfig`](/en/api/analytics/src/interfaces/exportconfig/)\> = `{}`

#### Returns

`ExportManager`

## Methods

### deleteExport()

> **deleteExport**(`exportId`): `boolean`

Defined in: [packages/analytics/src/reports/export.manager.ts:272](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/reports/export.manager.ts#L272)

내보내기 삭제

#### Parameters

##### exportId

`string`

#### Returns

`boolean`

***

### exportInsights()

> **exportInsights**(`insights`, `format`, `options?`): `Promise`\<[`ExportResult`](/en/api/analytics/src/interfaces/exportresult/)\>

Defined in: [packages/analytics/src/reports/export.manager.ts:204](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/reports/export.manager.ts#L204)

인사이트 데이터 내보내기

#### Parameters

##### insights

`object`[]

##### format

[`ExportFormat`](/en/api/analytics/src/interfaces/exportformat/)

##### options?

`any` = `{}`

#### Returns

`Promise`\<[`ExportResult`](/en/api/analytics/src/interfaces/exportresult/)\>

***

### exportMetrics()

> **exportMetrics**(`metrics`, `format`, `options?`): `Promise`\<[`ExportResult`](/en/api/analytics/src/interfaces/exportresult/)\>

Defined in: [packages/analytics/src/reports/export.manager.ts:161](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/reports/export.manager.ts#L161)

메트릭 데이터 내보내기

#### Parameters

##### metrics

[`AggregatedMetric`](/en/api/analytics/src/interfaces/aggregatedmetric/)[]

##### format

[`ExportFormat`](/en/api/analytics/src/interfaces/exportformat/)

##### options?

`any` = `{}`

#### Returns

`Promise`\<[`ExportResult`](/en/api/analytics/src/interfaces/exportresult/)\>

***

### exportReport()

> **exportReport**(`report`, `format`, `options?`): `Promise`\<[`ExportResult`](/en/api/analytics/src/interfaces/exportresult/)\>

Defined in: [packages/analytics/src/reports/export.manager.ts:99](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/reports/export.manager.ts#L99)

분석 보고서 내보내기

#### Parameters

##### report

[`AnalyticsReport`](/en/api/analytics/src/interfaces/analyticsreport/)

##### format

[`ExportFormat`](/en/api/analytics/src/interfaces/exportformat/)

##### options?

`any` = `{}`

#### Returns

`Promise`\<[`ExportResult`](/en/api/analytics/src/interfaces/exportresult/)\>

***

### getExportStatus()

> **getExportStatus**(`exportId`): [`ExportResult`](/en/api/analytics/src/interfaces/exportresult/) \| `null`

Defined in: [packages/analytics/src/reports/export.manager.ts:254](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/reports/export.manager.ts#L254)

내보내기 상태 조회

#### Parameters

##### exportId

`string`

#### Returns

[`ExportResult`](/en/api/analytics/src/interfaces/exportresult/) \| `null`

***

### listExports()

> **listExports**(`limit?`): [`ExportResult`](/en/api/analytics/src/interfaces/exportresult/)[]

Defined in: [packages/analytics/src/reports/export.manager.ts:261](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/reports/export.manager.ts#L261)

내보내기 목록 조회

#### Parameters

##### limit?

`number` = `50`

#### Returns

[`ExportResult`](/en/api/analytics/src/interfaces/exportresult/)[]
