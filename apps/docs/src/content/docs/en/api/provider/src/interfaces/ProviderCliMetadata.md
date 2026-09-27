---
editUrl: false
next: false
prev: false
title: "ProviderCliMetadata"
---

Defined in: [packages/provider/src/provider-cli-metadata.ts:5](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/provider-cli-metadata.ts#L5)

## Properties

### defaultKakaoSenderKey?

> `optional` **defaultKakaoSenderKey?**: `string`

Defined in: [packages/provider/src/provider-cli-metadata.ts:15](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/provider-cli-metadata.ts#L15)

***

### label

> **label**: `string`

Defined in: [packages/provider/src/provider-cli-metadata.ts:6](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/provider-cli-metadata.ts#L6)

***

### routingSeedTypes

> **routingSeedTypes**: readonly [`MessageType`](/en/api/core/src/type-aliases/messagetype/)[]

Defined in: [packages/provider/src/provider-cli-metadata.ts:7](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/provider-cli-metadata.ts#L7)

***

### routingSeedTypesForConfig?

> `optional` **routingSeedTypesForConfig?**: (`config`) => readonly [`MessageType`](/en/api/core/src/type-aliases/messagetype/)[]

Defined in: [packages/provider/src/provider-cli-metadata.ts:12](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/provider-cli-metadata.ts#L12)

The routing seed types for one configured entry, when they depend on its
credentials; `routingSeedTypes` otherwise.

#### Parameters

##### config

`Readonly`\<`Record`\<`string`, `unknown`\>\>

#### Returns

readonly [`MessageType`](/en/api/core/src/type-aliases/messagetype/)[]
