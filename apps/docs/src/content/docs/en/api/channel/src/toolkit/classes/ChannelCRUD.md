---
editUrl: false
next: false
prev: false
title: "ChannelCRUD"
---

Defined in: [packages/channel/src/toolkit/management/crud.ts:67](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/management/crud.ts#L67)

## Extends

- `EventEmitter`

## Constructors

### Constructor

> **new ChannelCRUD**(`options?`): `ChannelCRUD`

Defined in: [packages/channel/src/toolkit/management/crud.ts:83](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/management/crud.ts#L83)

#### Parameters

##### options?

`Partial`\<[`ChannelCRUDOptions`](/en/api/channel/src/toolkit/interfaces/channelcrudoptions/)\> = `{}`

#### Returns

`ChannelCRUD`

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

### cleanup()

> **cleanup**(): `object`

Defined in: [packages/channel/src/toolkit/management/crud.ts:646](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/management/crud.ts#L646)

#### Returns

`object`

##### deletedChannels

> **deletedChannels**: `number`

##### expiredAuditLogs

> **expiredAuditLogs**: `number`

***

### createChannel()

> **createChannel**(`request`, `userId?`): `Promise`\<[`Channel`](/en/api/channel/src/toolkit/interfaces/channel/)\>

Defined in: [packages/channel/src/toolkit/management/crud.ts:93](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/management/crud.ts#L93)

#### Parameters

##### request

[`ChannelCreateRequest`](/en/api/channel/src/toolkit/interfaces/channelcreaterequest/)

##### userId?

`string`

#### Returns

`Promise`\<[`Channel`](/en/api/channel/src/toolkit/interfaces/channel/)\>

***

### createSenderNumber()

> **createSenderNumber**(`channelId`, `request`, `userId?`): `Promise`\<[`SenderNumber`](/en/api/channel/src/toolkit/interfaces/sendernumber/)\>

Defined in: [packages/channel/src/toolkit/management/crud.ts:309](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/management/crud.ts#L309)

#### Parameters

##### channelId

`string`

##### request

[`SenderNumberCreateRequest`](/en/api/channel/src/toolkit/interfaces/sendernumbercreaterequest/)

##### userId?

`string`

#### Returns

`Promise`\<[`SenderNumber`](/en/api/channel/src/toolkit/interfaces/sendernumber/)\>

***

### deleteChannel()

> **deleteChannel**(`channelId`, `userId?`): `Promise`\<`boolean`\>

Defined in: [packages/channel/src/toolkit/management/crud.ts:198](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/management/crud.ts#L198)

#### Parameters

##### channelId

`string`

##### userId?

`string`

#### Returns

`Promise`\<`boolean`\>

***

### deleteSenderNumber()

> **deleteSenderNumber**(`senderNumberId`, `userId?`): `Promise`\<`boolean`\>

Defined in: [packages/channel/src/toolkit/management/crud.ts:439](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/management/crud.ts#L439)

#### Parameters

##### senderNumberId

`string`

##### userId?

`string`

#### Returns

`Promise`\<`boolean`\>

***

### destroy()

> **destroy**(): `void`

Defined in: [packages/channel/src/toolkit/management/crud.ts:678](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/management/crud.ts#L678)

#### Returns

`void`

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

### getAuditLogs()

> **getAuditLogs**(`entityType?`, `entityId?`, `limit?`): [`AuditLogEntry`](/en/api/channel/src/toolkit/interfaces/auditlogentry/)[]

Defined in: [packages/channel/src/toolkit/management/crud.ts:573](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/management/crud.ts#L573)

#### Parameters

##### entityType?

`"senderNumber"` | `"channel"`

##### entityId?

`string`

##### limit?

`number` = `100`

#### Returns

[`AuditLogEntry`](/en/api/channel/src/toolkit/interfaces/auditlogentry/)[]

***

### getChannel()

> **getChannel**(`channelId`, `userId?`): `Promise`\<[`Channel`](/en/api/channel/src/toolkit/interfaces/channel/) \| `null`\>

Defined in: [packages/channel/src/toolkit/management/crud.ts:139](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/management/crud.ts#L139)

#### Parameters

##### channelId

`string`

##### userId?

`string`

#### Returns

`Promise`\<[`Channel`](/en/api/channel/src/toolkit/interfaces/channel/) \| `null`\>

***

### getSenderNumber()

> **getSenderNumber**(`senderNumberId`, `userId?`): `Promise`\<[`SenderNumber`](/en/api/channel/src/toolkit/interfaces/sendernumber/) \| `null`\>

Defined in: [packages/channel/src/toolkit/management/crud.ts:364](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/management/crud.ts#L364)

#### Parameters

##### senderNumberId

`string`

##### userId?

`string`

#### Returns

`Promise`\<[`SenderNumber`](/en/api/channel/src/toolkit/interfaces/sendernumber/) \| `null`\>

***

### getStatistics()

> **getStatistics**(): `object`

Defined in: [packages/channel/src/toolkit/management/crud.ts:592](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/management/crud.ts#L592)

#### Returns

`object`

##### channels

> **channels**: `object`

###### channels.byProvider

> **byProvider**: `Record`\<`string`, `number`\>

###### channels.byStatus

> **byStatus**: `Record`\<`string`, `number`\>

###### channels.byType

> **byType**: `Record`\<`string`, `number`\>

###### channels.total

> **total**: `number`

##### senderNumbers

> **senderNumbers**: `object`

###### senderNumbers.byCategory

> **byCategory**: `Record`\<`string`, `number`\>

###### senderNumbers.byStatus

> **byStatus**: `Record`\<`string`, `number`\>

###### senderNumbers.total

> **total**: `number`

***

### listChannels()

> **listChannels**(`filters?`, `pagination?`): `Promise`\<[`PaginatedResult`](/en/api/channel/src/toolkit/interfaces/paginatedresult/)\<[`Channel`](/en/api/channel/src/toolkit/interfaces/channel/)\>\>

Defined in: [packages/channel/src/toolkit/management/crud.ts:227](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/management/crud.ts#L227)

#### Parameters

##### filters?

[`ChannelFilters`](/en/api/channel/src/toolkit/interfaces/channelfilters/) = `{}`

##### pagination?

[`PaginationOptions`](/en/api/channel/src/toolkit/interfaces/paginationoptions/) = `...`

#### Returns

`Promise`\<[`PaginatedResult`](/en/api/channel/src/toolkit/interfaces/paginatedresult/)\<[`Channel`](/en/api/channel/src/toolkit/interfaces/channel/)\>\>

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

### listSenderNumbers()

> **listSenderNumbers**(`filters?`, `pagination?`): `Promise`\<[`PaginatedResult`](/en/api/channel/src/toolkit/interfaces/paginatedresult/)\<[`SenderNumber`](/en/api/channel/src/toolkit/interfaces/sendernumber/)\>\>

Defined in: [packages/channel/src/toolkit/management/crud.ts:482](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/management/crud.ts#L482)

#### Parameters

##### filters?

[`SenderNumberFilters`](/en/api/channel/src/toolkit/interfaces/sendernumberfilters/) = `{}`

##### pagination?

[`PaginationOptions`](/en/api/channel/src/toolkit/interfaces/paginationoptions/) = `...`

#### Returns

`Promise`\<[`PaginatedResult`](/en/api/channel/src/toolkit/interfaces/paginatedresult/)\<[`SenderNumber`](/en/api/channel/src/toolkit/interfaces/sendernumber/)\>\>

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

### updateChannel()

> **updateChannel**(`channelId`, `updates`, `userId?`): `Promise`\<[`Channel`](/en/api/channel/src/toolkit/interfaces/channel/)\>

Defined in: [packages/channel/src/toolkit/management/crud.ts:152](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/management/crud.ts#L152)

#### Parameters

##### channelId

`string`

##### updates

`Partial`\<`Omit`\<[`Channel`](/en/api/channel/src/toolkit/interfaces/channel/), `"id"` \| `"createdAt"` \| `"updatedAt"`\>\>

##### userId?

`string`

#### Returns

`Promise`\<[`Channel`](/en/api/channel/src/toolkit/interfaces/channel/)\>

***

### updateSenderNumber()

> **updateSenderNumber**(`senderNumberId`, `updates`, `userId?`): `Promise`\<[`SenderNumber`](/en/api/channel/src/toolkit/interfaces/sendernumber/)\>

Defined in: [packages/channel/src/toolkit/management/crud.ts:377](https://github.com/k-otp/k-msg/blob/main/packages/channel/src/toolkit/management/crud.ts#L377)

#### Parameters

##### senderNumberId

`string`

##### updates

`Partial`\<`Omit`\<[`SenderNumber`](/en/api/channel/src/toolkit/interfaces/sendernumber/), `"id"` \| `"phoneNumber"` \| `"createdAt"` \| `"updatedAt"`\>\>

##### userId?

`string`

#### Returns

`Promise`\<[`SenderNumber`](/en/api/channel/src/toolkit/interfaces/sendernumber/)\>
