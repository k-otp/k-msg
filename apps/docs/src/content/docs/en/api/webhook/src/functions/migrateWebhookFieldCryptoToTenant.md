---
editUrl: false
next: false
prev: false
title: "migrateWebhookFieldCryptoToTenant"
---

> **migrateWebhookFieldCryptoToTenant**(`persistence`, `options`): `Promise`\<[`WebhookTenantMigrationResult`](/en/api/webhook/src/interfaces/webhooktenantmigrationresult/)\>

Defined in: [packages/webhook/src/crypto/field-crypto.ts:473](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/crypto/field-crypto.ts#L473)

Re-encrypts endpoint secrets and delivery payloads written before
ciphertext was bound to `options.tenantId`, so they read without
`acceptLegacyAad`. Pass the stores the runtime persists to, not wrapped
ones. Values already bound to the tenant are left as they are. The
migration runs fail-closed whatever `failMode` says, so a value that
decrypts with neither AAD stops it rather than being replaced by a
fallback. Deliveries are listed without a limit and written back with
`add`, which must replace a delivery with the same id, as the built-in
stores do.

## Parameters

### persistence

`Pick`\<[`WebhookPersistence`](/en/api/webhook/src/interfaces/webhookpersistence/), `"endpointStore"` \| `"deliveryStore"`\>

### options

[`WebhookRuntimeFieldCryptoOptions`](/en/api/webhook/src/interfaces/webhookruntimefieldcryptooptions/)

## Returns

`Promise`\<[`WebhookTenantMigrationResult`](/en/api/webhook/src/interfaces/webhooktenantmigrationresult/)\>
