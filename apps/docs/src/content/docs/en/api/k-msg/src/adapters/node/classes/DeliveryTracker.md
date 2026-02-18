---
editUrl: false
next: false
prev: false
title: "DeliveryTracker"
---

Defined in: [packages/messaging/src/delivery/tracker.ts:76](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery/tracker.ts#L76)

## Extends

- `EventEmitter`

## Constructors

### Constructor

> **new DeliveryTracker**(`options`): `DeliveryTracker`

Defined in: [packages/messaging/src/delivery/tracker.ts:98](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery/tracker.ts#L98)

#### Parameters

##### options

`DeliveryTrackingOptions`

#### Returns

`DeliveryTracker`

#### Overrides

`EventEmitter.constructor`

## Methods

### addListener()

> **addListener**(`eventName`, `listener`): `this`

Defined in: [packages/messaging/src/shared/event-emitter.ts:16](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/shared/event-emitter.ts#L16)

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

### cleanup()

> **cleanup**(): `number`

Defined in: [packages/messaging/src/delivery/tracker.ts:443](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery/tracker.ts#L443)

Clean up expired tracking records

#### Returns

`number`

***

### emit()

> **emit**(`eventName`, ...`args`): `boolean`

Defined in: [packages/messaging/src/shared/event-emitter.ts:44](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/shared/event-emitter.ts#L44)

#### Parameters

##### eventName

`string`

##### args

...`unknown`[]

#### Returns

`boolean`

#### Inherited from

`EventEmitter.emit`

***

### getDeliveryReport()

> **getDeliveryReport**(`messageId`): [`DeliveryReport`](/api/messaging/src/interfaces/deliveryreport/) \| `undefined`

Defined in: [packages/messaging/src/delivery/tracker.ts:347](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery/tracker.ts#L347)

Get delivery report for a message

#### Parameters

##### messageId

`string`

#### Returns

[`DeliveryReport`](/api/messaging/src/interfaces/deliveryreport/) \| `undefined`

***

### getMessagesByStatus()

> **getMessagesByStatus**(`status`): `TrackingRecord`[]

Defined in: [packages/messaging/src/delivery/tracker.ts:361](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery/tracker.ts#L361)

Get messages by status

#### Parameters

##### status

[`MessageStatus`](/api/messaging/src/enumerations/messagestatus/)

#### Returns

`TrackingRecord`[]

***

### getStats()

> **getStats**(): `DeliveryStats`

Defined in: [packages/messaging/src/delivery/tracker.ts:371](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery/tracker.ts#L371)

Get delivery statistics

#### Returns

`DeliveryStats`

***

### getStatsForPeriod()

> **getStatsForPeriod**(`startDate`, `endDate`): `DeliveryStats`

Defined in: [packages/messaging/src/delivery/tracker.ts:378](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery/tracker.ts#L378)

Get delivery statistics for a specific time range

#### Parameters

##### startDate

`Date`

##### endDate

`Date`

#### Returns

`DeliveryStats`

***

### getTrackingRecord()

> **getTrackingRecord**(`messageId`): `TrackingRecord` \| `undefined`

Defined in: [packages/messaging/src/delivery/tracker.ts:354](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery/tracker.ts#L354)

Get tracking record for a message

#### Parameters

##### messageId

`string`

#### Returns

`TrackingRecord` \| `undefined`

***

### off()

> **off**(`eventName`, `listener`): `this`

Defined in: [packages/messaging/src/shared/event-emitter.ts:20](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/shared/event-emitter.ts#L20)

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

Defined in: [packages/messaging/src/shared/event-emitter.ts:9](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/shared/event-emitter.ts#L9)

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

Defined in: [packages/messaging/src/shared/event-emitter.ts:35](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/shared/event-emitter.ts#L35)

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

Defined in: [packages/messaging/src/shared/event-emitter.ts:57](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/shared/event-emitter.ts#L57)

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

Defined in: [packages/messaging/src/shared/event-emitter.ts:31](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/shared/event-emitter.ts#L31)

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

### start()

> **start**(): `void`

Defined in: [packages/messaging/src/delivery/tracker.ts:123](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery/tracker.ts#L123)

Start delivery tracking

#### Returns

`void`

***

### stop()

> **stop**(): `void`

Defined in: [packages/messaging/src/delivery/tracker.ts:136](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery/tracker.ts#L136)

Stop delivery tracking

#### Returns

`void`

***

### stopTracking()

> **stopTracking**(`messageId`): `boolean`

Defined in: [packages/messaging/src/delivery/tracker.ts:470](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery/tracker.ts#L470)

Stop tracking a specific message

#### Parameters

##### messageId

`string`

#### Returns

`boolean`

***

### trackMessage()

> **trackMessage**(`messageId`, `phoneNumber`, `templateId`, `provider`, `options?`): `Promise`\<`void`\>

Defined in: [packages/messaging/src/delivery/tracker.ts:150](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery/tracker.ts#L150)

Start tracking a message

#### Parameters

##### messageId

`string`

##### phoneNumber

`string`

##### templateId

`string`

##### provider

`string`

##### options?

###### initialStatus?

[`MessageStatus`](/api/messaging/src/enumerations/messagestatus/)

###### metadata?

`Record`\<`string`, `unknown`\>

###### webhooks?

`DeliveryWebhook`[]

#### Returns

`Promise`\<`void`\>

***

### updateStatus()

> **updateStatus**(`messageId`, `status`, `details?`): `Promise`\<`boolean`\>

Defined in: [packages/messaging/src/delivery/tracker.ts:234](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery/tracker.ts#L234)

Update message status

#### Parameters

##### messageId

`string`

##### status

[`MessageStatus`](/api/messaging/src/enumerations/messagestatus/)

##### details?

###### clickedAt?

`Date`

###### deliveredAt?

`Date`

###### error?

\{ `code`: `string`; `details?`: `Record`\<`string`, `unknown`\>; `message`: `string`; \}

###### error.code

`string`

###### error.details?

`Record`\<`string`, `unknown`\>

###### error.message

`string`

###### failedAt?

`Date`

###### metadata?

`Record`\<`string`, `unknown`\>

###### provider?

`string`

###### sentAt?

`Date`

###### source?

`"manual"` \| `"provider"` \| `"webhook"` \| `"system"`

#### Returns

`Promise`\<`boolean`\>
