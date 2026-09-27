---
editUrl: false
next: false
prev: false
title: "LoadBalancer"
---

Defined in: [packages/webhook/src/dispatcher/load-balancer.ts:20](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/load-balancer.ts#L20)

## Extends

- `EventEmitter`

## Constructors

### Constructor

> **new LoadBalancer**(`config?`): `LoadBalancer`

Defined in: [packages/webhook/src/dispatcher/load-balancer.ts:36](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/load-balancer.ts#L36)

#### Parameters

##### config?

`Partial`\<[`LoadBalancerConfig`](/en/api/webhook/src/toolkit/interfaces/loadbalancerconfig/)\> = `{}`

#### Returns

`LoadBalancer`

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

### getAllEndpointHealth()

> **getAllEndpointHealth**(): `EndpointHealth`[]

Defined in: [packages/webhook/src/dispatcher/load-balancer.ts:214](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/load-balancer.ts#L214)

모든 엔드포인트 건강 상태 조회

#### Returns

`EndpointHealth`[]

***

### getEndpointHealth()

> **getEndpointHealth**(`endpointId`): `EndpointHealth` \| `null`

Defined in: [packages/webhook/src/dispatcher/load-balancer.ts:207](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/load-balancer.ts#L207)

엔드포인트 건강 상태 조회

#### Parameters

##### endpointId

`string`

#### Returns

`EndpointHealth` \| `null`

***

### getStats()

> **getStats**(): `object`

Defined in: [packages/webhook/src/dispatcher/load-balancer.ts:221](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/load-balancer.ts#L221)

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

### onRequestComplete()

> **onRequestComplete**(`endpointId`, `success`, `responseTime`): `Promise`\<`void`\>

Defined in: [packages/webhook/src/dispatcher/load-balancer.ts:147](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/load-balancer.ts#L147)

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

Defined in: [packages/webhook/src/dispatcher/load-balancer.ts:46](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/load-balancer.ts#L46)

엔드포인트 등록

#### Parameters

##### endpoint

###### active

`boolean` = `...`

###### createdAt

`Date` = `...`

###### description?

`string` = `...`

###### events

[`WebhookEventType`](/en/api/webhook/src/enumerations/webhookeventtype/)[] = `...`

###### filters?

\{ `channelId?`: `string`[]; `providerId?`: `string`[]; `templateId?`: `string`[]; \} = `...`

###### filters.channelId?

`string`[] = `...`

###### filters.providerId?

`string`[] = `...`

###### filters.templateId?

`string`[] = `...`

###### headers?

`Record`\<`string`, `string`\> = `...`

###### id

`string` = `...`

###### lastTriggeredAt?

`Date` = `...`

###### name?

`string` = `...`

###### retryConfig?

\{ `backoffMultiplier`: `number`; `maxRetries`: `number`; `retryDelayMs`: `number`; \} = `...`

###### retryConfig.backoffMultiplier

`number` = `...`

###### retryConfig.maxRetries

`number` = `...`

###### retryConfig.retryDelayMs

`number` = `...`

###### secret?

`string` = `...`

###### secretUndecryptable?

`true` = `...`

###### status

`"error"` \| `"active"` \| `"inactive"` \| `"suspended"` = `...`

###### updatedAt

`Date` = `...`

###### url

`string` = `...`

#### Returns

`Promise`\<`void`\>

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

### selectEndpoint()

> **selectEndpoint**(`endpoints`): `Promise`\<\{ `active`: `boolean`; `createdAt`: `Date`; `description?`: `string`; `events`: [`WebhookEventType`](/en/api/webhook/src/enumerations/webhookeventtype/)[]; `filters?`: \{ `channelId?`: `string`[]; `providerId?`: `string`[]; `templateId?`: `string`[]; \}; `headers?`: `Record`\<`string`, `string`\>; `id`: `string`; `lastTriggeredAt?`: `Date`; `name?`: `string`; `retryConfig?`: \{ `backoffMultiplier`: `number`; `maxRetries`: `number`; `retryDelayMs`: `number`; \}; `secret?`: `string`; `secretUndecryptable?`: `true`; `status`: `"error"` \| `"active"` \| `"inactive"` \| `"suspended"`; `updatedAt`: `Date`; `url`: `string`; \} \| `null`\>

Defined in: [packages/webhook/src/dispatcher/load-balancer.ts:84](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/load-balancer.ts#L84)

로드 밸런싱을 통한 엔드포인트 선택

#### Parameters

##### endpoints

`object`[]

#### Returns

`Promise`\<\{ `active`: `boolean`; `createdAt`: `Date`; `description?`: `string`; `events`: [`WebhookEventType`](/en/api/webhook/src/enumerations/webhookeventtype/)[]; `filters?`: \{ `channelId?`: `string`[]; `providerId?`: `string`[]; `templateId?`: `string`[]; \}; `headers?`: `Record`\<`string`, `string`\>; `id`: `string`; `lastTriggeredAt?`: `Date`; `name?`: `string`; `retryConfig?`: \{ `backoffMultiplier`: `number`; `maxRetries`: `number`; `retryDelayMs`: `number`; \}; `secret?`: `string`; `secretUndecryptable?`: `true`; `status`: `"error"` \| `"active"` \| `"inactive"` \| `"suspended"`; `updatedAt`: `Date`; `url`: `string`; \} \| `null`\>

***

### shutdown()

> **shutdown**(): `Promise`\<`void`\>

Defined in: [packages/webhook/src/dispatcher/load-balancer.ts:456](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/load-balancer.ts#L456)

로드 밸런서 종료

#### Returns

`Promise`\<`void`\>

***

### unregisterEndpoint()

> **unregisterEndpoint**(`endpointId`): `Promise`\<`void`\>

Defined in: [packages/webhook/src/dispatcher/load-balancer.ts:72](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/load-balancer.ts#L72)

엔드포인트 등록 해제

#### Parameters

##### endpointId

`string`

#### Returns

`Promise`\<`void`\>
