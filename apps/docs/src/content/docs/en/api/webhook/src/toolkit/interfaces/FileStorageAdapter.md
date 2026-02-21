---
editUrl: false
next: false
prev: false
title: "FileStorageAdapter"
---

Defined in: [packages/webhook/src/shared/file-storage.ts:1](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/shared/file-storage.ts#L1)

## Methods

### appendFile()

> **appendFile**(`filePath`, `data`): `Promise`\<`void`\>

Defined in: [packages/webhook/src/shared/file-storage.ts:2](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/shared/file-storage.ts#L2)

#### Parameters

##### filePath

`string`

##### data

`string`

#### Returns

`Promise`\<`void`\>

***

### ensureDirForFile()

> **ensureDirForFile**(`filePath`): `Promise`\<`void`\>

Defined in: [packages/webhook/src/shared/file-storage.ts:5](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/shared/file-storage.ts#L5)

#### Parameters

##### filePath

`string`

#### Returns

`Promise`\<`void`\>

***

### readFile()

> **readFile**(`filePath`): `Promise`\<`string`\>

Defined in: [packages/webhook/src/shared/file-storage.ts:3](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/shared/file-storage.ts#L3)

#### Parameters

##### filePath

`string`

#### Returns

`Promise`\<`string`\>

***

### writeFile()

> **writeFile**(`filePath`, `data`): `Promise`\<`void`\>

Defined in: [packages/webhook/src/shared/file-storage.ts:4](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/shared/file-storage.ts#L4)

#### Parameters

##### filePath

`string`

##### data

`string`

#### Returns

`Promise`\<`void`\>
