---
editUrl: false
next: false
prev: false
title: "SMSProvider"
---

Defined in: [packages/channel/src/verification/number.verify.ts:84](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/channel/src/verification/number.verify.ts#L84)

## Properties

### id

> **id**: `string`

Defined in: [packages/channel/src/verification/number.verify.ts:85](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/channel/src/verification/number.verify.ts#L85)

***

### name

> **name**: `string`

Defined in: [packages/channel/src/verification/number.verify.ts:86](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/channel/src/verification/number.verify.ts#L86)

## Methods

### getDeliveryStatus()?

> `optional` **getDeliveryStatus**(`messageId`): `Promise`\<`DeliveryStatus`\>

Defined in: [packages/channel/src/verification/number.verify.ts:92](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/channel/src/verification/number.verify.ts#L92)

#### Parameters

##### messageId

`string`

#### Returns

`Promise`\<`DeliveryStatus`\>

***

### sendSMS()

> **sendSMS**(`phoneNumber`, `message`, `options?`): `Promise`\<`SMSResult`\>

Defined in: [packages/channel/src/verification/number.verify.ts:87](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/channel/src/verification/number.verify.ts#L87)

#### Parameters

##### phoneNumber

`string`

##### message

`string`

##### options?

`any`

#### Returns

`Promise`\<`SMSResult`\>
