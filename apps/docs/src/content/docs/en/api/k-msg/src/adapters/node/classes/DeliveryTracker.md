---
editUrl: false
next: false
prev: false
title: "DeliveryTracker"
---

Defined in: [packages/messaging/src/delivery/tracker.ts:77](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery/tracker.ts#L77)

## Extends

- `EventEmitter`

## Constructors

### Constructor

> **new DeliveryTracker**(`options`): `DeliveryTracker`

Defined in: [packages/messaging/src/delivery/tracker.ts:99](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery/tracker.ts#L99)

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

Defined in: [packages/messaging/src/delivery/tracker.ts:444](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery/tracker.ts#L444)

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

> **getDeliveryReport**(`messageId`): [`DeliveryReport`](/en/api/messaging/src/interfaces/deliveryreport/) \| `undefined`

Defined in: [packages/messaging/src/delivery/tracker.ts:348](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery/tracker.ts#L348)

Get delivery report for a message

#### Parameters

##### messageId

`string`

#### Returns

[`DeliveryReport`](/en/api/messaging/src/interfaces/deliveryreport/) \| `undefined`

***

### getMessagesByStatus()

> **getMessagesByStatus**(`status`): `TrackingRecord`[]

Defined in: [packages/messaging/src/delivery/tracker.ts:362](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery/tracker.ts#L362)

Get messages by status

#### Parameters

##### status

[`MessageStatus`](/en/api/messaging/src/enumerations/messagestatus/)

#### Returns

`TrackingRecord`[]

***

### getStats()

> **getStats**(): `DeliveryStats`

Defined in: [packages/messaging/src/delivery/tracker.ts:372](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery/tracker.ts#L372)

Get delivery statistics

#### Returns

`DeliveryStats`

***

### getStatsForPeriod()

> **getStatsForPeriod**(`startDate`, `endDate`): `DeliveryStats`

Defined in: [packages/messaging/src/delivery/tracker.ts:379](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery/tracker.ts#L379)

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

Defined in: [packages/messaging/src/delivery/tracker.ts:355](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery/tracker.ts#L355)

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

Defined in: [packages/messaging/src/delivery/tracker.ts:124](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery/tracker.ts#L124)

Start delivery tracking

#### Returns

`void`

***

### stop()

> **stop**(): `void`

Defined in: [packages/messaging/src/delivery/tracker.ts:137](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery/tracker.ts#L137)

Stop delivery tracking

#### Returns

`void`

***

### stopTracking()

> **stopTracking**(`messageId`): `boolean`

Defined in: [packages/messaging/src/delivery/tracker.ts:471](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery/tracker.ts#L471)

Stop tracking a specific message

#### Parameters

##### messageId

`string`

#### Returns

`boolean`

***

### trackMessage()

> **trackMessage**(`messageId`, `phoneNumber`, `templateId`, `provider`, `options?`): `Promise`\<`void`\>

Defined in: [packages/messaging/src/delivery/tracker.ts:151](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery/tracker.ts#L151)

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

[`MessageStatus`](/en/api/messaging/src/enumerations/messagestatus/)

###### metadata?

`Record`\<`string`, `unknown`\>

###### webhooks?

`DeliveryWebhook`[]

#### Returns

`Promise`\<`void`\>

***

### updateStatus()

> **updateStatus**(`messageId`, `status`, `details?`): `Promise`\<`boolean`\>

Defined in: [packages/messaging/src/delivery/tracker.ts:235](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery/tracker.ts#L235)

Update message status

#### Parameters

##### messageId

`string`

##### status

[`MessageStatus`](/en/api/messaging/src/enumerations/messagestatus/)

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
