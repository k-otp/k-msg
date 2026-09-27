---
editUrl: false
next: false
prev: false
title: "WebhookRuntimeFieldCryptoOptions"
---

Defined in: [packages/webhook/src/runtime/types.ts:71](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L71)

## Properties

### acceptLegacyAad?

> `optional` **acceptLegacyAad?**: `boolean`

Defined in: [packages/webhook/src/runtime/types.ts:81](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L81)

Also reads secrets and payloads written before ciphertext was bound to
`tenantId`, which are otherwise rejected. Set it only while migrating
them with `migrateFieldCryptoToTenant()`, then remove it: a tenant-less
value copied from another tenant's row with the same id would decrypt.

***

### delivery?

> `optional` **delivery?**: [`FieldCryptoConfig`](/en/api/core/src/interfaces/fieldcryptoconfig/)

Defined in: [packages/webhook/src/runtime/types.ts:74](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L74)

***

### endpoint?

> `optional` **endpoint?**: [`FieldCryptoConfig`](/en/api/core/src/interfaces/fieldcryptoconfig/)

Defined in: [packages/webhook/src/runtime/types.ts:73](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L73)

***

### tenantId?

> `optional` **tenantId?**: `string`

Defined in: [packages/webhook/src/runtime/types.ts:72](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/runtime/types.ts#L72)
