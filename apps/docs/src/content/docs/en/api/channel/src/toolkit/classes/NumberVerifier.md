---
editUrl: false
next: false
prev: false
title: "NumberVerifier"
---

Defined in: [packages/channel/src/toolkit/verification/number.verify.ts:144](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/verification/number.verify.ts#L144)

## Extends

- `EventEmitter`

## Constructors

### Constructor

> **new NumberVerifier**(`options?`): `NumberVerifier`

Defined in: [packages/channel/src/toolkit/verification/number.verify.ts:169](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/verification/number.verify.ts#L169)

#### Parameters

##### options?

`Partial`\<[`NumberVerifierOptions`](/api/channel/src/toolkit/interfaces/numberverifieroptions/)\> = `{}`

#### Returns

`NumberVerifier`

#### Overrides

`EventEmitter.constructor`

## Methods

### addListener()

> **addListener**(`eventName`, `listener`): `this`

Defined in: [packages/channel/src/toolkit/shared/event-emitter.ts:16](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/shared/event-emitter.ts#L16)

#### Parameters

##### eventName

`string`

##### listener

`Listener`

#### Returns

`this`

#### Inherited from

`EventEmitter.addListener`

***

### blockPhoneNumber()

> **blockPhoneNumber**(`phoneNumber`, `reason?`): `void`

Defined in: [packages/channel/src/toolkit/verification/number.verify.ts:429](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/verification/number.verify.ts#L429)

Block a phone number from verification

#### Parameters

##### phoneNumber

`string`

##### reason?

`string`

#### Returns

`void`

***

### cancelVerification()

> **cancelVerification**(`requestId`): `Promise`\<`boolean`\>

Defined in: [packages/channel/src/toolkit/verification/number.verify.ts:410](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/verification/number.verify.ts#L410)

Cancel verification request

#### Parameters

##### requestId

`string`

#### Returns

`Promise`\<`boolean`\>

***

### cleanup()

> **cleanup**(): `number`

Defined in: [packages/channel/src/toolkit/verification/number.verify.ts:507](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/verification/number.verify.ts#L507)

Clean up expired verification requests

#### Returns

`number`

***

### emit()

> **emit**(`eventName`, ...`args`): `boolean`

Defined in: [packages/channel/src/toolkit/shared/event-emitter.ts:44](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/shared/event-emitter.ts#L44)

#### Parameters

##### eventName

`string`

##### args

...`any`[]

#### Returns

`boolean`

#### Inherited from

`EventEmitter.emit`

***

### eventNames()

> **eventNames**(): `string`[]

Defined in: [packages/channel/src/toolkit/shared/event-emitter.ts:71](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/shared/event-emitter.ts#L71)

#### Returns

`string`[]

#### Inherited from

`EventEmitter.eventNames`

***

### getVerificationStats()

> **getVerificationStats**(): `object`

Defined in: [packages/channel/src/toolkit/verification/number.verify.ts:458](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/verification/number.verify.ts#L458)

Get verification statistics

#### Returns

`object`

##### averageCompletionTime

> **averageCompletionTime**: `number`

##### byMethod

> **byMethod**: `Record`\<`string`, `number`\>

##### byStatus

> **byStatus**: `Record`\<`string`, `number`\>

##### successRate

> **successRate**: `number`

##### total

> **total**: `number`

***

### getVerificationStatus()

> **getVerificationStatus**(`requestId`): [`PhoneVerificationRequest`](/api/channel/src/toolkit/interfaces/phoneverificationrequest/) \| `null`

Defined in: [packages/channel/src/toolkit/verification/number.verify.ts:403](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/verification/number.verify.ts#L403)

Get verification request status

#### Parameters

##### requestId

`string`

#### Returns

[`PhoneVerificationRequest`](/api/channel/src/toolkit/interfaces/phoneverificationrequest/) \| `null`

***

### listenerCount()

> **listenerCount**(`eventName`): `number`

Defined in: [packages/channel/src/toolkit/shared/event-emitter.ts:67](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/shared/event-emitter.ts#L67)

#### Parameters

##### eventName

`string`

#### Returns

`number`

#### Inherited from

`EventEmitter.listenerCount`

***

### off()

> **off**(`eventName`, `listener`): `this`

Defined in: [packages/channel/src/toolkit/shared/event-emitter.ts:20](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/shared/event-emitter.ts#L20)

#### Parameters

##### eventName

`string`

##### listener

`Listener`

#### Returns

`this`

#### Inherited from

`EventEmitter.off`

***

### on()

> **on**(`eventName`, `listener`): `this`

Defined in: [packages/channel/src/toolkit/shared/event-emitter.ts:9](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/shared/event-emitter.ts#L9)

#### Parameters

##### eventName

`string`

##### listener

`Listener`

#### Returns

`this`

#### Inherited from

`EventEmitter.on`

***

### once()

> **once**(`eventName`, `listener`): `this`

Defined in: [packages/channel/src/toolkit/shared/event-emitter.ts:35](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/shared/event-emitter.ts#L35)

#### Parameters

##### eventName

`string`

##### listener

`Listener`

#### Returns

`this`

#### Inherited from

`EventEmitter.once`

***

### removeAllListeners()

> **removeAllListeners**(`eventName?`): `this`

Defined in: [packages/channel/src/toolkit/shared/event-emitter.ts:57](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/shared/event-emitter.ts#L57)

#### Parameters

##### eventName?

`string`

#### Returns

`this`

#### Inherited from

`EventEmitter.removeAllListeners`

***

### removeListener()

> **removeListener**(`eventName`, `listener`): `this`

Defined in: [packages/channel/src/toolkit/shared/event-emitter.ts:31](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/shared/event-emitter.ts#L31)

#### Parameters

##### eventName

`string`

##### listener

`Listener`

#### Returns

`this`

#### Inherited from

`EventEmitter.removeListener`

***

### resendCode()

> **resendCode**(`requestId`, `method?`): `Promise`\<[`PhoneVerificationRequest`](/api/channel/src/toolkit/interfaces/phoneverificationrequest/)\>

Defined in: [packages/channel/src/toolkit/verification/number.verify.ts:353](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/verification/number.verify.ts#L353)

Resend verification code

#### Parameters

##### requestId

`string`

##### method?

[`VerificationMethod`](/api/channel/src/toolkit/enumerations/verificationmethod/)

#### Returns

`Promise`\<[`PhoneVerificationRequest`](/api/channel/src/toolkit/interfaces/phoneverificationrequest/)\>

***

### startVerification()

> **startVerification**(`senderNumberId`, `phoneNumber`, `verificationType?`, `metadata?`): `Promise`\<[`PhoneVerificationRequest`](/api/channel/src/toolkit/interfaces/phoneverificationrequest/)\>

Defined in: [packages/channel/src/toolkit/verification/number.verify.ts:182](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/verification/number.verify.ts#L182)

Start phone number verification process

#### Parameters

##### senderNumberId

`string`

##### phoneNumber

`string`

##### verificationType?

[`VerificationType`](/api/channel/src/toolkit/enumerations/verificationtype/) = `VerificationType.SMS`

##### metadata?

###### callProvider?

`string`

###### deviceId?

`string`

###### ipAddress?

`string`

###### smsProvider?

`string`

###### userAgent?

`string`

#### Returns

`Promise`\<[`PhoneVerificationRequest`](/api/channel/src/toolkit/interfaces/phoneverificationrequest/)\>

***

### unblockPhoneNumber()

> **unblockPhoneNumber**(`phoneNumber`): `void`

Defined in: [packages/channel/src/toolkit/verification/number.verify.ts:449](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/verification/number.verify.ts#L449)

Unblock a phone number

#### Parameters

##### phoneNumber

`string`

#### Returns

`void`

***

### verifyCode()

> **verifyCode**(`requestId`, `providedCode`): `Promise`\<\{ `message`: `string`; `status`: [`PhoneVerificationStatus`](/api/channel/src/toolkit/enumerations/phoneverificationstatus/); `success`: `boolean`; \}\>

Defined in: [packages/channel/src/toolkit/verification/number.verify.ts:245](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/verification/number.verify.ts#L245)

Verify the provided code

#### Parameters

##### requestId

`string`

##### providedCode

`string`

#### Returns

`Promise`\<\{ `message`: `string`; `status`: [`PhoneVerificationStatus`](/api/channel/src/toolkit/enumerations/phoneverificationstatus/); `success`: `boolean`; \}\>
