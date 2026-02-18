---
editUrl: false
next: false
prev: false
title: "AnalyticsQuery"
---

Defined in: [packages/analytics/src/types/analytics.types.ts:84](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/types/analytics.types.ts#L84)

## Properties

### dateRange

> **dateRange**: `object`

Defined in: [packages/analytics/src/types/analytics.types.ts:86](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/types/analytics.types.ts#L86)

#### end

> **end**: `Date`

#### start

> **start**: `Date`

***

### filters?

> `optional` **filters**: `Record`\<`string`, `any`\>

Defined in: [packages/analytics/src/types/analytics.types.ts:91](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/types/analytics.types.ts#L91)

***

### groupBy?

> `optional` **groupBy**: `string`[]

Defined in: [packages/analytics/src/types/analytics.types.ts:92](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/types/analytics.types.ts#L92)

***

### interval?

> `optional` **interval**: `"minute"` \| `"hour"` \| `"day"` \| `"week"` \| `"month"`

Defined in: [packages/analytics/src/types/analytics.types.ts:90](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/types/analytics.types.ts#L90)

***

### limit?

> `optional` **limit**: `number`

Defined in: [packages/analytics/src/types/analytics.types.ts:94](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/types/analytics.types.ts#L94)

***

### metrics

> **metrics**: [`MetricType`](/api/analytics/src/enumerations/metrictype/)[]

Defined in: [packages/analytics/src/types/analytics.types.ts:85](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/types/analytics.types.ts#L85)

***

### offset?

> `optional` **offset**: `number`

Defined in: [packages/analytics/src/types/analytics.types.ts:95](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/types/analytics.types.ts#L95)

***

### orderBy?

> `optional` **orderBy**: `object`[]

Defined in: [packages/analytics/src/types/analytics.types.ts:93](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/types/analytics.types.ts#L93)

#### direction

> **direction**: `"asc"` \| `"desc"`

#### field

> **field**: `string`
