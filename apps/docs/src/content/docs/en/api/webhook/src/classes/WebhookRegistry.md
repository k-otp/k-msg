---
editUrl: false
next: false
prev: false
title: "WebhookRegistry"
---

Defined in: [packages/webhook/src/services/webhook.registry.ts:7](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/services/webhook.registry.ts#L7)

## Constructors

### Constructor

> **new WebhookRegistry**(): `WebhookRegistry`

#### Returns

`WebhookRegistry`

## Methods

### addDelivery()

> **addDelivery**(`delivery`): `Promise`\<`void`\>

Defined in: [packages/webhook/src/services/webhook.registry.ts:37](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/services/webhook.registry.ts#L37)

#### Parameters

##### delivery

[`WebhookDelivery`](/api/webhook/src/interfaces/webhookdelivery/)

#### Returns

`Promise`\<`void`\>

***

### addEndpoint()

> **addEndpoint**(`endpoint`): `Promise`\<`void`\>

Defined in: [packages/webhook/src/services/webhook.registry.ts:11](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/services/webhook.registry.ts#L11)

#### Parameters

##### endpoint

[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/)

#### Returns

`Promise`\<`void`\>

***

### getDeliveries()

> **getDeliveries**(`endpointId?`, `timeRange?`, `eventType?`, `status?`, `limit?`): `Promise`\<[`WebhookDelivery`](/api/webhook/src/interfaces/webhookdelivery/)[]\>

Defined in: [packages/webhook/src/services/webhook.registry.ts:41](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/services/webhook.registry.ts#L41)

#### Parameters

##### endpointId?

`string`

##### timeRange?

###### end

`Date`

###### start

`Date`

##### eventType?

[`WebhookEventType`](/api/webhook/src/enumerations/webhookeventtype/)

##### status?

`string`

##### limit?

`number` = `100`

#### Returns

`Promise`\<[`WebhookDelivery`](/api/webhook/src/interfaces/webhookdelivery/)[]\>

***

### getEndpoint()

> **getEndpoint**(`endpointId`): `Promise`\<[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/) \| `null`\>

Defined in: [packages/webhook/src/services/webhook.registry.ts:29](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/services/webhook.registry.ts#L29)

#### Parameters

##### endpointId

`string`

#### Returns

`Promise`\<[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/) \| `null`\>

***

### getFailedDeliveries()

> **getFailedDeliveries**(`endpointId?`, `eventType?`): `Promise`\<[`WebhookDelivery`](/api/webhook/src/interfaces/webhookdelivery/)[]\>

Defined in: [packages/webhook/src/services/webhook.registry.ts:73](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/services/webhook.registry.ts#L73)

#### Parameters

##### endpointId?

`string`

##### eventType?

[`WebhookEventType`](/api/webhook/src/enumerations/webhookeventtype/)

#### Returns

`Promise`\<[`WebhookDelivery`](/api/webhook/src/interfaces/webhookdelivery/)[]\>

***

### listEndpoints()

> **listEndpoints**(): `Promise`\<[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/)[]\>

Defined in: [packages/webhook/src/services/webhook.registry.ts:33](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/services/webhook.registry.ts#L33)

#### Returns

`Promise`\<[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/)[]\>

***

### removeEndpoint()

> **removeEndpoint**(`endpointId`): `Promise`\<`void`\>

Defined in: [packages/webhook/src/services/webhook.registry.ts:25](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/services/webhook.registry.ts#L25)

#### Parameters

##### endpointId

`string`

#### Returns

`Promise`\<`void`\>

***

### updateEndpoint()

> **updateEndpoint**(`endpointId`, `endpoint`): `Promise`\<`void`\>

Defined in: [packages/webhook/src/services/webhook.registry.ts:15](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/webhook/src/services/webhook.registry.ts#L15)

#### Parameters

##### endpointId

`string`

##### endpoint

[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/)

#### Returns

`Promise`\<`void`\>
