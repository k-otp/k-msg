---
editUrl: false
next: false
prev: false
title: "LoadBalancer"
---

Defined in: [packages/webhook/src/dispatcher/load-balancer.ts:19](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/dispatcher/load-balancer.ts#L19)

## Extends

- `EventEmitter`

## Constructors

### Constructor

> **new LoadBalancer**(`config?`): `LoadBalancer`

Defined in: [packages/webhook/src/dispatcher/load-balancer.ts:34](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/dispatcher/load-balancer.ts#L34)

#### Parameters

##### config?

`Partial`\<[`LoadBalancerConfig`](/api/webhook/src/interfaces/loadbalancerconfig/)\> = `{}`

#### Returns

`LoadBalancer`

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

### getAllEndpointHealth()

> **getAllEndpointHealth**(): `EndpointHealth`[]

Defined in: [packages/webhook/src/dispatcher/load-balancer.ts:210](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/dispatcher/load-balancer.ts#L210)

모든 엔드포인트 건강 상태 조회

#### Returns

`EndpointHealth`[]

***

### getEndpointHealth()

> **getEndpointHealth**(`endpointId`): `EndpointHealth` \| `null`

Defined in: [packages/webhook/src/dispatcher/load-balancer.ts:203](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/dispatcher/load-balancer.ts#L203)

엔드포인트 건강 상태 조회

#### Parameters

##### endpointId

`string`

#### Returns

`EndpointHealth` \| `null`

***

### getStats()

> **getStats**(): `object`

Defined in: [packages/webhook/src/dispatcher/load-balancer.ts:217](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/dispatcher/load-balancer.ts#L217)

로드 밸런서 통계 조회

#### Returns

`object`

##### activeConnections

> **activeConnections**: `number`

##### averageResponseTime

> **averageResponseTime**: `number`

##### circuitBreakersOpen

> **circuitBreakersOpen**: `number`

##### healthyEndpoints

> **healthyEndpoints**: `number`

##### totalEndpoints

> **totalEndpoints**: `number`

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

### onRequestComplete()

> **onRequestComplete**(`endpointId`, `success`, `responseTime`): `Promise`\<`void`\>

Defined in: [packages/webhook/src/dispatcher/load-balancer.ts:143](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/dispatcher/load-balancer.ts#L143)

요청 완료 시 호출 (연결 수 감소 및 통계 업데이트)

#### Parameters

##### endpointId

`string`

##### success

`boolean`

##### responseTime

`number`

#### Returns

`Promise`\<`void`\>

***

### registerEndpoint()

> **registerEndpoint**(`endpoint`): `Promise`\<`void`\>

Defined in: [packages/webhook/src/dispatcher/load-balancer.ts:44](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/dispatcher/load-balancer.ts#L44)

엔드포인트 등록

#### Parameters

##### endpoint

[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/)

#### Returns

`Promise`\<`void`\>

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

### selectEndpoint()

> **selectEndpoint**(`endpoints`): `Promise`\<[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/) \| `null`\>

Defined in: [packages/webhook/src/dispatcher/load-balancer.ts:80](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/dispatcher/load-balancer.ts#L80)

로드 밸런싱을 통한 엔드포인트 선택

#### Parameters

##### endpoints

[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/)[]

#### Returns

`Promise`\<[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/) \| `null`\>

***

### shutdown()

> **shutdown**(): `Promise`\<`void`\>

Defined in: [packages/webhook/src/dispatcher/load-balancer.ts:454](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/dispatcher/load-balancer.ts#L454)

로드 밸런서 종료

#### Returns

`Promise`\<`void`\>

***

### unregisterEndpoint()

> **unregisterEndpoint**(`endpointId`): `Promise`\<`void`\>

Defined in: [packages/webhook/src/dispatcher/load-balancer.ts:69](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/dispatcher/load-balancer.ts#L69)

엔드포인트 등록 해제

#### Parameters

##### endpointId

`string`

#### Returns

`Promise`\<`void`\>
