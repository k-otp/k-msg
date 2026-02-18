---
editUrl: false
next: false
prev: false
title: "DashboardGenerator"
---

Defined in: [packages/analytics/src/reports/dashboard.ts:87](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/reports/dashboard.ts#L87)

## Constructors

### Constructor

> **new DashboardGenerator**(`config?`): `DashboardGenerator`

Defined in: [packages/analytics/src/reports/dashboard.ts:116](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/reports/dashboard.ts#L116)

#### Parameters

##### config?

`Partial`\<[`DashboardConfig`](/api/analytics/src/interfaces/dashboardconfig/)\> = `{}`

#### Returns

`DashboardGenerator`

## Methods

### addWidget()

> **addWidget**(`widget`): `void`

Defined in: [packages/analytics/src/reports/dashboard.ts:221](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/reports/dashboard.ts#L221)

위젯 추가

#### Parameters

##### widget

[`DashboardWidget`](/api/analytics/src/interfaces/dashboardwidget/)

#### Returns

`void`

***

### generateDashboard()

> **generateDashboard**(`timeRange`, `filters?`, `metrics?`): `Promise`\<[`DashboardData`](/api/analytics/src/interfaces/dashboarddata/)\>

Defined in: [packages/analytics/src/reports/dashboard.ts:124](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/reports/dashboard.ts#L124)

대시보드 데이터 생성

#### Parameters

##### timeRange

###### end

`Date`

###### start

`Date`

##### filters?

`Record`\<`string`, `any`\> = `{}`

##### metrics?

[`AggregatedMetric`](/api/analytics/src/interfaces/aggregatedmetric/)[] = `[]`

#### Returns

`Promise`\<[`DashboardData`](/api/analytics/src/interfaces/dashboarddata/)\>

***

### removeWidget()

> **removeWidget**(`widgetId`): `boolean`

Defined in: [packages/analytics/src/reports/dashboard.ts:228](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/reports/dashboard.ts#L228)

위젯 제거

#### Parameters

##### widgetId

`string`

#### Returns

`boolean`

***

### streamDashboard()

> **streamDashboard**(`timeRange`, `filters?`): `AsyncGenerator`\<[`DashboardData`](/api/analytics/src/interfaces/dashboarddata/)\>

Defined in: [packages/analytics/src/reports/dashboard.ts:165](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/reports/dashboard.ts#L165)

실시간 대시보드 스트림

#### Parameters

##### timeRange

###### end

`Date`

###### start

`Date`

##### filters?

`Record`\<`string`, `any`\> = `{}`

#### Returns

`AsyncGenerator`\<[`DashboardData`](/api/analytics/src/interfaces/dashboarddata/)\>

***

### updateConfig()

> **updateConfig**(`config`): `void`

Defined in: [packages/analytics/src/reports/dashboard.ts:214](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/reports/dashboard.ts#L214)

대시보드 구성 업데이트

#### Parameters

##### config

`Partial`\<[`DashboardConfig`](/api/analytics/src/interfaces/dashboardconfig/)\>

#### Returns

`void`

***

### updateWidget()

> **updateWidget**(`widgetId`, `metrics`, `timeRange`, `filters?`): `Promise`\<[`WidgetData`](/api/analytics/src/interfaces/widgetdata/) \| `null`\>

Defined in: [packages/analytics/src/reports/dashboard.ts:182](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/reports/dashboard.ts#L182)

특정 위젯 데이터 업데이트

#### Parameters

##### widgetId

`string`

##### metrics

[`AggregatedMetric`](/api/analytics/src/interfaces/aggregatedmetric/)[]

##### timeRange

###### end

`Date`

###### start

`Date`

##### filters?

`Record`\<`string`, `any`\> = `{}`

#### Returns

`Promise`\<[`WidgetData`](/api/analytics/src/interfaces/widgetdata/) \| `null`\>
