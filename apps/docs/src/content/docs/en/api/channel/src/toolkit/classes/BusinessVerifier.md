---
editUrl: false
next: false
prev: false
title: "BusinessVerifier"
---

Defined in: [packages/channel/src/toolkit/verification/business.verify.ts:91](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/verification/business.verify.ts#L91)

## Extends

- `EventEmitter`

## Constructors

### Constructor

> **new BusinessVerifier**(`options?`): `BusinessVerifier`

Defined in: [packages/channel/src/toolkit/verification/business.verify.ts:107](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/verification/business.verify.ts#L107)

#### Parameters

##### options?

`Partial`\<[`BusinessVerifierOptions`](/api/channel/src/toolkit/interfaces/businessverifieroptions/)\> = `{}`

#### Returns

`BusinessVerifier`

#### Overrides

`EventEmitter.constructor`

## Methods

### addDocument()

> **addDocument**(`requestId`, `document`): `Promise`\<[`VerificationRequest`](/api/channel/src/toolkit/interfaces/verificationrequest/)\>

Defined in: [packages/channel/src/toolkit/verification/business.verify.ts:237](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/verification/business.verify.ts#L237)

Update verification request with additional documents

#### Parameters

##### requestId

`string`

##### document

[`VerificationDocument`](/api/channel/src/toolkit/interfaces/verificationdocument/)

#### Returns

`Promise`\<[`VerificationRequest`](/api/channel/src/toolkit/interfaces/verificationrequest/)\>

***

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

### approveVerification()

> **approveVerification**(`requestId`, `reviewerId`, `notes?`): `Promise`\<[`VerificationRequest`](/api/channel/src/toolkit/interfaces/verificationrequest/)\>

Defined in: [packages/channel/src/toolkit/verification/business.verify.ts:172](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/verification/business.verify.ts#L172)

Manually approve verification

#### Parameters

##### requestId

`string`

##### reviewerId

`string`

##### notes?

`string`

#### Returns

`Promise`\<[`VerificationRequest`](/api/channel/src/toolkit/interfaces/verificationrequest/)\>

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

### getVerificationByChannelId()

> **getVerificationByChannelId**(`channelId`): [`VerificationRequest`](/api/channel/src/toolkit/interfaces/verificationrequest/) \| `null`

Defined in: [packages/channel/src/toolkit/verification/business.verify.ts:160](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/verification/business.verify.ts#L160)

Get verification request by channel ID

#### Parameters

##### channelId

`string`

#### Returns

[`VerificationRequest`](/api/channel/src/toolkit/interfaces/verificationrequest/) \| `null`

***

### getVerificationRequest()

> **getVerificationRequest**(`requestId`): [`VerificationRequest`](/api/channel/src/toolkit/interfaces/verificationrequest/) \| `null`

Defined in: [packages/channel/src/toolkit/verification/business.verify.ts:153](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/verification/business.verify.ts#L153)

Get verification request by ID

#### Parameters

##### requestId

`string`

#### Returns

[`VerificationRequest`](/api/channel/src/toolkit/interfaces/verificationrequest/) \| `null`

***

### getVerificationStats()

> **getVerificationStats**(): `object`

Defined in: [packages/channel/src/toolkit/verification/business.verify.ts:305](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/verification/business.verify.ts#L305)

Get verification statistics

#### Returns

`object`

##### autoApprovalRate

> **autoApprovalRate**: `number`

##### averageProcessingTime

> **averageProcessingTime**: `number`

##### byStatus

> **byStatus**: `Record`\<`string`, `number`\>

##### total

> **total**: `number`

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

### listVerificationRequests()

> **listVerificationRequests**(`filters?`): [`VerificationRequest`](/api/channel/src/toolkit/interfaces/verificationrequest/)[]

Defined in: [packages/channel/src/toolkit/verification/business.verify.ts:272](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/verification/business.verify.ts#L272)

List verification requests with filters

#### Parameters

##### filters?

###### channelId?

`string`

###### status?

[`VerificationStatus`](/api/channel/src/toolkit/enumerations/verificationstatus/)

###### submittedAfter?

`Date`

###### submittedBefore?

`Date`

#### Returns

[`VerificationRequest`](/api/channel/src/toolkit/interfaces/verificationrequest/)[]

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

### rejectVerification()

> **rejectVerification**(`requestId`, `reviewerId`, `reason`): `Promise`\<[`VerificationRequest`](/api/channel/src/toolkit/interfaces/verificationrequest/)\>

Defined in: [packages/channel/src/toolkit/verification/business.verify.ts:203](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/verification/business.verify.ts#L203)

Manually reject verification

#### Parameters

##### requestId

`string`

##### reviewerId

`string`

##### reason

`string`

#### Returns

`Promise`\<[`VerificationRequest`](/api/channel/src/toolkit/interfaces/verificationrequest/)\>

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

### submitVerification()

> **submitVerification**(`channelId`, `businessInfo`, `documents`): `Promise`\<[`VerificationRequest`](/api/channel/src/toolkit/interfaces/verificationrequest/)\>

Defined in: [packages/channel/src/toolkit/verification/business.verify.ts:116](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/verification/business.verify.ts#L116)

Submit business verification request

#### Parameters

##### channelId

`string`

##### businessInfo

[`BusinessInfo`](/api/channel/src/toolkit/interfaces/businessinfo/)

##### documents

[`VerificationDocument`](/api/channel/src/toolkit/interfaces/verificationdocument/)[]

#### Returns

`Promise`\<[`VerificationRequest`](/api/channel/src/toolkit/interfaces/verificationrequest/)\>
