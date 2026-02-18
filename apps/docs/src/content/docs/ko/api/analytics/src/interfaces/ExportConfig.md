---
editUrl: false
next: false
prev: false
title: "ExportConfig"
---

Defined in: [packages/analytics/src/reports/export.manager.ts:13](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/reports/export.manager.ts#L13)

## Properties

### compressionEnabled

> **compressionEnabled**: `boolean`

Defined in: [packages/analytics/src/reports/export.manager.ts:16](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/reports/export.manager.ts#L16)

***

### formats

> **formats**: [`ExportFormat`](/api/analytics/src/interfaces/exportformat/)[]

Defined in: [packages/analytics/src/reports/export.manager.ts:14](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/reports/export.manager.ts#L14)

***

### maxFileSize

> **maxFileSize**: `number`

Defined in: [packages/analytics/src/reports/export.manager.ts:15](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/reports/export.manager.ts#L15)

***

### scheduling?

> `optional` **scheduling**: `object`

Defined in: [packages/analytics/src/reports/export.manager.ts:21](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/reports/export.manager.ts#L21)

#### cron

> **cron**: `string`

#### enabled

> **enabled**: `boolean`

#### recipients

> **recipients**: `string`[]

***

### watermark?

> `optional` **watermark**: `object`

Defined in: [packages/analytics/src/reports/export.manager.ts:17](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/reports/export.manager.ts#L17)

#### position

> **position**: `"top"` \| `"bottom"`

#### text

> **text**: `string`
