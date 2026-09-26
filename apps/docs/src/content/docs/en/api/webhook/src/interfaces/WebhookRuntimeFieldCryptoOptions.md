---
editUrl: false
next: false
prev: false
title: "WebhookRuntimeFieldCryptoOptions"
---

Defined in: [packages/webhook/src/runtime/types.ts:45](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L45)

## Properties

### acceptLegacyAad?

> `optional` **acceptLegacyAad?**: `boolean`

Defined in: [packages/webhook/src/runtime/types.ts:55](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L55)

Also reads secrets and payloads written before ciphertext was bound to
`tenantId`, which are otherwise rejected. Set it only while migrating
them with `migrateFieldCryptoToTenant()`, then remove it: a tenant-less
value copied from another tenant's row with the same id would decrypt.

***

### delivery?

> `optional` **delivery?**: [`FieldCryptoConfig`](/en/api/core/src/interfaces/fieldcryptoconfig/)

Defined in: [packages/webhook/src/runtime/types.ts:48](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L48)

***

### endpoint?

> `optional` **endpoint?**: [`FieldCryptoConfig`](/en/api/core/src/interfaces/fieldcryptoconfig/)

Defined in: [packages/webhook/src/runtime/types.ts:47](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L47)

***

### tenantId?

> `optional` **tenantId?**: `string`

Defined in: [packages/webhook/src/runtime/types.ts:46](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L46)
