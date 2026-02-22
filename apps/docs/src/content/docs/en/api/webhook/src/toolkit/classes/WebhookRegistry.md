---
editUrl: false
next: false
prev: false
title: "WebhookRegistry"
---

Defined in: [packages/webhook/src/services/webhook.registry.ts:142](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/services/webhook.registry.ts#L142)

## Constructors

### Constructor

> **new WebhookRegistry**(`options?`): `WebhookRegistry`

Defined in: [packages/webhook/src/services/webhook.registry.ts:147](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/services/webhook.registry.ts#L147)

#### Parameters

##### options?

[`WebhookRegistryOptions`](/api/webhook/src/interfaces/webhookregistryoptions/) = `{}`

#### Returns

`WebhookRegistry`

## Methods

### addDelivery()

> **addDelivery**(`delivery`): `Promise`\<`void`\>

Defined in: [packages/webhook/src/services/webhook.registry.ts:184](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/services/webhook.registry.ts#L184)

#### Parameters

##### delivery

[`WebhookDelivery`](/api/webhook/src/interfaces/webhookdelivery/)

#### Returns

`Promise`\<`void`\>

***

### addEndpoint()

> **addEndpoint**(`endpoint`): `Promise`\<`void`\>

Defined in: [packages/webhook/src/services/webhook.registry.ts:152](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/services/webhook.registry.ts#L152)

#### Parameters

##### endpoint

[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/)

#### Returns

`Promise`\<`void`\>

***

### getDeliveries()

> **getDeliveries**(`endpointId?`, `timeRange?`, `eventType?`, `status?`, `limit?`): `Promise`\<[`WebhookDelivery`](/api/webhook/src/interfaces/webhookdelivery/)[]\>

Defined in: [packages/webhook/src/services/webhook.registry.ts:188](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/services/webhook.registry.ts#L188)

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

Defined in: [packages/webhook/src/services/webhook.registry.ts:170](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/services/webhook.registry.ts#L170)

#### Parameters

##### endpointId

`string`

#### Returns

`Promise`\<[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/) \| `null`\>

***

### getFailedDeliveries()

> **getFailedDeliveries**(`endpointId?`, `eventType?`): `Promise`\<[`WebhookDelivery`](/api/webhook/src/interfaces/webhookdelivery/)[]\>

Defined in: [packages/webhook/src/services/webhook.registry.ts:224](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/services/webhook.registry.ts#L224)

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

Defined in: [packages/webhook/src/services/webhook.registry.ts:176](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/services/webhook.registry.ts#L176)

#### Returns

`Promise`\<[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/)[]\>

***

### removeEndpoint()

> **removeEndpoint**(`endpointId`): `Promise`\<`void`\>

Defined in: [packages/webhook/src/services/webhook.registry.ts:166](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/services/webhook.registry.ts#L166)

#### Parameters

##### endpointId

`string`

#### Returns

`Promise`\<`void`\>

***

### updateEndpoint()

> **updateEndpoint**(`endpointId`, `endpoint`): `Promise`\<`void`\>

Defined in: [packages/webhook/src/services/webhook.registry.ts:156](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/services/webhook.registry.ts#L156)

#### Parameters

##### endpointId

`string`

##### endpoint

[`WebhookEndpoint`](/api/webhook/src/interfaces/webhookendpoint/)

#### Returns

`Promise`\<`void`\>
