---
editUrl: false
next: false
prev: false
title: "MessageRepository"
---

Defined in: [packages/core/src/persistence/repository.ts:7](https://github.com/k-otp/k-msg/blob/main/packages/core/src/persistence/repository.ts#L7)

## Methods

### find()

> **find**(`messageId`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`SendResult`](/api/core/src/interfaces/sendresult/) \| `null`, [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/core/src/persistence/repository.ts:18](https://github.com/k-otp/k-msg/blob/main/packages/core/src/persistence/repository.ts#L18)

#### Parameters

##### messageId

`string`

#### Returns

`Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`SendResult`](/api/core/src/interfaces/sendresult/) \| `null`, [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

***

### save()

> **save**(`input`, `options?`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<`string`, [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/core/src/persistence/repository.ts:8](https://github.com/k-otp/k-msg/blob/main/packages/core/src/persistence/repository.ts#L8)

#### Parameters

##### input

[`SendInput`](/api/core/src/type-aliases/sendinput/)

##### options?

###### strategy?

[`PersistenceStrategy`](/api/core/src/type-aliases/persistencestrategy/)

#### Returns

`Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<`string`, [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

***

### update()

> **update**(`messageId`, `result`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<`void`, [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/core/src/persistence/repository.ts:13](https://github.com/k-otp/k-msg/blob/main/packages/core/src/persistence/repository.ts#L13)

#### Parameters

##### messageId

`string`

##### result

`Partial`\<[`SendResult`](/api/core/src/interfaces/sendresult/)\>

#### Returns

`Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<`void`, [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>
