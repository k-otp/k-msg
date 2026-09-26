---
editUrl: false
next: false
prev: false
title: "migrateWebhookFieldCryptoToTenant"
---

> **migrateWebhookFieldCryptoToTenant**(`persistence`, `options`): `Promise`\<[`WebhookTenantMigrationResult`](/en/api/webhook/src/interfaces/webhooktenantmigrationresult/)\>

Defined in: [packages/webhook/src/crypto/field-crypto.ts:543](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/crypto/field-crypto.ts#L543)

Re-encrypts endpoint secrets and delivery payloads written before
ciphertext was bound to `options.tenantId`, so they read without
`acceptLegacyAad`. Pass the stores the runtime persists to, not wrapped
ones. Values already bound to the tenant are left as they are, so running
it again is safe. The migration runs fail-closed whatever `failMode` says,
so a value that cannot be read with either AAD stops it rather than being
replaced by a fallback.

Run it once every instance runs a version that binds the tenant: an
instance still on an older version keeps writing tenant-less values,
which this run can miss (running it again after the rollout picks them
up). An endpoint is rewritten only if its secret has not changed since
the migration read it, keeping its other fields as they are then, and
`runtime.migrateFieldCryptoToTenant()` also holds that runtime's own
endpoint writes until it finishes. An update from another process can
still land between that check and the write and be lost, so pause
endpoint changes elsewhere while it runs. Deliveries, which the runtime
never rewrites, are read a page at a time with the `before` cursor and
written back with the delivery store's `replace()`; a custom store must
support both.

## Parameters

### persistence

`Pick`\<[`WebhookPersistence`](/en/api/webhook/src/interfaces/webhookpersistence/), `"endpointStore"` \| `"deliveryStore"`\>

### options

[`WebhookRuntimeFieldCryptoOptions`](/en/api/webhook/src/interfaces/webhookruntimefieldcryptooptions/)

## Returns

`Promise`\<[`WebhookTenantMigrationResult`](/en/api/webhook/src/interfaces/webhooktenantmigrationresult/)\>
