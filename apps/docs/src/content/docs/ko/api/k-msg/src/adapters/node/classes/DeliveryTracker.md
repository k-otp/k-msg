---
editUrl: false
next: false
prev: false
title: "DeliveryTracker"
---

Defined in: packages/messaging/dist/delivery/tracker.d.ts:63

## Extends

- `EventEmitter`

## Constructors

### Constructor

> **new DeliveryTracker**(`options`): `DeliveryTracker`

Defined in: packages/messaging/dist/delivery/tracker.d.ts:72

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

Defined in: packages/messaging/dist/shared/event-emitter.d.ts:8

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

Defined in: packages/messaging/dist/delivery/tracker.d.ts:129

Clean up expired tracking records

#### Returns

`number`

***

### emit()

> **emit**(`eventName`, ...`args`): `boolean`

Defined in: packages/messaging/dist/shared/event-emitter.d.ts:12

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

> **getDeliveryReport**(`messageId`): `DeliveryReport` \| `undefined`

Defined in: packages/messaging/dist/delivery/tracker.d.ts:109

Get delivery report for a message

#### Parameters

##### messageId

`string`

#### Returns

`DeliveryReport` \| `undefined`

***

### getMessagesByStatus()

> **getMessagesByStatus**(`status`): `TrackingRecord`[]

Defined in: packages/messaging/dist/delivery/tracker.d.ts:117

Get messages by status

#### Parameters

##### status

`MessageStatus`

#### Returns

`TrackingRecord`[]

***

### getStats()

> **getStats**(): `DeliveryStats`

Defined in: packages/messaging/dist/delivery/tracker.d.ts:121

Get delivery statistics

#### Returns

`DeliveryStats`

***

### getStatsForPeriod()

> **getStatsForPeriod**(`startDate`, `endDate`): `DeliveryStats`

Defined in: packages/messaging/dist/delivery/tracker.d.ts:125

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

Defined in: packages/messaging/dist/delivery/tracker.d.ts:113

Get tracking record for a message

#### Parameters

##### messageId

`string`

#### Returns

`TrackingRecord` \| `undefined`

***

### off()

> **off**(`eventName`, `listener`): `this`

Defined in: packages/messaging/dist/shared/event-emitter.d.ts:9

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

Defined in: packages/messaging/dist/shared/event-emitter.d.ts:7

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

Defined in: packages/messaging/dist/shared/event-emitter.d.ts:11

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

Defined in: packages/messaging/dist/shared/event-emitter.d.ts:13

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

Defined in: packages/messaging/dist/shared/event-emitter.d.ts:10

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

Defined in: packages/messaging/dist/delivery/tracker.d.ts:76

Start delivery tracking

#### Returns

`void`

***

### stop()

> **stop**(): `void`

Defined in: packages/messaging/dist/delivery/tracker.d.ts:80

Stop delivery tracking

#### Returns

`void`

***

### stopTracking()

> **stopTracking**(`messageId`): `boolean`

Defined in: packages/messaging/dist/delivery/tracker.d.ts:133

Stop tracking a specific message

#### Parameters

##### messageId

`string`

#### Returns

`boolean`

***

### trackMessage()

> **trackMessage**(`messageId`, `phoneNumber`, `templateId`, `provider`, `options?`): `Promise`\<`void`\>

Defined in: packages/messaging/dist/delivery/tracker.d.ts:84

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

`MessageStatus`

###### metadata?

`Record`\<`string`, `unknown`\>

###### webhooks?

`DeliveryWebhook`[]

#### Returns

`Promise`\<`void`\>

***

### updateStatus()

> **updateStatus**(`messageId`, `status`, `details?`): `Promise`\<`boolean`\>

Defined in: packages/messaging/dist/delivery/tracker.d.ts:92

Update message status

#### Parameters

##### messageId

`string`

##### status

`MessageStatus`

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
