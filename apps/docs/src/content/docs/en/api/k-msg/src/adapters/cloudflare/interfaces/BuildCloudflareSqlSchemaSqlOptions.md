---
editUrl: false
next: false
prev: false
title: "BuildCloudflareSqlSchemaSqlOptions"
---

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:36](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L36)

## Properties

### dialect

> **dialect**: [`SqlDialect`](/api/k-msg/src/adapters/cloudflare/type-aliases/sqldialect/)

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:37](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L37)

***

### fieldCryptoSchema?

> `optional` **fieldCryptoSchema**: `DeliveryTrackingFieldCryptoSchemaOptions`

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:44](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L44)

***

### includeIndexes?

> `optional` **includeIndexes**: `boolean`

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:50](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L50)

***

### includeMigrationMeta?

> `optional` **includeMigrationMeta**: `boolean`

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:46](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L46)

***

### migrationChunksTableName?

> `optional` **migrationChunksTableName**: `string`

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:48](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L48)

***

### migrationRunsTableName?

> `optional` **migrationRunsTableName**: `string`

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:47](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L47)

***

### queueTableName?

> `optional` **queueTableName**: `string`

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:49](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L49)

***

### target?

> `optional` **target**: [`CloudflareSqlSchemaTarget`](/api/k-msg/src/adapters/cloudflare/type-aliases/cloudflaresqlschematarget/)

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:38](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L38)

***

### trackingColumnMap?

> `optional` **trackingColumnMap**: `Partial`\<[`DeliveryTrackingColumnMap`](/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingcolumnmap/)\>

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:40](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L40)

***

### trackingIndexNames?

> `optional` **trackingIndexNames**: `Partial`\<\{ `due`: `string`; `fromHash`: `string`; `providerMessage`: `string`; `requestedAt`: `string`; `retentionBucket`: `string`; `toHash`: `string`; \}\>

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:45](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L45)

***

### trackingStoreRaw?

> `optional` **trackingStoreRaw**: `boolean`

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:43](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L43)

***

### trackingTableName?

> `optional` **trackingTableName**: `string`

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:39](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L39)

***

### trackingTypeStrategy?

> `optional` **trackingTypeStrategy**: `Partial`\<[`DeliveryTrackingTypeStrategy`](/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingtypestrategy/)\>

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:41](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L41)

***

### typeStrategy?

> `optional` **typeStrategy**: `Partial`\<[`DeliveryTrackingTypeStrategy`](/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingtypestrategy/)\>

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:42](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L42)
