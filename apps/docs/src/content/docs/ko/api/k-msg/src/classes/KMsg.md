---
editUrl: false
next: false
prev: false
title: "KMsg"
---

Defined in: [packages/messaging/src/k-msg.ts:76](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/k-msg.ts#L76)

## Constructors

### Constructor

> **new KMsg**(`config`): `KMsg`

Defined in: [packages/messaging/src/k-msg.ts:88](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/k-msg.ts#L88)

#### Parameters

##### config

`KMsgConfig`

#### Returns

`KMsg`

## Methods

### healthCheck()

> **healthCheck**(): `Promise`\<\{ `healthy`: `boolean`; `issues`: `string`[]; `providers`: `Record`\<`string`, [`ProviderHealthStatus`](/api/core/src/interfaces/providerhealthstatus/)\>; \}\>

Defined in: [packages/messaging/src/k-msg.ts:115](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/k-msg.ts#L115)

#### Returns

`Promise`\<\{ `healthy`: `boolean`; `issues`: `string`[]; `providers`: `Record`\<`string`, [`ProviderHealthStatus`](/api/core/src/interfaces/providerhealthstatus/)\>; \}\>

***

### send()

#### Call Signature

> **send**(`input`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`SendResult`](/api/core/src/interfaces/sendresult/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/messaging/src/k-msg.ts:150](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/k-msg.ts#L150)

##### Parameters

###### input

[`SendInput`](/api/core/src/type-aliases/sendinput/)

##### Returns

`Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`SendResult`](/api/core/src/interfaces/sendresult/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

#### Call Signature

> **send**(`input`): `Promise`\<[`BatchSendResult`](/api/messaging/src/interfaces/batchsendresult/)\>

Defined in: [packages/messaging/src/k-msg.ts:151](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/k-msg.ts#L151)

##### Parameters

###### input

[`SendInput`](/api/core/src/type-aliases/sendinput/)[]

##### Returns

`Promise`\<[`BatchSendResult`](/api/messaging/src/interfaces/batchsendresult/)\>

***

### sendOrThrow()

> **sendOrThrow**(`input`): `Promise`\<[`SendResult`](/api/core/src/interfaces/sendresult/)\>

Defined in: [packages/messaging/src/k-msg.ts:162](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/k-msg.ts#L162)

#### Parameters

##### input

[`SendInput`](/api/core/src/type-aliases/sendinput/)

#### Returns

`Promise`\<[`SendResult`](/api/core/src/interfaces/sendresult/)\>
