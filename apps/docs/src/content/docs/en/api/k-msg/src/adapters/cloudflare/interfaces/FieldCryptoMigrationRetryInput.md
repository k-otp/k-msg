---
editUrl: false
next: false
prev: false
title: "FieldCryptoMigrationRetryInput"
---

Defined in: [packages/messaging/src/migration/field-crypto/types.ts:84](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/migration/field-crypto/types.ts#L84)

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

Defined in: [packages/messaging/src/migration/field-crypto/types.ts:94](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/migration/field-crypto/types.ts#L94)

The field crypto options the tracking store uses. The backfill encrypts
legacy plaintext with them, so lookups and reads match new writes.

***

### fieldCryptoSchema?

> `optional` **fieldCryptoSchema?**: `DeliveryTrackingFieldCryptoSchemaOptions`

Defined in: [packages/messaging/src/migration/field-crypto/types.ts:89](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/migration/field-crypto/types.ts#L89)

***

### maxChunks?

> `optional` **maxChunks?**: `number`

Defined in: [packages/messaging/src/migration/field-crypto/types.ts:88](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/migration/field-crypto/types.ts#L88)

***

### planId

> **planId**: `string`

Defined in: [packages/messaging/src/migration/field-crypto/types.ts:86](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/migration/field-crypto/types.ts#L86)

***

### runsTableName?

> `optional` **runsTableName?**: `string`

Defined in: [packages/messaging/src/migration/field-crypto/types.ts:17](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/migration/field-crypto/types.ts#L17)

#### Inherited from

[`FieldCryptoMigrationStateTables`](/en/api/k-msg/src/adapters/cloudflare/interfaces/fieldcryptomigrationstatetables/).[`runsTableName`](/en/api/k-msg/src/adapters/cloudflare/interfaces/fieldcryptomigrationstatetables/#runstablename)

***

### trackingTableName?

> `optional` **trackingTableName?**: `string`

Defined in: [packages/messaging/src/migration/field-crypto/types.ts:87](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/migration/field-crypto/types.ts#L87)
