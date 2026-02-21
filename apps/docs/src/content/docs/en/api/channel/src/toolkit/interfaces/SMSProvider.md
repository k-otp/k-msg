---
editUrl: false
next: false
prev: false
title: "SMSProvider"
---

Defined in: packages/channel/src/toolkit/verification/number.verify.ts:84

## Properties

### id

> **id**: `string`

Defined in: packages/channel/src/toolkit/verification/number.verify.ts:85

***

### name

> **name**: `string`

Defined in: packages/channel/src/toolkit/verification/number.verify.ts:86

## Methods

### getDeliveryStatus()?

> `optional` **getDeliveryStatus**(`messageId`): `Promise`\<`DeliveryStatus`\>

Defined in: packages/channel/src/toolkit/verification/number.verify.ts:92

#### Parameters

##### messageId

`string`

#### Returns

`Promise`\<`DeliveryStatus`\>

***

### sendSMS()

> **sendSMS**(`phoneNumber`, `message`, `options?`): `Promise`\<`SMSResult`\>

Defined in: packages/channel/src/toolkit/verification/number.verify.ts:87

#### Parameters

##### phoneNumber

`string`

##### message

`string`

##### options?

`any`

#### Returns

`Promise`\<`SMSResult`\>
