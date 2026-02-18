---
editUrl: false
next: false
prev: false
title: "BatchDispatcher"
---

Defined in: [packages/webhook/src/dispatcher/batch.dispatcher.ts:15](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/dispatcher/batch.dispatcher.ts#L15)

Webhook System
실시간 메시지 이벤트 알림 시스템

## Extends

- `EventEmitter`

## Constructors

### Constructor

> **new BatchDispatcher**(`config?`): `BatchDispatcher`

Defined in: [packages/webhook/src/dispatcher/batch.dispatcher.ts:29](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/dispatcher/batch.dispatcher.ts#L29)

#### Parameters

##### config?

`Partial`\<[`BatchConfig`](/api/webhook/src/interfaces/batchconfig/)\> = `{}`

#### Returns

`BatchDispatcher`

#### Overrides

`EventEmitter.constructor`

## Methods

### addJob()

> **addJob**(`job`): `Promise`\<`void`\>

Defined in: [packages/webhook/src/dispatcher/batch.dispatcher.ts:38](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/dispatcher/batch.dispatcher.ts#L38)

배치 작업 추가

#### Parameters

##### job

[`DispatchJob`](/api/webhook/src/interfaces/dispatchjob/)

#### Returns

`Promise`\<`void`\>

***

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

### getBatchStats()

> **getBatchStats**(): `object`

Defined in: [packages/webhook/src/dispatcher/batch.dispatcher.ts:145](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/dispatcher/batch.dispatcher.ts#L145)

배치 통계 조회

#### Returns

`object`

##### activeBatchesCount

> **activeBatchesCount**: `number`

##### averageQueueSize

> **averageQueueSize**: `number`

##### endpointsWithPendingJobs

> **endpointsWithPendingJobs**: `number`

##### pendingJobsCount

> **pendingJobsCount**: `number`

***

### getPendingJobCount()

> **getPendingJobCount**(`endpointId`): `number`

Defined in: [packages/webhook/src/dispatcher/batch.dispatcher.ts:168](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/dispatcher/batch.dispatcher.ts#L168)

특정 엔드포인트의 대기 중인 작업 수 조회

#### Parameters

##### endpointId

`string`

#### Returns

`number`

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

### processAllBatches()

> **processAllBatches**(): `Promise`\<[`WebhookBatch`](/api/webhook/src/interfaces/webhookbatch/)[]\>

Defined in: [packages/webhook/src/dispatcher/batch.dispatcher.ts:128](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/dispatcher/batch.dispatcher.ts#L128)

모든 대기 중인 배치 처리

#### Returns

`Promise`\<[`WebhookBatch`](/api/webhook/src/interfaces/webhookbatch/)[]\>

***

### processBatchForEndpoint()

> **processBatchForEndpoint**(`endpointId`): `Promise`\<[`WebhookBatch`](/api/webhook/src/interfaces/webhookbatch/) \| `null`\>

Defined in: [packages/webhook/src/dispatcher/batch.dispatcher.ts:69](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/dispatcher/batch.dispatcher.ts#L69)

특정 엔드포인트의 배치 처리

#### Parameters

##### endpointId

`string`

#### Returns

`Promise`\<[`WebhookBatch`](/api/webhook/src/interfaces/webhookbatch/) \| `null`\>

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

### shutdown()

> **shutdown**(): `Promise`\<`void`\>

Defined in: [packages/webhook/src/dispatcher/batch.dispatcher.ts:339](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/dispatcher/batch.dispatcher.ts#L339)

배치 처리기 정지

#### Returns

`Promise`\<`void`\>
