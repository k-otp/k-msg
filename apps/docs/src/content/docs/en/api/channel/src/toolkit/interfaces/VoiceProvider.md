---
editUrl: false
next: false
prev: false
title: "VoiceProvider"
---

Defined in: [packages/channel/src/toolkit/verification/number.verify.ts:90](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/verification/number.verify.ts#L90)

## Properties

### id

> **id**: `string`

Defined in: [packages/channel/src/toolkit/verification/number.verify.ts:91](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/verification/number.verify.ts#L91)

***

### name

> **name**: `string`

Defined in: [packages/channel/src/toolkit/verification/number.verify.ts:92](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/verification/number.verify.ts#L92)

## Methods

### makeCall()

> **makeCall**(`phoneNumber`, `message`, `options?`): `Promise`\<`VoiceResult`\>

Defined in: [packages/channel/src/toolkit/verification/number.verify.ts:93](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/verification/number.verify.ts#L93)

#### Parameters

##### phoneNumber

`string`

##### message

`string`

##### options?

`unknown`

#### Returns

`Promise`\<`VoiceResult`\>

***

### makeMissedCall()?

> `optional` **makeMissedCall**(`phoneNumber`, `options?`): `Promise`\<`MissedCallResult`\>

Defined in: [packages/channel/src/toolkit/verification/number.verify.ts:98](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/verification/number.verify.ts#L98)

#### Parameters

##### phoneNumber

`string`

##### options?

`unknown`

#### Returns

`Promise`\<`MissedCallResult`\>
