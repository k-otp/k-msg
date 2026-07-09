---
editUrl: false
next: false
prev: false
title: "getFieldCryptoMigrationRun"
---

> **getFieldCryptoMigrationRun**(`client`, `planId`, `options?`): `Promise`\<[`FieldCryptoMigrationRunRecord`](/en/api/k-msg/src/adapters/cloudflare/interfaces/fieldcryptomigrationrunrecord/) \| `undefined`\>

Defined in: [packages/messaging/src/migration/field-crypto/state.ts:256](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/migration/field-crypto/state.ts#L256)

## Parameters

### client

[`CloudflareSqlClient`](/en/api/k-msg/src/adapters/cloudflare/interfaces/cloudflaresqlclient/)

### planId

`string`

### options?

[`FieldCryptoMigrationStateTables`](/en/api/k-msg/src/adapters/cloudflare/interfaces/fieldcryptomigrationstatetables/) = `{}`

## Returns

`Promise`\<[`FieldCryptoMigrationRunRecord`](/en/api/k-msg/src/adapters/cloudflare/interfaces/fieldcryptomigrationrunrecord/) \| `undefined`\>
