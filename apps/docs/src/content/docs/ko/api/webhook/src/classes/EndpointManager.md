---
editUrl: false
next: false
prev: false
title: "EndpointManager"
---

Defined in: [packages/webhook/src/registry/endpoint.manager.ts:20](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/registry/endpoint.manager.ts#L20)

## Extends

- `EventEmitter`

## Constructors

### Constructor

> **new EndpointManager**(`config?`): `EndpointManager`

Defined in: [packages/webhook/src/registry/endpoint.manager.ts:33](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/registry/endpoint.manager.ts#L33)

#### Parameters

##### config?

`Partial`\<[`StorageConfig`](/api/webhook/src/interfaces/storageconfig/)\> = `{}`

#### Returns

`EndpointManager`

#### Overrides

`EventEmitter.constructor`

## Methods

### addEndpoint()

> **addEndpoint**(`endpoint`): `Promise`\<`void`\>

Defined in: [packages/webhook/src/registry/endpoint.manager.ts:49](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/registry/endpoint.manager.ts#L49)

엔드포인트 추가

#### Parameters

##### endpoint

[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/)

#### Returns

`Promise`\<`void`\>

***

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

### cleanupExpiredEndpoints()

> **cleanupExpiredEndpoints**(): `Promise`\<`number`\>

Defined in: [packages/webhook/src/registry/endpoint.manager.ts:293](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/registry/endpoint.manager.ts#L293)

만료된 엔드포인트 정리

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

### getActiveEndpointsForEvent()

> **getActiveEndpointsForEvent**(`eventType`): `Promise`\<[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/)[]\>

Defined in: [packages/webhook/src/registry/endpoint.manager.ts:245](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/registry/endpoint.manager.ts#L245)

특정 이벤트 타입을 구독하는 활성 엔드포인트 조회

#### Parameters

##### eventType

[`WebhookEventType`](/api/webhook/src/enumerations/webhookeventtype/)

#### Returns

`Promise`\<[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/)[]\>

***

### getEndpoint()

> **getEndpoint**(`endpointId`): `Promise`\<[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/) \| `null`\>

Defined in: [packages/webhook/src/registry/endpoint.manager.ts:153](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/registry/endpoint.manager.ts#L153)

엔드포인트 조회

#### Parameters

##### endpointId

`string`

#### Returns

`Promise`\<[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/) \| `null`\>

***

### getEndpointByUrl()

> **getEndpointByUrl**(`url`): `Promise`\<[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/) \| `null`\>

Defined in: [packages/webhook/src/registry/endpoint.manager.ts:160](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/registry/endpoint.manager.ts#L160)

URL로 엔드포인트 조회

#### Parameters

##### url

`string`

#### Returns

`Promise`\<[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/) \| `null`\>

***

### getStats()

> **getStats**(): `object`

Defined in: [packages/webhook/src/registry/endpoint.manager.ts:261](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/registry/endpoint.manager.ts#L261)

엔드포인트 통계 조회

#### Returns

`object`

##### activeEndpoints

> **activeEndpoints**: `number`

##### errorEndpoints

> **errorEndpoints**: `number`

##### eventSubscriptions

> **eventSubscriptions**: `Record`\<[`WebhookEventType`](/api/webhook/src/enumerations/webhookeventtype/), `number`\>

##### inactiveEndpoints

> **inactiveEndpoints**: `number`

##### suspendedEndpoints

> **suspendedEndpoints**: `number`

##### totalEndpoints

> **totalEndpoints**: `number`

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

### removeEndpoint()

> **removeEndpoint**(`endpointId`): `Promise`\<`boolean`\>

Defined in: [packages/webhook/src/registry/endpoint.manager.ts:131](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/registry/endpoint.manager.ts#L131)

엔드포인트 제거

#### Parameters

##### endpointId

`string`

#### Returns

`Promise`\<`boolean`\>

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

### searchEndpoints()

> **searchEndpoints**(`filter?`, `pagination?`): `Promise`\<[`SearchResult`](/api/webhook/src/interfaces/searchresult/)\<[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/)\>\>

Defined in: [packages/webhook/src/registry/endpoint.manager.ts:168](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/registry/endpoint.manager.ts#L168)

필터 조건에 맞는 엔드포인트 검색

#### Parameters

##### filter?

[`EndpointFilter`](/api/webhook/src/interfaces/endpointfilter/) = `{}`

##### pagination?

[`PaginationOptions`](/api/webhook/src/interfaces/paginationoptions/) = `...`

#### Returns

`Promise`\<[`SearchResult`](/api/webhook/src/interfaces/searchresult/)\<[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/)\>\>

***

### shutdown()

> **shutdown**(): `Promise`\<`void`\>

Defined in: [packages/webhook/src/registry/endpoint.manager.ts:512](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/registry/endpoint.manager.ts#L512)

엔드포인트 관리자 종료

#### Returns

`Promise`\<`void`\>

***

### updateEndpoint()

> **updateEndpoint**(`endpointId`, `updates`): `Promise`\<[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/)\>

Defined in: [packages/webhook/src/registry/endpoint.manager.ts:81](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/registry/endpoint.manager.ts#L81)

엔드포인트 업데이트

#### Parameters

##### endpointId

`string`

##### updates

`Partial`\<[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/)\>

#### Returns

`Promise`\<[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/)\>
