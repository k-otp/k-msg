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
cannot be read with either AAD stops it rather than being replaced by a
fallback. Each endpoint is read again just before it is rewritten, but
pause endpoint updates while it runs: one landing in between would be
overwritten. Deliveries, which the runtime never rewrites, are listed
without a limit and written back with `add`, which replaces a delivery
with the same id.

## Parameters

### persistence

`Pick`\<[`WebhookPersistence`](/en/api/webhook/src/interfaces/webhookpersistence/), `"endpointStore"` \| `"deliveryStore"`\>

### options

[`WebhookRuntimeFieldCryptoOptions`](/en/api/webhook/src/interfaces/webhookruntimefieldcryptooptions/)

## Returns

`Promise`\<[`WebhookTenantMigrationResult`](/en/api/webhook/src/interfaces/webhooktenantmigrationresult/)\>
