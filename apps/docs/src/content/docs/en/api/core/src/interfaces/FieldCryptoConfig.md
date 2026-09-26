---
editUrl: false
next: false
prev: false
title: "FieldCryptoConfig"
---

Defined in: [packages/core/src/crypto/types.ts:120](https://github.com/k-otp/k-msg/blob/main/packages/core/src/crypto/types.ts#L120)

Field crypto settings shared by every storage integration.

## Properties

### aadFields?

> `optional` **aadFields?**: readonly `string`[]

Defined in: [packages/core/src/crypto/types.ts:126](https://github.com/k-otp/k-msg/blob/main/packages/core/src/crypto/types.ts#L126)

***

### enabled?

> `optional` **enabled?**: `boolean`

Defined in: [packages/core/src/crypto/types.ts:121](https://github.com/k-otp/k-msg/blob/main/packages/core/src/crypto/types.ts#L121)

***

### failMode?

> `optional` **failMode?**: [`FieldCryptoFailMode`](/en/api/core/src/type-aliases/fieldcryptofailmode/)

Defined in: [packages/core/src/crypto/types.ts:123](https://github.com/k-otp/k-msg/blob/main/packages/core/src/crypto/types.ts#L123)

***

### fields

> **fields**: `Record`\<`string`, [`FieldMode`](/en/api/core/src/type-aliases/fieldmode/)\>

Defined in: [packages/core/src/crypto/types.ts:122](https://github.com/k-otp/k-msg/blob/main/packages/core/src/crypto/types.ts#L122)

***

### keyResolver?

> `optional` **keyResolver?**: [`KeyResolver`](/en/api/core/src/interfaces/keyresolver/)

Defined in: [packages/core/src/crypto/types.ts:127](https://github.com/k-otp/k-msg/blob/main/packages/core/src/crypto/types.ts#L127)

***

### openFallback?

> `optional` **openFallback?**: [`FieldCryptoOpenFallback`](/en/api/core/src/type-aliases/fieldcryptoopenfallback/)

Defined in: [packages/core/src/crypto/types.ts:124](https://github.com/k-otp/k-msg/blob/main/packages/core/src/crypto/types.ts#L124)

***

### provider

> **provider**: [`FieldCryptoProvider`](/en/api/core/src/interfaces/fieldcryptoprovider/)

Defined in: [packages/core/src/crypto/types.ts:128](https://github.com/k-otp/k-msg/blob/main/packages/core/src/crypto/types.ts#L128)

***

### unsafeAllowPlaintextStorage?

> `optional` **unsafeAllowPlaintextStorage?**: `boolean`

Defined in: [packages/core/src/crypto/types.ts:125](https://github.com/k-otp/k-msg/blob/main/packages/core/src/crypto/types.ts#L125)
