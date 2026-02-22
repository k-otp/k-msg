---
editUrl: false
next: false
prev: false
title: "RenderDrizzleSchemaSourceOptions"
---

Defined in: [packages/messaging/src/adapters/cloudflare/drizzle-schema.ts:13](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/drizzle-schema.ts#L13)

## Properties

### dialect

> **dialect**: [`SqlDialect`](/api/k-msg/src/adapters/cloudflare/type-aliases/sqldialect/)

Defined in: [packages/messaging/src/adapters/cloudflare/drizzle-schema.ts:14](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/drizzle-schema.ts#L14)

***

### indexNames?

> `optional` **indexNames**: `Partial`\<\{ `due`: `string`; `providerMessage`: `string`; `requestedAt`: `string`; \}\>

Defined in: [packages/messaging/src/adapters/cloudflare/drizzle-schema.ts:20](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/drizzle-schema.ts#L20)

***

### queueTableName?

> `optional` **queueTableName**: `string`

Defined in: [packages/messaging/src/adapters/cloudflare/drizzle-schema.ts:23](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/drizzle-schema.ts#L23)

***

### target?

> `optional` **target**: [`CloudflareSqlSchemaTarget`](/api/k-msg/src/adapters/cloudflare/type-aliases/cloudflaresqlschematarget/)

Defined in: [packages/messaging/src/adapters/cloudflare/drizzle-schema.ts:15](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/drizzle-schema.ts#L15)

***

### trackingColumnMap?

> `optional` **trackingColumnMap**: `Partial`\<[`DeliveryTrackingColumnMap`](/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingcolumnmap/)\>

Defined in: [packages/messaging/src/adapters/cloudflare/drizzle-schema.ts:17](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/drizzle-schema.ts#L17)

***

### trackingIndexNames?

> `optional` **trackingIndexNames**: `Partial`\<\{ `due`: `string`; `providerMessage`: `string`; `requestedAt`: `string`; \}\>

Defined in: [packages/messaging/src/adapters/cloudflare/drizzle-schema.ts:22](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/drizzle-schema.ts#L22)

***

### trackingStoreRaw?

> `optional` **trackingStoreRaw**: `boolean`

Defined in: [packages/messaging/src/adapters/cloudflare/drizzle-schema.ts:21](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/drizzle-schema.ts#L21)

***

### trackingTableName?

> `optional` **trackingTableName**: `string`

Defined in: [packages/messaging/src/adapters/cloudflare/drizzle-schema.ts:16](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/drizzle-schema.ts#L16)

***

### trackingTypeStrategy?

> `optional` **trackingTypeStrategy**: `Partial`\<[`DeliveryTrackingTypeStrategy`](/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingtypestrategy/)\>

Defined in: [packages/messaging/src/adapters/cloudflare/drizzle-schema.ts:19](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/drizzle-schema.ts#L19)

***

### typeStrategy?

> `optional` **typeStrategy**: `Partial`\<[`DeliveryTrackingTypeStrategy`](/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingtypestrategy/)\>

Defined in: [packages/messaging/src/adapters/cloudflare/drizzle-schema.ts:18](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/drizzle-schema.ts#L18)
