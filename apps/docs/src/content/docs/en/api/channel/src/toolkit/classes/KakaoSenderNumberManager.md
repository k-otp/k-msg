---
editUrl: false
next: false
prev: false
title: "KakaoSenderNumberManager"
---

Defined in: packages/channel/src/toolkit/kakao/sender-number.ts:8

## Constructors

### Constructor

> **new KakaoSenderNumberManager**(): `KakaoSenderNumberManager`

#### Returns

`KakaoSenderNumberManager`

## Methods

### addSenderNumber()

> **addSenderNumber**(`channelId`, `request`): `Promise`\<[`SenderNumber`](/api/channel/src/toolkit/interfaces/sendernumber/)\>

Defined in: packages/channel/src/toolkit/kakao/sender-number.ts:13

#### Parameters

##### channelId

`string`

##### request

[`SenderNumberCreateRequest`](/api/channel/src/toolkit/interfaces/sendernumbercreaterequest/)

#### Returns

`Promise`\<[`SenderNumber`](/api/channel/src/toolkit/interfaces/sendernumber/)\>

***

### blockSenderNumber()

> **blockSenderNumber**(`senderNumberId`, `reason`): `Promise`\<`void`\>

Defined in: packages/channel/src/toolkit/kakao/sender-number.ts:253

#### Parameters

##### senderNumberId

`string`

##### reason

`string`

#### Returns

`Promise`\<`void`\>

***

### cleanup()

> **cleanup**(): `void`

Defined in: packages/channel/src/toolkit/kakao/sender-number.ts:331

#### Returns

`void`

***

### deleteSenderNumber()

> **deleteSenderNumber**(`senderNumberId`): `Promise`\<`boolean`\>

Defined in: packages/channel/src/toolkit/kakao/sender-number.ts:231

#### Parameters

##### senderNumberId

`string`

#### Returns

`Promise`\<`boolean`\>

***

### getSenderNumber()

> **getSenderNumber**(`senderNumberId`): `Promise`\<[`SenderNumber`](/api/channel/src/toolkit/interfaces/sendernumber/) \| `null`\>

Defined in: packages/channel/src/toolkit/kakao/sender-number.ts:166

#### Parameters

##### senderNumberId

`string`

#### Returns

`Promise`\<[`SenderNumber`](/api/channel/src/toolkit/interfaces/sendernumber/) \| `null`\>

***

### listSenderNumbers()

> **listSenderNumbers**(`filters?`): `Promise`\<[`SenderNumber`](/api/channel/src/toolkit/interfaces/sendernumber/)[]\>

Defined in: packages/channel/src/toolkit/kakao/sender-number.ts:170

#### Parameters

##### filters?

###### category?

[`SenderNumberCategory`](/api/channel/src/toolkit/enumerations/sendernumbercategory/)

###### channelId?

`string`

###### status?

[`SenderNumberStatus`](/api/channel/src/toolkit/enumerations/sendernumberstatus/)

###### verified?

`boolean`

#### Returns

`Promise`\<[`SenderNumber`](/api/channel/src/toolkit/interfaces/sendernumber/)[]\>

***

### resendVerificationCode()

> **resendVerificationCode**(`senderNumberId`): `Promise`\<`void`\>

Defined in: packages/channel/src/toolkit/kakao/sender-number.ts:139

#### Parameters

##### senderNumberId

`string`

#### Returns

`Promise`\<`void`\>

***

### unblockSenderNumber()

> **unblockSenderNumber**(`senderNumberId`): `Promise`\<`void`\>

Defined in: packages/channel/src/toolkit/kakao/sender-number.ts:269

#### Parameters

##### senderNumberId

`string`

#### Returns

`Promise`\<`void`\>

***

### updateSenderNumber()

> **updateSenderNumber**(`senderNumberId`, `updates`): `Promise`\<[`SenderNumber`](/api/channel/src/toolkit/interfaces/sendernumber/)\>

Defined in: packages/channel/src/toolkit/kakao/sender-number.ts:210

#### Parameters

##### senderNumberId

`string`

##### updates

`Partial`\<[`SenderNumber`](/api/channel/src/toolkit/interfaces/sendernumber/)\>

#### Returns

`Promise`\<[`SenderNumber`](/api/channel/src/toolkit/interfaces/sendernumber/)\>

***

### validateSenderNumberForSending()

> **validateSenderNumberForSending**(`senderNumberId`): `Promise`\<\{ `errors`: `string`[]; `isValid`: `boolean`; \}\>

Defined in: packages/channel/src/toolkit/kakao/sender-number.ts:286

#### Parameters

##### senderNumberId

`string`

#### Returns

`Promise`\<\{ `errors`: `string`[]; `isValid`: `boolean`; \}\>

***

### verifySenderNumber()

> **verifySenderNumber**(`senderNumberId`, `code`): `Promise`\<`boolean`\>

Defined in: packages/channel/src/toolkit/kakao/sender-number.ts:103

#### Parameters

##### senderNumberId

`string`

##### code

`string`

#### Returns

`Promise`\<`boolean`\>
