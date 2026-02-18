---
editUrl: false
next: false
prev: false
title: "DeliveryStore"
---

Defined in: [packages/webhook/src/registry/delivery.store.ts:19](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/registry/delivery.store.ts#L19)

## Extends

- `EventEmitter`

## Constructors

### Constructor

> **new DeliveryStore**(`config?`): `DeliveryStore`

Defined in: [packages/webhook/src/registry/delivery.store.ts:34](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/registry/delivery.store.ts#L34)

#### Parameters

##### config?

`Partial`\<[`StorageConfig`](/api/webhook/src/interfaces/storageconfig/)\> = `{}`

#### Returns

`DeliveryStore`

#### Overrides

`EventEmitter.constructor`

## Methods

### addListener()

> **addListener**(`eventName`, `listener`): `this`

Defined in: [packages/webhook/src/shared/event-emitter.ts:16](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/shared/event-emitter.ts#L16)

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

### cleanupOldDeliveries()

> **cleanupOldDeliveries**(): `Promise`\<`number`\>

Defined in: [packages/webhook/src/registry/delivery.store.ts:281](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/registry/delivery.store.ts#L281)

오래된 전달 기록 정리

#### Returns

`Promise`\<`number`\>

***

### emit()

> **emit**(`eventName`, ...`args`): `boolean`

Defined in: [packages/webhook/src/shared/event-emitter.ts:44](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/shared/event-emitter.ts#L44)

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

### getDeliveriesByEndpoint()

> **getDeliveriesByEndpoint**(`endpointId`, `limit?`): `Promise`\<[`WebhookDelivery`](/api/webhook/src/interfaces/webhookdelivery/)[]\>

Defined in: [packages/webhook/src/registry/delivery.store.ts:175](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/registry/delivery.store.ts#L175)

엔드포인트별 전달 기록 조회

#### Parameters

##### endpointId

`string`

##### limit?

`number` = `100`

#### Returns

`Promise`\<[`WebhookDelivery`](/api/webhook/src/interfaces/webhookdelivery/)[]\>

***

### getDelivery()

> **getDelivery**(`deliveryId`): `Promise`\<[`WebhookDelivery`](/api/webhook/src/interfaces/webhookdelivery/) \| `null`\>

Defined in: [packages/webhook/src/registry/delivery.store.ts:82](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/registry/delivery.store.ts#L82)

전달 기록 조회

#### Parameters

##### deliveryId

`string`

#### Returns

`Promise`\<[`WebhookDelivery`](/api/webhook/src/interfaces/webhookdelivery/) \| `null`\>

***

### getDeliveryStats()

> **getDeliveryStats**(`endpointId?`, `timeRange?`): `Promise`\<\{ `averageLatency`: `number`; `errorBreakdown`: `Record`\<`string`, `number`\>; `exhaustedDeliveries`: `number`; `failedDeliveries`: `number`; `pendingDeliveries`: `number`; `successfulDeliveries`: `number`; `successRate`: `number`; `totalDeliveries`: `number`; \}\>

Defined in: [packages/webhook/src/registry/delivery.store.ts:209](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/registry/delivery.store.ts#L209)

전달 통계 조회

#### Parameters

##### endpointId?

`string`

##### timeRange?

###### end

`Date`

###### start

`Date`

#### Returns

`Promise`\<\{ `averageLatency`: `number`; `errorBreakdown`: `Record`\<`string`, `number`\>; `exhaustedDeliveries`: `number`; `failedDeliveries`: `number`; `pendingDeliveries`: `number`; `successfulDeliveries`: `number`; `successRate`: `number`; `totalDeliveries`: `number`; \}\>

***

### getFailedDeliveries()

> **getFailedDeliveries**(`endpointId?`, `limit?`): `Promise`\<[`WebhookDelivery`](/api/webhook/src/interfaces/webhookdelivery/)[]\>

Defined in: [packages/webhook/src/registry/delivery.store.ts:193](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/registry/delivery.store.ts#L193)

실패한 전달 기록 조회

#### Parameters

##### endpointId?

`string`

##### limit?

`number` = `100`

#### Returns

`Promise`\<[`WebhookDelivery`](/api/webhook/src/interfaces/webhookdelivery/)[]\>

***

### getStorageStats()

> **getStorageStats**(): `object`

Defined in: [packages/webhook/src/registry/delivery.store.ts:316](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/registry/delivery.store.ts#L316)

저장소 통계 조회

#### Returns

`object`

##### indexSizes

> **indexSizes**: `object`

###### indexSizes.byDate

> **byDate**: `number`

###### indexSizes.byEndpoint

> **byEndpoint**: `number`

###### indexSizes.byStatus

> **byStatus**: `number`

##### memoryUsage

> **memoryUsage**: `number`

##### totalDeliveries

> **totalDeliveries**: `number`

***

### off()

> **off**(`eventName`, `listener`): `this`

Defined in: [packages/webhook/src/shared/event-emitter.ts:20](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/shared/event-emitter.ts#L20)

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

Defined in: [packages/webhook/src/shared/event-emitter.ts:9](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/shared/event-emitter.ts#L9)

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

Defined in: [packages/webhook/src/shared/event-emitter.ts:35](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/shared/event-emitter.ts#L35)

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

Defined in: [packages/webhook/src/shared/event-emitter.ts:57](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/shared/event-emitter.ts#L57)

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

Defined in: [packages/webhook/src/shared/event-emitter.ts:31](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/shared/event-emitter.ts#L31)

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

### saveDelivery()

> **saveDelivery**(`delivery`): `Promise`\<`void`\>

Defined in: [packages/webhook/src/registry/delivery.store.ts:51](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/registry/delivery.store.ts#L51)

전달 기록 저장

#### Parameters

##### delivery

[`WebhookDelivery`](/api/webhook/src/interfaces/webhookdelivery/)

#### Returns

`Promise`\<`void`\>

***

### searchDeliveries()

> **searchDeliveries**(`filter?`, `pagination?`): `Promise`\<[`SearchResult`](/api/webhook/src/interfaces/searchresult/)\<[`WebhookDelivery`](/api/webhook/src/interfaces/webhookdelivery/)\>\>

Defined in: [packages/webhook/src/registry/delivery.store.ts:89](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/registry/delivery.store.ts#L89)

필터 조건에 맞는 전달 기록 검색

#### Parameters

##### filter?

[`DeliveryFilter`](/api/webhook/src/interfaces/deliveryfilter/) = `{}`

##### pagination?

[`PaginationOptions`](/api/webhook/src/interfaces/paginationoptions/) = `...`

#### Returns

`Promise`\<[`SearchResult`](/api/webhook/src/interfaces/searchresult/)\<[`WebhookDelivery`](/api/webhook/src/interfaces/webhookdelivery/)\>\>

***

### shutdown()

> **shutdown**(): `Promise`\<`void`\>

Defined in: [packages/webhook/src/registry/delivery.store.ts:643](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/registry/delivery.store.ts#L643)

전달 저장소 종료

#### Returns

`Promise`\<`void`\>
