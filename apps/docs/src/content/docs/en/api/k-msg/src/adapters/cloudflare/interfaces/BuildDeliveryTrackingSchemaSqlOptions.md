---
editUrl: false
next: false
prev: false
title: "BuildDeliveryTrackingSchemaSqlOptions"
---

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:58](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L58)

## Extends

- [`DeliveryTrackingSchemaOptions`](/en/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingschemaoptions/)

## Properties

### columnMap?

> `optional` **columnMap?**: `Partial`\<[`DeliveryTrackingColumnMap`](/en/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingcolumnmap/)\>

Defined in: [packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts:132](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts#L132)

#### Inherited from

[`DeliveryTrackingSchemaOptions`](/en/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingschemaoptions/).[`columnMap`](/en/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingschemaoptions/#columnmap)

***

### dialect

> **dialect**: [`SqlDialect`](/en/api/k-msg/src/adapters/cloudflare/type-aliases/sqldialect/)

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:60](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L60)

***

### fieldCryptoSchema?

> `optional` **fieldCryptoSchema?**: `DeliveryTrackingFieldCryptoSchemaOptions`

Defined in: [packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts:142](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts#L142)

#### Inherited from

[`DeliveryTrackingSchemaOptions`](/en/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingschemaoptions/).[`fieldCryptoSchema`](/en/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingschemaoptions/#fieldcryptoschema)

***

### includeIndexes?

> `optional` **includeIndexes?**: `boolean`

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:61](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L61)

***

### indexNames?

> `optional` **indexNames?**: `Partial`\<\{ `due`: `string`; `fromHash`: `string`; `providerMessage`: `string`; `requestedAt`: `string`; `retentionBucket`: `string`; `toHash`: `string`; \}\>

Defined in: [packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts:139](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts#L139)

#### Inherited from

[`DeliveryTrackingSchemaOptions`](/en/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingschemaoptions/).[`indexNames`](/en/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingschemaoptions/#indexnames)

***

### storeRaw?

> `optional` **storeRaw?**: `boolean`

Defined in: [packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts:141](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts#L141)

#### Inherited from

[`DeliveryTrackingSchemaOptions`](/en/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingschemaoptions/).[`storeRaw`](/en/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingschemaoptions/#storeraw)

***

### tableName?

> `optional` **tableName?**: `string`

Defined in: [packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts:131](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts#L131)

#### Inherited from

[`DeliveryTrackingSchemaOptions`](/en/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingschemaoptions/).[`tableName`](/en/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingschemaoptions/#tablename)

***

### trackingIndexNames?

> `optional` **trackingIndexNames?**: `Partial`\<\{ `due`: `string`; `fromHash`: `string`; `providerMessage`: `string`; `requestedAt`: `string`; `retentionBucket`: `string`; `toHash`: `string`; \}\>

Defined in: [packages/messaging/src/adapters/cloudflare/sql-schema.ts:62](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-schema.ts#L62)

#### Overrides

[`DeliveryTrackingSchemaOptions`](/en/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingschemaoptions/).[`trackingIndexNames`](/en/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingschemaoptions/#trackingindexnames)

***

### trackingTypeStrategy?

> `optional` **trackingTypeStrategy?**: `Partial`\<[`DeliveryTrackingTypeStrategy`](/en/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingtypestrategy/)\>

Defined in: [packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts:137](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts#L137)

New API: `typeStrategy`.
Legacy alias preserved for compatibility with `trackingTypeStrategy`.

#### Inherited from

[`DeliveryTrackingSchemaOptions`](/en/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingschemaoptions/).[`trackingTypeStrategy`](/en/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingschemaoptions/#trackingtypestrategy)

***

### typeStrategy?

> `optional` **typeStrategy?**: `Partial`\<[`DeliveryTrackingTypeStrategy`](/en/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingtypestrategy/)\>

Defined in: [packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts:138](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts#L138)

#### Inherited from

[`DeliveryTrackingSchemaOptions`](/en/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingschemaoptions/).[`typeStrategy`](/en/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingschemaoptions/#typestrategy)
