---
editUrl: false
next: false
prev: false
title: "WebhookCollector"
---

Defined in: [packages/analytics/src/collectors/webhook.collector.ts:174](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/collectors/webhook.collector.ts#L174)

## Extends

- `EventEmitter`

## Constructors

### Constructor

> **new WebhookCollector**(`config?`): `WebhookCollector`

Defined in: [packages/analytics/src/collectors/webhook.collector.ts:189](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/collectors/webhook.collector.ts#L189)

#### Parameters

##### config?

`Partial`\<[`WebhookCollectorConfig`](/en/api/analytics/src/interfaces/webhookcollectorconfig/)\> = `{}`

#### Returns

`WebhookCollector`

#### Overrides

`EventEmitter.constructor`

## Methods

### addListener()

> **addListener**(`eventName`, `listener`): `this`

Defined in: [packages/analytics/src/shared/event-emitter.ts:16](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/shared/event-emitter.ts#L16)

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

Defined in: [packages/analytics/src/shared/event-emitter.ts:44](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/shared/event-emitter.ts#L44)

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

> **getProcessedWebhooks**(`since?`): [`WebhookData`](/en/api/analytics/src/interfaces/webhookdata/)[]

Defined in: [packages/analytics/src/collectors/webhook.collector.ts:280](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/collectors/webhook.collector.ts#L280)

처리된 웹훅 조회

#### Parameters

##### since?

`Date`

#### Returns

[`WebhookData`](/en/api/analytics/src/interfaces/webhookdata/)[]

***

### getWebhookStats()

> **getWebhookStats**(): `object`

Defined in: [packages/analytics/src/collectors/webhook.collector.ts:291](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/collectors/webhook.collector.ts#L291)

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

Defined in: [packages/analytics/src/shared/event-emitter.ts:20](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/shared/event-emitter.ts#L20)

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

Defined in: [packages/analytics/src/shared/event-emitter.ts:9](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/shared/event-emitter.ts#L9)

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

Defined in: [packages/analytics/src/shared/event-emitter.ts:35](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/shared/event-emitter.ts#L35)

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

> **receiveWebhook**(`webhook`): `Promise`\<[`EventData`](/en/api/analytics/src/interfaces/eventdata/)[]\>

Defined in: [packages/analytics/src/collectors/webhook.collector.ts:216](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/collectors/webhook.collector.ts#L216)

웹훅 수신 처리

#### Parameters

##### webhook

[`WebhookData`](/en/api/analytics/src/interfaces/webhookdata/)

#### Returns

`Promise`\<[`EventData`](/en/api/analytics/src/interfaces/eventdata/)[]\>

***

### registerTransformer()

> **registerTransformer**(`name`, `transformer`): `void`

Defined in: [packages/analytics/src/collectors/webhook.collector.ts:261](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/collectors/webhook.collector.ts#L261)

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

Defined in: [packages/analytics/src/shared/event-emitter.ts:57](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/shared/event-emitter.ts#L57)

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

Defined in: [packages/analytics/src/shared/event-emitter.ts:31](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/shared/event-emitter.ts#L31)

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

Defined in: [packages/analytics/src/collectors/webhook.collector.ts:269](https://github.com/k-otp/k-msg/blob/main/packages/analytics/src/collectors/webhook.collector.ts#L269)

웹훅 변환기 제거

#### Parameters

##### name

`string`

#### Returns

`boolean`
