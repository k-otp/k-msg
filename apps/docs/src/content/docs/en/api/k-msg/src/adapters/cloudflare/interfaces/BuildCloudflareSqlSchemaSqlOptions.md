---
editUrl: false
next: false
prev: false
title: "BuildCloudflareSqlSchemaSqlOptions"
---

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:71](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L71)

## Properties

### dialect

> **dialect**: [`SqlDialect`](/en/api/k-msg/src/adapters/cloudflare/type-aliases/sqldialect/)

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:72](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L72)

***

### fieldCryptoSchema?

> `optional` **fieldCryptoSchema?**: `DeliveryTrackingFieldCryptoSchemaOptions`

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:79](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L79)

***

### includeIndexes?

> `optional` **includeIndexes?**: `boolean`

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:86](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L86)

***

### includeMigrationMeta?

> `optional` **includeMigrationMeta?**: `boolean`

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:81](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L81)

***

### migrationChunksTableName?

> `optional` **migrationChunksTableName?**: `string`

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:83](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L83)

***

### migrationRunsTableName?

> `optional` **migrationRunsTableName?**: `string`

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:82](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L82)

***

### queueIndexNames?

> `optional` **queueIndexNames?**: `Partial`\<[`JobQueueIndexNames`](/en/api/k-msg/src/adapters/cloudflare/interfaces/jobqueueindexnames/)\>

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:85](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L85)

***

### queueTableName?

> `optional` **queueTableName?**: `string`

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:84](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L84)

***

### target?

> `optional` **target?**: [`CloudflareSqlSchemaTarget`](/en/api/k-msg/src/adapters/cloudflare/type-aliases/cloudflaresqlschematarget/)

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:73](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L73)

***

### trackingColumnMap?

> `optional` **trackingColumnMap?**: `Partial`\<[`DeliveryTrackingColumnMap`](/en/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingcolumnmap/)\>

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:75](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L75)

***

### trackingIndexNames?

> `optional` **trackingIndexNames?**: `Partial`\<\{ `due`: `string`; `fromHash`: `string`; `providerMessage`: `string`; `requestedAt`: `string`; `retentionBucket`: `string`; `toHash`: `string`; \}\>

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:80](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L80)

***

### trackingStoreRaw?

> `optional` **trackingStoreRaw?**: `boolean`

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:78](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L78)

***

### trackingTableName?

> `optional` **trackingTableName?**: `string`

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:74](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L74)

***

### trackingTypeStrategy?

> `optional` **trackingTypeStrategy?**: `Partial`\<[`DeliveryTrackingTypeStrategy`](/en/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingtypestrategy/)\>

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:76](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L76)

***

### typeStrategy?

> `optional` **typeStrategy?**: `Partial`\<[`DeliveryTrackingTypeStrategy`](/en/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingtypestrategy/)\>

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:77](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L77)
