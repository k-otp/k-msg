---
editUrl: false
next: false
prev: false
title: "RenderDrizzleSchemaSourceOptions"
---

Defined in: [packages/messaging/src/adapters/cloudflare/drizzle-schema.ts:14](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/drizzle-schema.ts#L14)

## Properties

### dialect

> **dialect**: [`SqlDialect`](/en/api/k-msg/src/adapters/cloudflare/type-aliases/sqldialect/)

Defined in: [packages/messaging/src/adapters/cloudflare/drizzle-schema.ts:15](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/drizzle-schema.ts#L15)

***

### fieldCryptoSchema?

> `optional` **fieldCryptoSchema**: `DeliveryTrackingFieldCryptoSchemaOptions`

Defined in: [packages/messaging/src/adapters/cloudflare/drizzle-schema.ts:23](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/drizzle-schema.ts#L23)

***

### indexNames?

> `optional` **indexNames**: `Partial`\<\{ `due`: `string`; `fromHash`: `string`; `providerMessage`: `string`; `requestedAt`: `string`; `retentionBucket`: `string`; `toHash`: `string`; \}\>

Defined in: [packages/messaging/src/adapters/cloudflare/drizzle-schema.ts:21](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/drizzle-schema.ts#L21)

***

### queueTableName?

> `optional` **queueTableName**: `string`

Defined in: [packages/messaging/src/adapters/cloudflare/drizzle-schema.ts:25](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/drizzle-schema.ts#L25)

***

### target?

> `optional` **target**: [`CloudflareSqlSchemaTarget`](/en/api/k-msg/src/adapters/cloudflare/type-aliases/cloudflaresqlschematarget/)

Defined in: [packages/messaging/src/adapters/cloudflare/drizzle-schema.ts:16](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/drizzle-schema.ts#L16)

***

### trackingColumnMap?

> `optional` **trackingColumnMap**: `Partial`\<[`DeliveryTrackingColumnMap`](/en/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingcolumnmap/)\>

Defined in: [packages/messaging/src/adapters/cloudflare/drizzle-schema.ts:18](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/drizzle-schema.ts#L18)

***

### trackingIndexNames?

> `optional` **trackingIndexNames**: `Partial`\<\{ `due`: `string`; `fromHash`: `string`; `providerMessage`: `string`; `requestedAt`: `string`; `retentionBucket`: `string`; `toHash`: `string`; \}\>

Defined in: [packages/messaging/src/adapters/cloudflare/drizzle-schema.ts:24](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/drizzle-schema.ts#L24)

***

### trackingStoreRaw?

> `optional` **trackingStoreRaw**: `boolean`

Defined in: [packages/messaging/src/adapters/cloudflare/drizzle-schema.ts:22](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/drizzle-schema.ts#L22)

***

### trackingTableName?

> `optional` **trackingTableName**: `string`

Defined in: [packages/messaging/src/adapters/cloudflare/drizzle-schema.ts:17](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/drizzle-schema.ts#L17)

***

### trackingTypeStrategy?

> `optional` **trackingTypeStrategy**: `Partial`\<[`DeliveryTrackingTypeStrategy`](/en/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingtypestrategy/)\>

Defined in: [packages/messaging/src/adapters/cloudflare/drizzle-schema.ts:20](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/drizzle-schema.ts#L20)

***

### typeStrategy?

> `optional` **typeStrategy**: `Partial`\<[`DeliveryTrackingTypeStrategy`](/en/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingtypestrategy/)\>

Defined in: [packages/messaging/src/adapters/cloudflare/drizzle-schema.ts:19](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/drizzle-schema.ts#L19)
