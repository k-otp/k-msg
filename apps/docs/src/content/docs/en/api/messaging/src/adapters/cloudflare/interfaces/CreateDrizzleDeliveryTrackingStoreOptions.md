---
editUrl: false
next: false
prev: false
title: "CreateDrizzleDeliveryTrackingStoreOptions"
---

Defined in: [packages/messaging/src/adapters/cloudflare/index.ts:98](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/index.ts#L98)

## Extends

- [`CreateDrizzleSqlClientOptions`](/api/k-msg/src/adapters/cloudflare/interfaces/createdrizzlesqlclientoptions/).[`DeliveryTrackingSchemaOptions`](/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingschemaoptions/)

## Properties

### close()?

> `optional` **close**: () => `void` \| `Promise`\<`void`\>

Defined in: [packages/messaging/src/adapters/cloudflare/sql-client.ts:51](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-client.ts#L51)

#### Returns

`void` \| `Promise`\<`void`\>

#### Inherited from

[`CreateDrizzleSqlClientOptions`](/api/k-msg/src/adapters/cloudflare/interfaces/createdrizzlesqlclientoptions/).[`close`](/api/k-msg/src/adapters/cloudflare/interfaces/createdrizzlesqlclientoptions/#close)

***

### columnMap?

> `optional` **columnMap**: `Partial`\<[`DeliveryTrackingColumnMap`](/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingcolumnmap/)\>

Defined in: [packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts:124](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts#L124)

#### Inherited from

[`DeliveryTrackingSchemaOptions`](/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingschemaoptions/).[`columnMap`](/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingschemaoptions/#columnmap)

***

### db

> **db**: [`DrizzleSqlDatabaseLike`](/api/k-msg/src/adapters/cloudflare/interfaces/drizzlesqldatabaselike/)

Defined in: [packages/messaging/src/adapters/cloudflare/sql-client.ts:39](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-client.ts#L39)

#### Inherited from

[`CreateDrizzleSqlClientOptions`](/api/k-msg/src/adapters/cloudflare/interfaces/createdrizzlesqlclientoptions/).[`db`](/api/k-msg/src/adapters/cloudflare/interfaces/createdrizzlesqlclientoptions/#db)

***

### dialect

> **dialect**: [`SqlDialect`](/api/k-msg/src/adapters/cloudflare/type-aliases/sqldialect/)

Defined in: [packages/messaging/src/adapters/cloudflare/sql-client.ts:38](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-client.ts#L38)

#### Inherited from

[`CreateDrizzleSqlClientOptions`](/api/k-msg/src/adapters/cloudflare/interfaces/createdrizzlesqlclientoptions/).[`dialect`](/api/k-msg/src/adapters/cloudflare/interfaces/createdrizzlesqlclientoptions/#dialect)

***

### fieldCrypto?

> `optional` **fieldCrypto**: [`DeliveryTrackingFieldCryptoOptions`](/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingfieldcryptooptions/)

Defined in: [packages/messaging/src/adapters/cloudflare/index.ts:101](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/index.ts#L101)

***

### fieldCryptoSchema?

> `optional` **fieldCryptoSchema**: `DeliveryTrackingFieldCryptoSchemaOptions`

Defined in: [packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts:134](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts#L134)

#### Inherited from

[`DeliveryTrackingSchemaOptions`](/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingschemaoptions/).[`fieldCryptoSchema`](/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingschemaoptions/#fieldcryptoschema)

***

### indexNames?

> `optional` **indexNames**: `Partial`\<\{ `due`: `string`; `fromHash`: `string`; `providerMessage`: `string`; `requestedAt`: `string`; `retentionBucket`: `string`; `toHash`: `string`; \}\>

Defined in: [packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts:131](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts#L131)

#### Inherited from

[`DeliveryTrackingSchemaOptions`](/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingschemaoptions/).[`indexNames`](/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingschemaoptions/#indexnames)

***

### mapTransactionDb()?

> `optional` **mapTransactionDb**: (`value`) => [`DrizzleSqlDatabaseLike`](/api/k-msg/src/adapters/cloudflare/interfaces/drizzlesqldatabaselike/)

Defined in: [packages/messaging/src/adapters/cloudflare/sql-client.ts:50](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-client.ts#L50)

#### Parameters

##### value

`unknown`

#### Returns

[`DrizzleSqlDatabaseLike`](/api/k-msg/src/adapters/cloudflare/interfaces/drizzlesqldatabaselike/)

#### Inherited from

[`CreateDrizzleSqlClientOptions`](/api/k-msg/src/adapters/cloudflare/interfaces/createdrizzlesqlclientoptions/).[`mapTransactionDb`](/api/k-msg/src/adapters/cloudflare/interfaces/createdrizzlesqlclientoptions/#maptransactiondb)

***

### normalizeResult()?

> `optional` **normalizeResult**: \<`T`\>(`input`) => [`CloudflareSqlQueryResult`](/api/k-msg/src/adapters/cloudflare/interfaces/cloudflaresqlqueryresult/)\<`T`\>

Defined in: [packages/messaging/src/adapters/cloudflare/sql-client.ts:45](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-client.ts#L45)

#### Type Parameters

##### T

`T` = `Record`\<`string`, `unknown`\>

#### Parameters

##### input

###### params

readonly `unknown`[]

###### result

`unknown`

###### sql

`string`

#### Returns

[`CloudflareSqlQueryResult`](/api/k-msg/src/adapters/cloudflare/interfaces/cloudflaresqlqueryresult/)\<`T`\>

#### Inherited from

[`CreateDrizzleSqlClientOptions`](/api/k-msg/src/adapters/cloudflare/interfaces/createdrizzlesqlclientoptions/).[`normalizeResult`](/api/k-msg/src/adapters/cloudflare/interfaces/createdrizzlesqlclientoptions/#normalizeresult)

***

### renderQuery()?

> `optional` **renderQuery**: (`input`) => `unknown`

Defined in: [packages/messaging/src/adapters/cloudflare/sql-client.ts:40](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/sql-client.ts#L40)

#### Parameters

##### input

###### dialect

[`SqlDialect`](/api/k-msg/src/adapters/cloudflare/type-aliases/sqldialect/)

###### params

readonly `unknown`[]

###### sql

`string`

#### Returns

`unknown`

#### Inherited from

[`CreateDrizzleSqlClientOptions`](/api/k-msg/src/adapters/cloudflare/interfaces/createdrizzlesqlclientoptions/).[`renderQuery`](/api/k-msg/src/adapters/cloudflare/interfaces/createdrizzlesqlclientoptions/#renderquery)

***

### retention?

> `optional` **retention**: [`DeliveryTrackingRetentionConfig`](/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingretentionconfig/)

Defined in: [packages/messaging/src/adapters/cloudflare/index.ts:102](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/index.ts#L102)

***

### storeRaw?

> `optional` **storeRaw**: `boolean`

Defined in: [packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts:133](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts#L133)

#### Inherited from

[`DeliveryTrackingSchemaOptions`](/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingschemaoptions/).[`storeRaw`](/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingschemaoptions/#storeraw)

***

### tableName?

> `optional` **tableName**: `string`

Defined in: [packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts:123](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts#L123)

#### Inherited from

[`DeliveryTrackingSchemaOptions`](/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingschemaoptions/).[`tableName`](/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingschemaoptions/#tablename)

***

### trackingIndexNames?

> `optional` **trackingIndexNames**: `Partial`\<\{ `due`: `string`; `fromHash`: `string`; `providerMessage`: `string`; `requestedAt`: `string`; `retentionBucket`: `string`; `toHash`: `string`; \}\>

Defined in: [packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts:132](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts#L132)

#### Inherited from

[`DeliveryTrackingSchemaOptions`](/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingschemaoptions/).[`trackingIndexNames`](/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingschemaoptions/#trackingindexnames)

***

### trackingTypeStrategy?

> `optional` **trackingTypeStrategy**: `Partial`\<[`DeliveryTrackingTypeStrategy`](/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingtypestrategy/)\>

Defined in: [packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts:129](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts#L129)

New API: `typeStrategy`.
Legacy alias preserved for compatibility with `trackingTypeStrategy`.

#### Inherited from

[`DeliveryTrackingSchemaOptions`](/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingschemaoptions/).[`trackingTypeStrategy`](/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingschemaoptions/#trackingtypestrategy)

***

### typeStrategy?

> `optional` **typeStrategy**: `Partial`\<[`DeliveryTrackingTypeStrategy`](/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingtypestrategy/)\>

Defined in: [packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts:130](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/delivery-tracking-schema.ts#L130)

#### Inherited from

[`DeliveryTrackingSchemaOptions`](/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingschemaoptions/).[`typeStrategy`](/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingschemaoptions/#typestrategy)
