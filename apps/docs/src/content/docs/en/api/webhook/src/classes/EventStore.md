---
editUrl: false
next: false
prev: false
title: "EventStore"
---

Defined in: [packages/webhook/src/registry/event.store.ts:20](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/registry/event.store.ts#L20)

## Extends

- `EventEmitter`

## Constructors

### Constructor

> **new EventStore**(`config?`): `EventStore`

Defined in: [packages/webhook/src/registry/event.store.ts:36](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/registry/event.store.ts#L36)

#### Parameters

##### config?

`Partial`\<[`StorageConfig`](/api/webhook/src/interfaces/storageconfig/)\> = `{}`

#### Returns

`EventStore`

#### Overrides

`EventEmitter.constructor`

## Methods

### addListener()

> **addListener**(`eventName`, `listener`): `this`

Defined in: [packages/webhook/src/shared/event-emitter.ts:16](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/shared/event-emitter.ts#L16)

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

### cleanupDuplicateEvents()

> **cleanupDuplicateEvents**(): `Promise`\<`number`\>

Defined in: [packages/webhook/src/registry/event.store.ts:331](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/registry/event.store.ts#L331)

중복 이벤트 정리

#### Returns

`Promise`\<`number`\>

***

### cleanupOldEvents()

> **cleanupOldEvents**(): `Promise`\<`number`\>

Defined in: [packages/webhook/src/registry/event.store.ts:296](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/registry/event.store.ts#L296)

오래된 이벤트 정리

#### Returns

`Promise`\<`number`\>

***

### emit()

> **emit**(`eventName`, ...`args`): `boolean`

Defined in: [packages/webhook/src/shared/event-emitter.ts:44](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/shared/event-emitter.ts#L44)

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

### getEvent()

> **getEvent**(`eventId`): `Promise`\<[`WebhookEvent`](/api/webhook/src/interfaces/webhookevent/)\<`any`\> \| `null`\>

Defined in: [packages/webhook/src/registry/event.store.ts:84](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/registry/event.store.ts#L84)

이벤트 조회

#### Parameters

##### eventId

`string`

#### Returns

`Promise`\<[`WebhookEvent`](/api/webhook/src/interfaces/webhookevent/)\<`any`\> \| `null`\>

***

### getEventsByType()

> **getEventsByType**(`eventType`, `limit?`): `Promise`\<[`WebhookEvent`](/api/webhook/src/interfaces/webhookevent/)\<`any`\>[]\>

Defined in: [packages/webhook/src/registry/event.store.ts:215](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/registry/event.store.ts#L215)

이벤트 타입별 조회

#### Parameters

##### eventType

[`WebhookEventType`](/api/webhook/src/enumerations/webhookeventtype/)

##### limit?

`number` = `100`

#### Returns

`Promise`\<[`WebhookEvent`](/api/webhook/src/interfaces/webhookevent/)\<`any`\>[]\>

***

### getEventStats()

> **getEventStats**(`timeRange?`): `Promise`\<\{ `eventsByChannel`: `Record`\<`string`, `number`\>; `eventsByProvider`: `Record`\<`string`, `number`\>; `eventsByType`: `Record`\<[`WebhookEventType`](/api/webhook/src/enumerations/webhookeventtype/), `number`\>; `eventsPerHour`: `Record`\<`string`, `number`\>; `totalEvents`: `number`; \}\>

Defined in: [packages/webhook/src/registry/event.store.ts:233](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/registry/event.store.ts#L233)

이벤트 통계 조회

#### Parameters

##### timeRange?

###### end

`Date`

###### start

`Date`

#### Returns

`Promise`\<\{ `eventsByChannel`: `Record`\<`string`, `number`\>; `eventsByProvider`: `Record`\<`string`, `number`\>; `eventsByType`: `Record`\<[`WebhookEventType`](/api/webhook/src/enumerations/webhookeventtype/), `number`\>; `eventsPerHour`: `Record`\<`string`, `number`\>; `totalEvents`: `number`; \}\>

***

### getStorageStats()

> **getStorageStats**(): `object`

Defined in: [packages/webhook/src/registry/event.store.ts:378](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/registry/event.store.ts#L378)

저장소 통계 조회

#### Returns

`object`

##### indexSizes

> **indexSizes**: `object`

###### indexSizes.byChannel

> **byChannel**: `number`

###### indexSizes.byDate

> **byDate**: `number`

###### indexSizes.byProvider

> **byProvider**: `number`

###### indexSizes.byType

> **byType**: `number`

##### memoryUsage

> **memoryUsage**: `number`

##### totalEvents

> **totalEvents**: `number`

***

### off()

> **off**(`eventName`, `listener`): `this`

Defined in: [packages/webhook/src/shared/event-emitter.ts:20](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/shared/event-emitter.ts#L20)

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

Defined in: [packages/webhook/src/shared/event-emitter.ts:9](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/shared/event-emitter.ts#L9)

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

Defined in: [packages/webhook/src/shared/event-emitter.ts:35](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/shared/event-emitter.ts#L35)

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

Defined in: [packages/webhook/src/shared/event-emitter.ts:57](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/shared/event-emitter.ts#L57)

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

Defined in: [packages/webhook/src/shared/event-emitter.ts:31](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/shared/event-emitter.ts#L31)

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

### saveEvent()

> **saveEvent**(`event`): `Promise`\<`void`\>

Defined in: [packages/webhook/src/registry/event.store.ts:53](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/registry/event.store.ts#L53)

이벤트 저장

#### Parameters

##### event

[`WebhookEvent`](/api/webhook/src/interfaces/webhookevent/)

#### Returns

`Promise`\<`void`\>

***

### searchEvents()

> **searchEvents**(`filter?`, `pagination?`): `Promise`\<[`SearchResult`](/api/webhook/src/interfaces/searchresult/)\<[`WebhookEvent`](/api/webhook/src/interfaces/webhookevent/)\<`any`\>\>\>

Defined in: [packages/webhook/src/registry/event.store.ts:91](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/registry/event.store.ts#L91)

필터 조건에 맞는 이벤트 검색

#### Parameters

##### filter?

[`EventFilter`](/api/webhook/src/interfaces/eventfilter/) = `{}`

##### pagination?

[`PaginationOptions`](/api/webhook/src/interfaces/paginationoptions/) = `...`

#### Returns

`Promise`\<[`SearchResult`](/api/webhook/src/interfaces/searchresult/)\<[`WebhookEvent`](/api/webhook/src/interfaces/webhookevent/)\<`any`\>\>\>

***

### shutdown()

> **shutdown**(): `Promise`\<`void`\>

Defined in: [packages/webhook/src/registry/event.store.ts:727](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/registry/event.store.ts#L727)

이벤트 저장소 종료

#### Returns

`Promise`\<`void`\>
