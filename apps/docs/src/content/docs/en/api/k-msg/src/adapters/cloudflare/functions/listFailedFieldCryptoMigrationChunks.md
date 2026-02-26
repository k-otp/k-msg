---
editUrl: false
next: false
prev: false
title: "listFailedFieldCryptoMigrationChunks"
---

> **listFailedFieldCryptoMigrationChunks**(`client`, `planId`, `options?`): `Promise`\<[`FieldCryptoMigrationChunkRecord`](/api/k-msg/src/adapters/cloudflare/interfaces/fieldcryptomigrationchunkrecord/)[]\>

Defined in: [packages/messaging/src/migration/field-crypto/state.ts:356](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/migration/field-crypto/state.ts#L356)

## Parameters

### client

[`CloudflareSqlClient`](/api/k-msg/src/adapters/cloudflare/interfaces/cloudflaresqlclient/)

### planId

`string`

### options?

[`FieldCryptoMigrationStateTables`](/api/k-msg/src/adapters/cloudflare/interfaces/fieldcryptomigrationstatetables/) = `{}`

## Returns

`Promise`\<[`FieldCryptoMigrationChunkRecord`](/api/k-msg/src/adapters/cloudflare/interfaces/fieldcryptomigrationchunkrecord/)[]\>
