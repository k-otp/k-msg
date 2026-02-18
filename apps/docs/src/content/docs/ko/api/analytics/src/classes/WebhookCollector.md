---
editUrl: false
next: false
prev: false
title: "WebhookCollector"
---

Defined in: [packages/analytics/src/collectors/webhook.collector.ts:32](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/collectors/webhook.collector.ts#L32)

## Extends

- `EventEmitter`

## Constructors

### Constructor

> **new WebhookCollector**(`config?`): `WebhookCollector`

Defined in: [packages/analytics/src/collectors/webhook.collector.ts:47](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/collectors/webhook.collector.ts#L47)

#### Parameters

##### config?

`Partial`\<[`WebhookCollectorConfig`](/api/analytics/src/interfaces/webhookcollectorconfig/)\> = `{}`

#### Returns

`WebhookCollector`

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

### getProcessedWebhooks()

> **getProcessedWebhooks**(`since?`): [`WebhookData`](/api/analytics/src/interfaces/webhookdata/)[]

Defined in: [packages/analytics/src/collectors/webhook.collector.ts:111](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/collectors/webhook.collector.ts#L111)

처리된 웹훅 조회

#### Parameters

##### since?

`Date`

#### Returns

[`WebhookData`](/api/analytics/src/interfaces/webhookdata/)[]

***

### getWebhookStats()

> **getWebhookStats**(): `object`

Defined in: [packages/analytics/src/collectors/webhook.collector.ts:122](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/collectors/webhook.collector.ts#L122)

웹훅 통계

#### Returns

`object`

##### bySource

> **bySource**: `Record`\<`string`, `number`\>

##### recentCount

> **recentCount**: `number`

##### totalProcessed

> **totalProcessed**: `number`

##### transformerCount

> **transformerCount**: `number`

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

### receiveWebhook()

> **receiveWebhook**(`webhook`): `Promise`\<[`EventData`](/api/analytics/src/interfaces/eventdata/)[]\>

Defined in: [packages/analytics/src/collectors/webhook.collector.ts:57](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/collectors/webhook.collector.ts#L57)

웹훅 수신 처리

#### Parameters

##### webhook

[`WebhookData`](/api/analytics/src/interfaces/webhookdata/)

#### Returns

`Promise`\<[`EventData`](/api/analytics/src/interfaces/eventdata/)[]\>

***

### registerTransformer()

> **registerTransformer**(`name`, `transformer`): `void`

Defined in: [packages/analytics/src/collectors/webhook.collector.ts:92](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/collectors/webhook.collector.ts#L92)

웹훅 변환기 등록

#### Parameters

##### name

`string`

##### transformer

`WebhookTransformer`

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

### unregisterTransformer()

> **unregisterTransformer**(`name`): `boolean`

Defined in: [packages/analytics/src/collectors/webhook.collector.ts:100](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/analytics/src/collectors/webhook.collector.ts#L100)

웹훅 변환기 제거

#### Parameters

##### name

`string`

#### Returns

`boolean`
