---
editUrl: false
next: false
prev: false
title: "getFieldCryptoMigrationStatus"
---

> **getFieldCryptoMigrationStatus**(`client`, `planId`, `options?`): `Promise`\<[`FieldCryptoMigrationStatus`](/api/k-msg/src/adapters/cloudflare/interfaces/fieldcryptomigrationstatus/)\>

Defined in: [packages/messaging/src/migration/field-crypto/state.ts:374](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/migration/field-crypto/state.ts#L374)

## Parameters

### client

[`CloudflareSqlClient`](/api/k-msg/src/adapters/cloudflare/interfaces/cloudflaresqlclient/)

### planId

`string`

### options?

[`FieldCryptoMigrationStateTables`](/api/k-msg/src/adapters/cloudflare/interfaces/fieldcryptomigrationstatetables/) = `{}`

## Returns

`Promise`\<[`FieldCryptoMigrationStatus`](/api/k-msg/src/adapters/cloudflare/interfaces/fieldcryptomigrationstatus/)\>
