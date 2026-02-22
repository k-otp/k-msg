---
editUrl: false
next: false
prev: false
title: "BuildCloudflareSqlSchemaSqlOptions"
---

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:32](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L32)

## Properties

### dialect

> **dialect**: [`SqlDialect`](/api/k-msg/src/adapters/cloudflare/type-aliases/sqldialect/)

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:33](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L33)

***

### fieldCryptoSchema?

> `optional` **fieldCryptoSchema**: `DeliveryTrackingFieldCryptoSchemaOptions`

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:40](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L40)

***

### includeIndexes?

> `optional` **includeIndexes**: `boolean`

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:43](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L43)

***

### queueTableName?

> `optional` **queueTableName**: `string`

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:42](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L42)

***

### target?

> `optional` **target**: [`CloudflareSqlSchemaTarget`](/api/k-msg/src/adapters/cloudflare/type-aliases/cloudflaresqlschematarget/)

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:34](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L34)

***

### trackingColumnMap?

> `optional` **trackingColumnMap**: `Partial`\<[`DeliveryTrackingColumnMap`](/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingcolumnmap/)\>

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:36](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L36)

***

### trackingIndexNames?

> `optional` **trackingIndexNames**: `Partial`\<\{ `due`: `string`; `fromHash`: `string`; `providerMessage`: `string`; `requestedAt`: `string`; `retentionBucket`: `string`; `toHash`: `string`; \}\>

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:41](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L41)

***

### trackingStoreRaw?

> `optional` **trackingStoreRaw**: `boolean`

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:39](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L39)

***

### trackingTableName?

> `optional` **trackingTableName**: `string`

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:35](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L35)

***

### trackingTypeStrategy?

> `optional` **trackingTypeStrategy**: `Partial`\<[`DeliveryTrackingTypeStrategy`](/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingtypestrategy/)\>

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:37](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L37)

***

### typeStrategy?

> `optional` **typeStrategy**: `Partial`\<[`DeliveryTrackingTypeStrategy`](/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingtypestrategy/)\>

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:38](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L38)
