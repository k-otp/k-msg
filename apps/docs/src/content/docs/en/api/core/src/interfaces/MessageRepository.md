---
editUrl: false
next: false
prev: false
title: "MessageRepository"
---

Defined in: [packages/core/src/persistence/repository.ts:7](https://github.com/k-otp/k-msg/blob/main/packages/core/src/persistence/repository.ts#L7)

## Methods

### find()

> **find**(`messageId`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`SendResult`](/en/api/core/src/interfaces/sendresult/) \| `null`, [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/core/src/persistence/repository.ts:18](https://github.com/k-otp/k-msg/blob/main/packages/core/src/persistence/repository.ts#L18)

#### Parameters

##### messageId

`string`

#### Returns

`Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`SendResult`](/en/api/core/src/interfaces/sendresult/) \| `null`, [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

***

### save()

> **save**(`input`, `options?`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<`string`, [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/core/src/persistence/repository.ts:8](https://github.com/k-otp/k-msg/blob/main/packages/core/src/persistence/repository.ts#L8)

#### Parameters

##### input

[`SendInput`](/en/api/core/src/type-aliases/sendinput/)

##### options?

###### strategy?

[`PersistenceStrategy`](/en/api/core/src/type-aliases/persistencestrategy/)

#### Returns

`Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<`string`, [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

***

### update()

> **update**(`messageId`, `result`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<`void`, [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/core/src/persistence/repository.ts:13](https://github.com/k-otp/k-msg/blob/main/packages/core/src/persistence/repository.ts#L13)

#### Parameters

##### messageId

`string`

##### result

`Partial`\<[`SendResult`](/en/api/core/src/interfaces/sendresult/)\>

#### Returns

`Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<`void`, [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>
