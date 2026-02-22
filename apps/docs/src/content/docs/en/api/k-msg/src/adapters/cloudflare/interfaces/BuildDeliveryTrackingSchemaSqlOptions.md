---
editUrl: false
next: false
prev: false
title: "BuildDeliveryTrackingSchemaSqlOptions"
---

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:18](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L18)

## Extends

- [`DeliveryTrackingSchemaOptions`](/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingschemaoptions/)

## Properties

### columnMap?

> `optional` **columnMap**: `Partial`\<[`DeliveryTrackingColumnMap`](/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingcolumnmap/)\>

Defined in: [packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts:80](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts#L80)

#### Inherited from

[`DeliveryTrackingSchemaOptions`](/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingschemaoptions/).[`columnMap`](/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingschemaoptions/#columnmap)

***

### dialect

> **dialect**: [`SqlDialect`](/api/k-msg/src/adapters/cloudflare/type-aliases/sqldialect/)

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:20](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L20)

***

### includeIndexes?

> `optional` **includeIndexes**: `boolean`

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:21](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L21)

***

### indexNames?

> `optional` **indexNames**: `Partial`\<\{ `due`: `string`; `providerMessage`: `string`; `requestedAt`: `string`; \}\>

Defined in: [packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts:87](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts#L87)

#### Inherited from

[`DeliveryTrackingSchemaOptions`](/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingschemaoptions/).[`indexNames`](/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingschemaoptions/#indexnames)

***

### storeRaw?

> `optional` **storeRaw**: `boolean`

Defined in: [packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts:89](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts#L89)

#### Inherited from

[`DeliveryTrackingSchemaOptions`](/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingschemaoptions/).[`storeRaw`](/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingschemaoptions/#storeraw)

***

### tableName?

> `optional` **tableName**: `string`

Defined in: [packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts:79](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts#L79)

#### Inherited from

[`DeliveryTrackingSchemaOptions`](/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingschemaoptions/).[`tableName`](/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingschemaoptions/#tablename)

***

### trackingIndexNames?

> `optional` **trackingIndexNames**: `Partial`\<\{ `due`: `string`; `providerMessage`: `string`; `requestedAt`: `string`; \}\>

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:22](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L22)

#### Overrides

[`DeliveryTrackingSchemaOptions`](/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingschemaoptions/).[`trackingIndexNames`](/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingschemaoptions/#trackingindexnames)

***

### trackingTypeStrategy?

> `optional` **trackingTypeStrategy**: `Partial`\<[`DeliveryTrackingTypeStrategy`](/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingtypestrategy/)\>

Defined in: [packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts:85](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts#L85)

New API: `typeStrategy`.
Legacy alias preserved for compatibility with `trackingTypeStrategy`.

#### Inherited from

[`DeliveryTrackingSchemaOptions`](/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingschemaoptions/).[`trackingTypeStrategy`](/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingschemaoptions/#trackingtypestrategy)

***

### typeStrategy?

> `optional` **typeStrategy**: `Partial`\<[`DeliveryTrackingTypeStrategy`](/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingtypestrategy/)\>

Defined in: [packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts:86](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts#L86)

#### Inherited from

[`DeliveryTrackingSchemaOptions`](/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingschemaoptions/).[`typeStrategy`](/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingschemaoptions/#typestrategy)
