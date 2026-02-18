---
editUrl: false
next: false
prev: false
title: "KakaoSenderNumberManager"
---

Defined in: [packages/channel/src/kakao/sender-number.ts:8](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/kakao/sender-number.ts#L8)

## Constructors

### Constructor

> **new KakaoSenderNumberManager**(): `KakaoSenderNumberManager`

#### Returns

`KakaoSenderNumberManager`

## Methods

### addSenderNumber()

> **addSenderNumber**(`channelId`, `request`): `Promise`\<[`SenderNumber`](/api/channel/src/interfaces/sendernumber/)\>

Defined in: [packages/channel/src/kakao/sender-number.ts:13](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/kakao/sender-number.ts#L13)

#### Parameters

##### channelId

`string`

##### request

[`SenderNumberCreateRequest`](/api/channel/src/interfaces/sendernumbercreaterequest/)

#### Returns

`Promise`\<[`SenderNumber`](/api/channel/src/interfaces/sendernumber/)\>

***

### blockSenderNumber()

> **blockSenderNumber**(`senderNumberId`, `reason`): `Promise`\<`void`\>

Defined in: [packages/channel/src/kakao/sender-number.ts:253](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/kakao/sender-number.ts#L253)

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

Defined in: [packages/channel/src/kakao/sender-number.ts:331](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/kakao/sender-number.ts#L331)

#### Returns

`void`

***

### deleteSenderNumber()

> **deleteSenderNumber**(`senderNumberId`): `Promise`\<`boolean`\>

Defined in: [packages/channel/src/kakao/sender-number.ts:231](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/kakao/sender-number.ts#L231)

#### Parameters

##### senderNumberId

`string`

#### Returns

`Promise`\<`boolean`\>

***

### getSenderNumber()

> **getSenderNumber**(`senderNumberId`): `Promise`\<[`SenderNumber`](/api/channel/src/interfaces/sendernumber/) \| `null`\>

Defined in: [packages/channel/src/kakao/sender-number.ts:166](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/kakao/sender-number.ts#L166)

#### Parameters

##### senderNumberId

`string`

#### Returns

`Promise`\<[`SenderNumber`](/api/channel/src/interfaces/sendernumber/) \| `null`\>

***

### listSenderNumbers()

> **listSenderNumbers**(`filters?`): `Promise`\<[`SenderNumber`](/api/channel/src/interfaces/sendernumber/)[]\>

Defined in: [packages/channel/src/kakao/sender-number.ts:170](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/kakao/sender-number.ts#L170)

#### Parameters

##### filters?

###### category?

[`SenderNumberCategory`](/api/channel/src/enumerations/sendernumbercategory/)

###### channelId?

`string`

###### status?

[`SenderNumberStatus`](/api/channel/src/enumerations/sendernumberstatus/)

###### verified?

`boolean`

#### Returns

`Promise`\<[`SenderNumber`](/api/channel/src/interfaces/sendernumber/)[]\>

***

### resendVerificationCode()

> **resendVerificationCode**(`senderNumberId`): `Promise`\<`void`\>

Defined in: [packages/channel/src/kakao/sender-number.ts:139](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/kakao/sender-number.ts#L139)

#### Parameters

##### senderNumberId

`string`

#### Returns

`Promise`\<`void`\>

***

### unblockSenderNumber()

> **unblockSenderNumber**(`senderNumberId`): `Promise`\<`void`\>

Defined in: [packages/channel/src/kakao/sender-number.ts:269](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/kakao/sender-number.ts#L269)

#### Parameters

##### senderNumberId

`string`

#### Returns

`Promise`\<`void`\>

***

### updateSenderNumber()

> **updateSenderNumber**(`senderNumberId`, `updates`): `Promise`\<[`SenderNumber`](/api/channel/src/interfaces/sendernumber/)\>

Defined in: [packages/channel/src/kakao/sender-number.ts:210](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/kakao/sender-number.ts#L210)

#### Parameters

##### senderNumberId

`string`

##### updates

`Partial`\<[`SenderNumber`](/api/channel/src/interfaces/sendernumber/)\>

#### Returns

`Promise`\<[`SenderNumber`](/api/channel/src/interfaces/sendernumber/)\>

***

### validateSenderNumberForSending()

> **validateSenderNumberForSending**(`senderNumberId`): `Promise`\<\{ `errors`: `string`[]; `isValid`: `boolean`; \}\>

Defined in: [packages/channel/src/kakao/sender-number.ts:286](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/kakao/sender-number.ts#L286)

#### Parameters

##### senderNumberId

`string`

#### Returns

`Promise`\<\{ `errors`: `string`[]; `isValid`: `boolean`; \}\>

***

### verifySenderNumber()

> **verifySenderNumber**(`senderNumberId`, `code`): `Promise`\<`boolean`\>

Defined in: [packages/channel/src/kakao/sender-number.ts:103](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/kakao/sender-number.ts#L103)

#### Parameters

##### senderNumberId

`string`

##### code

`string`

#### Returns

`Promise`\<`boolean`\>
