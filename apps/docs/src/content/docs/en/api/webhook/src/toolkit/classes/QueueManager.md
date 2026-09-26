---
editUrl: false
next: false
prev: false
title: "QueueManager"
---

Defined in: [packages/webhook/src/dispatcher/queue.manager.ts:15](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/queue.manager.ts#L15)

## Extends

- `EventEmitter`

## Constructors

### Constructor

> **new QueueManager**(`config?`): `QueueManager`

Defined in: [packages/webhook/src/dispatcher/queue.manager.ts:32](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/queue.manager.ts#L32)

#### Parameters

##### config?

`Partial`\<[`QueueConfig`](/en/api/webhook/src/toolkit/interfaces/queueconfig/)\> = `{}`

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

Defined in: [packages/webhook/src/dispatcher/queue.manager.ts:253](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/queue.manager.ts#L253)

만료된 작업 정리

#### Returns

`Promise`\<`number`\>

***

### clear()

> **clear**(): `Promise`\<`void`\>

Defined in: [packages/webhook/src/dispatcher/queue.manager.ts:227](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/queue.manager.ts#L227)

큐 비우기

#### Returns

`Promise`\<`void`\>

***

### dequeue()

> **dequeue**(): `Promise`\<[`DispatchJob`](/en/api/webhook/src/toolkit/interfaces/dispatchjob/) \| `null`\>

Defined in: [packages/webhook/src/dispatcher/queue.manager.ts:102](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/queue.manager.ts#L102)

우선순위에 따라 작업 추출

#### Returns

`Promise`\<[`DispatchJob`](/en/api/webhook/src/toolkit/interfaces/dispatchjob/) \| `null`\>

***

### dequeueFromPriority()

> **dequeueFromPriority**(`priority`): `Promise`\<[`DispatchJob`](/en/api/webhook/src/toolkit/interfaces/dispatchjob/) \| `null`\>

Defined in: [packages/webhook/src/dispatcher/queue.manager.ts:132](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/queue.manager.ts#L132)

특정 우선순위 큐에서 작업 추출

#### Parameters

##### priority

`number`

#### Returns

`Promise`\<[`DispatchJob`](/en/api/webhook/src/toolkit/interfaces/dispatchjob/) \| `null`\>

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

Defined in: [packages/webhook/src/dispatcher/queue.manager.ts:54](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/queue.manager.ts#L54)

작업을 큐에 추가

#### Parameters

##### job

[`DispatchJob`](/en/api/webhook/src/toolkit/interfaces/dispatchjob/)

#### Returns

`Promise`\<`boolean`\>

***

### getStats()

> **getStats**(): `object`

Defined in: [packages/webhook/src/dispatcher/queue.manager.ts:206](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/queue.manager.ts#L206)

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

> **peek**(): [`DispatchJob`](/en/api/webhook/src/toolkit/interfaces/dispatchjob/) \| `null`

Defined in: [packages/webhook/src/dispatcher/queue.manager.ts:155](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/queue.manager.ts#L155)

작업 상태 확인

#### Returns

[`DispatchJob`](/en/api/webhook/src/toolkit/interfaces/dispatchjob/) \| `null`

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

Defined in: [packages/webhook/src/dispatcher/queue.manager.ts:167](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/queue.manager.ts#L167)

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

Defined in: [packages/webhook/src/dispatcher/queue.manager.ts:441](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/queue.manager.ts#L441)

큐 관리자 종료

#### Returns

`Promise`\<`void`\>
