---
editUrl: false
next: false
prev: false
title: "getLatestFieldCryptoMigrationRun"
---

> **getLatestFieldCryptoMigrationRun**(`client`, `trackingTableName`, `options?`): `Promise`\<[`FieldCryptoMigrationRunRecord`](/en/api/k-msg/src/adapters/cloudflare/interfaces/fieldcryptomigrationrunrecord/) \| `undefined`\>

Defined in: [packages/messaging/src/migration/field-crypto/state.ts:275](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/migration/field-crypto/state.ts#L275)

## Parameters

### client

[`CloudflareSqlClient`](/en/api/k-msg/src/adapters/cloudflare/interfaces/cloudflaresqlclient/)

### trackingTableName

`string`

### options?

[`FieldCryptoMigrationStateTables`](/en/api/k-msg/src/adapters/cloudflare/interfaces/fieldcryptomigrationstatetables/) = `{}`

## Returns

`Promise`\<[`FieldCryptoMigrationRunRecord`](/en/api/k-msg/src/adapters/cloudflare/interfaces/fieldcryptomigrationrunrecord/) \| `undefined`\>
