---
editUrl: false
next: false
prev: false
title: "VoiceProvider"
---

Defined in: [packages/channel/src/verification/number.verify.ts:95](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/channel/src/verification/number.verify.ts#L95)

## Properties

### id

> **id**: `string`

Defined in: [packages/channel/src/verification/number.verify.ts:96](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/channel/src/verification/number.verify.ts#L96)

***

### name

> **name**: `string`

Defined in: [packages/channel/src/verification/number.verify.ts:97](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/channel/src/verification/number.verify.ts#L97)

## Methods

### makeCall()

> **makeCall**(`phoneNumber`, `message`, `options?`): `Promise`\<`VoiceResult`\>

Defined in: [packages/channel/src/verification/number.verify.ts:98](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/channel/src/verification/number.verify.ts#L98)

#### Parameters

##### phoneNumber

`string`

##### message

`string`

##### options?

`any`

#### Returns

`Promise`\<`VoiceResult`\>

***

### makeMissedCall()?

> `optional` **makeMissedCall**(`phoneNumber`, `options?`): `Promise`\<`MissedCallResult`\>

Defined in: [packages/channel/src/verification/number.verify.ts:103](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/channel/src/verification/number.verify.ts#L103)

#### Parameters

##### phoneNumber

`string`

##### options?

`any`

#### Returns

`Promise`\<`MissedCallResult`\>
