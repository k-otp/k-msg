---
editUrl: false
next: false
prev: false
title: "SMSProvider"
---

Defined in: [packages/channel/src/toolkit/verification/number.verify.ts:79](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/verification/number.verify.ts#L79)

## Properties

### id

> **id**: `string`

Defined in: [packages/channel/src/toolkit/verification/number.verify.ts:80](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/verification/number.verify.ts#L80)

***

### name

> **name**: `string`

Defined in: [packages/channel/src/toolkit/verification/number.verify.ts:81](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/verification/number.verify.ts#L81)

## Methods

### getDeliveryStatus()?

> `optional` **getDeliveryStatus**(`messageId`): `Promise`\<`DeliveryStatus`\>

Defined in: [packages/channel/src/toolkit/verification/number.verify.ts:87](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/verification/number.verify.ts#L87)

#### Parameters

##### messageId

`string`

#### Returns

`Promise`\<`DeliveryStatus`\>

***

### sendSMS()

> **sendSMS**(`phoneNumber`, `message`, `options?`): `Promise`\<`SMSResult`\>

Defined in: [packages/channel/src/toolkit/verification/number.verify.ts:82](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/verification/number.verify.ts#L82)

#### Parameters

##### phoneNumber

`string`

##### message

`string`

##### options?

`unknown`

#### Returns

`Promise`\<`SMSResult`\>
