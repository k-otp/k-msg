---
editUrl: false
next: false
prev: false
title: "EventCollector"
---

Defined in: [packages/analytics/src/collectors/event.collector.ts:39](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/collectors/event.collector.ts#L39)

## Extends

- `EventEmitter`

## Constructors

### Constructor

> **new EventCollector**(`config?`): `EventCollector`

Defined in: [packages/analytics/src/collectors/event.collector.ts:55](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/collectors/event.collector.ts#L55)

#### Parameters

##### config?

`Partial`\<[`EventCollectorConfig`](/api/analytics/src/interfaces/eventcollectorconfig/)\> = `{}`

#### Returns

`EventCollector`

#### Overrides

`EventEmitter.constructor`

## Methods

### addListener()

> **addListener**(`eventName`, `listener`): `this`

Defined in: [packages/analytics/src/shared/event-emitter.ts:16](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/shared/event-emitter.ts#L16)

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

### collectEvent()

> **collectEvent**(`event`): `Promise`\<`void`\>

Defined in: [packages/analytics/src/collectors/event.collector.ts:66](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/collectors/event.collector.ts#L66)

이벤트 수집

#### Parameters

##### event

[`EventData`](/api/analytics/src/interfaces/eventdata/)

#### Returns

`Promise`\<`void`\>

***

### collectEvents()

> **collectEvents**(`events`): `Promise`\<`void`\>

Defined in: [packages/analytics/src/collectors/event.collector.ts:102](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/collectors/event.collector.ts#L102)

배치 이벤트 수집

#### Parameters

##### events

[`EventData`](/api/analytics/src/interfaces/eventdata/)[]

#### Returns

`Promise`\<`void`\>

***

### emit()

> **emit**(`eventName`, ...`args`): `boolean`

Defined in: [packages/analytics/src/shared/event-emitter.ts:44](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/shared/event-emitter.ts#L44)

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

### flush()

> **flush**(): `Promise`\<`void`\>

Defined in: [packages/analytics/src/collectors/event.collector.ts:192](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/collectors/event.collector.ts#L192)

버퍼 강제 플러시

#### Returns

`Promise`\<`void`\>

***

### getCollectedMetrics()

> **getCollectedMetrics**(`since?`): [`MetricData`](/api/analytics/src/interfaces/metricdata/)[]

Defined in: [packages/analytics/src/collectors/event.collector.ts:130](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/collectors/event.collector.ts#L130)

수집된 메트릭 조회

#### Parameters

##### since?

`Date`

#### Returns

[`MetricData`](/api/analytics/src/interfaces/metricdata/)[]

***

### getEventStats()

> **getEventStats**(): `object`

Defined in: [packages/analytics/src/collectors/event.collector.ts:164](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/collectors/event.collector.ts#L164)

이벤트 통계

#### Returns

`object`

##### bufferSize

> **bufferSize**: `number`

##### eventsBySource

> **eventsBySource**: `Record`\<`string`, `number`\>

##### eventsByType

> **eventsByType**: `Record`\<`string`, `number`\>

##### metricsGenerated

> **metricsGenerated**: `number`

##### totalEvents

> **totalEvents**: `number`

***

### off()

> **off**(`eventName`, `listener`): `this`

Defined in: [packages/analytics/src/shared/event-emitter.ts:20](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/shared/event-emitter.ts#L20)

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

Defined in: [packages/analytics/src/shared/event-emitter.ts:9](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/shared/event-emitter.ts#L9)

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

Defined in: [packages/analytics/src/shared/event-emitter.ts:35](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/shared/event-emitter.ts#L35)

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

### registerProcessor()

> **registerProcessor**(`name`, `processor`): `void`

Defined in: [packages/analytics/src/collectors/event.collector.ts:111](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/collectors/event.collector.ts#L111)

커스텀 이벤트 프로세서 등록

#### Parameters

##### name

`string`

##### processor

[`EventProcessor`](/api/analytics/src/interfaces/eventprocessor/)

#### Returns

`void`

***

### removeAllListeners()

> **removeAllListeners**(`eventName?`): `this`

Defined in: [packages/analytics/src/shared/event-emitter.ts:57](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/shared/event-emitter.ts#L57)

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

Defined in: [packages/analytics/src/shared/event-emitter.ts:31](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/shared/event-emitter.ts#L31)

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

### streamMetrics()

> **streamMetrics**(): `AsyncGenerator`\<[`MetricData`](/api/analytics/src/interfaces/metricdata/)[]\>

Defined in: [packages/analytics/src/collectors/event.collector.ts:141](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/collectors/event.collector.ts#L141)

실시간 메트릭 스트림

#### Returns

`AsyncGenerator`\<[`MetricData`](/api/analytics/src/interfaces/metricdata/)[]\>

***

### unregisterProcessor()

> **unregisterProcessor**(`name`): `boolean`

Defined in: [packages/analytics/src/collectors/event.collector.ts:119](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/collectors/event.collector.ts#L119)

이벤트 프로세서 제거

#### Parameters

##### name

`string`

#### Returns

`boolean`
