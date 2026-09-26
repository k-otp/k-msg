---
editUrl: false
next: false
prev: false
title: "FieldCryptoMigrationApplyInput"
---

Defined in: [packages/messaging/src/migration/field-crypto/types.ts:71](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/migration/field-crypto/types.ts#L71)

## Extends

- [`FieldCryptoMigrationStateTables`](/en/api/k-msg/src/adapters/cloudflare/interfaces/fieldcryptomigrationstatetables/)

## Properties

### chunksTableName?

> `optional` **chunksTableName?**: `string`

Defined in: [packages/messaging/src/migration/field-crypto/types.ts:18](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/migration/field-crypto/types.ts#L18)

#### Inherited from

[`FieldCryptoMigrationStateTables`](/en/api/k-msg/src/adapters/cloudflare/interfaces/fieldcryptomigrationstatetables/).[`chunksTableName`](/en/api/k-msg/src/adapters/cloudflare/interfaces/fieldcryptomigrationstatetables/#chunkstablename)

***

### fieldCrypto

> **fieldCrypto**: [`DeliveryTrackingFieldCryptoOptions`](/en/api/k-msg/src/adapters/cloudflare/interfaces/deliverytrackingfieldcryptooptions/)

Defined in: [packages/messaging/src/migration/field-crypto/types.ts:81](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/migration/field-crypto/types.ts#L81)

The field crypto options the tracking store uses. The backfill encrypts
legacy plaintext with them, so lookups and reads match new writes.

***

### fieldCryptoSchema?

> `optional` **fieldCryptoSchema?**: `DeliveryTrackingFieldCryptoSchemaOptions`

Defined in: [packages/messaging/src/migration/field-crypto/types.ts:76](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/migration/field-crypto/types.ts#L76)

***

### maxChunks?

> `optional` **maxChunks?**: `number`

Defined in: [packages/messaging/src/migration/field-crypto/types.ts:75](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/migration/field-crypto/types.ts#L75)

***

### planId

> **planId**: `string`

Defined in: [packages/messaging/src/migration/field-crypto/types.ts:73](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/migration/field-crypto/types.ts#L73)

***

### runsTableName?

> `optional` **runsTableName?**: `string`

Defined in: [packages/messaging/src/migration/field-crypto/types.ts:17](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/migration/field-crypto/types.ts#L17)

#### Inherited from

[`FieldCryptoMigrationStateTables`](/en/api/k-msg/src/adapters/cloudflare/interfaces/fieldcryptomigrationstatetables/).[`runsTableName`](/en/api/k-msg/src/adapters/cloudflare/interfaces/fieldcryptomigrationstatetables/#runstablename)

***

### trackingTableName?

> `optional` **trackingTableName?**: `string`

Defined in: [packages/messaging/src/migration/field-crypto/types.ts:74](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/migration/field-crypto/types.ts#L74)
