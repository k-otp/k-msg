---
editUrl: false
next: false
prev: false
title: "NumberVerifier"
---

Defined in: [packages/channel/src/verification/number.verify.ts:149](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/verification/number.verify.ts#L149)

## Extends

- `EventEmitter`

## Constructors

### Constructor

> **new NumberVerifier**(`options?`): `NumberVerifier`

Defined in: [packages/channel/src/verification/number.verify.ts:173](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/verification/number.verify.ts#L173)

#### Parameters

##### options?

`Partial`\<[`NumberVerifierOptions`](/api/channel/src/interfaces/numberverifieroptions/)\> = `{}`

#### Returns

`NumberVerifier`

#### Overrides

`EventEmitter.constructor`

## Methods

### addListener()

> **addListener**(`eventName`, `listener`): `this`

Defined in: [packages/channel/src/shared/event-emitter.ts:16](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/shared/event-emitter.ts#L16)

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

Defined in: [packages/channel/src/verification/number.verify.ts:433](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/verification/number.verify.ts#L433)

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

Defined in: [packages/channel/src/verification/number.verify.ts:414](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/verification/number.verify.ts#L414)

Cancel verification request

#### Parameters

##### requestId

`string`

#### Returns

`Promise`\<`boolean`\>

***

### cleanup()

> **cleanup**(): `number`

Defined in: [packages/channel/src/verification/number.verify.ts:511](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/verification/number.verify.ts#L511)

Clean up expired verification requests

#### Returns

`number`

***

### emit()

> **emit**(`eventName`, ...`args`): `boolean`

Defined in: [packages/channel/src/shared/event-emitter.ts:44](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/shared/event-emitter.ts#L44)

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

Defined in: [packages/channel/src/shared/event-emitter.ts:71](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/shared/event-emitter.ts#L71)

#### Returns

`string`[]

#### Inherited from

`EventEmitter.eventNames`

***

### getVerificationStats()

> **getVerificationStats**(): `object`

Defined in: [packages/channel/src/verification/number.verify.ts:462](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/verification/number.verify.ts#L462)

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

> **getVerificationStatus**(`requestId`): [`PhoneVerificationRequest`](/api/channel/src/interfaces/phoneverificationrequest/) \| `null`

Defined in: [packages/channel/src/verification/number.verify.ts:407](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/verification/number.verify.ts#L407)

Get verification request status

#### Parameters

##### requestId

`string`

#### Returns

[`PhoneVerificationRequest`](/api/channel/src/interfaces/phoneverificationrequest/) \| `null`

***

### listenerCount()

> **listenerCount**(`eventName`): `number`

Defined in: [packages/channel/src/shared/event-emitter.ts:67](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/shared/event-emitter.ts#L67)

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

Defined in: [packages/channel/src/shared/event-emitter.ts:20](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/shared/event-emitter.ts#L20)

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

Defined in: [packages/channel/src/shared/event-emitter.ts:9](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/shared/event-emitter.ts#L9)

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

Defined in: [packages/channel/src/shared/event-emitter.ts:35](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/shared/event-emitter.ts#L35)

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

Defined in: [packages/channel/src/shared/event-emitter.ts:57](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/shared/event-emitter.ts#L57)

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

Defined in: [packages/channel/src/shared/event-emitter.ts:31](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/shared/event-emitter.ts#L31)

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

> **resendCode**(`requestId`, `method?`): `Promise`\<[`PhoneVerificationRequest`](/api/channel/src/interfaces/phoneverificationrequest/)\>

Defined in: [packages/channel/src/verification/number.verify.ts:357](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/verification/number.verify.ts#L357)

Resend verification code

#### Parameters

##### requestId

`string`

##### method?

[`VerificationMethod`](/api/channel/src/enumerations/verificationmethod/)

#### Returns

`Promise`\<[`PhoneVerificationRequest`](/api/channel/src/interfaces/phoneverificationrequest/)\>

***

### startVerification()

> **startVerification**(`senderNumberId`, `phoneNumber`, `verificationType?`, `metadata?`): `Promise`\<[`PhoneVerificationRequest`](/api/channel/src/interfaces/phoneverificationrequest/)\>

Defined in: [packages/channel/src/verification/number.verify.ts:186](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/verification/number.verify.ts#L186)

Start phone number verification process

#### Parameters

##### senderNumberId

`string`

##### phoneNumber

`string`

##### verificationType?

[`VerificationType`](/api/channel/src/enumerations/verificationtype/) = `VerificationType.SMS`

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

`Promise`\<[`PhoneVerificationRequest`](/api/channel/src/interfaces/phoneverificationrequest/)\>

***

### unblockPhoneNumber()

> **unblockPhoneNumber**(`phoneNumber`): `void`

Defined in: [packages/channel/src/verification/number.verify.ts:453](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/verification/number.verify.ts#L453)

Unblock a phone number

#### Parameters

##### phoneNumber

`string`

#### Returns

`void`

***

### verifyCode()

> **verifyCode**(`requestId`, `providedCode`): `Promise`\<\{ `message`: `string`; `status`: [`PhoneVerificationStatus`](/api/channel/src/enumerations/phoneverificationstatus/); `success`: `boolean`; \}\>

Defined in: [packages/channel/src/verification/number.verify.ts:249](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/verification/number.verify.ts#L249)

Verify the provided code

#### Parameters

##### requestId

`string`

##### providedCode

`string`

#### Returns

`Promise`\<\{ `message`: `string`; `status`: [`PhoneVerificationStatus`](/api/channel/src/enumerations/phoneverificationstatus/); `success`: `boolean`; \}\>
