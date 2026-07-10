---
editUrl: false
next: false
prev: false
title: "DeliveryStore"
---

Defined in: [packages/webhook/src/registry/delivery.store.ts:19](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/registry/delivery.store.ts#L19)

## Extends

- `EventEmitter`

## Constructors

### Constructor

> **new DeliveryStore**(`config?`): `DeliveryStore`

Defined in: [packages/webhook/src/registry/delivery.store.ts:34](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/registry/delivery.store.ts#L34)

#### Parameters

##### config?

`Partial`\<[`StorageConfig`](/en/api/webhook/src/toolkit/interfaces/storageconfig/)\> = `{}`

#### Returns

`DeliveryStore`

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

### cleanupOldDeliveries()

> **cleanupOldDeliveries**(): `Promise`\<`number`\>

Defined in: [packages/webhook/src/registry/delivery.store.ts:281](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/registry/delivery.store.ts#L281)

오래된 전달 기록 정리

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

### getDeliveriesByEndpoint()

> **getDeliveriesByEndpoint**(`endpointId`, `limit?`): `Promise`\<`object`[]\>

Defined in: [packages/webhook/src/registry/delivery.store.ts:175](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/registry/delivery.store.ts#L175)

엔드포인트별 전달 기록 조회

#### Parameters

##### endpointId

`string`

##### limit?

`number` = `100`

#### Returns

`Promise`\<`object`[]\>

***

### getDelivery()

> **getDelivery**(`deliveryId`): `Promise`\<\{ `attempts`: `object`[]; `completedAt?`: `Date`; `createdAt`: `Date`; `endpointId`: `string`; `eventId`: `string`; `eventType?`: [`MESSAGE_SENT`](/en/api/webhook/src/enumerations/webhookeventtype/#message_sent) \| [`MESSAGE_DELIVERED`](/en/api/webhook/src/enumerations/webhookeventtype/#message_delivered) \| [`MESSAGE_FAILED`](/en/api/webhook/src/enumerations/webhookeventtype/#message_failed) \| [`MESSAGE_CLICKED`](/en/api/webhook/src/enumerations/webhookeventtype/#message_clicked) \| [`MESSAGE_READ`](/en/api/webhook/src/enumerations/webhookeventtype/#message_read) \| [`TEMPLATE_CREATED`](/en/api/webhook/src/enumerations/webhookeventtype/#template_created) \| [`TEMPLATE_APPROVED`](/en/api/webhook/src/enumerations/webhookeventtype/#template_approved) \| [`TEMPLATE_REJECTED`](/en/api/webhook/src/enumerations/webhookeventtype/#template_rejected) \| [`TEMPLATE_UPDATED`](/en/api/webhook/src/enumerations/webhookeventtype/#template_updated) \| [`TEMPLATE_DELETED`](/en/api/webhook/src/enumerations/webhookeventtype/#template_deleted) \| [`CHANNEL_CREATED`](/en/api/webhook/src/enumerations/webhookeventtype/#channel_created) \| [`CHANNEL_VERIFIED`](/en/api/webhook/src/enumerations/webhookeventtype/#channel_verified) \| [`SENDER_NUMBER_ADDED`](/en/api/webhook/src/enumerations/webhookeventtype/#sender_number_added) \| [`SENDER_NUMBER_VERIFIED`](/en/api/webhook/src/enumerations/webhookeventtype/#sender_number_verified) \| [`QUOTA_WARNING`](/en/api/webhook/src/enumerations/webhookeventtype/#quota_warning) \| [`QUOTA_EXCEEDED`](/en/api/webhook/src/enumerations/webhookeventtype/#quota_exceeded) \| [`PROVIDER_ERROR`](/en/api/webhook/src/enumerations/webhookeventtype/#provider_error) \| [`SYSTEM_MAINTENANCE`](/en/api/webhook/src/enumerations/webhookeventtype/#system_maintenance) \| [`ANOMALY_DETECTED`](/en/api/webhook/src/enumerations/webhookeventtype/#anomaly_detected) \| [`THRESHOLD_EXCEEDED`](/en/api/webhook/src/enumerations/webhookeventtype/#threshold_exceeded); `headers`: `Record`\<`string`, `string`\>; `httpMethod`: `"POST"` \| `"PUT"` \| `"PATCH"`; `id`: `string`; `nextRetryAt?`: `Date`; `payload`: `string`; `status`: `"failed"` \| `"success"` \| `"pending"` \| `"exhausted"`; `url`: `string`; \} \| `null`\>

Defined in: [packages/webhook/src/registry/delivery.store.ts:82](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/registry/delivery.store.ts#L82)

전달 기록 조회

#### Parameters

##### deliveryId

`string`

#### Returns

`Promise`\<\{ `attempts`: `object`[]; `completedAt?`: `Date`; `createdAt`: `Date`; `endpointId`: `string`; `eventId`: `string`; `eventType?`: [`MESSAGE_SENT`](/en/api/webhook/src/enumerations/webhookeventtype/#message_sent) \| [`MESSAGE_DELIVERED`](/en/api/webhook/src/enumerations/webhookeventtype/#message_delivered) \| [`MESSAGE_FAILED`](/en/api/webhook/src/enumerations/webhookeventtype/#message_failed) \| [`MESSAGE_CLICKED`](/en/api/webhook/src/enumerations/webhookeventtype/#message_clicked) \| [`MESSAGE_READ`](/en/api/webhook/src/enumerations/webhookeventtype/#message_read) \| [`TEMPLATE_CREATED`](/en/api/webhook/src/enumerations/webhookeventtype/#template_created) \| [`TEMPLATE_APPROVED`](/en/api/webhook/src/enumerations/webhookeventtype/#template_approved) \| [`TEMPLATE_REJECTED`](/en/api/webhook/src/enumerations/webhookeventtype/#template_rejected) \| [`TEMPLATE_UPDATED`](/en/api/webhook/src/enumerations/webhookeventtype/#template_updated) \| [`TEMPLATE_DELETED`](/en/api/webhook/src/enumerations/webhookeventtype/#template_deleted) \| [`CHANNEL_CREATED`](/en/api/webhook/src/enumerations/webhookeventtype/#channel_created) \| [`CHANNEL_VERIFIED`](/en/api/webhook/src/enumerations/webhookeventtype/#channel_verified) \| [`SENDER_NUMBER_ADDED`](/en/api/webhook/src/enumerations/webhookeventtype/#sender_number_added) \| [`SENDER_NUMBER_VERIFIED`](/en/api/webhook/src/enumerations/webhookeventtype/#sender_number_verified) \| [`QUOTA_WARNING`](/en/api/webhook/src/enumerations/webhookeventtype/#quota_warning) \| [`QUOTA_EXCEEDED`](/en/api/webhook/src/enumerations/webhookeventtype/#quota_exceeded) \| [`PROVIDER_ERROR`](/en/api/webhook/src/enumerations/webhookeventtype/#provider_error) \| [`SYSTEM_MAINTENANCE`](/en/api/webhook/src/enumerations/webhookeventtype/#system_maintenance) \| [`ANOMALY_DETECTED`](/en/api/webhook/src/enumerations/webhookeventtype/#anomaly_detected) \| [`THRESHOLD_EXCEEDED`](/en/api/webhook/src/enumerations/webhookeventtype/#threshold_exceeded); `headers`: `Record`\<`string`, `string`\>; `httpMethod`: `"POST"` \| `"PUT"` \| `"PATCH"`; `id`: `string`; `nextRetryAt?`: `Date`; `payload`: `string`; `status`: `"failed"` \| `"success"` \| `"pending"` \| `"exhausted"`; `url`: `string`; \} \| `null`\>

***

### getDeliveryStats()

> **getDeliveryStats**(`endpointId?`, `timeRange?`): `Promise`\<\{ `averageLatency`: `number`; `errorBreakdown`: `Record`\<`string`, `number`\>; `exhaustedDeliveries`: `number`; `failedDeliveries`: `number`; `pendingDeliveries`: `number`; `successfulDeliveries`: `number`; `successRate`: `number`; `totalDeliveries`: `number`; \}\>

Defined in: [packages/webhook/src/registry/delivery.store.ts:209](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/registry/delivery.store.ts#L209)

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

> **getFailedDeliveries**(`endpointId?`, `limit?`): `Promise`\<`object`[]\>

Defined in: [packages/webhook/src/registry/delivery.store.ts:193](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/registry/delivery.store.ts#L193)

실패한 전달 기록 조회

#### Parameters

##### endpointId?

`string`

##### limit?

`number` = `100`

#### Returns

`Promise`\<`object`[]\>

***

### getStorageStats()

> **getStorageStats**(): `object`

Defined in: [packages/webhook/src/registry/delivery.store.ts:316](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/registry/delivery.store.ts#L316)

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

### saveDelivery()

> **saveDelivery**(`delivery`): `Promise`\<`void`\>

Defined in: [packages/webhook/src/registry/delivery.store.ts:51](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/registry/delivery.store.ts#L51)

전달 기록 저장

#### Parameters

##### delivery

###### attempts

`object`[] = `...`

###### completedAt?

`Date` = `...`

###### createdAt

`Date` = `...`

###### endpointId

`string` = `...`

###### eventId

`string` = `...`

###### eventType?

[`MESSAGE_SENT`](/en/api/webhook/src/enumerations/webhookeventtype/#message_sent) \| [`MESSAGE_DELIVERED`](/en/api/webhook/src/enumerations/webhookeventtype/#message_delivered) \| [`MESSAGE_FAILED`](/en/api/webhook/src/enumerations/webhookeventtype/#message_failed) \| [`MESSAGE_CLICKED`](/en/api/webhook/src/enumerations/webhookeventtype/#message_clicked) \| [`MESSAGE_READ`](/en/api/webhook/src/enumerations/webhookeventtype/#message_read) \| [`TEMPLATE_CREATED`](/en/api/webhook/src/enumerations/webhookeventtype/#template_created) \| [`TEMPLATE_APPROVED`](/en/api/webhook/src/enumerations/webhookeventtype/#template_approved) \| [`TEMPLATE_REJECTED`](/en/api/webhook/src/enumerations/webhookeventtype/#template_rejected) \| [`TEMPLATE_UPDATED`](/en/api/webhook/src/enumerations/webhookeventtype/#template_updated) \| [`TEMPLATE_DELETED`](/en/api/webhook/src/enumerations/webhookeventtype/#template_deleted) \| [`CHANNEL_CREATED`](/en/api/webhook/src/enumerations/webhookeventtype/#channel_created) \| [`CHANNEL_VERIFIED`](/en/api/webhook/src/enumerations/webhookeventtype/#channel_verified) \| [`SENDER_NUMBER_ADDED`](/en/api/webhook/src/enumerations/webhookeventtype/#sender_number_added) \| [`SENDER_NUMBER_VERIFIED`](/en/api/webhook/src/enumerations/webhookeventtype/#sender_number_verified) \| [`QUOTA_WARNING`](/en/api/webhook/src/enumerations/webhookeventtype/#quota_warning) \| [`QUOTA_EXCEEDED`](/en/api/webhook/src/enumerations/webhookeventtype/#quota_exceeded) \| [`PROVIDER_ERROR`](/en/api/webhook/src/enumerations/webhookeventtype/#provider_error) \| [`SYSTEM_MAINTENANCE`](/en/api/webhook/src/enumerations/webhookeventtype/#system_maintenance) \| [`ANOMALY_DETECTED`](/en/api/webhook/src/enumerations/webhookeventtype/#anomaly_detected) \| [`THRESHOLD_EXCEEDED`](/en/api/webhook/src/enumerations/webhookeventtype/#threshold_exceeded) = `...`

###### headers

`Record`\<`string`, `string`\> = `...`

###### httpMethod

`"POST"` \| `"PUT"` \| `"PATCH"` = `...`

###### id

`string` = `...`

###### nextRetryAt?

`Date` = `...`

###### payload

`string` = `...`

###### status

`"failed"` \| `"success"` \| `"pending"` \| `"exhausted"` = `...`

###### url

`string` = `...`

#### Returns

`Promise`\<`void`\>

***

### searchDeliveries()

> **searchDeliveries**(`filter?`, `pagination?`): `Promise`\<[`SearchResult`](/en/api/webhook/src/toolkit/interfaces/searchresult/)\<\{ `attempts`: `object`[]; `completedAt?`: `Date`; `createdAt`: `Date`; `endpointId`: `string`; `eventId`: `string`; `eventType?`: [`MESSAGE_SENT`](/en/api/webhook/src/enumerations/webhookeventtype/#message_sent) \| [`MESSAGE_DELIVERED`](/en/api/webhook/src/enumerations/webhookeventtype/#message_delivered) \| [`MESSAGE_FAILED`](/en/api/webhook/src/enumerations/webhookeventtype/#message_failed) \| [`MESSAGE_CLICKED`](/en/api/webhook/src/enumerations/webhookeventtype/#message_clicked) \| [`MESSAGE_READ`](/en/api/webhook/src/enumerations/webhookeventtype/#message_read) \| [`TEMPLATE_CREATED`](/en/api/webhook/src/enumerations/webhookeventtype/#template_created) \| [`TEMPLATE_APPROVED`](/en/api/webhook/src/enumerations/webhookeventtype/#template_approved) \| [`TEMPLATE_REJECTED`](/en/api/webhook/src/enumerations/webhookeventtype/#template_rejected) \| [`TEMPLATE_UPDATED`](/en/api/webhook/src/enumerations/webhookeventtype/#template_updated) \| [`TEMPLATE_DELETED`](/en/api/webhook/src/enumerations/webhookeventtype/#template_deleted) \| [`CHANNEL_CREATED`](/en/api/webhook/src/enumerations/webhookeventtype/#channel_created) \| [`CHANNEL_VERIFIED`](/en/api/webhook/src/enumerations/webhookeventtype/#channel_verified) \| [`SENDER_NUMBER_ADDED`](/en/api/webhook/src/enumerations/webhookeventtype/#sender_number_added) \| [`SENDER_NUMBER_VERIFIED`](/en/api/webhook/src/enumerations/webhookeventtype/#sender_number_verified) \| [`QUOTA_WARNING`](/en/api/webhook/src/enumerations/webhookeventtype/#quota_warning) \| [`QUOTA_EXCEEDED`](/en/api/webhook/src/enumerations/webhookeventtype/#quota_exceeded) \| [`PROVIDER_ERROR`](/en/api/webhook/src/enumerations/webhookeventtype/#provider_error) \| [`SYSTEM_MAINTENANCE`](/en/api/webhook/src/enumerations/webhookeventtype/#system_maintenance) \| [`ANOMALY_DETECTED`](/en/api/webhook/src/enumerations/webhookeventtype/#anomaly_detected) \| [`THRESHOLD_EXCEEDED`](/en/api/webhook/src/enumerations/webhookeventtype/#threshold_exceeded); `headers`: `Record`\<`string`, `string`\>; `httpMethod`: `"POST"` \| `"PUT"` \| `"PATCH"`; `id`: `string`; `nextRetryAt?`: `Date`; `payload`: `string`; `status`: `"failed"` \| `"success"` \| `"pending"` \| `"exhausted"`; `url`: `string`; \}\>\>

Defined in: [packages/webhook/src/registry/delivery.store.ts:89](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/registry/delivery.store.ts#L89)

필터 조건에 맞는 전달 기록 검색

#### Parameters

##### filter?

[`DeliveryFilter`](/en/api/webhook/src/toolkit/interfaces/deliveryfilter/) = `{}`

##### pagination?

[`PaginationOptions`](/en/api/webhook/src/toolkit/interfaces/paginationoptions/) = `...`

#### Returns

`Promise`\<[`SearchResult`](/en/api/webhook/src/toolkit/interfaces/searchresult/)\<\{ `attempts`: `object`[]; `completedAt?`: `Date`; `createdAt`: `Date`; `endpointId`: `string`; `eventId`: `string`; `eventType?`: [`MESSAGE_SENT`](/en/api/webhook/src/enumerations/webhookeventtype/#message_sent) \| [`MESSAGE_DELIVERED`](/en/api/webhook/src/enumerations/webhookeventtype/#message_delivered) \| [`MESSAGE_FAILED`](/en/api/webhook/src/enumerations/webhookeventtype/#message_failed) \| [`MESSAGE_CLICKED`](/en/api/webhook/src/enumerations/webhookeventtype/#message_clicked) \| [`MESSAGE_READ`](/en/api/webhook/src/enumerations/webhookeventtype/#message_read) \| [`TEMPLATE_CREATED`](/en/api/webhook/src/enumerations/webhookeventtype/#template_created) \| [`TEMPLATE_APPROVED`](/en/api/webhook/src/enumerations/webhookeventtype/#template_approved) \| [`TEMPLATE_REJECTED`](/en/api/webhook/src/enumerations/webhookeventtype/#template_rejected) \| [`TEMPLATE_UPDATED`](/en/api/webhook/src/enumerations/webhookeventtype/#template_updated) \| [`TEMPLATE_DELETED`](/en/api/webhook/src/enumerations/webhookeventtype/#template_deleted) \| [`CHANNEL_CREATED`](/en/api/webhook/src/enumerations/webhookeventtype/#channel_created) \| [`CHANNEL_VERIFIED`](/en/api/webhook/src/enumerations/webhookeventtype/#channel_verified) \| [`SENDER_NUMBER_ADDED`](/en/api/webhook/src/enumerations/webhookeventtype/#sender_number_added) \| [`SENDER_NUMBER_VERIFIED`](/en/api/webhook/src/enumerations/webhookeventtype/#sender_number_verified) \| [`QUOTA_WARNING`](/en/api/webhook/src/enumerations/webhookeventtype/#quota_warning) \| [`QUOTA_EXCEEDED`](/en/api/webhook/src/enumerations/webhookeventtype/#quota_exceeded) \| [`PROVIDER_ERROR`](/en/api/webhook/src/enumerations/webhookeventtype/#provider_error) \| [`SYSTEM_MAINTENANCE`](/en/api/webhook/src/enumerations/webhookeventtype/#system_maintenance) \| [`ANOMALY_DETECTED`](/en/api/webhook/src/enumerations/webhookeventtype/#anomaly_detected) \| [`THRESHOLD_EXCEEDED`](/en/api/webhook/src/enumerations/webhookeventtype/#threshold_exceeded); `headers`: `Record`\<`string`, `string`\>; `httpMethod`: `"POST"` \| `"PUT"` \| `"PATCH"`; `id`: `string`; `nextRetryAt?`: `Date`; `payload`: `string`; `status`: `"failed"` \| `"success"` \| `"pending"` \| `"exhausted"`; `url`: `string`; \}\>\>

***

### shutdown()

> **shutdown**(): `Promise`\<`void`\>

Defined in: [packages/webhook/src/registry/delivery.store.ts:643](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/registry/delivery.store.ts#L643)

전달 저장소 종료

#### Returns

`Promise`\<`void`\>
