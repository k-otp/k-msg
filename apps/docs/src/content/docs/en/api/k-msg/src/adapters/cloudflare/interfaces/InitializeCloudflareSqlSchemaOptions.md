---
editUrl: false
next: false
prev: false
title: "InitializeCloudflareSqlSchemaOptions"
---

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:90](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L90)

## Properties

### fieldCryptoSchema?

> `optional` **fieldCryptoSchema?**: `DeliveryTrackingFieldCryptoSchemaOptions`

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:97](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L97)

***

### includeIndexes?

> `optional` **includeIndexes?**: `boolean`

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:104](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L104)

***

### includeMigrationMeta?

> `optional` **includeMigrationMeta?**: `boolean`

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:99](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L99)

***

### migrationChunksTableName?

> `optional` **migrationChunksTableName?**: `string`

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:101](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L101)

***

### migrationRunsTableName?

> `optional` **migrationRunsTableName?**: `string`

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:100](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L100)

***

### queueIndexNames?

> `optional` **queueIndexNames?**: `Partial`\<[`JobQueueIndexNames`](/en/api/k-msg/src/adapters/cloudflare/interfaces/jobqueueindexnames/)\>

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:103](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L103)

***

### queueTableName?

> `optional` **queueTableName?**: `string`

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:102](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L102)

***

### target?

> `optional` **target?**: [`CloudflareSqlSchemaTarget`](/en/api/k-msg/src/adapters/cloudflare/type-aliases/cloudflaresqlschematarget/)

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:91](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L91)

***

### trackingColumnMap?

> `optional` **trackingColumnMap?**: `Partial`\<[`DeliveryTrackingColumnMap`](/en/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingcolumnmap/)\>

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:93](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L93)

***

### trackingIndexNames?

> `optional` **trackingIndexNames?**: `Partial`\<\{ `due`: `string`; `fromHash`: `string`; `providerMessage`: `string`; `requestedAt`: `string`; `retentionBucket`: `string`; `toHash`: `string`; \}\>

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:98](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L98)

***

### trackingStoreRaw?

> `optional` **trackingStoreRaw?**: `boolean`

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:96](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L96)

***

### trackingTableName?

> `optional` **trackingTableName?**: `string`

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:92](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L92)

***

### trackingTypeStrategy?

> `optional` **trackingTypeStrategy?**: `Partial`\<[`DeliveryTrackingTypeStrategy`](/en/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingtypestrategy/)\>

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:94](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L94)

***

### typeStrategy?

> `optional` **typeStrategy?**: `Partial`\<[`DeliveryTrackingTypeStrategy`](/en/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingtypestrategy/)\>

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:95](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L95)
