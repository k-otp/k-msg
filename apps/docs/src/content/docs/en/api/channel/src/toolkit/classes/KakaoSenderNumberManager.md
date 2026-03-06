---
editUrl: false
next: false
prev: false
title: "KakaoSenderNumberManager"
---

Defined in: [packages/channel/src/toolkit/kakao/sender-number.ts:8](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/kakao/sender-number.ts#L8)

## Constructors

### Constructor

> **new KakaoSenderNumberManager**(): `KakaoSenderNumberManager`

#### Returns

`KakaoSenderNumberManager`

## Methods

### addSenderNumber()

> **addSenderNumber**(`channelId`, `request`): `Promise`\<[`SenderNumber`](/en/api/channel/src/toolkit/interfaces/sendernumber/)\>

Defined in: [packages/channel/src/toolkit/kakao/sender-number.ts:11](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/kakao/sender-number.ts#L11)

#### Parameters

##### channelId

`string`

##### request

[`SenderNumberCreateRequest`](/en/api/channel/src/toolkit/interfaces/sendernumbercreaterequest/)

#### Returns

`Promise`\<[`SenderNumber`](/en/api/channel/src/toolkit/interfaces/sendernumber/)\>

***

### blockSenderNumber()

> **blockSenderNumber**(`senderNumberId`, `reason`): `Promise`\<`void`\>

Defined in: [packages/channel/src/toolkit/kakao/sender-number.ts:176](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/kakao/sender-number.ts#L176)

#### Parameters

##### senderNumberId

`string`

##### reason

`string`

#### Returns

`Promise`\<`void`\>

***

### deleteSenderNumber()

> **deleteSenderNumber**(`senderNumberId`): `Promise`\<`boolean`\>

Defined in: [packages/channel/src/toolkit/kakao/sender-number.ts:155](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/kakao/sender-number.ts#L155)

#### Parameters

##### senderNumberId

`string`

#### Returns

`Promise`\<`boolean`\>

***

### getSenderNumber()

> **getSenderNumber**(`senderNumberId`): `Promise`\<[`SenderNumber`](/en/api/channel/src/toolkit/interfaces/sendernumber/) \| `null`\>

Defined in: [packages/channel/src/toolkit/kakao/sender-number.ts:64](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/kakao/sender-number.ts#L64)

#### Parameters

##### senderNumberId

`string`

#### Returns

`Promise`\<[`SenderNumber`](/en/api/channel/src/toolkit/interfaces/sendernumber/) \| `null`\>

***

### listSenderNumbers()

> **listSenderNumbers**(`filters?`): `Promise`\<[`SenderNumber`](/en/api/channel/src/toolkit/interfaces/sendernumber/)[]\>

Defined in: [packages/channel/src/toolkit/kakao/sender-number.ts:68](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/kakao/sender-number.ts#L68)

#### Parameters

##### filters?

###### category?

[`SenderNumberCategory`](/en/api/channel/src/toolkit/enumerations/sendernumbercategory/)

###### channelId?

`string`

###### status?

[`SenderNumberStatus`](/en/api/channel/src/toolkit/enumerations/sendernumberstatus/)

###### verified?

`boolean`

#### Returns

`Promise`\<[`SenderNumber`](/en/api/channel/src/toolkit/interfaces/sendernumber/)[]\>

***

### unblockSenderNumber()

> **unblockSenderNumber**(`senderNumberId`): `Promise`\<`void`\>

Defined in: [packages/channel/src/toolkit/kakao/sender-number.ts:192](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/kakao/sender-number.ts#L192)

#### Parameters

##### senderNumberId

`string`

#### Returns

`Promise`\<`void`\>

***

### updateSenderNumber()

> **updateSenderNumber**(`senderNumberId`, `updates`): `Promise`\<[`SenderNumber`](/en/api/channel/src/toolkit/interfaces/sendernumber/)\>

Defined in: [packages/channel/src/toolkit/kakao/sender-number.ts:108](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/kakao/sender-number.ts#L108)

#### Parameters

##### senderNumberId

`string`

##### updates

`Partial`\<[`SenderNumber`](/en/api/channel/src/toolkit/interfaces/sendernumber/)\>

#### Returns

`Promise`\<[`SenderNumber`](/en/api/channel/src/toolkit/interfaces/sendernumber/)\>

***

### validateSenderNumberForSending()

> **validateSenderNumberForSending**(`senderNumberId`): `Promise`\<\{ `errors`: `string`[]; `isValid`: `boolean`; \}\>

Defined in: [packages/channel/src/toolkit/kakao/sender-number.ts:209](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/kakao/sender-number.ts#L209)

#### Parameters

##### senderNumberId

`string`

#### Returns

`Promise`\<\{ `errors`: `string`[]; `isValid`: `boolean`; \}\>
