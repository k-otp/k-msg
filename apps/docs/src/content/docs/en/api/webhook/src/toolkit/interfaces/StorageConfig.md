---
editUrl: false
next: false
prev: false
title: "StorageConfig"
---

Defined in: [packages/webhook/src/registry/types.ts:44](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/registry/types.ts#L44)

## Properties

### connectionString?

> `optional` **connectionString**: `string`

Defined in: [packages/webhook/src/registry/types.ts:54](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/registry/types.ts#L54)

***

### enableCompression?

> `optional` **enableCompression**: `boolean`

Defined in: [packages/webhook/src/registry/types.ts:50](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/registry/types.ts#L50)

***

### ~~enableEncryption?~~

> `optional` **enableEncryption**: `boolean`

Defined in: [packages/webhook/src/registry/types.ts:69](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/registry/types.ts#L69)

:::caution[Deprecated]
Use `fieldCrypto` instead.
:::

***

### ~~encryptionKey?~~

> `optional` **encryptionKey**: `string`

Defined in: [packages/webhook/src/registry/types.ts:74](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/registry/types.ts#L74)

:::caution[Deprecated]
Use `fieldCrypto` with a provider implementation.
Legacy option kept for compatibility only.
:::

***

### fieldCrypto?

> `optional` **fieldCrypto**: [`FieldCryptoConfig`](/api/core/src/interfaces/fieldcryptoconfig/)

Defined in: [packages/webhook/src/registry/types.ts:65](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/registry/types.ts#L65)

Preferred option. If both legacy and `fieldCrypto` are set, `fieldCrypto` takes precedence.

***

### fileAdapter?

> `optional` **fileAdapter**: [`FileStorageAdapter`](/api/webhook/src/toolkit/interfaces/filestorageadapter/)

Defined in: [packages/webhook/src/registry/types.ts:49](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/registry/types.ts#L49)

***

### filePath?

> `optional` **filePath**: `string`

Defined in: [packages/webhook/src/registry/types.ts:48](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/registry/types.ts#L48)

***

### maxFileSize?

> `optional` **maxFileSize**: `number`

Defined in: [packages/webhook/src/registry/types.ts:51](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/registry/types.ts#L51)

***

### maxMemoryUsage?

> `optional` **maxMemoryUsage**: `number`

Defined in: [packages/webhook/src/registry/types.ts:58](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/registry/types.ts#L58)

***

### retentionDays?

> `optional` **retentionDays**: `number`

Defined in: [packages/webhook/src/registry/types.ts:61](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/registry/types.ts#L61)

***

### tableName?

> `optional` **tableName**: `string`

Defined in: [packages/webhook/src/registry/types.ts:55](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/registry/types.ts#L55)

***

### type

> **type**: `"file"` \| `"memory"` \| `"database"`

Defined in: [packages/webhook/src/registry/types.ts:45](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/registry/types.ts#L45)
