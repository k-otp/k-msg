---
editUrl: false
next: false
prev: false
title: "QueueManager"
---

Defined in: [packages/webhook/src/dispatcher/queue.manager.ts:14](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/queue.manager.ts#L14)

## Extends

- `EventEmitter`

## Constructors

### Constructor

> **new QueueManager**(`config?`): `QueueManager`

Defined in: [packages/webhook/src/dispatcher/queue.manager.ts:31](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/queue.manager.ts#L31)

#### Parameters

##### config?

`Partial`\<[`QueueConfig`](/api/webhook/src/interfaces/queueconfig/)\> = `{}`

#### Returns

`QueueManager`

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

### cleanupExpiredJobs()

> **cleanupExpiredJobs**(): `Promise`\<`number`\>

Defined in: [packages/webhook/src/dispatcher/queue.manager.ts:252](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/queue.manager.ts#L252)

만료된 작업 정리

#### Returns

`Promise`\<`number`\>

***

### clear()

> **clear**(): `Promise`\<`void`\>

Defined in: [packages/webhook/src/dispatcher/queue.manager.ts:226](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/queue.manager.ts#L226)

큐 비우기

#### Returns

`Promise`\<`void`\>

***

### dequeue()

> **dequeue**(): `Promise`\<[`DispatchJob`](/api/webhook/src/interfaces/dispatchjob/) \| `null`\>

Defined in: [packages/webhook/src/dispatcher/queue.manager.ts:101](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/queue.manager.ts#L101)

우선순위에 따라 작업 추출

#### Returns

`Promise`\<[`DispatchJob`](/api/webhook/src/interfaces/dispatchjob/) \| `null`\>

***

### dequeueFromPriority()

> **dequeueFromPriority**(`priority`): `Promise`\<[`DispatchJob`](/api/webhook/src/interfaces/dispatchjob/) \| `null`\>

Defined in: [packages/webhook/src/dispatcher/queue.manager.ts:131](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/queue.manager.ts#L131)

특정 우선순위 큐에서 작업 추출

#### Parameters

##### priority

`number`

#### Returns

`Promise`\<[`DispatchJob`](/api/webhook/src/interfaces/dispatchjob/) \| `null`\>

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

### enqueue()

> **enqueue**(`job`): `Promise`\<`boolean`\>

Defined in: [packages/webhook/src/dispatcher/queue.manager.ts:53](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/queue.manager.ts#L53)

작업을 큐에 추가

#### Parameters

##### job

[`DispatchJob`](/api/webhook/src/interfaces/dispatchjob/)

#### Returns

`Promise`\<`boolean`\>

***

### getStats()

> **getStats**(): `object`

Defined in: [packages/webhook/src/dispatcher/queue.manager.ts:205](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/queue.manager.ts#L205)

큐 통계 조회

#### Returns

`object`

##### delayedJobs

> **delayedJobs**: `number`

##### highPriorityJobs

> **highPriorityJobs**: `number`

##### lowPriorityJobs

> **lowPriorityJobs**: `number`

##### mediumPriorityJobs

> **mediumPriorityJobs**: `number`

##### queueUtilization

> **queueUtilization**: `number`

##### totalJobs

> **totalJobs**: `number`

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

### peek()

> **peek**(): [`DispatchJob`](/api/webhook/src/interfaces/dispatchjob/) \| `null`

Defined in: [packages/webhook/src/dispatcher/queue.manager.ts:154](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/queue.manager.ts#L154)

작업 상태 확인

#### Returns

[`DispatchJob`](/api/webhook/src/interfaces/dispatchjob/) \| `null`

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

### removeJob()

> **removeJob**(`jobId`): `Promise`\<`boolean`\>

Defined in: [packages/webhook/src/dispatcher/queue.manager.ts:166](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/queue.manager.ts#L166)

특정 작업 제거

#### Parameters

##### jobId

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

### shutdown()

> **shutdown**(): `Promise`\<`void`\>

Defined in: [packages/webhook/src/dispatcher/queue.manager.ts:429](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/queue.manager.ts#L429)

큐 관리자 종료

#### Returns

`Promise`\<`void`\>
